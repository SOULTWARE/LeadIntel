import { describe, it, expect, vi } from "vitest";
import { PlanType } from "@prisma/client";

describe("polar product helpers", () => {
  it("maps product ids to plan types and addon", async () => {
    process.env.POLAR_STARTER_PRODUCT_ID = "starter-product";
    process.env.POLAR_PRO_PRODUCT_ID = "pro-product";
    process.env.POLAR_ADDON_PRODUCT_ID = "addon-product";

    vi.resetModules();

    const { getPlanTypeByProductId, isAddonProductId } = await import("@/lib/polar/products");

    expect(getPlanTypeByProductId("starter-product")).toBe(PlanType.STARTER);
    expect(getPlanTypeByProductId("pro-product")).toBe(PlanType.PRO);
    expect(getPlanTypeByProductId("unknown")).toBeNull();
    expect(isAddonProductId("addon-product")).toBe(true);
    expect(isAddonProductId("starter-product")).toBe(false);
  });
});
