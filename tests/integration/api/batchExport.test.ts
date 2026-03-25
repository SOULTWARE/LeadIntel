import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/batches/export/route";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/db", () => ({
  prisma: {
    leadBatch: {
      updateMany: vi.fn(),
    },
  },
}));

describe("/api/batches/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest("http://localhost:3000/api/batches/export", {
      method: "POST",
      body: JSON.stringify({ batchIds: ["batch-1"] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("marks owned batches as exported", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(prisma.leadBatch.updateMany).mockResolvedValue({ count: 2 } as never);

    const req = new NextRequest("http://localhost:3000/api/batches/export", {
      method: "POST",
      body: JSON.stringify({ batchIds: ["batch-1", "batch-2", "batch-1"] }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.updatedCount).toBe(2);
    expect(prisma.leadBatch.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["batch-1", "batch-2"] },
        userId: "user-1",
        status: {
          in: ["DRAFT", "READY", "EXPORTED"],
        },
      },
      data: {
        status: "EXPORTED",
      },
    });
  });
});
