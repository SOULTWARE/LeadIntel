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
import { ResearchAgentService } from "@/services/researchAgentService";
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

  // Limit concurrency to avoid OpenAI rate limits (30k TPM)
  // Each lead does deep search with multiple AI calls
  const maxConcurrent = Math.min(
    parseInt(process.env.MAX_CONCURRENT_FETCHES ?? "2", 10),
    2
  );

  const discoveryService = new DiscoveryService();
  const fetchService = new FetchService({ maxConcurrentFetches: maxConcurrent });
  const analysisService = new AnalysisService();

  const results: CandidateResult[] = [];
  let leadsSaved = 0;
  let requiresReview = 0;
  let skipped = 0;
  let failed = 0;

  // Track seen domains/companies to avoid re-discovering same candidates
  const seenDomains = new Set<string>();
  const seenCompanies = new Set<string>();

  // Load existing leads to pre-populate seen sets
  const existingLeads = await prisma.lead.findMany({
    select: { domain: true, companyName: true, website: true },
  });
  for (const lead of existingLeads) {
    if (lead.domain) seenDomains.add(lead.domain.toLowerCase());
    if (lead.website) seenDomains.add(lead.website.replace(/^https?:\/\//, '').toLowerCase());
    if (lead.companyName) seenCompanies.add(lead.companyName.toLowerCase());
  }

  const targetNewLeads = count;
  let newLeadsFound = 0;
  let discoveryOffset = 0;
  const maxDiscoveryAttempts = 5; // Prevent infinite loop
  let discoveryAttempts = 0;

  console.log(
    `[Orchestrator] Starting discovery: industry=${industry}, location=${location}, target=${targetNewLeads} new leads`
  );

  while (newLeadsFound < targetNewLeads && discoveryAttempts < maxDiscoveryAttempts) {
    discoveryAttempts++;

    // Request more candidates than needed to account for duplicates
    const requestCount = Math.max(count, (targetNewLeads - newLeadsFound) * 2);

    const candidates = await discoveryService.discoverCandidates({
      industry,
      location,
      count: requestCount,
      leadPurpose,
      excludeCompanies: Array.from(seenCompanies),
      excludeDomains: Array.from(seenDomains),
    });

    console.log(`[Orchestrator] Discovery attempt ${discoveryAttempts}: found ${candidates.length} candidates`);

    if (candidates.length === 0) {
      console.log(`[Orchestrator] No more candidates found, stopping discovery`);
      break;
    }

    // Filter out already-seen candidates before processing
    const newCandidates = candidates.filter(c => {
      const domainsSeen = (c.domain_candidates || []).some(d => seenDomains.has(d.toLowerCase()));
      const companySeen = seenCompanies.has(c.company_name.toLowerCase());
      return !domainsSeen && !companySeen;
    });

    console.log(`[Orchestrator] ${newCandidates.length} candidates after filtering duplicates`);

    if (newCandidates.length === 0) {
      console.log(`[Orchestrator] All candidates were duplicates, trying again...`);
      discoveryOffset += requestCount;
      continue;
    }

    // Mark these as seen
    for (const c of newCandidates) {
      for (const d of c.domain_candidates || []) {
        seenDomains.add(d.toLowerCase());
      }
      seenCompanies.add(c.company_name.toLowerCase());
    }

    // Process candidates until we have enough new leads
    const processingQueue = [...newCandidates];
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
          newLeadsFound++;
          break;
        case "requires_review":
          requiresReview++;
          newLeadsFound++;
          break;
        case "skipped":
          skipped++;
          break;
        case "failed":
          failed++;
          break;
      }
    };

    while ((processingQueue.length > 0 || processing.length > 0) && newLeadsFound < targetNewLeads) {
      while (processing.length < maxConcurrent && processingQueue.length > 0 && newLeadsFound < targetNewLeads) {
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

    // Wait for remaining processing to complete
    await Promise.all(processing);
  }

  console.log(
    `[Orchestrator] Complete: saved=${leadsSaved}, review=${requiresReview}, skipped=${skipped}, failed=${failed} (target was ${targetNewLeads})`
  );

  // Fetch created leads to include in response (exclude skipped duplicates)
  const leadIds = results
    .filter((r) => r.leadId && r.status !== "skipped")
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
    results: results.filter(r => r.status !== "skipped"), // Don't return skipped duplicates
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
    // Check for duplicate leads by domain or company name BEFORE processing
    const domains = candidate.domain_candidates || [];
    const companyName = candidate.company_name;

    // Check if any of these domains already exist as leads
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          // Match by domain
          ...(domains.length > 0
            ? [{ domain: { in: domains } }]
            : []),
          // Match by website (with or without protocol)
          ...(domains.length > 0
            ? [{ website: { in: domains.flatMap(d => [d, `https://${d}`, `http://${d}`]) } }]
            : []),
          // Match by company name (case insensitive)
          { companyName: { equals: companyName, mode: "insensitive" as const } },
        ],
      },
      select: { id: true, companyName: true, domain: true },
    });

    if (existingLead) {
      console.log(
        `[Orchestrator] Skipping duplicate: "${companyName}" already exists as "${existingLead.companyName}" (id: ${existingLead.id})`
      );
      return {
        candidateId: existingLead.id,
        leadId: existingLead.id,
        status: "skipped",
        reasons: [`Lead already exists: ${existingLead.companyName} (${existingLead.domain || 'no domain'})`],
      };
    }

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

    // AI-guided research to find missing data via real web searches
    const needsResearch = !lead.industry || !lead.location || !lead.employeeCount;
    if (needsResearch && process.env.SEARCH_API_KEY) {
      try {
        console.log(`[Orchestrator] Starting AI-guided research for lead ${lead.id}`);
        const researchAgent = new ResearchAgentService();
        const domain = candidate.domain_candidates[0];

        // Get website content summary for context
        const websiteContent = fetchResult.verifiedResources
          .filter((r: { body_text?: string }) => r.body_text)
          .map((r: { body_text?: string }) => r.body_text || '')
          .join('\n')
          .slice(0, 3000);

        const research = await researchAgent.research({
          companyName: candidate.company_name,
          domain,
          leadPurpose: opts.leadPurpose || "general business development",
          existingData: {
            industry: lead.industry,
            location: lead.location,
            employeeCount: lead.employeeCount,
            description: lead.description,
          },
          websiteContent,
        });

        console.log(`[Orchestrator] Research complete: ${research.iterationsUsed} iterations, ${research.searchesPerformed.length} searches`);

        // Update lead with researched data (only real discovered data, no defaults)
        const updateData: Record<string, unknown> = {};
        if (research.industry && !lead.industry) {
          updateData.industry = research.industry;
        }
        if (research.location && !lead.location) {
          updateData.location = research.location;
        }
        if (research.employeeCount && !lead.employeeCount) {
          updateData.employeeCount = research.employeeCount;
        }
        if (research.description && !lead.description) {
          updateData.description = research.description;
        }

        // Compute overall lead score from research signals
        const scoreBreakdown = research.scoreBreakdown;
        const overallScore = Math.round(
          (scoreBreakdown.reputationScore * 0.2) +
          (scoreBreakdown.onlinePresenceScore * 0.15) +
          (scoreBreakdown.growthSignalsScore * 0.15) +
          (scoreBreakdown.intentMatchScore * 0.3) +
          (scoreBreakdown.accessibilityScore * 0.2)
        );

        // Update lead score if we have signals
        if (research.signals.length > 0) {
          updateData.leadScore = overallScore;
          updateData.confidenceScore = Math.min(100, research.signals.length * 5 + 30);
        }

        // Store deep search data in aiRawOutput
        const existingRawOutput = (lead.aiRawOutput as Record<string, unknown>) || {};
        updateData.aiRawOutput = {
          ...existingRawOutput,
          deep_search: {
            signals: research.signals,
            score_breakdown: research.scoreBreakdown,
            discovery_info: research.discoveryInfo,
            overall_score: overallScore,
            searches_performed: research.searchesPerformed.length,
            iterations_used: research.iterationsUsed,
          },
        };

        await prisma.lead.update({
          where: { id: lead.id },
          data: updateData,
        });
        console.log(`[Orchestrator] Updated lead with deep search data: score=${overallScore}, signals=${research.signals.length}`);
        console.log(`[Orchestrator] Score breakdown:`, research.scoreBreakdown);

        // Add decision makers from research with their contacts
        if (research.decisionMakers.length > 0) {
          for (const dm of research.decisionMakers) {
            const decisionMaker = await prisma.decisionMaker.create({
              data: {
                leadId: lead.id,
                firstName: dm.firstName,
                lastName: dm.lastName,
                title: dm.title,
                aiRawOutput: { source: dm.source, evidence: dm.evidence },
              },
            });

            // Add contacts for this decision maker
            if (dm.contacts && dm.contacts.length > 0) {
              for (const contact of dm.contacts) {
                await prisma.contact.create({
                  data: {
                    decisionMakerId: decisionMaker.id,
                    type: contact.type,
                    value: contact.value,
                    isPrimary: contact.type === "email",
                    isVerified: false,
                  },
                });
              }
              console.log(`[Orchestrator] Added ${dm.contacts.length} contacts for ${dm.firstName} ${dm.lastName}`);
            }
          }
          console.log(`[Orchestrator] Added ${research.decisionMakers.length} decision makers from research`);
        }

        // Add issues identified by research agent
        if (research.issues.length > 0) {
          for (const issue of research.issues) {
            await prisma.issue.create({
              data: {
                leadId: lead.id,
                title: issue.title,
                description: issue.description,
                category: issue.category,
                severity: issue.severity,
                aiRawOutput: { source: issue.source, evidence: issue.evidence },
              },
            });
          }
          console.log(`[Orchestrator] Added ${research.issues.length} issues from research`);
        }
      } catch (error) {
        console.error("[Orchestrator] Research failed:", error);
        // Continue without research - analysis data is still available
      }
    }

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
