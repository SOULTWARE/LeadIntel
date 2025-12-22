/**
 * Actionability Service
 *
 * Converts raw model signals into concise, sales-oriented decisions for UI.
 * Answers: "Should I contact this lead and why?" and "What exactly to say?"
 */

import { prisma } from "@/db";
import {
  verifyEvidenceAgainstSnapshots,
  type Snapshot,
} from "@/lib/validators/leadSchema";

export interface TopIssue {
  issue: string;
  severity: "low" | "medium" | "high";
  evidenceSnapshotId: string;
  evidenceExcerpt: string;
  relevanceToIntent: number;
}

export interface ActionabilityResult {
  actionable: boolean;
  actionabilityScore: number; // 0-100
  primaryOpportunity: string; // <=200 chars
  topIssues: TopIssue[];
  reasons: string[]; // human readable short bullets
}

interface RawSignal {
  category?: string;
  type?: string;
  value?: string;
  sentiment?: string;
  source_url?: string;
  evidence?: string;
  relevance?: number;
  source_type?: string;
}

interface RawIssue {
  title?: string;
  description?: string;
  category?: string;
  severity?: string;
  source_evidence?: {
    source_url?: string;
    snippet?: string;
    source_type?: string;
  };
  evidence?: {
    source_url?: string;
    excerpt?: string;
    snapshot_id?: string;
  };
  relevanceToIntent?: number;
  confidence_score?: number;
}

interface DeepSearchData {
  signals?: RawSignal[];
  score_breakdown?: {
    reputationScore?: number;
    onlinePresenceScore?: number;
    growthSignalsScore?: number;
    intentMatchScore?: number;
    accessibilityScore?: number;
  };
}

interface ScoredIssue {
  title: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high";
  evidenceExcerpt: string;
  evidenceSnapshotId: string;
  sourceUrl: string;
  relevanceToIntent: number;
  computedScore: number;
}

const SEVERITY_WEIGHTS: Record<string, number> = {
  high: 30,
  critical: 30,
  medium: 15,
  low: 5,
};

const BUSINESS_IMPACT_CATEGORIES = ["website", "order", "ordering", "online", "digital"];

export class ActionabilityService {
  /**
   * Evaluate a lead for UI display, computing actionability score and top issues.
   */
  async evaluateLeadForUI(leadId: string): Promise<ActionabilityResult> {
    // Step 1: Load lead with related data
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        candidate: {
          include: {
            snapshots: true,
          },
        },
        issues: {
          include: {
            sourceEvidence: true,
            snapshot: true,
          },
        },
        decisionMakers: {
          include: {
            contacts: true,
          },
        },
      },
    });

    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Get snapshots from candidate
    const snapshots: Snapshot[] = (lead.candidate?.snapshots ?? []).map((s) => ({
      id: s.id,
      url: s.url,
      textExtract: s.textExtract,
      sourceType: s.sourceType,
    }));

    // Step 2: Build deduplicated signal set
    const aiRawOutput = (lead.aiRawOutput as Record<string, unknown>) ?? {};
    const deepSearch = (aiRawOutput.deep_search as DeepSearchData) ?? {};
    const rawSignals = deepSearch.signals ?? [];

    // Convert signals and DB issues to a unified format
    const allIssues: RawIssue[] = [];

    // Add signals as potential issues
    for (const signal of rawSignals) {
      if (signal.category && signal.value) {
        allIssues.push({
          title: signal.value,
          description: signal.value,
          category: signal.category,
          severity: this.inferSeverityFromSentiment(signal.sentiment),
          source_evidence: {
            source_url: signal.source_url,
            snippet: signal.evidence,
            source_type: signal.source_type,
          },
          relevanceToIntent: signal.relevance ?? 50,
        });
      }
    }

    // Add DB issues
    for (const issue of lead.issues) {
      const rawOutput = issue.aiRawOutput as Record<string, unknown> | null;
      allIssues.push({
        title: issue.title,
        description: issue.description ?? undefined,
        category: issue.category ?? undefined,
        severity: issue.severity ?? "medium",
        source_evidence: {
          source_url: rawOutput?.source_url as string | undefined,
          snippet: rawOutput?.evidence as string | undefined,
          source_type: issue.snapshot?.sourceType ?? undefined,
        },
        evidence: issue.snapshot
          ? {
              source_url: issue.snapshot.url,
              excerpt: rawOutput?.evidence as string | undefined,
              snapshot_id: issue.snapshot.id,
            }
          : undefined,
        relevanceToIntent: issue.confidenceScore ?? 50,
      });
    }

    // Step 2b: Deduplicate by exact evidence excerpt + source_url
    const seenKeys = new Set<string>();
    const deduplicatedIssues: RawIssue[] = [];

    for (const issue of allIssues) {
      const excerpt =
        issue.evidence?.excerpt ?? issue.source_evidence?.snippet ?? "";
      const sourceUrl =
        issue.evidence?.source_url ?? issue.source_evidence?.source_url ?? "";
      const key = `${excerpt.trim().toLowerCase()}::${sourceUrl.toLowerCase()}`;

      if (!seenKeys.has(key) && (excerpt || issue.title)) {
        seenKeys.add(key);
        deduplicatedIssues.push(issue);
      }
    }

    // Step 3: Filter signals by relevance or source type
    const ALLOWED_SOURCE_TYPES = ["homepage", "contact", "about"];
    const filteredIssues = deduplicatedIssues.filter((issue) => {
      const relevance = issue.relevanceToIntent ?? 0;
      const sourceType = (
        issue.source_evidence?.source_type ??
        ""
      ).toLowerCase();

      return (
        relevance >= 50 || ALLOWED_SOURCE_TYPES.includes(sourceType)
      );
    });

    // Step 4: Score issues
    const scoredIssues = this.scoreIssues(filteredIssues, snapshots);

    // Step 5: Pick top 3 issues by computed score
    const topIssues = scoredIssues.slice(0, 3);

    // Step 6: Compute overall actionability score
    const hasVerifiedContact = this.hasVerifiedContactInfo(lead.decisionMakers);
    const contactBonus = hasVerifiedContact ? 15 : 0;

    let actionabilityScore = 0;
    if (topIssues.length > 0) {
      const avgScore =
        topIssues.reduce((sum, i) => sum + i.computedScore, 0) / topIssues.length;
      actionabilityScore = Math.min(100, Math.round(avgScore + contactBonus));
    } else {
      // Base score from confidence if no issues
      actionabilityScore = Math.min(
        100,
        Math.round((lead.confidenceScore ?? 0) * 0.5 + contactBonus)
      );
    }

    // Step 7: Determine actionability
    const confidence = lead.confidenceScore ?? 0;
    const actionable =
      actionabilityScore >= 60 &&
      confidence >= 70 &&
      lead.requiresReview === false;

    // Step 8: Generate primary opportunity
    const primaryOpportunity = this.synthesizePrimaryOpportunity(
      topIssues,
      lead.leadPurpose ?? ""
    );

    // Step 9: Generate reasons
    const reasons = this.generateReasons(
      actionable,
      actionabilityScore,
      confidence,
      lead.requiresReview,
      topIssues,
      hasVerifiedContact
    );

    // Format top issues for output
    const formattedTopIssues: TopIssue[] = topIssues.map((issue) => ({
      issue: issue.title,
      severity: issue.severity,
      evidenceSnapshotId: issue.evidenceSnapshotId,
      evidenceExcerpt: issue.evidenceExcerpt,
      relevanceToIntent: issue.relevanceToIntent,
    }));

    return {
      actionable,
      actionabilityScore,
      primaryOpportunity,
      topIssues: formattedTopIssues,
      reasons,
    };
  }

  /**
   * Score issues based on severity, relevance, and business impact.
   */
  private scoreIssues(
    issues: RawIssue[],
    snapshots: Snapshot[]
  ): ScoredIssue[] {
    const scored: ScoredIssue[] = [];

    for (const issue of issues) {
      const severity = this.normalizeSeverity(issue.severity);
      const severityWeight = SEVERITY_WEIGHTS[severity] ?? 5;

      const relevance = issue.relevanceToIntent ?? 50;
      const relevanceContribution = (relevance / 100) * 40;

      const category = (issue.category ?? "").toLowerCase();
      const hasBusinessImpact = BUSINESS_IMPACT_CATEGORIES.some((cat) =>
        category.includes(cat)
      );
      const businessImpactBonus = hasBusinessImpact ? 20 : 0;

      const rawScore = severityWeight + relevanceContribution + businessImpactBonus;
      const computedScore = Math.min(100, Math.round(rawScore));

      // Find matching snapshot
      const excerpt =
        issue.evidence?.excerpt ?? issue.source_evidence?.snippet ?? "";
      const sourceUrl =
        issue.evidence?.source_url ?? issue.source_evidence?.source_url ?? "";
      const snapshotId = issue.evidence?.snapshot_id;

      let matchedSnapshotId = snapshotId ?? "";
      let verifiedExcerpt = excerpt;

      // Try to find snapshot by ID or URL
      if (!matchedSnapshotId && sourceUrl) {
        const matchingSnapshot = snapshots.find(
          (s) => s.url === sourceUrl || s.url.includes(sourceUrl)
        );
        if (matchingSnapshot) {
          matchedSnapshotId = matchingSnapshot.id;
        }
      }

      // Verify excerpt against snapshot
      if (matchedSnapshotId && excerpt) {
        const verification = verifyEvidenceAgainstSnapshots(
          {
            issues: [
              {
                title: issue.title,
                evidence: {
                  snapshot_id: matchedSnapshotId,
                  excerpt: excerpt,
                },
              },
            ],
          },
          snapshots
        );

        if (!verification.ok) {
          console.log(
            `[ActionabilityService] Evidence mismatch for "${issue.title}": ${verification.errors.join(", ")}`
          );
          // Still include but note the mismatch
          verifiedExcerpt = excerpt + " [unverified]";
        }
      }

      scored.push({
        title: issue.title ?? "Unnamed Issue",
        description: issue.description ?? "",
        category: issue.category ?? "general",
        severity,
        evidenceExcerpt: verifiedExcerpt.slice(0, 500),
        evidenceSnapshotId: matchedSnapshotId,
        sourceUrl,
        relevanceToIntent: relevance,
        computedScore,
      });
    }

    // Sort by computed score descending
    return scored.sort((a, b) => b.computedScore - a.computedScore);
  }

  /**
   * Check if lead has verified contact information.
   */
  private hasVerifiedContactInfo(
    decisionMakers: Array<{
      contacts: Array<{ type: string; isVerified: boolean }>;
    }>
  ): boolean {
    for (const dm of decisionMakers) {
      for (const contact of dm.contacts) {
        if (
          contact.isVerified &&
          (contact.type === "email" || contact.type === "phone")
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Infer severity from sentiment.
   */
  private inferSeverityFromSentiment(
    sentiment?: string
  ): "low" | "medium" | "high" {
    if (!sentiment) return "medium";
    const s = sentiment.toLowerCase();
    if (s === "negative") return "high";
    if (s === "positive") return "low";
    return "medium";
  }

  /**
   * Normalize severity string to enum value.
   */
  private normalizeSeverity(severity?: string): "low" | "medium" | "high" {
    if (!severity) return "medium";
    const s = severity.toLowerCase();
    if (s === "high" || s === "critical") return "high";
    if (s === "low") return "low";
    return "medium";
  }

  /**
   * Synthesize a primary opportunity one-liner from top issues.
   * Format: "<verb> <asset> to <benefit>"
   */
  private synthesizePrimaryOpportunity(
    topIssues: ScoredIssue[],
    leadPurpose: string
  ): string {
    if (topIssues.length === 0) {
      return leadPurpose
        ? `Explore ${leadPurpose} opportunities`
        : "Evaluate potential partnership";
    }

    const topIssue = topIssues[0];
    const category = topIssue.category.toLowerCase();

    // Generate verb based on category
    let verb = "Improve";
    if (category.includes("website") || category.includes("online")) {
      verb = "Modernize";
    } else if (category.includes("order") || category.includes("sales")) {
      verb = "Streamline";
    } else if (category.includes("review") || category.includes("reputation")) {
      verb = "Enhance";
    } else if (category.includes("social") || category.includes("marketing")) {
      verb = "Boost";
    }

    // Generate asset from issue title
    const asset = this.extractAsset(topIssue.title, category);

    // Generate benefit from purpose or category
    const benefit = this.extractBenefit(leadPurpose, category);

    const opportunity = `${verb} ${asset} to ${benefit}`;
    return opportunity.slice(0, 200);
  }

  /**
   * Extract asset noun from issue title.
   */
  private extractAsset(title: string, category: string): string {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("website")) return "website";
    if (titleLower.includes("ordering")) return "ordering system";
    if (titleLower.includes("online")) return "online presence";
    if (titleLower.includes("review")) return "customer reviews";
    if (titleLower.includes("social")) return "social media";
    if (titleLower.includes("mobile")) return "mobile experience";

    // Fallback to category
    if (category.includes("website")) return "website";
    if (category.includes("social")) return "social presence";
    if (category.includes("review")) return "reputation";

    return "digital presence";
  }

  /**
   * Extract benefit from lead purpose.
   */
  private extractBenefit(purpose: string, category: string): string {
    const purposeLower = purpose.toLowerCase();

    if (purposeLower.includes("revenue") || purposeLower.includes("sales")) {
      return "increase revenue";
    }
    if (purposeLower.includes("customer") || purposeLower.includes("client")) {
      return "attract more customers";
    }
    if (purposeLower.includes("brand") || purposeLower.includes("awareness")) {
      return "strengthen brand visibility";
    }
    if (purposeLower.includes("efficiency") || purposeLower.includes("automate")) {
      return "improve operational efficiency";
    }

    // Fallback based on category
    if (category.includes("order") || category.includes("sales")) {
      return "recover lost revenue";
    }
    if (category.includes("review") || category.includes("reputation")) {
      return "build customer trust";
    }

    return "drive business growth";
  }

  /**
   * Generate human-readable reasons for actionability decision.
   */
  private generateReasons(
    actionable: boolean,
    score: number,
    confidence: number,
    requiresReview: boolean,
    topIssues: ScoredIssue[],
    hasVerifiedContact: boolean
  ): string[] {
    const reasons: string[] = [];

    if (actionable) {
      if (topIssues.length > 0) {
        reasons.push(
          `${topIssues.length} clear opportunities identified with high relevance`
        );
      }
      if (hasVerifiedContact) {
        reasons.push("Verified contact information available");
      }
      reasons.push(`Strong actionability score of ${score}/100`);
    } else {
      if (score < 60) {
        reasons.push(`Actionability score (${score}) below threshold of 60`);
      }
      if (confidence < 70) {
        reasons.push(`Confidence score (${Math.round(confidence)}) below 70%`);
      }
      if (requiresReview) {
        reasons.push("Lead flagged for manual review");
      }
      if (topIssues.length === 0) {
        reasons.push("No clear opportunities identified");
      }
      if (!hasVerifiedContact) {
        reasons.push("No verified contact information found");
      }
    }

    return reasons.slice(0, 3);
  }
}

// Export singleton instance
export const actionabilityService = new ActionabilityService();
