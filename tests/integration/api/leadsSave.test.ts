import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/leads/save/route";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/db", () => ({
  prisma: {
    session: {
      create: vi.fn(),
    },
    lead: {
      upsert: vi.fn(),
    },
  },
}));

describe("/api/leads/save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/leads/save", {
      method: "POST",
      body: JSON.stringify({ leads: [] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when body invalid", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/leads/save", {
      method: "POST",
      body: JSON.stringify({ bad: true }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("creates session and upserts leads", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.session.create).mockResolvedValue({ id: "session-1" } as never);
    vi.mocked(prisma.lead.upsert).mockResolvedValue({ id: "lead-1" } as never);

    const req = new NextRequest("http://localhost:3000/api/leads/save", {
      method: "POST",
      body: JSON.stringify({
        leads: [{ name: "Lead", placeId: "p1" }],
        sessionName: "Session",
        contactPurpose: "Test",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.count).toBe(1);
    expect(prisma.session.create).toHaveBeenCalled();
    expect(prisma.lead.upsert).toHaveBeenCalled();
  });
});
