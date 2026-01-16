import { prisma } from "../db";
import type { Prisma } from "@prisma/client";

export interface FetchJsonWithCacheOptions<T> {
  provider: string;
  cacheKey: string;
  expiresInMs: number;
  fetcher: () => Promise<{ statusCode?: number; json: T }>;
}

export class ExternalApiCacheService {
  async getCachedJson<T>(provider: string, cacheKey: string): Promise<T | null> {
    const entry = await prisma.externalApiCache.findUnique({
      where: {
        provider_cacheKey: {
          provider,
          cacheKey,
        },
      },
    });

    if (!entry) return null;

    if (entry.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return entry.responseJson as T;
  }

  async setCachedJson<T>(options: {
    provider: string;
    cacheKey: string;
    expiresAt: Date;
    statusCode?: number;
    json: T;
    costUnits?: number;
  }): Promise<void> {
    const { provider, cacheKey, expiresAt, statusCode, json, costUnits } = options;

    await prisma.externalApiCache.upsert({
      where: {
        provider_cacheKey: {
          provider,
          cacheKey,
        },
      },
      update: {
        expiresAt,
        statusCode,
        responseJson: json as unknown as Prisma.InputJsonValue,
        costUnits,
      },
      create: {
        provider,
        cacheKey,
        expiresAt,
        statusCode,
        responseJson: json as unknown as Prisma.InputJsonValue,
        costUnits,
      },
    });
  }

  async fetchJsonWithCache<T>(options: FetchJsonWithCacheOptions<T>): Promise<T> {
    const cached = await this.getCachedJson<T>(options.provider, options.cacheKey);
    if (cached) return cached;

    const { statusCode, json } = await options.fetcher();

    if (typeof statusCode === "number" && statusCode >= 400) {
      return json;
    }

    await this.setCachedJson({
      provider: options.provider,
      cacheKey: options.cacheKey,
      expiresAt: new Date(Date.now() + options.expiresInMs),
      statusCode,
      json,
    });

    return json;
  }
}

export const externalApiCacheService = new ExternalApiCacheService();
