import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/credits/summary/route";
import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/creditsService", () => ({
  creditsService: {
    getBalance: vi.fn(),
    getAddonBalance: vi.fn(),
  },
}));

describe("/api/credits/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it("returns balances and total", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(creditsService.getBalance).mockResolvedValue(40);
    vi.mocked(creditsService.getAddonBalance).mockResolvedValue({
      userId: "user-1",
      remaining: 10,
      expiresAt: null,
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.total).toBe(50);
  });
});
