import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const SaveLeadsRequestSchema = z.object({
  leads: z
    .array(
      z
        .object({
          name: z.string().min(1),
          address: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
          website: z.string().nullable().optional(),
          rating: z.coerce.number().nullable().optional(),
          reviews: z.coerce.number().nullable().optional(),
          type: z.string().nullable().optional(),
          placeId: z.string().nullable().optional(),
          aiAnalysis: z
            .object({
              compatibilityScore: z.number().optional(),
              recommendation: z.string().optional(),
              reasoning: z.string().optional(),
              identifiedProblems: z.unknown().optional(),
              compatibilityHooks: z.unknown().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough(),
    )
    .default([]),
  sessionName: z.string().optional(),
  target: z.string().optional(),
  location: z.string().optional(),
  contactPurpose: z.string().optional(),
});

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

    const parsed = SaveLeadsRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request. 'leads' array is required.",
        },
        { status: 400 },
      );
    }

    const { leads, sessionName, target, location, contactPurpose } =
      parsed.data;

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
        const createData: Prisma.LeadUncheckedCreateInput = {
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
          searchQuery: contactPurpose || undefined,
        };

        const updateData: Prisma.LeadUncheckedUpdateInput = {
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
          searchQuery: contactPurpose || undefined,
        };

        if (lead.aiAnalysis) {
          createData.isEnhanced = true;
          createData.compatibilityScore = lead.aiAnalysis.compatibilityScore;
          createData.recommendation = lead.aiAnalysis.recommendation;
          createData.reasoning = lead.aiAnalysis.reasoning;
          createData.identifiedProblems = lead.aiAnalysis
            .identifiedProblems as Prisma.InputJsonValue;
          createData.compatibilityHooks = lead.aiAnalysis
            .compatibilityHooks as Prisma.InputJsonValue;

          updateData.isEnhanced = true;
          updateData.compatibilityScore = lead.aiAnalysis.compatibilityScore;
          updateData.recommendation = lead.aiAnalysis.recommendation;
          updateData.reasoning = lead.aiAnalysis.reasoning;
          updateData.identifiedProblems = lead.aiAnalysis
            .identifiedProblems as Prisma.InputJsonValue;
          updateData.compatibilityHooks = lead.aiAnalysis
            .compatibilityHooks as Prisma.InputJsonValue;
        }

        if (lead.placeId) {
          return prisma.lead.upsert({
            where: {
              userId_placeId: {
                userId: user.id,
                placeId: lead.placeId,
              },
            },
            update: updateData,
            create: createData,
          });
        }

        return prisma.lead.create({
          data: createData,
        });
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        count: savedLeads.length,
      },
    });
  } catch (error) {
    console.error("[API /api/leads/save] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
