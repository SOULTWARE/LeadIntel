import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leads, sessionName, target, location } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: "Invalid request. 'leads' array is required." }, { status: 400 });
    }

    let sessionId: string | undefined;
    if (sessionName) {
      const session = await prisma.session.create({
        data: {
          name: sessionName,
          target: target,
          location: location,
          userId: user.id,
        },
      });
      sessionId = session.id;
    }

    const savedLeads = await Promise.all(
      leads.map(async (lead) => {
        const data: any = {
          name: lead.name,
          address: lead.address,
          phone: lead.phone,
          website: lead.website,
          rating: lead.rating,
          reviews: lead.reviews,
          type: lead.type,
          placeId: lead.placeId,
          sessionId: sessionId,
          userId: user.id,
        };

        if (lead.aiAnalysis) {
          data.isEnhanced = true;
          data.compatibilityScore = lead.aiAnalysis.compatibilityScore;
          data.recommendation = lead.aiAnalysis.recommendation;
          data.reasoning = lead.aiAnalysis.reasoning;
          data.identifiedProblems = lead.aiAnalysis.identifiedProblems;
          data.compatibilityHooks = lead.aiAnalysis.compatibilityHooks;
        }

        return prisma.lead.upsert({
          where: { placeId: lead.placeId || lead.name },
          update: data,
          create: data,
        });
      })
    );

    return NextResponse.json({
      success: true,
      count: savedLeads.length,
    });
  } catch (error) {
    console.error("[API /api/leads/save] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
