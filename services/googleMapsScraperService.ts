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
    let start = 0;

    try {
      while (allResults.length < maxResults) {
        const url = new URL("https://serpapi.com/search");
        url.searchParams.set("engine", "google_maps");
        url.searchParams.set("api_key", this.apiKey);
        url.searchParams.set("hl", language);
        url.searchParams.set("q", q);
        url.searchParams.set("start", start.toString());
        if (country) url.searchParams.set("gl", country.toLowerCase());

        console.log(`[GoogleMapsScraper] Fetching results starting at ${start}...`);

        const response = await fetch(url.toString());
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[GoogleMapsScraper] SerpApi error: ${response.status}`, errorText);
          break;
        }

        const data = await response.json();
        const results = data.local_results || [];

        if (results.length === 0) {
          console.log("[GoogleMapsScraper] No more results found.");
          break;
        }

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
        console.log(`[GoogleMapsScraper] Fetched ${mapped.length} results. Total: ${allResults.length}`);

        if (allResults.length >= maxResults) {
          allResults = allResults.slice(0, maxResults);
          break;
        }

        // If we got fewer than 20 results, it's likely the last page
        if (results.length < 20) {
          break;
        }

        start += 20;
      }

      return allResults;
    } catch (error) {
      console.error("[GoogleMapsScraper] Error:", error);
      throw error;
    }
  }
}

export const googleMapsScraperService = new GoogleMapsScraperService();
