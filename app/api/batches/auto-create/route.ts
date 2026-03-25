import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { createBatchPlan } from "@/lib/leads/batching";
import { z } from "zod";

const BodySchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1),
  maxLeadsPerBatch: z.coerce.number().int().min(1).max(100).default(25),
  minQualityScore: z.coerce.number().int().min(0).max(100).default(60),
  requireVerified: z.boolean().optional().default(true),
  requireDecisionMaker: z.boolean().optional().default(true),
  requireWarmup: z.boolean().optional().default(false),
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

    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const {
      leadIds,
      maxLeadsPerBatch,
      minQualityScore,
      requireVerified,
      requireDecisionMaker,
      requireWarmup,
    } = parsed.data;

    const leads = await prisma.lead.findMany({
      where: {
        id: {
          in: Array.from(new Set(leadIds)),
        },
        userId: user.id,
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        batch: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
        primaryContact: {
          select: {
            isDecisionMaker: true,
          },
        },
      },
    });

    const plan = createBatchPlan(leads, {
      maxLeadsPerBatch,
      minQualityScore,
      requireVerified,
      requireDecisionMaker,
      requireWarmup,
    });

    if (plan.batches.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          createdBatchCount: 0,
          assignedLeadCount: 0,
          skippedCount: plan.skippedLeads.length,
          batches: [],
          skippedLeads: plan.skippedLeads,
        },
      });
    }

    const createdBatches = await prisma.$transaction(async (tx) => {
      const batches = [];

      for (const plannedBatch of plan.batches) {
        const createdBatch = await tx.leadBatch.create({
          data: {
            userId: user.id,
            name: plannedBatch.name,
            code: plannedBatch.codeSeed,
            status: "READY",
            maxLeads: plannedBatch.leads.length,
            campaignId: plannedBatch.campaignId || undefined,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            name: true,
            code: true,
            status: true,
            maxLeads: true,
            campaignId: true,
          },
        });

        const leadIdsForBatch = plannedBatch.leads.map((lead) => lead.id);
        await tx.lead.updateMany({
          where: {
            id: {
              in: leadIdsForBatch,
            },
            userId: user.id,
          },
          data: {
            batchId: createdBatch.id,
          },
        });

        batches.push({
          ...createdBatch,
          leadIds: leadIdsForBatch,
          campaignName: plannedBatch.campaignName,
          segmentName: plannedBatch.segmentName,
        });
      }

      return batches;
    });

    return NextResponse.json({
      success: true,
      data: {
        createdBatchCount: createdBatches.length,
        assignedLeadCount: plan.eligibleLeads.length,
        skippedCount: plan.skippedLeads.length,
        batches: createdBatches,
        skippedLeads: plan.skippedLeads,
      },
    });
  } catch (error) {
    console.error("[API /api/batches/auto-create] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
