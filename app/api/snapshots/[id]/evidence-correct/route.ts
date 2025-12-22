/**
 * Evidence Correction API
 *
 * POST /api/snapshots/{id}/evidence-correct
 *
 * Allows manual correction of evidence excerpts when verification fails.
 * Verifies new excerpt exists in snapshot before accepting.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";

interface RequestBody {
  snapshotId: string;
  oldExcerpt: string;
  newExcerpt: string;
  reason: string;
  verifierName: string;
  issueId?: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    // Parse and validate request body
    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.snapshotId || body.snapshotId !== id) {
      return NextResponse.json(
        { error: "snapshotId must match route parameter" },
        { status: 400 }
      );
    }

    if (!body.newExcerpt || typeof body.newExcerpt !== "string") {
      return NextResponse.json(
        { error: "newExcerpt is required" },
        { status: 400 }
      );
    }

    if (!body.verifierName || typeof body.verifierName !== "string") {
      return NextResponse.json(
        { error: "verifierName is required" },
        { status: 400 }
      );
    }

    // Load snapshot
    const snapshot = await prisma.snapshot.findUnique({
      where: { id },
      select: {
        id: true,
        url: true,
        textExtract: true,
        issues: {
          select: { id: true },
        },
      },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 }
      );
    }

    // Verify new excerpt exists in snapshot text
    const snapshotText = snapshot.textExtract ?? "";
    const normalizedExcerpt = normalizeText(body.newExcerpt);
    const normalizedSnapshotText = normalizeText(snapshotText);

    if (!normalizedSnapshotText.includes(normalizedExcerpt)) {
      return NextResponse.json(
        {
          error: "New excerpt not found in snapshot",
          detail: "The provided excerpt does not exist verbatim in the snapshot text",
          suggestion: "Copy the exact text from the snapshot content"
        },
        { status: 422 }
      );
    }

    // Create evidence verification record
    const verification = await prisma.evidenceVerification.create({
      data: {
        snapshotId: id,
        issueId: body.issueId ?? null,
        originalExcerpt: body.oldExcerpt ?? null,
        newExcerpt: body.newExcerpt,
        isValid: true,
        notes: body.reason,
        verifierId: body.verifierName,
        verifiedAt: new Date(),
      },
    });

    // If issueId provided, update the issue's evidence
    if (body.issueId) {
      const issue = await prisma.issue.findUnique({
        where: { id: body.issueId },
        select: { aiRawOutput: true },
      });

      if (issue) {
        const existingOutput = (issue.aiRawOutput as Record<string, unknown>) ?? {};
        const evidence = (existingOutput.evidence as Record<string, unknown>) ?? {};

        await prisma.issue.update({
          where: { id: body.issueId },
          data: {
            aiRawOutput: {
              ...existingOutput,
              evidence: {
                ...evidence,
                excerpt: body.newExcerpt,
                manually_verified: true,
                verified_by: body.verifierName,
                verified_at: new Date().toISOString(),
                original_excerpt: body.oldExcerpt,
                correction_reason: body.reason,
              },
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      verificationId: verification.id,
      message: "Evidence correction recorded successfully",
    });
  } catch (error) {
    console.error("[EvidenceCorrect] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
