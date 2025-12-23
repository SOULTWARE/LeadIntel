export interface ScraperOptions {
  categories?: string;
  plainQueries?: string;
  location?: string;
  country?: string;
  maxResults?: number;
  language?: string;
}

export class GoogleMapsScraperService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SEARCH_API_KEY || "";
  }

  async scrape(options: ScraperOptions): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error("SEARCH_API_KEY is missing in environment variables");
    }
    const { categories, plainQueries, location, country, maxResults = 20, language = 'en' } = options;

    // Construct query
    const q = [categories, plainQueries, location, country].filter(Boolean).join(" ");

    console.log(`[GoogleMapsScraper] Scraping for: "${q}" (Max: ${maxResults})`);

    let allResults: any[] = [];
    let nextToken: string | null = null;

    try {
      do {
        const url = new URL("https://serpapi.com/search");
        url.searchParams.set("engine", "google_maps");
        url.searchParams.set("api_key", this.apiKey);
        url.searchParams.set("hl", language);

        if (nextToken) {
          url.searchParams.set("next_page_token", nextToken);
        } else {
          url.searchParams.set("q", q);
          if (country) url.searchParams.set("gl", country.toLowerCase());
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`SerpApi error: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        const results = data.local_results || [];

        const mapped = results.map((item: any) => ({
          name: item.title,
          address: item.address,
          phone: item.phone,
          website: item.website,
          rating: item.rating,
          reviews: item.reviews,
          type: item.type,
          placeId: item.place_id,
          gps: item.gps_coordinates,
          thumbnail: item.thumbnail,
        }));

        allResults = [...allResults, ...mapped];

        // Debug
        console.log(`[GoogleMapsScraper] Fetched ${mapped.length} results. Total: ${allResults.length}`);

        // Check if we need more
        if (maxResults > 0 && allResults.length >= maxResults) {
          allResults = allResults.slice(0, maxResults);
          break;
        }

        nextToken = data.serpapi_pagination?.next_page_token || null;

      } while (nextToken && (maxResults === 0 || allResults.length < maxResults));

      return allResults;
    } catch (error) {
      console.error("[GoogleMapsScraper] Error:", error);
      throw error;
    }
  }
}

export const googleMapsScraperService = new GoogleMapsScraperService();
