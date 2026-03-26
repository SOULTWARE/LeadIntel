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
    process.env.CREDITS_TOPUP_SECRET = "topup-secret";
  });

  it("returns 503 when the topup secret is not configured", async () => {
    delete process.env.CREDITS_TOPUP_SECRET;

    const req = new NextRequest("http://localhost:3000/api/credits/topup", {
      method: "POST",
      headers: {
        "Idempotency-Key": "key",
        "x-credits-topup-secret": "topup-secret",
      },
      body: JSON.stringify({ amount: 10 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("returns 403 when the internal secret is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/credits/topup", {
      method: "POST",
      headers: { "Idempotency-Key": "key" },
      body: JSON.stringify({ amount: 10 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 401 when neither an authenticated user nor a target userId is provided", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/credits/topup", {
      method: "POST",
      headers: {
        "Idempotency-Key": "key",
        "x-credits-topup-secret": "topup-secret",
      },
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
      headers: {
        "x-credits-topup-secret": "topup-secret",
      },
      body: JSON.stringify({ amount: 10 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 and balance on success for an authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(creditsService.getBalance).mockResolvedValue(55);

    const req = new NextRequest("http://localhost:3000/api/credits/topup", {
      method: "POST",
      headers: {
        "Idempotency-Key": "key",
        "x-credits-topup-secret": "topup-secret",
      },
      body: JSON.stringify({ amount: 10 }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.balance).toBe(55);
    expect(json.data.userId).toBe("user-1");
    expect(creditsService.addCredits).toHaveBeenCalledWith({
      userId: "user-1",
      amount: 10,
      idempotencyKey: "key",
      meta: { source: "internal-manual" },
    });
  });

  it("returns 200 and balance for an internal request with an explicit target userId", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(creditsService.getBalance).mockResolvedValue(125);

    const req = new NextRequest("http://localhost:3000/api/credits/topup", {
      method: "POST",
      headers: {
        "Idempotency-Key": "key",
        authorization: "Bearer topup-secret",
      },
      body: JSON.stringify({ amount: 25, userId: "user-2" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.userId).toBe("user-2");
    expect(json.data.balance).toBe(125);
    expect(creditsService.addCredits).toHaveBeenCalledWith({
      userId: "user-2",
      amount: 25,
      idempotencyKey: "key",
      meta: { source: "internal-manual" },
    });
  });
});
