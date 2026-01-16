import { NextRequest, NextResponse } from "next/server";
import { aiEnhanceService } from "@/services/aiEnhanceService";
import { createClient } from "@/lib/supabase/server";
import { creditsService, InsufficientCreditsError } from "@/services/creditsService";
import { CreditAction, getCreditCost } from "@/lib/credits/costs";
import { z } from "zod";

const LeadPlaceDataSchema = z
  .object({
    name: z.string().min(1),
  })
  .passthrough();

const EnhanceBatchRequestSchema = z.object({
  leads: z.array(LeadPlaceDataSchema),
  leadPurpose: z.string().min(1),
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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const parsed = EnhanceBatchRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request. 'leads' (array) and 'leadPurpose' (string) are required." },
        { status: 400 }
      );
    }

    const { leads, leadPurpose } = parsed.data;

    // Limit batch size to 10 for now to avoid timeouts
    const batch = leads.slice(0, 10);

    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return NextResponse.json({ success: false, error: "Missing Idempotency-Key header" }, { status: 400 });
    }

    const holdAmount = getCreditCost(CreditAction.AI_ENHANCE, { leadsCount: batch.length });
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
          return NextResponse.json({ success: false, error: "Insufficient credits" }, { status: 402 });
        }
        throw err;
      }
    }

    const ids = batch
      .map((l) => getLeadId(l))
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    let batchForAi = batch;
    if (ids.length > 0) {
      const { prisma } = await import("@/db");

      const dbLeads = await prisma.lead.findMany({
        where: {
          id: { in: ids },
        },
      });

      const byId = new Map(dbLeads.map((l) => [l.id, l] as const));
      batchForAi = batch.map((l) => {
        const id = getLeadId(l);
        return (id && byId.get(id)) || l;
      });
    }

    const results = await aiEnhanceService.enhanceBatch(batchForAi, leadPurpose);

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
          ...(typeof batchForAi[i] === "object" && batchForAi[i] !== null ? (batchForAi[i] as object) : {}),
          aiAnalysis: res
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
      { status: 500 }
    );
  }
}
