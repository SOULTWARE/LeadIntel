import { describe, expect, it } from "vitest";
import { createBatchPlan, getBatchSkipReason } from "@/lib/leads/batching";

const baseLead = {
  id: "lead-1",
  name: "Acme",
  qualityScore: 78,
  warmupScore: 45,
  emailVerificationStatus: "VALID",
  primaryDecisionMakerRole: "CEO",
  primaryContact: { isDecisionMaker: true },
  campaignId: "campaign-1",
  campaign: { name: "Outbound" },
  segmentName: "Core",
  batchId: null,
  batch: null,
};

describe("batching helpers", () => {
  it("skips leads that fail readiness rules", () => {
    expect(
      getBatchSkipReason(
        {
          ...baseLead,
          emailVerificationStatus: "UNKNOWN",
        },
        {
          maxLeadsPerBatch: 10,
          minQualityScore: 60,
          requireVerified: true,
          requireDecisionMaker: true,
          requireWarmup: false,
        },
      ),
    ).toContain("not verified");
  });

  it("creates grouped batches by campaign and segment", () => {
    const plan = createBatchPlan(
      [
        baseLead,
        { ...baseLead, id: "lead-2", name: "Beta" },
        {
          ...baseLead,
          id: "lead-3",
          name: "Gamma",
          segmentName: "Expansion",
        },
      ],
      {
        maxLeadsPerBatch: 2,
        minQualityScore: 60,
        requireVerified: true,
        requireDecisionMaker: true,
        requireWarmup: false,
      },
    );

    expect(plan.eligibleLeads).toHaveLength(3);
    expect(plan.batches).toHaveLength(2);
    expect(plan.batches[0]?.leads).toHaveLength(2);
    expect(plan.batches[1]?.segmentName).toBe("Expansion");
  });

  it("skips locked batch assignments", () => {
    const plan = createBatchPlan(
      [
        {
          ...baseLead,
          batchId: "batch-1",
          batch: {
            status: "READY",
            code: "ready-1",
          },
        },
      ],
      {
        maxLeadsPerBatch: 10,
        minQualityScore: 60,
        requireVerified: true,
        requireDecisionMaker: true,
        requireWarmup: false,
      },
    );

    expect(plan.eligibleLeads).toHaveLength(0);
    expect(plan.skippedLeads[0]?.reason).toContain("ready batch");
  });
});
