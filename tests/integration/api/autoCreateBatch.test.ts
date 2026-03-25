import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/batches/auto-create/route";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/db", () => ({
  prisma: {
    lead: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    leadBatch: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
    ),
  },
}));

describe("/api/batches/auto-create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/batches/auto-create", {
      method: "POST",
      body: JSON.stringify({ leadIds: ["lead-1"] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("creates ready batches for eligible leads", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.lead.findMany).mockResolvedValue(
      [
        {
          id: "lead-1",
          name: "Acme",
          qualityScore: 82,
          warmupScore: 40,
          emailVerificationStatus: "VALID",
          primaryDecisionMakerRole: "CEO",
          primaryContact: { isDecisionMaker: true },
          campaignId: "campaign-1",
          campaign: { id: "campaign-1", name: "Outbound" },
          segmentName: "Core",
          batchId: null,
          batch: null,
        },
        {
          id: "lead-2",
          name: "Beta",
          qualityScore: 75,
          warmupScore: 50,
          emailVerificationStatus: "VALID",
          primaryDecisionMakerRole: "CEO",
          primaryContact: { isDecisionMaker: true },
          campaignId: "campaign-1",
          campaign: { id: "campaign-1", name: "Outbound" },
          segmentName: "Core",
          batchId: null,
          batch: null,
        },
      ] as never,
    );
    vi.mocked(prisma.leadBatch.create).mockResolvedValue({
      id: "batch-1",
      createdAt: new Date("2026-03-25T10:00:00.000Z"),
      updatedAt: new Date("2026-03-25T10:00:00.000Z"),
      userId: "user-1",
      name: "Outbound · Core Batch 1",
      code: "outbound-core-batch-1-abc123",
      status: "READY",
      maxLeads: 2,
      campaignId: "campaign-1",
    } as never);
    vi.mocked(prisma.lead.updateMany).mockResolvedValue({ count: 2 } as never);

    const req = new NextRequest("http://localhost:3000/api/batches/auto-create", {
      method: "POST",
      body: JSON.stringify({
        leadIds: ["lead-1", "lead-2"],
        maxLeadsPerBatch: 25,
        minQualityScore: 60,
        requireVerified: true,
        requireDecisionMaker: true,
        requireWarmup: false,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.createdBatchCount).toBe(1);
    expect(json.data.assignedLeadCount).toBe(2);
    expect(prisma.leadBatch.create).toHaveBeenCalled();
    expect(prisma.lead.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["lead-1", "lead-2"],
        },
        userId: "user-1",
      },
      data: {
        batchId: "batch-1",
      },
    });
  });
});
