import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/billing/subscription/change/route";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";
import { polar } from "@/lib/polar/server";
import { NextRequest } from "next/server";

vi.mock("@/lib/polar/config", () => ({
  POLAR_PRO_PRODUCT_ID: "pro-product",
  POLAR_STARTER_PRODUCT_ID: "starter-product",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/polar/server", () => ({
  polar: {
    subscriptions: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/db", () => ({
  prisma: {
    polarSubscription: {
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

    vi.mocked(prisma.polarSubscription.findFirst).mockResolvedValue(null);

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

    vi.mocked(prisma.polarSubscription.findFirst).mockResolvedValue({
      subscriptionId: "sub-1",
      productId: "starter-product",
    } as never);

    vi.mocked(polar.subscriptions.update).mockResolvedValue({
      id: "sub-1",
      status: "active",
      currentPeriodStart: "2024-01-01T00:00:00Z",
      currentPeriodEnd: "2024-02-01T00:00:00Z",
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
