import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/db", () => ({
  prisma: {},
}));

vi.mock("@polar-sh/nextjs", () => ({
  Webhooks: vi.fn(() => {
    return async (req: Request) => {
      const signature = req.headers.get("webhook-id");
      if (!signature) {
        return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
      }
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    };
  }),
}));

vi.mock("@/lib/polar/plans", () => ({
  PLAN_LIMITS: {},
  ADDON_CREDITS_AMOUNT: 500,
  ADDON_CREDITS_MONTHS: 3,
}));

vi.mock("@/lib/polar/products", () => ({
  getPlanTypeByProductId: vi.fn(),
  isAddonProductId: vi.fn(),
}));

vi.mock("@/lib/credits/costs", () => ({
  STARTER_INITIAL_CREDITS: 1000,
  PRO_INITIAL_CREDITS: 5000,
}));

vi.mock("@/services/creditsService", () => ({
  creditsService: { addAddonCredits: vi.fn() },
}));

describe("/api/billing/webhook", () => {
  it("returns 400 when signature missing", async () => {
    const { POST } = await import("@/app/api/billing/webhook/route");

    const req = new NextRequest("http://localhost:3000/api/billing/webhook", {
      method: "POST",
      body: "payload",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
