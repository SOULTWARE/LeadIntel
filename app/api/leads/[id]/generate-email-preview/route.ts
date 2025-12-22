/**
 * Generate Email Preview API
 *
 * POST /api/leads/{id}/generate-email-preview
 *
 * Generates 2 email variations for outreach preview.
 * Does NOT send emails - preview only.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { actionabilityService } from "@/services/actionabilityService";
import { emailPreviewService, type EmailTone } from "@/services/emailPreviewService";

interface RequestBody {
  sender_name: string;
  sender_company: string;
  tone?: EmailTone;
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

    if (!body.sender_name || typeof body.sender_name !== "string") {
      return NextResponse.json(
        { error: "sender_name is required" },
        { status: 400 }
      );
    }

    if (!body.sender_company || typeof body.sender_company !== "string") {
      return NextResponse.json(
        { error: "sender_company is required" },
        { status: 400 }
      );
    }

    const validTones: EmailTone[] = ["concise", "professional", "direct"];
    if (body.tone && !validTones.includes(body.tone)) {
      return NextResponse.json(
        { error: `tone must be one of: ${validTones.join(", ")}` },
        { status: 400 }
      );
    }

    // Load lead to check existence and actionability
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        actionable: true,
        requiresReview: true,
        primaryOpportunity: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check actionability
    // @ts-expect-error - actionable field exists after migration
    if (!lead.actionable) {
      return NextResponse.json(
        {
          error: "Lead is not actionable",
          reason: lead.requiresReview
            ? "Lead requires manual review before outreach"
            : "Lead does not meet actionability criteria (score < 60 or confidence < 70)",
          suggestion: "Review the lead details and address any verification issues before generating emails"
        },
        { status: 400 }
      );
    }

    // Get actionability data with top issues
    const actionability = await actionabilityService.evaluateLeadForUI(id);

    if (actionability.topIssues.length === 0) {
      return NextResponse.json(
        {
          error: "No opportunities identified",
          reason: "Cannot generate personalized emails without identified issues",
          suggestion: "Run deep search on this lead to identify opportunities"
        },
        { status: 400 }
      );
    }

    // Generate email previews
    const result = await emailPreviewService.generateEmailPreviews({
      companyName: lead.companyName,
      // @ts-expect-error - primaryOpportunity field exists after migration
      primaryOpportunity: lead.primaryOpportunity ?? actionability.primaryOpportunity,
      topIssues: actionability.topIssues,
      senderName: body.sender_name,
      senderCompany: body.sender_company,
      tone: body.tone,
    });

    return NextResponse.json({
      success: true,
      leadId: id,
      companyName: lead.companyName,
      variations: result.emails,
    });
  } catch (error) {
    console.error("[GenerateEmailPreview] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
