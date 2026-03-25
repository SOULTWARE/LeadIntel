import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/leads/find-emails-batch/route";
import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";
import { jobQueueService } from "@/services/jobQueueService";
import { prisma } from "@/db";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/creditsService", () => {
  class MockInsufficientCreditsError extends Error {}
  return {
    creditsService: {
      getBalance: vi.fn(),
      getAddonBalance: vi.fn(),
      createHold: vi.fn(),
      releaseHold: vi.fn(),
    },
    InsufficientCreditsError: MockInsufficientCreditsError,
  };
});

vi.mock("@/services/jobQueueService", () => ({
  jobQueueService: {
    enqueue: vi.fn(),
  },
}));

vi.mock("@/db", () => ({
  prisma: {
    lead: {
      findMany: vi.fn(),
    },
  },
}));

describe("/api/leads/find-emails-batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/leads/find-emails-batch", {
      method: "POST",
      body: JSON.stringify({ leadIds: ["l1"] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 402 when insufficient credits", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.lead.findMany).mockResolvedValue([{ id: "l1" }] as never);
    vi.mocked(creditsService.getBalance).mockResolvedValue(0);
    vi.mocked(creditsService.getAddonBalance).mockResolvedValue({
      userId: "user-1",
      remaining: 0,
      expiresAt: null,
    });

    const req = new NextRequest("http://localhost:3000/api/leads/find-emails-batch", {
      method: "POST",
      body: JSON.stringify({ leadIds: ["l1"] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(402);
  });

  it("queues jobs when credits available", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.lead.findMany).mockResolvedValue([{ id: "l1" }, { id: "l2" }] as never);
    vi.mocked(creditsService.getBalance).mockResolvedValue(5);
    vi.mocked(creditsService.getAddonBalance).mockResolvedValue({
      userId: "user-1",
      remaining: 0,
      expiresAt: null,
    });

    const req = new NextRequest("http://localhost:3000/api/leads/find-emails-batch", {
      method: "POST",
      body: JSON.stringify({ leadIds: ["l1", "l2"] }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.queuedCount).toBe(2);
    expect(jobQueueService.enqueue).toHaveBeenCalledTimes(2);
  });
});
