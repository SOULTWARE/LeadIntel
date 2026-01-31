import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/leads/[id]/find-email/route";
import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";
import { jobQueueService } from "@/services/jobQueueService";
import { prisma } from "@/db";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/creditsService", () => ({
  creditsService: {
    createHold: vi.fn(),
    releaseHold: vi.fn(),
  },
  InsufficientCreditsError: class MockInsufficientCreditsError extends Error {},
}));

vi.mock("@/services/jobQueueService", () => ({
  jobQueueService: {
    enqueue: vi.fn(),
  },
}));

vi.mock("@/db", () => ({
  prisma: {
    lead: {
      findUnique: vi.fn(),
    },
  },
}));

describe("/api/leads/[id]/find-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/leads/lead-1/find-email", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "lead-1" }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 when lead not found", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.lead.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/leads/lead-1/find-email", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "lead-1" }) });

    expect(res.status).toBe(404);
  });

  it("returns 403 when lead belongs to another user", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.lead.findUnique).mockResolvedValue({
      id: "lead-1",
      userId: "user-2",
    } as never);

    const req = new NextRequest("http://localhost:3000/api/leads/lead-1/find-email", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "lead-1" }) });

    expect(res.status).toBe(403);
  });

  it("queues job when successful", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.lead.findUnique).mockResolvedValue({
      id: "lead-1",
      userId: "user-1",
    } as never);

    const req = new NextRequest("http://localhost:3000/api/leads/lead-1/find-email", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "lead-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.queued).toBe(true);
    expect(jobQueueService.enqueue).toHaveBeenCalled();
    expect(creditsService.createHold).toHaveBeenCalled();
  });
});
