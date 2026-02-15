import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/billing/checkout/route";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePolarCustomer } from "@/lib/polar/customers";
import { polar } from "@/lib/polar/server";
import { NextRequest } from "next/server";

vi.mock("@/lib/polar/config", () => ({
  POLAR_ADDON_PRODUCT_ID: "addon-product",
  POLAR_PRO_PRODUCT_ID: "pro-product",
  POLAR_STARTER_PRODUCT_ID: "starter-product",
  POLAR_SUCCESS_URL: "http://localhost/success",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/polar/customers", () => ({
  getOrCreatePolarCustomer: vi.fn(),
}));

vi.mock("@/lib/polar/server", () => ({
  polar: {
    checkouts: {
      create: vi.fn(),
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

    vi.mocked(getOrCreatePolarCustomer).mockResolvedValue("cust-1");
    vi.mocked(polar.checkouts.create).mockResolvedValue({ url: "http://polar/checkout" } as never);

    const req = new NextRequest("http://localhost:3000/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ type: "subscription", plan: "starter" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.url).toBe("http://polar/checkout");
    expect(polar.checkouts.create).toHaveBeenCalled();
  });
});
