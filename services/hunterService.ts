import { externalApiCacheService } from "./externalApiCacheService";

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

        const res = await fetch(url.toString(), {
          method: "GET",
        });

        const json = (await res.json()) as HunterDomainSearchResponse;
        return { statusCode: res.status, json };
      },
    });

    if (data.errors && data.errors.length > 0) {
      const details = data.errors[0]?.details || "Hunter API error";
      throw new Error(details);
    }

    const emails = data.data?.emails || [];

    return [...emails]
      .filter((e) => typeof e.value === "string" && e.value.includes("@"))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }
}

export const hunterService = new HunterService();
