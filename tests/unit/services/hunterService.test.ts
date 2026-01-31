import { describe, it, expect, vi, beforeEach } from "vitest";
import { HunterService } from "@/services/hunterService";
import { externalApiCacheService } from "@/services/externalApiCacheService";

vi.mock("@/services/externalApiCacheService", () => ({
  externalApiCacheService: {
    fetchJsonWithCache: vi.fn(),
  },
}));

describe("HunterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HUNTER_API_KEY = "test-key";
  });

  it("throws when API key is missing", async () => {
    process.env.HUNTER_API_KEY = "";
    const service = new HunterService();

    await expect(service.domainSearch("example.com")).rejects.toThrow(
      "HUNTER_API_KEY is missing in environment variables"
    );
  });

  it("returns sorted, valid email entries", async () => {
    const service = new HunterService();

    vi.mocked(externalApiCacheService.fetchJsonWithCache).mockResolvedValue({
      data: {
        emails: [
          { value: "bad-value" },
          { value: "admin@example.com", confidence: 65 },
          { value: "sales@example.com", confidence: 90 },
        ],
      },
    } as Awaited<ReturnType<typeof externalApiCacheService.fetchJsonWithCache>>);

    const results = await service.domainSearch("Example.com");

    expect(results.map((r) => r.value)).toEqual([
      "sales@example.com",
      "admin@example.com",
    ]);
  });
});
