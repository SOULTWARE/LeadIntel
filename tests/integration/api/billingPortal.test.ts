import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/billing/portal/route";
import { createClient } from "@/lib/supabase/server";
import { getPolarCustomerIdByUserId } from "@/lib/polar/customers";
import { polar } from "@/lib/polar/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/polar/customers", () => ({
  getPolarCustomerIdByUserId: vi.fn(),
}));

vi.mock("@/lib/polar/server", () => ({
  polar: {
    customerSessions: {
      create: vi.fn(),
    },
  },
}));

describe("/api/billing/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    } as Awaited<ReturnType<typeof createClient>>);

    const res = await POST();

    expect(res.status).toBe(401);
  });

  it("returns 400 when customer missing", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(getPolarCustomerIdByUserId).mockResolvedValue(null);

    const res = await POST();

    expect(res.status).toBe(400);
  });

  it("returns portal url when available", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(getPolarCustomerIdByUserId).mockResolvedValue("cust-1");
    vi.mocked(polar.customerSessions.create).mockResolvedValue({ customerPortalUrl: "http://polar/portal" } as never);

    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.url).toBe("http://polar/portal");
  });
});
