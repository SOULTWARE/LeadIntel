import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/credits/topup/route";
import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/creditsService", () => ({
  creditsService: {
    addCredits: vi.fn(),
    getBalance: vi.fn(),
  },
}));

describe("/api/credits/topup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/credits/topup", {
      method: "POST",
      headers: { "Idempotency-Key": "key" },
      body: JSON.stringify({ amount: 10 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when missing idempotency key", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/credits/topup", {
      method: "POST",
      body: JSON.stringify({ amount: 10 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 and balance on success", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(creditsService.getBalance).mockResolvedValue(55);

    const req = new NextRequest("http://localhost:3000/api/credits/topup", {
      method: "POST",
      headers: { "Idempotency-Key": "key" },
      body: JSON.stringify({ amount: 10 }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.balance).toBe(55);
    expect(creditsService.addCredits).toHaveBeenCalled();
  });
});
