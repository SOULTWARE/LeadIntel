import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/billing/checkout/route";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customers";
import { prisma } from "@/db";
import { stripe } from "@/lib/stripe/server";
import { NextRequest } from "next/server";

vi.mock("@/lib/stripe/config", () => ({
  STRIPE_ADDON_PRICE_ID: "addon-price",
  STRIPE_CANCEL_URL: "http://localhost/cancel",
  STRIPE_PRO_PRICE_ID: "pro-price",
  STRIPE_STARTER_PRICE_ID: "starter-price",
  STRIPE_SUCCESS_URL: "http://localhost/success",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/stripe/customers", () => ({
  getOrCreateStripeCustomer: vi.fn(),
}));

vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    subscriptions: {
      cancel: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock("@/db", () => ({
  prisma: {
    stripeSubscription: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("/api/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ type: "subscription", plan: "starter" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when plan missing for subscription", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ type: "subscription" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("creates checkout session for subscription", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1", email: "test@example.com" } } }) },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.stripeSubscription.findFirst).mockResolvedValue(null);
    vi.mocked(getOrCreateStripeCustomer).mockResolvedValue("cust-1");
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: "http://stripe/checkout" } as never);

    const req = new NextRequest("http://localhost:3000/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ type: "subscription", plan: "starter" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.url).toBe("http://stripe/checkout");
    expect(stripe.checkout.sessions.create).toHaveBeenCalled();
  });
});
