import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const BodySchema = z.object({
  batchIds: z.array(z.string().min(1)).min(1),
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

    const batchIds = Array.from(new Set(parsed.data.batchIds));

    const updated = await prisma.leadBatch.updateMany({
      where: {
        id: { in: batchIds },
        userId: user.id,
        status: {
          in: ["DRAFT", "READY", "EXPORTED"],
        },
      },
      data: {
        status: "EXPORTED",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: updated.count,
      },
    });
  } catch (error) {
    console.error("[API /api/batches/export] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
