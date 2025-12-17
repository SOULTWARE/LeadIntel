import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const verifySchema = z.object({
  issueId: z.string().optional(),
  newExcerpt: z.string().min(1),
  isValid: z.boolean(),
  notes: z.string().optional(),
  verifierId: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: snapshotId } = await params;
    const body = await request.json();

    const validation = verifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 422 }
      );
    }

    const { issueId, newExcerpt, isValid, notes, verifierId } = validation.data;

    // @ts-expect-error - Prisma client types will be updated after migration
    const snapshot = await prisma.snapshot.findUnique({
      where: { id: snapshotId },
      select: { id: true, textExtract: true },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 }
      );
    }

    const excerptExists = snapshot.textExtract
      ?.toLowerCase()
      .includes(newExcerpt.toLowerCase());

    if (isValid && !excerptExists) {
      return NextResponse.json(
        {
          error: "Excerpt not found in snapshot",
          message: "Cannot mark evidence as valid if excerpt does not exist in snapshot",
        },
        { status: 400 }
      );
    }

    // @ts-expect-error - Prisma client types will be updated after migration
    const verification = await prisma.evidenceVerification.create({
      data: {
        snapshotId,
        issueId: issueId ?? null,
        originalExcerpt: "",
        newExcerpt,
        isValid,
        notes: notes ?? null,
        verifierId: verifierId ?? "system",
        verifiedAt: new Date(),
      },
    });

    if (issueId) {
      await prisma.issue.update({
        where: { id: issueId },
        data: {
          aiRawOutput: {
            evidence_verified: isValid,
            verification_notes: notes,
            verified_excerpt: newExcerpt,
            verified_at: new Date().toISOString(),
            verifier_id: verifierId,
          },
        },
      });

      if (!isValid) {
        const issue = await prisma.issue.findUnique({
          where: { id: issueId },
          select: { leadId: true },
        });

        if (issue) {
          await prisma.lead.update({
            where: { id: issue.leadId },
            data: { requiresReview: true },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        isValid,
        excerptExists,
      },
    });
  } catch (error) {
    console.error("[API /api/snapshots/[id]/verify] Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
