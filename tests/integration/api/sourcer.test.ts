import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/sourcer/route";
import { createClient } from "@/lib/supabase/server";
import { creditsService, InsufficientCreditsError } from "@/services/creditsService";
import { googleMapsSourcerService } from "@/services/googleMapsScraperService";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/googleMapsScraperService", () => ({
  googleMapsSourcerService: {
    collect: vi.fn(),
  },
}));

vi.mock("@/services/creditsService", () => ({
  creditsService: {
    createHold: vi.fn(),
    captureHold: vi.fn(),
    releaseHold: vi.fn(),
  },
  InsufficientCreditsError: class MockInsufficientCreditsError extends Error {},
}));

describe("/api/sourcer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/sourcer", {
      method: "POST",
      headers: { "Idempotency-Key": "key" },
      body: JSON.stringify({ categories: "Dentist" }),
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

    const req = new NextRequest("http://localhost:3000/api/sourcer", {
      method: "POST",
      body: JSON.stringify({ categories: "Dentist" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 402 when credits are insufficient", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(creditsService.createHold).mockRejectedValue(new InsufficientCreditsError("nope"));

    const req = new NextRequest("http://localhost:3000/api/sourcer", {
      method: "POST",
      headers: { "Idempotency-Key": "key" },
      body: JSON.stringify({ categories: "Dentist", maxResults: 2 }),
    });

    const res = await POST(req);

    expect(res.status).toBe(402);
  });

  it("returns results when successful", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(creditsService.createHold).mockResolvedValue({
      id: "hold-1",
      userId: "user-1",
      status: "HOLD",
      amount: 1,
      idempotencyKey: "key",
    } as Awaited<ReturnType<typeof creditsService.createHold>>);

    vi.mocked(googleMapsSourcerService.collect).mockResolvedValue([
      { name: "Test" },
    ] as Awaited<ReturnType<typeof googleMapsSourcerService.collect>>);

    const req = new NextRequest("http://localhost:3000/api/sourcer", {
      method: "POST",
      headers: { "Idempotency-Key": "key" },
      body: JSON.stringify({ categories: "Dentist", maxResults: 1 }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.results).toHaveLength(1);
    expect(creditsService.captureHold).toHaveBeenCalled();
  });
});
