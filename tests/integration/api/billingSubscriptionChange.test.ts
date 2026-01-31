import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/billing/subscription/change/route";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";
import { stripe } from "@/lib/stripe/server";
import { NextRequest } from "next/server";

vi.mock("@/lib/stripe/config", () => ({
  STRIPE_PRO_PRICE_ID: "pro-price",
  STRIPE_STARTER_PRICE_ID: "starter-price",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/db", () => ({
  prisma: {
    stripeSubscription: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    userPlan: {
      upsert: vi.fn(),
    },
  },
}));

describe("/api/billing/subscription/change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/billing/subscription/change", {
      method: "POST",
      body: JSON.stringify({ plan: "starter" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 404 when no active subscription", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.stripeSubscription.findFirst).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/billing/subscription/change", {
      method: "POST",
      body: JSON.stringify({ plan: "starter" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it("updates subscription and user plan", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.stripeSubscription.findFirst).mockResolvedValue({
      subscriptionId: "sub-1",
    } as never);

    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      id: "sub-1",
      items: { data: [{ id: "item-1", price: { id: "starter-price" } }] },
    } as never);

    vi.mocked(stripe.subscriptions.update).mockResolvedValue({
      id: "sub-1",
      status: "active",
      current_period_start: 1700000000,
      current_period_end: 1700003600,
    } as never);

    const req = new NextRequest("http://localhost:3000/api/billing/subscription/change", {
      method: "POST",
      body: JSON.stringify({ plan: "pro" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("active");
    expect(prisma.userPlan.upsert).toHaveBeenCalled();
  });
});
