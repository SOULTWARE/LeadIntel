import { calculateRate } from "@/lib/leads/insights";

type PortfolioLead = {
  qualityScore?: number | null;
  compatibilityScore?: number | null;
  warmupScore?: number | null;
  emailVerificationStatus?: string | null;
  primaryDecisionMakerRole?: string | null;
  primaryContact?: {
    isDecisionMaker?: boolean | null;
  } | null;
  campaign?: {
    name?: string | null;
  } | null;
  batch?: {
    id?: string | null;
    name?: string | null;
    code?: string | null;
    status?: string | null;
  } | null;
  sentCount?: number | null;
  openCount?: number | null;
  clickCount?: number | null;
  responseCount?: number | null;
  bounceCount?: number | null;
  events?: Array<{
    occurredAt: Date | string;
  }>;
};

export type LeadPortfolioSummary = {
  totalLeads: number;
  avgQualityScore: number;
  avgCompatibilityScore: number;
  avgWarmupScore: number;
  verifiedCount: number;
  decisionMakerCount: number;
  warmedCount: number;
  readyCount: number;
  sent: number;
  opens: number;
  clicks: number;
  replies: number;
  bounces: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  bounceRate: number;
};

export type CampaignPerformanceSummary = {
  name: string;
  leadCount: number;
  avgQualityScore: number;
  readyCount: number;
  verifiedCount: number;
  sent: number;
  responseRate: number;
  bounceRate: number;
  openRate: number;
};

export type BatchPerformanceSummary = {
  id: string;
  name: string;
  code: string;
  status: string;
  leadCount: number;
  avgQualityScore: number;
  readyCount: number;
  sent: number;
  responseRate: number;
  lastActivityAt: Date | null;
};

export type StrictnessProfile = {
  label: string;
  tone: string;
  description: string;
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function hasDecisionMaker(lead: PortfolioLead): boolean {
  return Boolean(lead.primaryDecisionMakerRole || lead.primaryContact?.isDecisionMaker);
}

function isVerified(lead: PortfolioLead): boolean {
  return lead.emailVerificationStatus === "VALID";
}

export function isLeadReadyForOutreach(lead: PortfolioLead): boolean {
  return isVerified(lead) && hasDecisionMaker(lead) && (lead.qualityScore || 0) >= 60;
}

export function summarizeLeadPortfolio<T extends PortfolioLead>(
  leads: T[],
): LeadPortfolioSummary {
  const totals = leads.reduce(
    (acc, lead) => {
      acc.sent += lead.sentCount || 0;
      acc.opens += lead.openCount || 0;
      acc.clicks += lead.clickCount || 0;
      acc.replies += lead.responseCount || 0;
      acc.bounces += lead.bounceCount || 0;
      if (isVerified(lead)) acc.verifiedCount += 1;
      if (hasDecisionMaker(lead)) acc.decisionMakerCount += 1;
      if ((lead.warmupScore || 0) >= 40) acc.warmedCount += 1;
      if (isLeadReadyForOutreach(lead)) acc.readyCount += 1;
      return acc;
    },
    {
      sent: 0,
      opens: 0,
      clicks: 0,
      replies: 0,
      bounces: 0,
      verifiedCount: 0,
      decisionMakerCount: 0,
      warmedCount: 0,
      readyCount: 0,
    },
  );

  return {
    totalLeads: leads.length,
    avgQualityScore: average(leads.map((lead) => lead.qualityScore || 0)),
    avgCompatibilityScore: average(
      leads.map((lead) => lead.compatibilityScore || 0),
    ),
    avgWarmupScore: average(leads.map((lead) => lead.warmupScore || 0)),
    verifiedCount: totals.verifiedCount,
    decisionMakerCount: totals.decisionMakerCount,
    warmedCount: totals.warmedCount,
    readyCount: totals.readyCount,
    sent: totals.sent,
    opens: totals.opens,
    clicks: totals.clicks,
    replies: totals.replies,
    bounces: totals.bounces,
    openRate: calculateRate(totals.opens, totals.sent),
    clickRate: calculateRate(totals.clicks, totals.sent),
    responseRate: calculateRate(totals.replies, totals.sent),
    bounceRate: calculateRate(totals.bounces, totals.sent),
  };
}

export function summarizeCampaignPerformance<T extends PortfolioLead>(
  leads: T[],
): CampaignPerformanceSummary[] {
  const groups = new Map<string, T[]>();

  for (const lead of leads) {
    const key = lead.campaign?.name || "Unassigned";
    const group = groups.get(key) || [];
    group.push(lead);
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .map(([name, campaignLeads]) => {
      const summary = summarizeLeadPortfolio(campaignLeads);
      return {
        name,
        leadCount: summary.totalLeads,
        avgQualityScore: summary.avgQualityScore,
        readyCount: summary.readyCount,
        verifiedCount: summary.verifiedCount,
        sent: summary.sent,
        responseRate: summary.responseRate,
        bounceRate: summary.bounceRate,
        openRate: summary.openRate,
      };
    })
    .sort((a, b) => {
      if (b.responseRate !== a.responseRate) return b.responseRate - a.responseRate;
      if (b.avgQualityScore !== a.avgQualityScore) {
        return b.avgQualityScore - a.avgQualityScore;
      }
      return b.leadCount - a.leadCount;
    });
}

function getLatestActivity(leads: PortfolioLead[]): Date | null {
  let latest: Date | null = null;

  for (const lead of leads) {
    for (const event of lead.events || []) {
      const occurredAt = new Date(event.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) continue;
      if (!latest || occurredAt > latest) {
        latest = occurredAt;
      }
    }
  }

  return latest;
}

const BATCH_STATUS_ORDER: Record<string, number> = {
  ACTIVE: 0,
  EXPORTED: 1,
  READY: 2,
  COMPLETE: 3,
  DRAFT: 4,
};

export function summarizeBatchPerformance<T extends PortfolioLead>(
  leads: T[],
): BatchPerformanceSummary[] {
  const groups = new Map<string, T[]>();

  for (const lead of leads) {
    if (!lead.batch?.code) continue;
    const key = lead.batch.id || lead.batch.code;
    const group = groups.get(key) || [];
    group.push(lead);
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .map(([id, batchLeads]) => {
      const summary = summarizeLeadPortfolio(batchLeads);
      const batch = batchLeads[0]?.batch;
      return {
        id,
        name: batch?.name || batch?.code || "Batch",
        code: batch?.code || "Batch",
        status: batch?.status || "DRAFT",
        leadCount: summary.totalLeads,
        avgQualityScore: summary.avgQualityScore,
        readyCount: summary.readyCount,
        sent: summary.sent,
        responseRate: summary.responseRate,
        lastActivityAt: getLatestActivity(batchLeads),
      };
    })
    .sort((a, b) => {
      const statusDelta =
        (BATCH_STATUS_ORDER[a.status] ?? 99) - (BATCH_STATUS_ORDER[b.status] ?? 99);
      if (statusDelta !== 0) return statusDelta;
      if ((b.lastActivityAt?.getTime() || 0) !== (a.lastActivityAt?.getTime() || 0)) {
        return (b.lastActivityAt?.getTime() || 0) - (a.lastActivityAt?.getTime() || 0);
      }
      return b.leadCount - a.leadCount;
    });
}

export function getQualityStrictnessProfile(strictness: number): StrictnessProfile {
  if (strictness < 40) {
    return {
      label: "Volume",
      tone: "text-amber-600 border-amber-100 bg-amber-50",
      description: "Casts a wider net and keeps more borderline leads in play.",
    };
  }

  if (strictness < 70) {
    return {
      label: "Balanced",
      tone: "text-blue-600 border-blue-100 bg-blue-50",
      description: "Balances lead volume with stronger ICP fit and cleaner outreach.",
    };
  }

  return {
    label: "Precision",
    tone: "text-emerald-600 border-emerald-100 bg-emerald-50",
    description: "Optimizes for tighter fit, cleaner contact data, and smaller batches.",
  };
}

export function buildPortfolioGuidance(input: {
  totalCount: number;
  visibleCount: number;
  qualityFloor: number;
  qualityStrictness: number;
  readyCount: number;
  bounceRate: number;
  responseRate: number;
}): string {
  const strictnessProfile = getQualityStrictnessProfile(input.qualityStrictness);

  if (input.visibleCount === 0) {
    return "Current filters are too restrictive for this lead set. Lower the quality floor or strictness to reopen volume.";
  }

  if (input.bounceRate >= 8) {
    return "Bounce rate is elevated. Tighten strictness, prioritize verified contacts, and export only smaller ready batches.";
  }

  if (strictnessProfile.label === "Volume" && input.qualityFloor <= 30) {
    return "You are favoring volume. Watch bounce and reply rates closely before scaling up batch size.";
  }

  if (strictnessProfile.label === "Precision" && input.readyCount < Math.max(3, Math.round(input.visibleCount * 0.2))) {
    return "Precision mode is limiting throughput. Relax the floor slightly if you need more send-ready leads this week.";
  }

  if (input.responseRate >= 10 && input.readyCount >= Math.max(5, Math.round(input.visibleCount * 0.3))) {
    return "This segment is healthy. Keep strictness steady and push export-ready leads in controlled batches.";
  }

  const coverage = calculateRate(input.visibleCount, input.totalCount || 1);
  return `${coverage}% of this workspace survives the current floor. ${strictnessProfile.label} mode is a reasonable default for continued tuning.`;
}
