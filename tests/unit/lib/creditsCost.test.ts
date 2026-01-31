import { describe, it, expect } from "vitest";
import { CreditAction, getCreditCost } from "@/lib/credits/costs";

describe("getCreditCost", () => {
  it("returns per-result cost for scrape", () => {
    expect(getCreditCost(CreditAction.SCRAPE, { resultsCount: 0 })).toBe(0);
    expect(getCreditCost(CreditAction.SCRAPE, { resultsCount: 5 })).toBe(5);
  });

  it("returns per-lead cost for AI enhance", () => {
    expect(getCreditCost(CreditAction.AI_ENHANCE, { leadsCount: 0 })).toBe(0);
    expect(getCreditCost(CreditAction.AI_ENHANCE, { leadsCount: 3 })).toBe(3);
  });

  it("returns fixed cost for email verify", () => {
    expect(getCreditCost(CreditAction.EMAIL_VERIFY)).toBe(2);
  });

  it("returns zero for topup", () => {
    expect(getCreditCost(CreditAction.TOPUP)).toBe(0);
  });

  it("defaults to 1 for other actions", () => {
    expect(getCreditCost(CreditAction.EMAIL_DISCOVER)).toBe(1);
    expect(getCreditCost(CreditAction.GENERATE_EMAIL)).toBe(1);
  });
});
