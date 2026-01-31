import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/generate/email/route";
import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";
import { prisma } from "@/db";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

class MockInsufficientCreditsError extends Error {}

vi.mock("@/services/creditsService", () => ({
  creditsService: {
    createHold: vi.fn(),
    releaseHold: vi.fn(),
    captureHold: vi.fn(),
  },
  InsufficientCreditsError: MockInsufficientCreditsError,
}));

vi.mock("@/db", () => ({
  prisma: {
    lead: {
      update: vi.fn(),
    },
  },
}));

describe("/api/generate/email", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/generate/email", {
      method: "POST",
      headers: { "Idempotency-Key": "key" },
      body: JSON.stringify({ lead: { name: "Lead" } }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when idempotency key is missing", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/generate/email", {
      method: "POST",
      body: JSON.stringify({ lead: { name: "Lead" } }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns generated email on success", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ subject: "Hi", body: "Hello" }),
            },
          },
        ],
      }),
    });

    vi.mocked(prisma.lead.update).mockResolvedValue({
      emailDraftGeneratedAt: new Date("2025-01-01T00:00:00.000Z"),
    } as never);

    const req = new NextRequest("http://localhost:3000/api/generate/email", {
      method: "POST",
      headers: { "Idempotency-Key": "key" },
      body: JSON.stringify({ lead: { id: "lead-1", name: "Lead" } }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.subject).toBe("Hi");
    expect(json.data.body).toBe("Hello");
    expect(creditsService.captureHold).toHaveBeenCalled();
  });
});
