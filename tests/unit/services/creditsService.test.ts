import { describe, it, expect } from "vitest";
import { CreditsService } from "@/services/creditsService";

describe("CreditsService validations", () => {
  it("createHold rejects non-positive amounts", async () => {
    const service = new CreditsService();

    await expect(
      service.createHold({
        userId: "user-1",
        action: "SCRAPE",
        amount: 0,
        idempotencyKey: "key",
      })
    ).rejects.toThrow("Hold amount must be > 0");
  });

  it("addAddonCredits validates amount and months", async () => {
    const service = new CreditsService();

    await expect(
      service.addAddonCredits({
        userId: "user-1",
        amount: 0,
        monthsToExtend: 1,
        idempotencyKey: "key",
      })
    ).rejects.toThrow("Credit amount must be > 0");

    await expect(
      service.addAddonCredits({
        userId: "user-1",
        amount: 5,
        monthsToExtend: 0,
        idempotencyKey: "key",
      })
    ).rejects.toThrow("monthsToExtend must be > 0");

    await expect(
      service.addAddonCredits({
        userId: "user-1",
        amount: 5,
        monthsToExtend: 1,
        idempotencyKey: "",
      })
    ).rejects.toThrow("idempotencyKey is required");
  });

  it("addCredits validates amount", async () => {
    const service = new CreditsService();

    await expect(
      service.addCredits({
        userId: "user-1",
        amount: 0,
        idempotencyKey: "key",
      })
    ).rejects.toThrow("Credit amount must be > 0");
  });
});
