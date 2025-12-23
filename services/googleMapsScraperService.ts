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

    console.log(`[GoogleMapsScraper] Scraping for: "${q}"`);

    const url = new URL("https://serpapi.com/search");
    url.searchParams.set("q", q);
    url.searchParams.set("engine", "google_maps");
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("hl", language);
    if (country) url.searchParams.set("gl", country.toLowerCase());

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`SerpApi error: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json();
      const results = data.local_results || [];

      return results.map((item: any) => ({
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
      })).slice(0, maxResults === 0 ? undefined : maxResults);
    } catch (error) {
      console.error("[GoogleMapsScraper] Error:", error);
      throw error;
    }
  }
}

export const googleMapsScraperService = new GoogleMapsScraperService();
