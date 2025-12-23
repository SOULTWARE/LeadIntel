import { NextRequest, NextResponse } from "next/server";
import { aiEnhanceService } from "@/services/aiEnhanceService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leads, leadPurpose } = body;

    if (!leads || !Array.isArray(leads) || !leadPurpose) {
      return NextResponse.json({ error: "Invalid request. 'leads' (array) and 'leadPurpose' (string) are required." }, { status: 400 });
    }

    // Limit batch size to 10 for now to avoid timeouts
    const batch = leads.slice(0, 10);
    const results = await aiEnhanceService.enhanceBatch(batch, leadPurpose);

    return NextResponse.json({
      success: true,
      results: results.map((res, i) => ({
        ...batch[i],
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
