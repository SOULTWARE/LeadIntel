import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/credits/balance/route";
import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/creditsService", () => ({
  creditsService: {
    getBalance: vi.fn(),
  },
}));

describe("/api/credits/balance", () => {
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

  it("returns balance for authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "user-1" } } }),
      },
    } as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(creditsService.getBalance).mockResolvedValue(42);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.balance).toBe(42);
  });
});
