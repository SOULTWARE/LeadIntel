import { NextRequest, NextResponse } from "next/server";
import { aiEnhanceService } from "@/services/aiEnhanceService";
import { z } from "zod";

const EnhanceBatchRequestSchema = z.object({
  leads: z.array(z.unknown()),
  leadPurpose: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = EnhanceBatchRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. 'leads' (array) and 'leadPurpose' (string) are required." },
        { status: 400 }
      );
    }

    const { leads, leadPurpose } = parsed.data;

    // Limit batch size to 10 for now to avoid timeouts
    const batch = leads.slice(0, 10);

    const ids = batch
      .map((l: any) => l?.id)
      .filter((id: any) => typeof id === "string" && id.length > 0) as string[];

    let batchForAi = batch;
    if (ids.length > 0) {
      const { prisma } = await import("@/db");

      const dbLeads = await prisma.lead.findMany({
        where: {
          id: { in: ids },
        },
      });

      const byId = new Map(dbLeads.map((l) => [l.id, l] as const));
      batchForAi = batch.map((l: any) => {
        const id = typeof l?.id === "string" ? l.id : null;
        return (id && byId.get(id)) || l;
      });
    }

    const results = await aiEnhanceService.enhanceBatch(batchForAi, leadPurpose);

    return NextResponse.json({
      success: true,
      results: results.map((res, i) => ({
        ...(typeof batchForAi[i] === "object" && batchForAi[i] !== null ? (batchForAi[i] as object) : {}),
        aiAnalysis: res
      })),
      totalProcessed: batch.length
    });
  } catch (error) {
    console.error("[API /api/enhance/batch] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
