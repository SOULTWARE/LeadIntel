/**
 * Lead Generation Orchestrator API
 *
 * ⚠️ IMMUTABLE RULE: NO AI-CLAIMS WITHOUT SNAPSHOT
 * See: src/docs/architecture.md
 *
 * Pipeline: Discovery -> Verification/Fetch -> Analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/db";
import { DiscoveryService } from "@/services/discoveryService";
import { FetchService } from "@/services/fetchService";
import { AnalysisService } from "@/services/analysisService";
import type { DiscoveryResult } from "@/src/types/pipeline";

const MIN_CONFIDENCE_THRESHOLD = 60;

const requestSchema = z.object({
  industry: z.string().min(1, "Industry is required"),
  location: z.string().min(1, "Location is required"),
  count: z.number().int().min(1).max(50).default(5),
  leadPurpose: z
    .string()
    .min(1, "Lead purpose is required")
    .max(300, "Lead purpose must be 300 characters or less")
    .transform((val) => val.trim()),
  sender_name: z.string().optional(),
  sender_company: z.string().optional(),
});

type RequestBody = z.infer<typeof requestSchema>;

interface CandidateResult {
  candidateId: string;
  leadId?: string;
  status: "saved" | "requires_review" | "skipped" | "failed";
  reasons?: string[];
}

interface LeadSummary {
  id: string;
  companyName: string;
  leadScore: number | null;
  confidenceScore: number | null;
  requiresReview: boolean;
}

interface OrchestrationResult {
  leadsSaved: number;
  requiresReview: number;
  skipped: number;
  failed: number;
  results: CandidateResult[];
  leads: LeadSummary[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 422 }
      );
    }

    const result = await orchestrateLeadGeneration(validation.data);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[API /api/leads/generate] Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function orchestrateLeadGeneration(
  input: RequestBody
): Promise<OrchestrationResult> {
  const { industry, location, count, leadPurpose, sender_name, sender_company } =
    input;

  const maxConcurrent = parseInt(
    process.env.MAX_CONCURRENT_FETCHES ?? "10",
    10
  );

  const discoveryService = new DiscoveryService();
  const fetchService = new FetchService({ maxConcurrentFetches: maxConcurrent });
  const analysisService = new AnalysisService();

  console.log(
    `[Orchestrator] Starting discovery: industry=${industry}, location=${location}, count=${count}`
  );

  const candidates = await discoveryService.discoverCandidates({
    industry,
    location,
    count,
    leadPurpose,
  });

  console.log(`[Orchestrator] Discovered ${candidates.length} candidates`);

  const results: CandidateResult[] = [];
  let leadsSaved = 0;
  let requiresReview = 0;
  let skipped = 0;
  let failed = 0;

  const processingQueue = [...candidates];
  const processing: Promise<void>[] = [];

  const processCandidate = async (candidate: DiscoveryResult) => {
    const result = await processSingleCandidate(
      candidate,
      fetchService,
      analysisService,
      { sender_name, sender_company, leadPurpose }
    );

    results.push(result);

    switch (result.status) {
      case "saved":
        leadsSaved++;
        break;
      case "requires_review":
        requiresReview++;
        break;
      case "skipped":
        skipped++;
        break;
      case "failed":
        failed++;
        break;
    }
  };

  while (processingQueue.length > 0 || processing.length > 0) {
    while (processing.length < maxConcurrent && processingQueue.length > 0) {
      const candidate = processingQueue.shift()!;
      const promise = processCandidate(candidate).then(() => {
        const idx = processing.indexOf(promise);
        if (idx !== -1) processing.splice(idx, 1);
      });
      processing.push(promise);
    }

    if (processing.length > 0) {
      await Promise.race(processing);
    }
  }

  console.log(
    `[Orchestrator] Complete: saved=${leadsSaved}, review=${requiresReview}, skipped=${skipped}, failed=${failed}`
  );

  // Fetch created leads to include in response
  const leadIds = results
    .filter((r) => r.leadId)
    .map((r) => r.leadId as string);

  const leads: LeadSummary[] = leadIds.length > 0
    ? (await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        select: {
          id: true,
          companyName: true,
          leadScore: true,
          confidenceScore: true,
          requiresReview: true,
        },
      }))
    : [];

  return {
    leadsSaved,
    requiresReview,
    skipped,
    failed,
    results,
    leads,
  };
}

async function processSingleCandidate(
  candidate: DiscoveryResult,
  fetchService: FetchService,
  analysisService: AnalysisService,
  opts: { sender_name?: string; sender_company?: string; leadPurpose: string }
): Promise<CandidateResult> {
  let candidateId = "";

  try {
    // @ts-expect-error - Prisma client types will be updated after migration
    const dbCandidate = await prisma.candidate.create({
      data: {
        companyName: candidate.company_name,
        domainCandidates: candidate.domain_candidates,
        profileUrls: candidate.profile_urls,
        discoveryProvenance: candidate.search_provenance,
        discoveryConfidence: candidate.discovery_confidence,
        status: "DISCOVERED",
      },
    });
    candidateId = dbCandidate.id;

    console.log(
      `[Orchestrator] Processing candidate: ${candidate.company_name} (${candidateId})`
    );

    const fetchResult = await fetchService.verifyAndFetch(candidate, candidateId);

    if (
      fetchResult.verifiedResources.length === 0 &&
      candidate.profile_urls.length === 0
    ) {
      // @ts-expect-error - Prisma client types will be updated after migration
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { status: "FAILED" },
      });

      return {
        candidateId,
        status: "skipped",
        reasons: [
          "No snapshots fetched and no profile URLs available",
          ...(fetchResult.failedReasons ?? []),
        ],
      };
    }

    // @ts-expect-error - Prisma client types will be updated after migration
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: "VERIFYING" },
    });

    const lead = await analysisService.analyzeCandidate(candidateId, {
      sender_name: opts.sender_name,
      sender_company: opts.sender_company,
      leadPurpose: opts.leadPurpose,
    });

    if (!lead) {
      // @ts-expect-error - Prisma client types will be updated after migration
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { status: "FAILED" },
      });

      return {
        candidateId,
        status: "failed",
        reasons: ["Analysis returned no lead"],
      };
    }

    // @ts-expect-error - Prisma client types will be updated after migration
    await prisma.rawAiResponse.create({
      data: {
        candidateId,
        leadId: lead.id,
        responseType: "analysis",
        response: lead.aiRawOutput ?? {},
        modelUsed: process.env.AI_MODEL ?? "gpt-4o",
      },
    });

    const confidence = lead.confidenceScore ?? 0;
    const requiresManualReview = lead.requiresReview || confidence < MIN_CONFIDENCE_THRESHOLD;

    if (requiresManualReview) {
      // @ts-expect-error - Prisma client types will be updated after migration
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { status: "VERIFIED" },
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: { requiresReview: true },
      });

      return {
        candidateId,
        leadId: lead.id,
        status: "requires_review",
        reasons: [
          confidence < MIN_CONFIDENCE_THRESHOLD
            ? `Confidence ${confidence} below threshold ${MIN_CONFIDENCE_THRESHOLD}`
            : "Flagged for manual review",
        ],
      };
    }

    // @ts-expect-error - Prisma client types will be updated after migration
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: "CONVERTED" },
    });

    return {
      candidateId,
      leadId: lead.id,
      status: "saved",
    };
  } catch (error) {
    console.error(
      `[Orchestrator] Error processing candidate ${candidate.company_name}:`,
      error
    );

    if (candidateId) {
      try {
        // @ts-expect-error - Prisma client types will be updated after migration
        await prisma.candidate.update({
          where: { id: candidateId },
          data: { status: "FAILED" },
        });
      } catch {
        // Ignore update errors
      }
    }

    return {
      candidateId: candidateId || `temp-${Date.now()}`,
      status: "failed",
      reasons: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}
