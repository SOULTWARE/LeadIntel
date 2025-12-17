/**
 * Enrichment Service for Lead Intel
 *
 * Enriches lead data with external sources:
 * - LinkedIn company/people search
 * - Crunchbase company data
 * - Google search for additional info
 */

import { OpenAIClient } from "./ai/openaiClient";

const SERP_API_KEY = process.env.SEARCH_API_KEY || process.env.SERP_API_KEY;

interface EnrichmentResult {
  companyInfo?: {
    industry?: string;
    employeeCount?: number;
    location?: string;
    description?: string;
    founded?: string;
    linkedinUrl?: string;
  };
  decisionMakers: DecisionMakerEnrichment[];
  sources: EnrichmentSource[];
}

interface DecisionMakerEnrichment {
  firstName: string;
  lastName: string;
  title?: string;
  linkedinUrl?: string;
  source: string;
}

interface EnrichmentSource {
  type: "linkedin" | "crunchbase" | "google" | "website";
  url: string;
  snippet?: string;
}

interface SerpAPIResponse {
  organic_results?: Array<{
    title: string;
    link: string;
    snippet?: string;
  }>;
  knowledge_graph?: {
    title?: string;
    description?: string;
    type?: string;
  };
}

export class EnrichmentService {
  private aiClient: OpenAIClient;

  constructor() {
    this.aiClient = new OpenAIClient({
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.AI_MODEL || "gpt-4o",
    });
  }

  /**
   * Enrich company data with external sources
   */
  async enrichCompany(
    companyName: string,
    domain?: string,
    location?: string
  ): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      decisionMakers: [],
      sources: [],
    };

    try {
      // Search LinkedIn for company page
      const linkedinCompanyResults = await this.searchLinkedIn(
        `${companyName} company`,
        "company"
      );
      if (linkedinCompanyResults.length > 0) {
        result.sources.push(...linkedinCompanyResults);
      }

      // Search LinkedIn for decision makers
      const linkedinPeopleResults = await this.searchLinkedInPeople(
        companyName,
        location
      );
      result.decisionMakers.push(...linkedinPeopleResults.decisionMakers);
      result.sources.push(...linkedinPeopleResults.sources);

      // Search Google for company info
      const googleResults = await this.searchGoogle(companyName, domain);
      result.sources.push(...googleResults);

      // Use AI to extract structured data from search results
      if (result.sources.length > 0) {
        const enrichedInfo = await this.extractCompanyInfo(
          companyName,
          result.sources
        );
        result.companyInfo = enrichedInfo;
      }
    } catch (error) {
      console.error("[EnrichmentService] Error enriching company:", error);
    }

    return result;
  }

  /**
   * Search LinkedIn via SerpAPI
   */
  private async searchLinkedIn(
    query: string,
    type: "company" | "people"
  ): Promise<EnrichmentSource[]> {
    if (!SERP_API_KEY) {
      console.log("[EnrichmentService] No SERP API key, skipping LinkedIn search");
      return [];
    }

    const searchQuery =
      type === "company"
        ? `site:linkedin.com/company ${query}`
        : `site:linkedin.com/in ${query}`;

    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("q", searchQuery);
      url.searchParams.set("api_key", SERP_API_KEY);
      url.searchParams.set("num", "5");

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error("[EnrichmentService] SerpAPI error:", response.status);
        return [];
      }

      const data: SerpAPIResponse = await response.json();
      const results: EnrichmentSource[] = [];

      if (data.organic_results) {
        for (const result of data.organic_results.slice(0, 3)) {
          if (result.link.includes("linkedin.com")) {
            results.push({
              type: "linkedin",
              url: result.link,
              snippet: result.snippet,
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error("[EnrichmentService] LinkedIn search error:", error);
      return [];
    }
  }

  /**
   * Search for decision makers on LinkedIn
   */
  private async searchLinkedInPeople(
    companyName: string,
    location?: string
  ): Promise<{ decisionMakers: DecisionMakerEnrichment[]; sources: EnrichmentSource[] }> {
    const decisionMakers: DecisionMakerEnrichment[] = [];
    const sources: EnrichmentSource[] = [];

    if (!SERP_API_KEY) {
      return { decisionMakers, sources };
    }

    // Search for key roles
    const roles = ["CEO", "Owner", "Founder", "President", "Director", "Manager"];
    const locationQuery = location ? ` ${location}` : "";

    for (const role of roles.slice(0, 3)) {
      // Limit to 3 role searches to avoid rate limits
      try {
        const query = `site:linkedin.com/in "${companyName}" ${role}${locationQuery}`;
        const url = new URL("https://serpapi.com/search.json");
        url.searchParams.set("q", query);
        url.searchParams.set("api_key", SERP_API_KEY);
        url.searchParams.set("num", "3");

        const response = await fetch(url.toString());
        if (!response.ok) continue;

        const data: SerpAPIResponse = await response.json();

        if (data.organic_results) {
          for (const result of data.organic_results.slice(0, 2)) {
            if (result.link.includes("linkedin.com/in/")) {
              // Extract name from LinkedIn title (usually "Name - Title - Company | LinkedIn")
              const nameMatch = result.title.match(/^([^-|]+)/);
              if (nameMatch) {
                const fullName = nameMatch[1].trim();
                const nameParts = fullName.split(" ");
                if (nameParts.length >= 2) {
                  decisionMakers.push({
                    firstName: nameParts[0],
                    lastName: nameParts.slice(1).join(" "),
                    title: role,
                    linkedinUrl: result.link,
                    source: "linkedin_search",
                  });
                  sources.push({
                    type: "linkedin",
                    url: result.link,
                    snippet: result.snippet,
                  });
                }
              }
            }
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`[EnrichmentService] Error searching ${role}:`, error);
      }
    }

    // Deduplicate by LinkedIn URL
    const seenUrls = new Set<string>();
    const uniqueDecisionMakers = decisionMakers.filter((dm) => {
      if (dm.linkedinUrl && seenUrls.has(dm.linkedinUrl)) {
        return false;
      }
      if (dm.linkedinUrl) seenUrls.add(dm.linkedinUrl);
      return true;
    });

    return { decisionMakers: uniqueDecisionMakers, sources };
  }

  /**
   * Search Google for general company info
   */
  private async searchGoogle(
    companyName: string,
    domain?: string
  ): Promise<EnrichmentSource[]> {
    if (!SERP_API_KEY) {
      return [];
    }

    try {
      const query = domain
        ? `"${companyName}" ${domain} company info`
        : `"${companyName}" company info employees`;

      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("q", query);
      url.searchParams.set("api_key", SERP_API_KEY);
      url.searchParams.set("num", "5");

      const response = await fetch(url.toString());
      if (!response.ok) return [];

      const data: SerpAPIResponse = await response.json();
      const results: EnrichmentSource[] = [];

      if (data.organic_results) {
        for (const result of data.organic_results.slice(0, 3)) {
          // Skip LinkedIn (already searched separately)
          if (result.link.includes("linkedin.com")) continue;

          results.push({
            type: result.link.includes("crunchbase.com") ? "crunchbase" : "google",
            url: result.link,
            snippet: result.snippet,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("[EnrichmentService] Google search error:", error);
      return [];
    }
  }

  /**
   * Use AI to extract structured company info from search snippets
   */
  private async extractCompanyInfo(
    companyName: string,
    sources: EnrichmentSource[]
  ): Promise<EnrichmentResult["companyInfo"]> {
    const snippets = sources
      .filter((s) => s.snippet)
      .map((s) => `[${s.type}] ${s.snippet}`)
      .join("\n");

    if (!snippets) return undefined;

    try {
      const response = await this.aiClient.complete({
        messages: [
          {
            role: "system",
            content: `Extract company information from search snippets. Return JSON only:
{
  "industry": "string or null",
  "employeeCount": "number or null",
  "location": "string or null",
  "description": "1-2 sentence summary or null",
  "founded": "year string or null"
}
Only include fields you can confidently extract. Use null for unknown.`,
          },
          {
            role: "user",
            content: `Company: ${companyName}\n\nSearch snippets:\n${snippets}`,
          },
        ],
        responseFormat: "json",
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error("[EnrichmentService] AI extraction error:", error);
      return undefined;
    }
  }
}
