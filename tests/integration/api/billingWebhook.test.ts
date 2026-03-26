import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

let capturedHandlers: Record<string, (payload: unknown) => Promise<void>> = {};

vi.mock("@/db", () => ({
  prisma: {
    polarCustomer: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    polarSubscription: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    userPlan: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@polar-sh/nextjs", () => ({
  Webhooks: vi.fn(
    (handlers: Record<string, (payload: unknown) => Promise<void>>) => {
      capturedHandlers = handlers;

      return async (req: Request) => {
        const signature = req.headers.get("webhook-id");
        if (!signature) {
          return new Response(JSON.stringify({ error: "Missing signature" }), {
            status: 400,
          });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
        });
      };
    },
  ),
}));

vi.mock("@/lib/polar/plans", () => ({
  PLAN_LIMITS: {
    STARTER: {
      maxLeadsPerSearch: 100,
      maxEnhancedLeadsPerMonth: 1000,
      maxEmailDiscoveriesPerMonth: 1000,
      maxEmailVerificationsPerMonth: 500,
    },
    PRO: {
      maxLeadsPerSearch: 100,
      maxEnhancedLeadsPerMonth: 5000,
      maxEmailDiscoveriesPerMonth: 5000,
      maxEmailVerificationsPerMonth: 2500,
    },
  },
  ADDON_CREDITS_AMOUNT: 500,
  ADDON_CREDITS_MONTHS: 3,
}));

vi.mock("@/lib/polar/products", () => ({
  getPlanTypeByProductId: vi.fn(),
  isAddonProductId: vi.fn(),
}));

vi.mock("@/services/creditsService", () => ({
  creditsService: {
    addAddonCredits: vi.fn(),
    syncPlanCredits: vi.fn(),
  },
}));

describe("/api/billing/webhook", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    capturedHandlers = {};
  });

  it("returns 400 when signature missing", async () => {
    const { POST } = await import("@/app/api/billing/webhook/route");

    const req = new NextRequest("http://localhost:3000/api/billing/webhook", {
      method: "POST",
      body: "payload",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("credits addon orders using checkout metadata when customer mapping is unavailable", async () => {
    const { prisma } = await import("@/db");
    const { isAddonProductId } = await import("@/lib/polar/products");
    const { creditsService } = await import("@/services/creditsService");

    await import("@/app/api/billing/webhook/route");

    vi.mocked(isAddonProductId).mockReturnValue(true);
    vi.mocked(creditsService.addAddonCredits).mockResolvedValue({
      userId: "user-1",
      remaining: 500,
      expiresAt: null,
    });
    vi.mocked(prisma.polarCustomer.findUnique).mockResolvedValue(null);

    await capturedHandlers.onOrderPaid({
      data: {
        id: "order-1",
        paid: true,
        productId: "addon-product",
        customer: { id: "polar-customer-1", externalId: null },
        metadata: { userId: "user-1", type: "addon" },
      },
    });

    expect(creditsService.addAddonCredits).toHaveBeenCalledWith({
      userId: "user-1",
      amount: 500,
      monthsToExtend: 3,
      idempotencyKey: "order-1",
    });
    expect(prisma.polarCustomer.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: { customerId: "polar-customer-1" },
      create: { userId: "user-1", customerId: "polar-customer-1" },
    });
  });

  it("credits a paid addon order from onOrderCreated", async () => {
    const { isAddonProductId } = await import("@/lib/polar/products");
    const { creditsService } = await import("@/services/creditsService");

    await import("@/app/api/billing/webhook/route");

    vi.mocked(isAddonProductId).mockReturnValue(true);
    vi.mocked(creditsService.addAddonCredits).mockResolvedValue({
      userId: "user-2",
      remaining: 500,
      expiresAt: null,
    });

    await capturedHandlers.onOrderCreated({
      data: {
        id: "order-2",
        paid: true,
        productId: "addon-product",
        customer: { id: "polar-customer-2", externalId: "user-2" },
        metadata: {},
      },
    });

    expect(creditsService.addAddonCredits).toHaveBeenCalledWith({
      userId: "user-2",
      amount: 500,
      monthsToExtend: 3,
      idempotencyKey: "order-2",
    });
  });
});
