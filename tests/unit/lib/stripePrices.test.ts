import { describe, it, expect, vi } from "vitest";
import { PlanType } from "@prisma/client";

describe("stripe price helpers", () => {
  it("maps price ids to plan types and addon", async () => {
    process.env.STRIPE_STARTER_PRICE_ID = "starter-price";
    process.env.STRIPE_PRO_PRICE_ID = "pro-price";
    process.env.STRIPE_ADDON_PRICE_ID = "addon-price";

    vi.resetModules();

    const { getPlanTypeByPriceId, isAddonPriceId } = await import("@/lib/stripe/prices");

    expect(getPlanTypeByPriceId("starter-price")).toBe(PlanType.STARTER);
    expect(getPlanTypeByPriceId("pro-price")).toBe(PlanType.PRO);
    expect(getPlanTypeByPriceId("unknown")).toBeNull();
    expect(isAddonPriceId("addon-price")).toBe(true);
    expect(isAddonPriceId("starter-price")).toBe(false);
  });
});
