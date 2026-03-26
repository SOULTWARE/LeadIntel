import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanType } from "@prisma/client";

const transactionMocks = {
  creditBalance: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  userPlan: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/db", () => ({
  prisma: {
    $transaction: vi.fn(
      async (callback: (tx: typeof transactionMocks) => Promise<unknown>) =>
        callback(transactionMocks),
    ),
  },
}));

import { CreditsService } from "@/services/creditsService";

describe("CreditsService.syncPlanCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves used credits when upgrading within the same billing period", async () => {
    transactionMocks.creditBalance.findUnique.mockResolvedValue({
      userId: "user-1",
      balance: 886,
    });
    transactionMocks.userPlan.findUnique.mockResolvedValue({
      plan: PlanType.STARTER,
      periodStart: new Date("2024-01-01T00:00:00Z"),
    });
    transactionMocks.creditBalance.upsert.mockImplementation(
      async ({ create, update }) => ({
        userId: create.userId,
        balance: update.balance,
      }),
    );

    const service = new CreditsService();
    const result = await service.syncPlanCredits({
      userId: "user-1",
      plan: PlanType.PRO,
      periodStart: new Date("2024-01-01T00:00:00Z"),
      periodEnd: new Date("2024-02-01T00:00:00Z"),
    });

    expect(result).toEqual({
      userId: "user-1",
      balance: 4886,
    });
    expect(transactionMocks.creditBalance.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: { balance: 4886 },
      create: {
        userId: "user-1",
        balance: 4886,
      },
    });
  });

  it("resets base credits when a new billing period starts", async () => {
    transactionMocks.creditBalance.findUnique.mockResolvedValue({
      userId: "user-1",
      balance: 886,
    });
    transactionMocks.userPlan.findUnique.mockResolvedValue({
      plan: PlanType.STARTER,
      periodStart: new Date("2024-01-01T00:00:00Z"),
    });
    transactionMocks.creditBalance.upsert.mockImplementation(
      async ({ create, update }) => ({
        userId: create.userId,
        balance: update.balance,
      }),
    );

    const service = new CreditsService();
    const result = await service.syncPlanCredits({
      userId: "user-1",
      plan: PlanType.STARTER,
      periodStart: new Date("2024-02-01T00:00:00Z"),
      periodEnd: new Date("2024-03-01T00:00:00Z"),
    });

    expect(result).toEqual({
      userId: "user-1",
      balance: 1000,
    });
  });

  it("keeps an already-synced balance stable when the same plan sync runs again", async () => {
    transactionMocks.creditBalance.findUnique.mockResolvedValue({
      userId: "user-1",
      balance: 4886,
    });
    transactionMocks.userPlan.findUnique.mockResolvedValue({
      plan: PlanType.PRO,
      periodStart: new Date("2024-01-01T00:00:00Z"),
    });
    transactionMocks.creditBalance.upsert.mockImplementation(
      async ({ create, update }) => ({
        userId: create.userId,
        balance: update.balance,
      }),
    );

    const service = new CreditsService();
    const result = await service.syncPlanCredits({
      userId: "user-1",
      plan: PlanType.PRO,
      periodStart: new Date("2024-01-01T00:00:00Z"),
      periodEnd: new Date("2024-02-01T00:00:00Z"),
      previousPlan: PlanType.STARTER,
    });

    expect(result).toEqual({
      userId: "user-1",
      balance: 4886,
    });
  });

  it("preserves manual top-ups when the same billing period sync runs again", async () => {
    transactionMocks.creditBalance.findUnique.mockResolvedValue({
      userId: "user-1",
      balance: 5200,
    });
    transactionMocks.userPlan.findUnique.mockResolvedValue({
      plan: PlanType.PRO,
      periodStart: new Date("2024-01-01T00:00:00Z"),
    });
    transactionMocks.creditBalance.upsert.mockImplementation(
      async ({ create, update }) => ({
        userId: create.userId,
        balance: update.balance,
      }),
    );

    const service = new CreditsService();
    const result = await service.syncPlanCredits({
      userId: "user-1",
      plan: PlanType.PRO,
      periodStart: new Date("2024-01-01T00:00:00Z"),
      periodEnd: new Date("2024-02-01T00:00:00Z"),
    });

    expect(result).toEqual({
      userId: "user-1",
      balance: 5200,
    });
    expect(transactionMocks.creditBalance.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: { balance: 5200 },
      create: {
        userId: "user-1",
        balance: 5200,
      },
    });
  });
});
