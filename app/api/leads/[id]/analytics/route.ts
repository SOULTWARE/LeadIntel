import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { calculateRate } from "@/lib/leads/insights";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().min(1),
});

const BodySchema = z.object({
  metric: z.enum(["sentCount", "openCount", "clickCount", "responseCount", "bounceCount"]),
  operation: z.enum(["increment", "decrement"]).optional().default("increment"),
});

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

    const metric = parsedBody.data.metric;
    const direction = parsedBody.data.operation === "decrement" ? -1 : 1;
    const currentValue = lead[metric];
    const nextValue = Math.max(0, currentValue + direction);

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        [metric]: nextValue,
      },
      select: {
        id: true,
        sentCount: true,
        openCount: true,
        clickCount: true,
        responseCount: true,
        bounceCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        openRate: calculateRate(updated.openCount, updated.sentCount),
        clickRate: calculateRate(updated.clickCount, updated.sentCount),
        responseRate: calculateRate(updated.responseCount, updated.sentCount),
        bounceRate: calculateRate(updated.bounceCount, updated.sentCount),
      },
    });
  } catch (error) {
    console.error("[API /api/leads/[id]/analytics] Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
