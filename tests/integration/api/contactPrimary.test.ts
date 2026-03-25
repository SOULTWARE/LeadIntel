import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/contacts/[id]/primary/route";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/db", () => ({
  prisma: {
    contact: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    lead: {
      update: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma)),
  },
}));

describe("/api/contacts/[id]/primary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/contacts/contact-1/primary", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "contact-1" }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 when contact is missing", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.contact.findUnique).mockResolvedValue(null as never);

    const req = new NextRequest("http://localhost:3000/api/contacts/contact-1/primary", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "contact-1" }) });

    expect(res.status).toBe(404);
  });

  it("marks the selected contact as primary", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.contact.findUnique).mockResolvedValue({
      id: "contact-1",
      userId: "user-1",
      leadId: "lead-1",
      email: "ceo@example.com",
      emailVerificationStatus: "VALID",
      emailVerifiedAt: null,
      emailVerificationProvider: "kickbox",
      roleTitle: "CEO",
      lead: {
        id: "lead-1",
        userId: "user-1",
        primaryDecisionMakerRole: null,
      },
    } as never);

    const req = new NextRequest("http://localhost:3000/api/contacts/contact-1/primary", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "contact-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.contactId).toBe("contact-1");
    expect(prisma.contact.updateMany).toHaveBeenCalled();
    expect(prisma.contact.update).toHaveBeenCalled();
    expect(prisma.lead.update).toHaveBeenCalled();
  });
});
