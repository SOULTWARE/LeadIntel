import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/outreach/webhook/route";
import { prisma } from "@/db";

vi.mock("@/db", () => ({
  prisma: {
    contact: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    leadBatch: {
      updateMany: vi.fn(),
    },
    outreachEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
    ),
  },
}));

describe("/api/outreach/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OUTREACH_WEBHOOK_SECRET = "webhook-secret";
  });

  it("returns 401 when the webhook secret is missing or invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/outreach/webhook", {
      method: "POST",
      body: JSON.stringify({
        provider: "smartlead",
        events: [{ eventId: "evt-1", type: "SENT", leadId: "lead-1" }],
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("records a sent event and activates the batch", async () => {
    vi.mocked(prisma.lead.findUnique).mockResolvedValue({
      id: "lead-1",
      email: "ceo@example.com",
      campaignId: "campaign-1",
      batchId: "batch-1",
      primaryContactId: "contact-1",
    } as never);
    vi.mocked(prisma.outreachEvent.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.outreachEvent.create).mockResolvedValue({ id: "evt-row-1" } as never);
    vi.mocked(prisma.lead.update).mockResolvedValue({ id: "lead-1" } as never);
    vi.mocked(prisma.leadBatch.updateMany).mockResolvedValue({ count: 1 } as never);

    const req = new NextRequest("http://localhost:3000/api/outreach/webhook", {
      method: "POST",
      headers: {
        authorization: "Bearer webhook-secret",
      },
      body: JSON.stringify({
        provider: "smartlead",
        events: [
          {
            eventId: "evt-1",
            type: "SENT",
            leadId: "lead-1",
            messageId: "message-1",
            occurredAt: "2026-03-25T10:00:00.000Z",
          },
        ],
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.processed).toBe(1);
    expect(prisma.outreachEvent.create).toHaveBeenCalled();
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: {
        sentCount: { increment: 1 },
      },
    });
    expect(prisma.leadBatch.updateMany).toHaveBeenCalledWith({
      where: {
        id: "batch-1",
        status: {
          in: ["DRAFT", "READY", "EXPORTED"],
        },
      },
      data: {
        status: "ACTIVE",
      },
    });
  });

  it("does not increment metrics for duplicate events", async () => {
    vi.mocked(prisma.lead.findUnique).mockResolvedValue({
      id: "lead-1",
      email: "ceo@example.com",
      campaignId: null,
      batchId: null,
      primaryContactId: "contact-1",
    } as never);
    vi.mocked(prisma.outreachEvent.findUnique).mockResolvedValue({ id: "evt-row-1" } as never);

    const req = new NextRequest("http://localhost:3000/api/outreach/webhook", {
      method: "POST",
      headers: {
        authorization: "Bearer webhook-secret",
      },
      body: JSON.stringify({
        provider: "smartlead",
        events: [
          {
            eventId: "evt-1",
            type: "OPEN",
            leadId: "lead-1",
          },
        ],
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.duplicates).toBe(1);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });
});
