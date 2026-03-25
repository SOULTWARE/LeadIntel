import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanType } from "@prisma/client";

vi.mock("@/db", () => ({
  prisma: {
    creditBalance: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    polarCustomer: {
      upsert: vi.fn(),
    },
    polarSubscription: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    userPlan: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/polar/server", () => ({
  polar: {
    customers: {
      list: vi.fn(),
    },
    subscriptions: {
      list: vi.fn(),
    },
  },
}));

vi.mock("@/lib/polar/customers", () => ({
  getPolarCustomerIdByUserId: vi.fn(),
}));

vi.mock("@/lib/polar/products", () => ({
  getPlanTypeByProductId: (productId: string) => {
    if (productId === "starter-product") return PlanType.STARTER;
    if (productId === "pro-product") return PlanType.PRO;
    return null;
  },
}));

import { prisma } from "@/db";
import { getPolarCustomerIdByUserId } from "@/lib/polar/customers";
import { polar } from "@/lib/polar/server";
import { resolveProfileBillingState } from "@/lib/polar/profile";

const mockedPrisma = prisma as unknown as {
  creditBalance: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  polarCustomer: {
    upsert: ReturnType<typeof vi.fn>;
  };
  polarSubscription: {
    findFirst: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  userPlan: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

const mockedPolar = polar as unknown as {
  customers: {
    list: ReturnType<typeof vi.fn>;
  };
  subscriptions: {
    list: ReturnType<typeof vi.fn>;
  };
};

const mockedGetPolarCustomerIdByUserId = vi.mocked(getPolarCustomerIdByUserId);

function makeDate(value: string) {
  return new Date(value);
}

describe("resolveProfileBillingState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetPolarCustomerIdByUserId.mockResolvedValue(null);
    mockedPrisma.creditBalance.findUnique.mockResolvedValue(null);
    mockedPrisma.creditBalance.create.mockResolvedValue({ userId: "user-1", balance: 5000 } as never);
    mockedPrisma.creditBalance.update.mockResolvedValue({ userId: "user-1", balance: 5000 } as never);
    mockedPolar.customers.list.mockResolvedValue({ result: { items: [] } } as never);
    mockedPolar.subscriptions.list.mockResolvedValue({ result: { items: [] } } as never);
    mockedPrisma.polarCustomer.upsert.mockResolvedValue({} as never);
    mockedPrisma.polarSubscription.upsert.mockResolvedValue({} as never);
    mockedPrisma.userPlan.upsert.mockResolvedValue({} as never);
  });

  it("restores a missing plan from a local active subscription", async () => {
    mockedPrisma.userPlan.findUnique.mockResolvedValue(null);
    mockedPrisma.polarSubscription.findFirst.mockResolvedValue({
      subscriptionId: "sub-local",
      productId: "starter-product",
      status: "active",
      currentPeriodStart: makeDate("2024-01-01T00:00:00.000Z"),
      currentPeriodEnd: makeDate("2024-02-01T00:00:00.000Z"),
    } as never);

    const result = await resolveProfileBillingState("user-1");

    expect(result.plan?.plan).toBe(PlanType.STARTER);
    expect(result.plan?.periodEnd.toISOString()).toBe("2024-02-01T00:00:00.000Z");
    expect(mockedPrisma.userPlan.upsert).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.polarSubscription.upsert).toHaveBeenCalledTimes(1);
    expect(mockedPolar.subscriptions.list).not.toHaveBeenCalled();
  });

  it("falls back to live Polar subscriptions when local records are missing", async () => {
    mockedPrisma.userPlan.findUnique.mockResolvedValue(null);
    mockedPrisma.polarSubscription.findFirst.mockResolvedValue(null);
    mockedPolar.customers.list.mockResolvedValue({
      result: {
        items: [
          {
            id: "customer-live",
          },
        ],
      },
    } as never);
    mockedPolar.subscriptions.list.mockResolvedValue({
      result: {
        items: [
          {
            id: "sub-live",
            productId: "pro-product",
            status: "active",
            currentPeriodStart: makeDate("2024-03-01T00:00:00.000Z"),
            currentPeriodEnd: makeDate("2024-04-01T00:00:00.000Z"),
            customerId: "customer-live",
          },
        ],
      },
    } as never);

    const result = await resolveProfileBillingState("user-2", "user-2@example.com");

    expect(result.plan?.plan).toBe(PlanType.PRO);
    expect(mockedPolar.customers.list).toHaveBeenCalledWith({ email: "user-2@example.com", limit: 1 });
    expect(mockedPolar.subscriptions.list).toHaveBeenCalledWith({ customerId: "customer-live", active: true, limit: 10 });
    expect(mockedPrisma.userPlan.upsert).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.polarCustomer.upsert).toHaveBeenCalledWith({
      where: { userId: "user-2" },
      update: { customerId: "customer-live" },
      create: { userId: "user-2", customerId: "customer-live" },
    });
  });
});
