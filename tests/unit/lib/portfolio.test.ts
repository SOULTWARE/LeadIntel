import { describe, expect, it } from "vitest";
import {
  buildPortfolioGuidance,
  getQualityStrictnessProfile,
  isLeadReadyForOutreach,
  summarizeBatchPerformance,
  summarizeCampaignPerformance,
  summarizeLeadPortfolio,
} from "@/lib/leads/portfolio";

const baseLead = {
  qualityScore: 82,
  compatibilityScore: 76,
  warmupScore: 45,
  emailVerificationStatus: "VALID",
  primaryDecisionMakerRole: "CEO",
  primaryContact: { isDecisionMaker: true },
  sentCount: 10,
  openCount: 4,
  clickCount: 1,
  responseCount: 2,
  bounceCount: 0,
  events: [{ occurredAt: "2026-03-25T10:00:00.000Z" }],
};

describe("portfolio helpers", () => {
  it("computes portfolio readiness and rates", () => {
    const summary = summarizeLeadPortfolio([
      {
        ...baseLead,
        batch: { id: "batch-1", code: "alpha", status: "ACTIVE" },
      },
      {
        ...baseLead,
        qualityScore: 40,
        emailVerificationStatus: "UNKNOWN",
        primaryDecisionMakerRole: null,
        sentCount: 0,
        openCount: 0,
        clickCount: 0,
        responseCount: 0,
        bounceCount: 0,
      },
    ]);

    expect(summary.totalLeads).toBe(2);
    expect(summary.verifiedCount).toBe(1);
    expect(summary.readyCount).toBe(1);
    expect(summary.responseRate).toBe(20);
  });

  it("groups campaign and batch performance", () => {
    const campaigns = summarizeCampaignPerformance([
      {
        ...baseLead,
        campaign: { name: "Outbound A" },
      },
      {
        ...baseLead,
        campaign: { name: "Outbound B" },
        responseCount: 0,
      },
    ]);
    const batches = summarizeBatchPerformance([
      {
        ...baseLead,
        batch: {
          id: "batch-1",
          name: "Batch One",
          code: "alpha",
          status: "ACTIVE",
        },
      },
      {
        ...baseLead,
        batch: {
          id: "batch-2",
          name: "Batch Two",
          code: "beta",
          status: "READY",
        },
        events: [{ occurredAt: "2026-03-20T10:00:00.000Z" }],
      },
    ]);

    expect(campaigns[0]?.name).toBe("Outbound A");
    expect(batches[0]?.code).toBe("alpha");
    expect(batches[0]?.status).toBe("ACTIVE");
  });

  it("returns strictness profile and guidance copy", () => {
    expect(getQualityStrictnessProfile(30).label).toBe("Volume");
    expect(getQualityStrictnessProfile(55).label).toBe("Balanced");
    expect(getQualityStrictnessProfile(85).label).toBe("Precision");

    expect(
      buildPortfolioGuidance({
        totalCount: 20,
        visibleCount: 0,
        qualityFloor: 80,
        qualityStrictness: 85,
        readyCount: 0,
        bounceRate: 0,
        responseRate: 0,
      }),
    ).toContain("too restrictive");
  });

  it("flags send-ready leads correctly", () => {
    expect(isLeadReadyForOutreach(baseLead)).toBe(true);
    expect(
      isLeadReadyForOutreach({
        ...baseLead,
        emailVerificationStatus: "UNKNOWN",
      }),
    ).toBe(false);
  });
});
