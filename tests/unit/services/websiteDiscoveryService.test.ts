import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebsiteDiscoveryService } from "@/services/websiteDiscoveryService";
import { externalApiCacheService } from "@/services/externalApiCacheService";

vi.mock("@/services/externalApiCacheService", () => ({
  externalApiCacheService: {
    fetchJsonWithCache: vi.fn(),
  },
}));

describe("WebsiteDiscoveryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SEARCH_API_KEY = "test-key";
  });

  it("throws when API key is missing", async () => {
    process.env.SEARCH_API_KEY = "";
    const service = new WebsiteDiscoveryService();

    await expect(service.discoverWebsiteHostname({ name: "Test" })).rejects.toThrow(
      "SEARCH_API_KEY is missing in environment variables"
    );
  });

  it("returns null when name is empty", async () => {
    const service = new WebsiteDiscoveryService();

    const result = await service.discoverWebsiteHostname({ name: "   " });

    expect(result).toBeNull();
  });

  it("skips blocked hostnames and returns normalized hostname", async () => {
    const service = new WebsiteDiscoveryService();

    vi.mocked(externalApiCacheService.fetchJsonWithCache).mockResolvedValue({
      organic_results: [
        { link: "https://facebook.com/some" },
        { link: "https://www.Example.com/landing" },
      ],
    } as Awaited<ReturnType<typeof externalApiCacheService.fetchJsonWithCache>>);

    const result = await service.discoverWebsiteHostname({ name: "Example", location: "NY" });

    expect(result).toBe("example.com");
  });

  it("returns null when no valid hostname is found", async () => {
    const service = new WebsiteDiscoveryService();

    vi.mocked(externalApiCacheService.fetchJsonWithCache).mockResolvedValue({
      organic_results: [{ link: "https://facebook.com/some" }],
    } as Awaited<ReturnType<typeof externalApiCacheService.fetchJsonWithCache>>);

    const result = await service.discoverWebsiteHostname({ name: "Example", location: "NY" });

    expect(result).toBeNull();
  });
});
