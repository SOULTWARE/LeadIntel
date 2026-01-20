import { externalApiCacheService } from "./externalApiCacheService";

const REQUEST_TIMEOUT_MS = 15_000;

interface HunterDomainSearchEmail {
  value: string;
  confidence?: number;
  verification?: {
    status?: string;
    date?: string;
  };
}

interface HunterDomainSearchResponse {
  data?: {
    domain?: string;
    organization?: string;
    emails?: HunterDomainSearchEmail[];
  };
  errors?: Array<{
    id?: string;
    code?: number;
    details?: string;
  }>;
}

export class HunterService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.HUNTER_API_KEY || "";
  }

  async domainSearch(domain: string): Promise<HunterDomainSearchEmail[]> {
    if (!this.apiKey) {
      throw new Error("HUNTER_API_KEY is missing in environment variables");
    }

    const normalizedDomain = domain.trim().toLowerCase();
    const cacheKey = `domain-search:${normalizedDomain}`;

    const data = await externalApiCacheService.fetchJsonWithCache<HunterDomainSearchResponse>({
      provider: "hunter",
      cacheKey,
      expiresInMs: 24 * 60 * 60 * 1000,
      fetcher: async () => {
        const url = new URL("https://api.hunter.io/v2/domain-search");
        url.searchParams.set("domain", normalizedDomain);
        url.searchParams.set("api_key", this.apiKey);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
          const res = await fetch(url.toString(), {
            method: "GET",
            signal: controller.signal,
          });

          const json = (await res.json()) as HunterDomainSearchResponse;

          if (res.status >= 500) {
            throw new Error(`Hunter API unavailable (status ${res.status})`);
          }

          if (res.status >= 400) {
            const details = json.errors?.[0]?.details || `Hunter client error (status ${res.status})`;
            throw new Error(details);
          }

          return { statusCode: res.status, json };
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            throw new Error("Hunter API request timed out");
          }
          throw err;
        } finally {
          clearTimeout(timeout);
        }
      },
    });

    const emails = data.data?.emails || [];

    return [...emails]
      .filter((e) => typeof e.value === "string" && e.value.includes("@"))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }
}

export const hunterService = new HunterService();
