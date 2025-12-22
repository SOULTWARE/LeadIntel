/**
 * Lead UI API - Returns UI-ready payload for lead detail page
 *
 * GET /api/leads/{id}/ui
 *
 * Returns structured data optimized for quick UI rendering.
 * Does NOT include full rawAIResponse (use /audit endpoint for that).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { actionabilityService } from "@/services/actionabilityService";
import {
  verifyEvidenceAgainstSnapshots,
  type Snapshot as ValidatorSnapshot,
} from "@/lib/validators/leadSchema";

const STALE_THRESHOLD_DAYS = 3;

interface LeadUIResponse {
  lead: {
    id: string;
    company_name: string;
    industry: string | null;
    location: string | null;
    employees: number | null;
    stage: string;
    lead_score: number | null;
    confidence: number | null;
    actionable: boolean;
    actionabilityScore: number | null;
    primaryOpportunity: string | null;
    requiresReview: boolean;
  };
  contactPaths: {
    phone: { value: string; verified: boolean } | null;
    email: { value: string; verified: boolean } | null;
    website: string | null;
    linkedin: string | null;
  };
  keyOpportunities: Array<{
    issue: string;
    severity: string;
    evidenceExcerpt: string;
    evidenceSnapshotId: string;
    source_url: string;
  }>;
  evidenceSummary: {
    counts: {
      snapshots: number;
      reviews: number;
      socials: number;
    };
    topSources: Array<{
      source_url: string;
      type: string;
      usedFor: "issue" | "contact" | "background";
      snippetsCount: number;
    }>;
  };
  outreachPreview: {
    suggestedAngle: string;
    suggestedSubject: string | null;
    suggestedSnippet: string | null;
  };
  audit: {
    rawAIResponseShown: boolean;
  };
  verificationIssues?: Array<{
    issue: string;
    reason: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            snapshots: true,
          },
        },
        issues: {
          include: {
            snapshot: true,
            sourceEvidence: true,
          },
        },
        decisionMakers: {
          include: {
            contacts: true,
          },
        },
        emailDrafts: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if actionability needs recomputation
    const aiRawOutput = (lead.aiRawOutput as Record<string, unknown>) ?? {};
    const actionabilityData = aiRawOutput.actionability as Record<string, unknown> | undefined;
    const lastComputedAt = actionabilityData?.computedAt
      ? new Date(actionabilityData.computedAt as string)
      : null;

    const isStale = !lastComputedAt ||
      (Date.now() - lastComputedAt.getTime()) > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

    const needsRecompute =
      lead.actionabilityScore === null ||
      lead.primaryOpportunity === null ||
      isStale;

    // Recompute actionability if needed
    if (needsRecompute) {
      try {
        const actionability = await actionabilityService.evaluateLeadForUI(id);

        // Update lead with fresh actionability data
        await prisma.lead.update({
          where: { id },
          data: {
            actionable: actionability.actionable,
            actionabilityScore: actionability.actionabilityScore,
            primaryOpportunity: actionability.primaryOpportunity.slice(0, 200),
            aiRawOutput: {
              ...aiRawOutput,
              actionability: {
                topIssues: JSON.parse(JSON.stringify(actionability.topIssues)),
                reasons: actionability.reasons,
                computedAt: new Date().toISOString(),
              },
            },
          },
        });

        // Reload lead with fresh data
        const updatedLead = await prisma.lead.findUnique({
          where: { id },
          include: {
            candidate: { include: { snapshots: true } },
            issues: { include: { snapshot: true, sourceEvidence: true } },
            decisionMakers: { include: { contacts: true } },
            emailDrafts: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        });

        if (updatedLead) {
          Object.assign(lead, updatedLead);
        }
      } catch (error) {
        console.error(`[LeadUI] Failed to recompute actionability for ${id}:`, error);
      }
    }

    // Build snapshots for verification
    const snapshots: ValidatorSnapshot[] = (lead.candidate?.snapshots ?? []).map((s) => ({
      id: s.id,
      url: s.url,
      textExtract: s.textExtract,
      sourceType: s.sourceType,
    }));

    // Build contact paths
    const contactPaths = buildContactPaths(lead.decisionMakers);

    // Build key opportunities with verification
    const { keyOpportunities, verificationIssues } = buildKeyOpportunities(
      lead.issues,
      snapshots
    );

    // Build evidence summary
    const evidenceSummary = buildEvidenceSummary(
      lead.candidate?.snapshots ?? [],
      lead.issues
    );

    // Build outreach preview
    const outreachPreview = buildOutreachPreview(lead, keyOpportunities);

    const response: LeadUIResponse = {
      lead: {
        id: lead.id,
        company_name: lead.companyName,
        industry: lead.industry,
        location: lead.location,
        employees: lead.employeeCount,
        stage: lead.outreachStage,
        lead_score: lead.leadScore,
        confidence: lead.confidenceScore,
        actionable: lead.actionable,
        actionabilityScore: lead.actionabilityScore,
        primaryOpportunity: lead.primaryOpportunity,
        requiresReview: lead.requiresReview,
      },
      contactPaths,
      keyOpportunities,
      evidenceSummary,
      outreachPreview,
      audit: {
        rawAIResponseShown: false,
      },
    };

    if (verificationIssues.length > 0) {
      response.verificationIssues = verificationIssues;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[LeadUI] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface DecisionMakerWithContacts {
  contacts: Array<{
    type: string;
    value: string;
    isVerified: boolean;
  }>;
}

function buildContactPaths(decisionMakers: DecisionMakerWithContacts[]): LeadUIResponse["contactPaths"] {
  let phone: { value: string; verified: boolean } | null = null;
  let email: { value: string; verified: boolean } | null = null;
  let linkedin: string | null = null;

  for (const dm of decisionMakers) {
    for (const contact of dm.contacts) {
      if (contact.type === "phone" && !phone) {
        phone = { value: contact.value, verified: contact.isVerified };
      }
      if (contact.type === "email" && !email) {
        email = { value: contact.value, verified: contact.isVerified };
      }
      if (contact.type === "linkedin" && !linkedin) {
        linkedin = contact.value;
      }
    }
  }

  return {
    phone,
    email,
    website: null, // Will be set from lead.website if needed
    linkedin,
  };
}

interface IssueWithSnapshot {
  id: string;
  title: string;
  description: string | null;
  severity: string | null;
  aiRawOutput: unknown;
  snapshot: {
    id: string;
    url: string;
    textExtract: string | null;
  } | null;
}

function buildKeyOpportunities(
  issues: IssueWithSnapshot[],
  snapshots: ValidatorSnapshot[]
): {
  keyOpportunities: LeadUIResponse["keyOpportunities"];
  verificationIssues: Array<{ issue: string; reason: string }>;
} {
  const keyOpportunities: LeadUIResponse["keyOpportunities"] = [];
  const verificationIssues: Array<{ issue: string; reason: string }> = [];

  // Sort by severity and take top 3
  const sortedIssues = [...issues].sort((a, b) => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (severityOrder[a.severity ?? "low"] ?? 3) - (severityOrder[b.severity ?? "low"] ?? 3);
  });

  for (const issue of sortedIssues.slice(0, 3)) {
    const rawOutput = issue.aiRawOutput as Record<string, unknown> | null;
    const evidence = rawOutput?.evidence as Record<string, unknown> | undefined;
    const excerpt = (evidence?.excerpt as string) ?? "";
    const sourceUrl = issue.snapshot?.url ?? (evidence?.source_url as string) ?? "";

    if (!excerpt || !issue.snapshot) {
      verificationIssues.push({
        issue: issue.title,
        reason: "Missing evidence excerpt or snapshot",
      });
      continue;
    }

    // Verify excerpt against snapshot
    const verification = verifyEvidenceAgainstSnapshots(
      {
        issues: [
          {
            title: issue.title,
            evidence: {
              snapshot_id: issue.snapshot.id,
              excerpt: excerpt,
            },
          },
        ],
      },
      snapshots
    );

    if (!verification.ok) {
      verificationIssues.push({
        issue: issue.title,
        reason: verification.errors[0] ?? "Evidence verification failed",
      });
      continue;
    }

    keyOpportunities.push({
      issue: issue.title,
      severity: issue.severity ?? "medium",
      evidenceExcerpt: excerpt.slice(0, 300),
      evidenceSnapshotId: issue.snapshot.id,
      source_url: sourceUrl,
    });
  }

  return { keyOpportunities, verificationIssues };
}

interface SnapshotForSummary {
  id: string;
  url: string;
  sourceType: string | null;
}

function buildEvidenceSummary(
  snapshots: SnapshotForSummary[],
  issues: IssueWithSnapshot[]
): LeadUIResponse["evidenceSummary"] {
  const counts = {
    snapshots: snapshots.length,
    reviews: snapshots.filter((s) =>
      s.sourceType?.toLowerCase().includes("review") ||
      s.url.includes("yelp") ||
      s.url.includes("google.com/maps")
    ).length,
    socials: snapshots.filter((s) =>
      s.sourceType?.toLowerCase().includes("social") ||
      s.url.includes("facebook") ||
      s.url.includes("instagram") ||
      s.url.includes("twitter") ||
      s.url.includes("linkedin")
    ).length,
  };

  // Build top sources
  const sourceUsage = new Map<string, { type: string; usedFor: Set<string>; count: number }>();

  for (const snapshot of snapshots) {
    const existing = sourceUsage.get(snapshot.url) ?? {
      type: snapshot.sourceType ?? "unknown",
      usedFor: new Set<string>(),
      count: 0,
    };
    existing.usedFor.add("background");
    existing.count++;
    sourceUsage.set(snapshot.url, existing);
  }

  for (const issue of issues) {
    if (issue.snapshot) {
      const existing = sourceUsage.get(issue.snapshot.url);
      if (existing) {
        existing.usedFor.add("issue");
        existing.count++;
      }
    }
  }

  const topSources = Array.from(sourceUsage.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([url, data]) => ({
      source_url: url,
      type: data.type,
      usedFor: data.usedFor.has("issue") ? "issue" as const :
               data.usedFor.has("contact") ? "contact" as const : "background" as const,
      snippetsCount: data.count,
    }));

  return { counts, topSources };
}

interface LeadForOutreach {
  companyName: string;
  industry: string | null;
  leadPurpose: string | null;
  emailDrafts: Array<{
    subject: string;
    body: string;
  }>;
}

function buildOutreachPreview(
  lead: LeadForOutreach,
  keyOpportunities: LeadUIResponse["keyOpportunities"]
): LeadUIResponse["outreachPreview"] {
  // Generate suggested angle from top opportunity
  let suggestedAngle = "General business development inquiry";

  if (keyOpportunities.length > 0) {
    const topOpp = keyOpportunities[0];
    if (topOpp.issue.toLowerCase().includes("website")) {
      suggestedAngle = "Website modernization opportunity";
    } else if (topOpp.issue.toLowerCase().includes("online") || topOpp.issue.toLowerCase().includes("order")) {
      suggestedAngle = "Digital presence enhancement";
    } else if (topOpp.issue.toLowerCase().includes("review")) {
      suggestedAngle = "Reputation management support";
    } else {
      suggestedAngle = `Address ${topOpp.issue.toLowerCase()}`;
    }
  } else if (lead.leadPurpose) {
    suggestedAngle = `${lead.leadPurpose} for ${lead.companyName}`;
  }

  // Get from email draft if available
  const emailDraft = lead.emailDrafts[0];

  return {
    suggestedAngle: suggestedAngle.slice(0, 100),
    suggestedSubject: emailDraft?.subject ?? null,
    suggestedSnippet: emailDraft?.body?.slice(0, 200) ?? null,
  };
}
