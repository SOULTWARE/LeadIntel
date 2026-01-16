import { externalApiCacheService } from "./externalApiCacheService";

interface SerpApiOrganicResult {
  link?: string;
}

interface SerpApiGoogleSearchResponse {
  organic_results?: SerpApiOrganicResult[];
  error?: string;
}

function normalizeHostname(hostname: string): string {
  const h = hostname.trim().toLowerCase();
  return h.replace(/^www\./, "");
}

function isBlockedHostname(hostname: string): boolean {
  const h = normalizeHostname(hostname);

  const blocked = [
    "facebook.com",
    "m.facebook.com",
    "linkedin.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "yelp.com",
    "yellowpages.com",
    "google.com",
    "maps.google.com",
    "goo.gl",
    "tripadvisor.com",
    "wikipedia.org",
    "bloomberg.com",
    "crunchbase.com",
  ];

  return blocked.some((b) => h === b || h.endsWith(`.${b}`));
}

export class WebsiteDiscoveryService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SEARCH_API_KEY || "";
  }

  async discoverWebsiteHostname(input: {
    name: string;
    address?: string | null;
    location?: string | null;
  }): Promise<string | null> {
    if (!this.apiKey) {
      throw new Error("SEARCH_API_KEY is missing in environment variables");
    }

    const name = input.name.trim();
    const addressOrLocation = (input.address || input.location || "").trim();

    if (!name) return null;

    const q = `${name} ${addressOrLocation} official website`.trim();
    const cacheKey = `google-website:${q.toLowerCase()}`;

    const data = await externalApiCacheService.fetchJsonWithCache<SerpApiGoogleSearchResponse>({
      provider: "serpapi",
      cacheKey,
      expiresInMs: 7 * 24 * 60 * 60 * 1000,
      fetcher: async () => {
        const url = new URL("https://serpapi.com/search");
        url.searchParams.set("engine", "google");
        url.searchParams.set("api_key", this.apiKey);
        url.searchParams.set("q", q);
        url.searchParams.set("hl", "en");
        url.searchParams.set("num", "5");

        const res = await fetch(url.toString(), { method: "GET" });
        const json = (await res.json()) as SerpApiGoogleSearchResponse;
        return { statusCode: res.status, json };
      },
    });

    if (data.error) {
      throw new Error(data.error);
    }

    const organic = data.organic_results || [];

    for (const r of organic) {
      if (!r.link) continue;
      let hostname: string;
      try {
        hostname = new URL(r.link).hostname;
      } catch {
        continue;
      }

      if (!hostname) continue;
      if (isBlockedHostname(hostname)) continue;

      return normalizeHostname(hostname);
    }

    return null;
  }
}

export const websiteDiscoveryService = new WebsiteDiscoveryService();
