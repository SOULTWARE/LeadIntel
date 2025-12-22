/**
 * Lead Audit API - Returns full rawAIResponse and deep_search data
 *
 * GET /api/leads/{id}/audit
 *
 * Used by the Audit Inspector UI to view raw AI responses and deep search data.
 * Separated from main UI endpoint to keep payload small by default.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";

interface AuditResponse {
  leadId: string;
  companyName: string;
  rawAIResponse: unknown;
  deepSearch: {
    signals: unknown[];
    scoreBreakdown: unknown;
    discoveryInfo: unknown;
    searchesPerformed: number;
    iterationsUsed: number;
  } | null;
  actionability: {
    topIssues: unknown[];
    reasons: string[];
    computedAt: string;
  } | null;
  verification: {
    passed: boolean;
    reviewReason: string | null;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
    lastAnalysisAt: string | null;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        aiRawOutput: true,
        requiresReview: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    const aiRawOutput = (lead.aiRawOutput as Record<string, unknown>) ?? {};

    // Extract components from aiRawOutput
    const rawAIResponse = aiRawOutput.response ?? null;
    const deepSearchData = aiRawOutput.deep_search as Record<string, unknown> | undefined;
    const actionabilityData = aiRawOutput.actionability as Record<string, unknown> | undefined;
    const reviewReason = (aiRawOutput.review_reason as string) ?? null;
    const verificationPassed = (aiRawOutput.verification_passed as boolean) ?? true;

    // Build deep search summary
    let deepSearch: AuditResponse["deepSearch"] = null;
    if (deepSearchData) {
      deepSearch = {
        signals: (deepSearchData.signals as unknown[]) ?? [],
        scoreBreakdown: deepSearchData.score_breakdown ?? null,
        discoveryInfo: deepSearchData.discovery_info ?? null,
        searchesPerformed: (deepSearchData.searches_performed as number) ?? 0,
        iterationsUsed: (deepSearchData.iterations_used as number) ?? 0,
      };
    }

    // Build actionability data
    let actionability: AuditResponse["actionability"] = null;
    if (actionabilityData) {
      actionability = {
        topIssues: (actionabilityData.topIssues as unknown[]) ?? [],
        reasons: (actionabilityData.reasons as string[]) ?? [],
        computedAt: (actionabilityData.computedAt as string) ?? "",
      };
    }

    const response: AuditResponse = {
      leadId: lead.id,
      companyName: lead.companyName,
      rawAIResponse,
      deepSearch,
      actionability,
      verification: {
        passed: verificationPassed,
        reviewReason,
      },
      timestamps: {
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        lastAnalysisAt: actionabilityData?.computedAt as string | null ?? null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[LeadAudit] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
