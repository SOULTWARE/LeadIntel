import { buildBatchCode } from "@/lib/leads/insights";

export type BatchPlanningLead = {
  id: string;
  name: string;
  qualityScore?: number | null;
  warmupScore?: number | null;
  emailVerificationStatus?: string | null;
  primaryDecisionMakerRole?: string | null;
  primaryContact?: {
    isDecisionMaker?: boolean | null;
  } | null;
  campaignId?: string | null;
  campaign?: {
    name?: string | null;
  } | null;
  segmentName?: string | null;
  batchId?: string | null;
  batch?: {
    status?: string | null;
    code?: string | null;
  } | null;
};

export type BatchPlanningOptions = {
  maxLeadsPerBatch: number;
  minQualityScore: number;
  requireVerified: boolean;
  requireDecisionMaker: boolean;
  requireWarmup: boolean;
};

export type SkippedBatchLead = {
  leadId: string;
  reason: string;
};

export type PlannedBatch<TLead extends BatchPlanningLead = BatchPlanningLead> = {
  key: string;
  name: string;
  codeSeed: string;
  campaignId: string | null;
  campaignName: string;
  segmentName: string | null;
  leads: TLead[];
};

export type BatchPlan<TLead extends BatchPlanningLead = BatchPlanningLead> = {
  eligibleLeads: TLead[];
  skippedLeads: SkippedBatchLead[];
  batches: PlannedBatch<TLead>[];
};

const LOCKED_BATCH_STATUSES = new Set(["READY", "EXPORTED", "ACTIVE"]);

function hasDecisionMaker(lead: BatchPlanningLead): boolean {
  return Boolean(lead.primaryDecisionMakerRole || lead.primaryContact?.isDecisionMaker);
}

function isVerified(lead: BatchPlanningLead): boolean {
  return lead.emailVerificationStatus === "VALID";
}

function isWarm(lead: BatchPlanningLead): boolean {
  return (lead.warmupScore || 0) >= 40;
}

export function getBatchSkipReason(
  lead: BatchPlanningLead,
  options: BatchPlanningOptions,
): string | null {
  if (lead.batch?.status && LOCKED_BATCH_STATUSES.has(lead.batch.status)) {
    return `Already assigned to ${lead.batch.status.toLowerCase()} batch ${lead.batch.code || ""}`.trim();
  }

  if ((lead.qualityScore || 0) < options.minQualityScore) {
    return `Below quality floor (${lead.qualityScore || 0}% < ${options.minQualityScore}%)`;
  }

  if (options.requireVerified && !isVerified(lead)) {
    return "Email is not verified";
  }

  if (options.requireDecisionMaker && !hasDecisionMaker(lead)) {
    return "No decision-maker contact identified";
  }

  if (options.requireWarmup && !isWarm(lead)) {
    return "Warm-up score is too low";
  }

  return null;
}

function chunkLeads<T>(leads: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < leads.length; index += size) {
    chunks.push(leads.slice(index, index + size));
  }
  return chunks;
}

export function createBatchPlan<TLead extends BatchPlanningLead>(
  leads: TLead[],
  options: BatchPlanningOptions,
): BatchPlan<TLead> {
  const eligibleLeads: TLead[] = [];
  const skippedLeads: SkippedBatchLead[] = [];

  for (const lead of leads) {
    const reason = getBatchSkipReason(lead, options);
    if (reason) {
      skippedLeads.push({ leadId: lead.id, reason });
      continue;
    }

    eligibleLeads.push(lead);
  }

  const grouped = new Map<string, TLead[]>();

  for (const lead of eligibleLeads.sort((a, b) => {
    const qualityDelta = (b.qualityScore || 0) - (a.qualityScore || 0);
    if (qualityDelta !== 0) return qualityDelta;
    return (b.warmupScore || 0) - (a.warmupScore || 0);
  })) {
    const groupKey = `${lead.campaignId || "none"}::${lead.segmentName || "default"}`;
    const group = grouped.get(groupKey) || [];
    group.push(lead);
    grouped.set(groupKey, group);
  }

  const batches: PlannedBatch<TLead>[] = [];

  for (const [groupKey, groupLeads] of grouped.entries()) {
    const [campaignIdPart, segmentNamePart] = groupKey.split("::");
    const campaignName = groupLeads[0]?.campaign?.name || "Unassigned";
    const segmentName = segmentNamePart === "default" ? null : segmentNamePart;

    chunkLeads(groupLeads, options.maxLeadsPerBatch).forEach((chunk, index) => {
      const batchLabelParts = [
        campaignName !== "Unassigned" ? campaignName : "outbound",
        segmentName || "core",
        `batch-${index + 1}`,
      ];

      batches.push({
        key: `${groupKey}:${index}`,
        name: `${campaignName} ${segmentName ? `· ${segmentName} ` : ""}Batch ${index + 1}`.trim(),
        codeSeed: buildBatchCode(batchLabelParts.join(" ")),
        campaignId: campaignIdPart === "none" ? null : campaignIdPart,
        campaignName,
        segmentName,
        leads: chunk,
      });
    });
  }

  return {
    eligibleLeads,
    skippedLeads,
    batches,
  };
}
