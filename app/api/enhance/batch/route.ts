import { NextRequest, NextResponse } from "next/server";
import { aiEnhanceService } from "@/services/aiEnhanceService";
import { createClient } from "@/lib/supabase/server";
import {
  creditsService,
  InsufficientCreditsError,
} from "@/services/creditsService";
import { CreditAction, getCreditCost } from "@/lib/credits/costs";
import {
  computeLeadQualityScore,
  parseEmployeeEstimate,
} from "@/lib/leads/insights";
import { prisma } from "@/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const LeadPlaceDataSchema = z
  .object({
    name: z.string().min(1),
  })
  .passthrough();

const EnhanceBatchRequestSchema = z.object({
  leads: z.array(LeadPlaceDataSchema),
  leadPurpose: z.string().min(1),
  qualityStrictness: z.coerce.number().int().min(0).max(100).optional(),
});

function getLeadId(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && v.id.length > 0 ? v.id : null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const parsed = EnhanceBatchRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request. 'leads' (array) and 'leadPurpose' (string) are required.",
        },
        { status: 400 },
      );
    }

    const { leads, leadPurpose, qualityStrictness } = parsed.data;

    // Limit batch size to 10 for now to avoid timeouts
    const batch = leads.slice(0, 10);

    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return NextResponse.json(
        { success: false, error: "Missing Idempotency-Key header" },
        { status: 400 },
      );
    }

    const holdAmount = getCreditCost(CreditAction.AI_ENHANCE, {
      leadsCount: batch.length,
    });
    const shouldCharge = holdAmount > 0;

    if (shouldCharge) {
      try {
        await creditsService.createHold({
          userId: user.id,
          action: CreditAction.AI_ENHANCE,
          amount: holdAmount,
          idempotencyKey,
          meta: { leadsCount: batch.length },
        });
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          return NextResponse.json(
            { success: false, error: "Insufficient credits" },
            { status: 402 },
          );
        }
        throw err;
      }
    }

    const ids = batch
      .map((l) => getLeadId(l))
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    let batchForAi = batch;
    const byId = new Map<
      string,
      Awaited<ReturnType<typeof prisma.lead.findMany>>[number]
    >();
    if (ids.length > 0) {
      const dbLeads = await prisma.lead.findMany({
        where: {
          id: { in: ids },
        },
      });

      for (const dbLead of dbLeads) {
        byId.set(dbLead.id, dbLead);
      }
      batchForAi = batch.map((l) => {
        const id = getLeadId(l);
        return (id && byId.get(id)) || l;
      });
    }

    const results = await aiEnhanceService.enhanceBatch(
      batchForAi,
      leadPurpose,
      qualityStrictness,
    );

    const leadsToPersist = results
      .map((analysis, index) => {
        const candidate = batchForAi[index];
        const id = getLeadId(candidate);
        return id
          ? {
              id,
              analysis,
            }
          : null;
      })
      .filter(
        (item): item is { id: string; analysis: (typeof results)[number] } =>
          item !== null,
      );

    if (leadsToPersist.length > 0) {
      const operations: Prisma.PrismaPromise<unknown>[] = [];

      for (const { id, analysis } of leadsToPersist) {
        const storedLead = byId.get(id);
        const qualityScore = computeLeadQualityScore({
          compatibilityScore: analysis.compatibilityScore,
          emailVerificationStatus: storedLead?.emailVerificationStatus,
          warmupScore: storedLead?.warmupScore,
          companyConfidence: analysis.companyProfile?.confidence,
          hasDecisionMakerRole: (analysis.decisionMakerRoles?.length || 0) > 0,
        });

        operations.push(
          prisma.lead.update({
            where: { id },
            data: {
              isEnhanced: true,
              compatibilityScore: analysis.compatibilityScore,
              qualityScore,
              recommendation: analysis.recommendation,
              reasoning: analysis.reasoning,
              identifiedProblems: analysis.identifiedProblems,
              compatibilityHooks: analysis.compatibilityHooks,
              decisionMakerRoles: analysis.decisionMakerRoles,
              primaryDecisionMakerRole:
                analysis.decisionMakerRoles?.[0] || null,
              warmupSignals: {
                linkedinTouched: Boolean(storedLead?.linkedinTouchedAt),
                contentEngaged: Boolean(storedLead?.contentEngagedAt),
                warmIntroRequested: Boolean(storedLead?.warmIntroRequestedAt),
                suggestedTouches: analysis.outreachSignals,
              },
            },
          }),
        );

        if (storedLead?.companyId && analysis.companyProfile) {
          operations.push(
            prisma.company.update({
              where: { id: storedLead.companyId },
              data: {
                industry: analysis.companyProfile.industry,
                companySize: analysis.companyProfile.companySize,
                employeeCountEstimate: parseEmployeeEstimate(
                  analysis.companyProfile.employeeRange,
                ),
                revenueRange: analysis.companyProfile.revenueRange,
                hqLocation:
                  analysis.companyProfile.locationSummary || undefined,
                industryConfidence: analysis.companyProfile.confidence,
                decisionMakerRoleHints: analysis.decisionMakerRoles,
                lastEnrichedAt: new Date(),
              },
            }),
          );
        }
      }

      await prisma.$transaction(operations);
    }

    if (shouldCharge) {
      await creditsService.captureHold({
        userId: user.id,
        action: CreditAction.AI_ENHANCE,
        idempotencyKey,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        results: results.map((res, i) => ({
          ...(typeof batchForAi[i] === "object" && batchForAi[i] !== null
            ? (batchForAi[i] as object)
            : {}),
          aiAnalysis: res,
        })),
        totalProcessed: batch.length,
      },
    });
  } catch (error) {
    console.error("[API /api/enhance/batch] Error:", error);

    try {
      const idempotencyKey = request.headers.get("Idempotency-Key");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && idempotencyKey) {
        await creditsService.releaseHold({
          userId: user.id,
          action: CreditAction.AI_ENHANCE,
          idempotencyKey,
        });
      }
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
