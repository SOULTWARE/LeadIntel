import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { computeLeadQualityScore, computeWarmupScore } from "@/lib/leads/insights";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().min(1),
});

const BodySchema = z.object({
  signal: z.enum(["linkedin", "content", "warm_intro"]),
  active: z.boolean().optional().default(true),
});

function getSuggestedTouches(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const suggested = (value as { suggestedTouches?: unknown }).suggestedTouches;
  if (!Array.isArray(suggested)) return [];
  return suggested.filter((item): item is string => typeof item === "string");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const parsedParams = ParamsSchema.safeParse(await params);
    const parsedBody = BodySchema.safeParse(await request.json());
    if (!parsedParams.success || !parsedBody.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: parsedParams.data.id },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    if (lead.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const isActive = parsedBody.data.active;
    const stamp = isActive ? new Date() : null;
    const nextLinkedinTouchedAt = parsedBody.data.signal === "linkedin" ? stamp : lead.linkedinTouchedAt;
    const nextContentEngagedAt = parsedBody.data.signal === "content" ? stamp : lead.contentEngagedAt;
    const nextWarmIntroRequestedAt =
      parsedBody.data.signal === "warm_intro" ? stamp : lead.warmIntroRequestedAt;

    const warmupScore = computeWarmupScore({
      linkedinTouchedAt: nextLinkedinTouchedAt,
      contentEngagedAt: nextContentEngagedAt,
      warmIntroRequestedAt: nextWarmIntroRequestedAt,
    });

    const qualityScore = computeLeadQualityScore({
      compatibilityScore: lead.compatibilityScore,
      emailVerificationStatus: lead.emailVerificationStatus,
      warmupScore,
      hasDecisionMakerRole: Boolean(lead.primaryDecisionMakerRole),
    });

    const suggestedTouches = getSuggestedTouches(lead.warmupSignals);

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        linkedinTouchedAt: nextLinkedinTouchedAt,
        contentEngagedAt: nextContentEngagedAt,
        warmIntroRequestedAt: nextWarmIntroRequestedAt,
        warmupScore,
        qualityScore,
        warmupSignals: {
          linkedinTouched: Boolean(nextLinkedinTouchedAt),
          contentEngaged: Boolean(nextContentEngagedAt),
          warmIntroRequested: Boolean(nextWarmIntroRequestedAt),
          suggestedTouches,
        },
      },
      select: {
        id: true,
        linkedinTouchedAt: true,
        contentEngagedAt: true,
        warmIntroRequestedAt: true,
        warmupScore: true,
        qualityScore: true,
        warmupSignals: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("[API /api/leads/[id]/outreach-prep] Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
