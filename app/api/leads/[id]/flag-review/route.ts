/**
 * Flag Lead for Review API
 *
 * POST /api/leads/{id}/flag-review
 *
 * Marks a lead as requiring manual review with a note.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";

interface RequestBody {
  reason: string;
  reviewerName: string;
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

    if (!body.reason || typeof body.reason !== "string") {
      return NextResponse.json(
        { error: "reason is required" },
        { status: 400 }
      );
    }

    if (!body.reviewerName || typeof body.reviewerName !== "string") {
      return NextResponse.json(
        { error: "reviewerName is required" },
        { status: 400 }
      );
    }

    // Check lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        requiresReview: true,
        aiRawOutput: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Update lead with review flag and note
    const existingOutput = (lead.aiRawOutput as Record<string, unknown>) ?? {};
    const existingReviewNotes = Array.isArray(existingOutput.review_notes)
      ? existingOutput.review_notes
      : [];

    const newReviewNote = {
      reason: body.reason,
      flagged_by: body.reviewerName,
      flagged_at: new Date().toISOString(),
    };

    // Use JSON stringify/parse to ensure Prisma JSON compatibility
    const updatedAiOutput = JSON.parse(JSON.stringify({
      ...existingOutput,
      review_notes: [...existingReviewNotes, newReviewNote],
      last_flagged_at: new Date().toISOString(),
      last_flagged_by: body.reviewerName,
    }));

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        requiresReview: true,
        aiRawOutput: updatedAiOutput,
      },
      select: {
        id: true,
        companyName: true,
        requiresReview: true,
      },
    });

    return NextResponse.json({
      success: true,
      leadId: updatedLead.id,
      companyName: updatedLead.companyName,
      requiresReview: updatedLead.requiresReview,
      message: "Lead flagged for manual review",
    });
  } catch (error) {
    console.error("[FlagReview] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
