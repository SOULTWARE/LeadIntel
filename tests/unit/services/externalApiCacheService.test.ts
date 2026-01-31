import { describe, it, expect, vi, beforeEach } from "vitest";
import { externalApiCacheService } from "@/services/externalApiCacheService";
import { prisma } from "@/db";

vi.mock("@/db", () => ({
  prisma: {
    externalApiCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("ExternalApiCacheService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when cache entry is missing", async () => {
    vi.mocked(prisma.externalApiCache.findUnique).mockResolvedValue(null);

    const result = await externalApiCacheService.getCachedJson("provider", "key");

    expect(result).toBeNull();
  });

  it("returns null when cache entry is expired", async () => {
    vi.mocked(prisma.externalApiCache.findUnique).mockResolvedValue({
      provider: "provider",
      cacheKey: "key",
      expiresAt: new Date(Date.now() - 1000),
      responseJson: { ok: true },
    } as unknown as Awaited<ReturnType<typeof prisma.externalApiCache.findUnique>>);

    const result = await externalApiCacheService.getCachedJson("provider", "key");

    expect(result).toBeNull();
  });

  it("returns cached json when entry is valid", async () => {
    vi.mocked(prisma.externalApiCache.findUnique).mockResolvedValue({
      provider: "provider",
      cacheKey: "key",
      expiresAt: new Date(Date.now() + 1000),
      responseJson: { ok: true },
    } as unknown as Awaited<ReturnType<typeof prisma.externalApiCache.findUnique>>);

    const result = await externalApiCacheService.getCachedJson<{ ok: boolean }>("provider", "key");

    expect(result).toEqual({ ok: true });
  });

  it("returns cached value without calling fetcher", async () => {
    const fetcher = vi.fn();
    const getCachedSpy = vi
      .spyOn(externalApiCacheService, "getCachedJson")
      .mockResolvedValue({ cached: true });

    const result = await externalApiCacheService.fetchJsonWithCache({
      provider: "provider",
      cacheKey: "key",
      expiresInMs: 1000,
      fetcher,
    });

    expect(result).toEqual({ cached: true });
    expect(fetcher).not.toHaveBeenCalled();
    getCachedSpy.mockRestore();
  });

  it("stores and returns fetched json when status is OK", async () => {
    const fetcher = vi.fn().mockResolvedValue({ statusCode: 200, json: { ok: true } });
    const setCachedSpy = vi.spyOn(externalApiCacheService, "setCachedJson").mockResolvedValue();

    const result = await externalApiCacheService.fetchJsonWithCache({
      provider: "provider",
      cacheKey: "key",
      expiresInMs: 1000,
      fetcher,
    });

    expect(result).toEqual({ ok: true });
    expect(setCachedSpy).toHaveBeenCalled();
    setCachedSpy.mockRestore();
  });

  it("returns fetched json without storing when status >= 400", async () => {
    const fetcher = vi.fn().mockResolvedValue({ statusCode: 500, json: { ok: false } });
    const setCachedSpy = vi.spyOn(externalApiCacheService, "setCachedJson").mockResolvedValue();

    const result = await externalApiCacheService.fetchJsonWithCache({
      provider: "provider",
      cacheKey: "key",
      expiresInMs: 1000,
      fetcher,
    });

    expect(result).toEqual({ ok: false });
    expect(setCachedSpy).not.toHaveBeenCalled();
    setCachedSpy.mockRestore();
  });
});
