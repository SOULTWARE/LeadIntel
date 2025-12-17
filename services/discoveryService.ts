/**
 * Discovery Service for Lead Intel
 *
 * ⚠️ IMMUTABLE RULE: NO AI-CLAIMS WITHOUT SNAPSHOT
 * See: src/docs/architecture.md
 *
 * GPT MAY ONLY discover candidate companies (name, domain candidates,
 * social profiles, directory entries) using search tools.
 * GPT MUST NOT output issues, evidence excerpts, or verified contact details.
 */

import type {
  DiscoveryResult,
  DiscoveryInput,
  SearchProvenance,
} from "../src/types/pipeline";
import {
  type ISearchAdapter,
  type SearchResult,
  getSearchAdapterFromEnv,
} from "../lib/searchAdapter";

const MAX_QUERIES_PER_ROUND = 8;
const MAX_PARSE_RETRIES = 2;
const FORBIDDEN_FIELDS = [
  "email",
  "phone",
  "contact",
  "issue",
  "problem",
  "evidence",
  "complaint",
  "review",
  "rating",
  "price",
  "revenue",
  "employee_count",
  "employees",
];

const DISCOVERY_SYSTEM_PROMPT = `You are a company discovery assistant. Your ONLY job is to find candidate companies matching the search criteria.

IMMUTABLE RULES:
1. You MAY ONLY return: company_name, domain_candidates, profile_urls, search_provenance, discovery_confidence
2. You MUST NOT output: emails, phone numbers, contact details, issues, problems, evidence, complaints, reviews, or any verified claims
3. All data you return is UNVERIFIED and will be verified by backend systems

Return ONLY a valid JSON array of candidate objects with this exact structure:
[
  {
    "company_name": "Company Name",
    "domain_candidates": ["example.com", "example.net"],
    "profile_urls": ["https://linkedin.com/company/example", "https://maps.google.com/..."],
    "search_provenance": [
      {"queryUsed": "the search query", "resultUrl": "https://...", "snippet": "text from search result"}
    ],
    "discovery_confidence": 75
  }
]

CRITICAL: Return ONLY the JSON array. No explanations, no markdown, no extra text.`;

export interface DiscoveryServiceConfig {
  searchAdapter?: ISearchAdapter;
  maxQueriesPerRound?: number;
  maxParseRetries?: number;
}

export class DiscoveryService {
  private searchAdapter: ISearchAdapter;
  private maxQueriesPerRound: number;
  private maxParseRetries: number;

  constructor(config: DiscoveryServiceConfig = {}) {
    this.searchAdapter = config.searchAdapter ?? getSearchAdapterFromEnv();
    this.maxQueriesPerRound = config.maxQueriesPerRound ?? MAX_QUERIES_PER_ROUND;
    this.maxParseRetries = config.maxParseRetries ?? MAX_PARSE_RETRIES;
  }

  async discoverCandidates(input: DiscoveryInput): Promise<DiscoveryResult[]> {
    const { industry, location, count, leadPurpose, excludeCompanies = [], excludeDomains = [] } = input;
    const allCandidates: DiscoveryResult[] = [];
    const seenKeys = new Set<string>();

    // Pre-populate seen keys with exclusions
    for (const company of excludeCompanies) {
      seenKeys.add(`${company.toLowerCase().trim()}::`);
    }
    for (const domain of excludeDomains) {
      seenKeys.add(`::${domain.toLowerCase().trim()}`);
    }

    const queries = this.buildSearchQueries(industry, location, leadPurpose);
    let queryIndex = 0;

    while (allCandidates.length < count && queryIndex < queries.length) {
      const batchQueries = queries.slice(
        queryIndex,
        queryIndex + this.maxQueriesPerRound
      );
      queryIndex += this.maxQueriesPerRound;

      for (const query of batchQueries) {
        if (allCandidates.length >= count) break;

        try {
          const candidates = await this.executeDiscoveryQuery(
            query,
            count - allCandidates.length,
            excludeCompanies,
            excludeDomains
          );

          for (const candidate of candidates) {
            const key = this.getCandidateKey(candidate);

            // Also check if company name or domain matches exclusions
            const companyLower = candidate.company_name.toLowerCase().trim();
            const isExcludedCompany = excludeCompanies.some(exc =>
              companyLower.includes(exc.toLowerCase()) || exc.toLowerCase().includes(companyLower)
            );
            const isExcludedDomain = candidate.domain_candidates.some(d =>
              excludeDomains.some(exc => d.toLowerCase().includes(exc.toLowerCase()))
            );

            if (!seenKeys.has(key) && !isExcludedCompany && !isExcludedDomain) {
              seenKeys.add(key);
              allCandidates.push(candidate);
              if (allCandidates.length >= count) break;
            }
          }
        } catch (error) {
          console.error(`Discovery query failed: ${query}`, error);
        }
      }
    }

    return allCandidates.slice(0, count);
  }

  private buildSearchQueries(
    industry: string,
    location: string,
    leadPurpose: string
  ): string[] {
    const baseQueries = [
      `${industry} companies in ${location}`,
      `${industry} businesses ${location}`,
      `top ${industry} companies ${location}`,
      `${industry} ${location} directory`,
      `${industry} services ${location}`,
      `best ${industry} ${location}`,
      `${industry} firms ${location}`,
      `${industry} providers ${location}`,
    ];

    const purposeQueries = this.getPurposeSpecificQueries(
      industry,
      location,
      leadPurpose
    );

    return [...baseQueries, ...purposeQueries];
  }

  private getPurposeSpecificQueries(
    industry: string,
    location: string,
    leadPurpose: string
  ): string[] {
    const purposeLower = leadPurpose.toLowerCase();

    if (purposeLower.includes("b2b") || purposeLower.includes("enterprise")) {
      return [
        `enterprise ${industry} ${location}`,
        `${industry} for business ${location}`,
        `commercial ${industry} ${location}`,
      ];
    }

    if (purposeLower.includes("startup") || purposeLower.includes("small")) {
      return [
        `${industry} startups ${location}`,
        `small ${industry} companies ${location}`,
        `emerging ${industry} ${location}`,
      ];
    }

    if (purposeLower.includes("local")) {
      return [
        `local ${industry} ${location}`,
        `${industry} near ${location}`,
        `${location} ${industry} listings`,
      ];
    }

    return [`${industry} ${leadPurpose} ${location}`];
  }

  private async executeDiscoveryQuery(
    query: string,
    maxResults: number,
    excludeCompanies: string[] = [],
    excludeDomains: string[] = []
  ): Promise<DiscoveryResult[]> {
    // Build exclusion text if we have exclusions
    let exclusionText = "";
    if (excludeCompanies.length > 0 || excludeDomains.length > 0) {
      exclusionText = `\n\nIMPORTANT - DO NOT include these companies (already in database):`;
      if (excludeCompanies.length > 0) {
        exclusionText += `\nExcluded company names: ${excludeCompanies.slice(0, 20).join(", ")}`;
      }
      if (excludeDomains.length > 0) {
        exclusionText += `\nExcluded domains: ${excludeDomains.slice(0, 20).join(", ")}`;
      }
      exclusionText += `\nFind DIFFERENT companies not in this list.`;
    }

    const userPrompt = `Search for companies matching: "${query}"

Find up to ${maxResults} NEW companies. For each company found, extract:
- company_name: The official company name
- domain_candidates: Any website domains found (may be empty)
- profile_urls: LinkedIn, Google Maps, Facebook, Instagram, directory listings
- search_provenance: Top 3 search results that led to this company (queryUsed, resultUrl, snippet)
- discovery_confidence: Your confidence 0-100 that this is a real, active company
${exclusionText}

Remember: Return ONLY the JSON array. No other text.`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxParseRetries; attempt++) {
      try {
        const response = await this.searchAdapter.searchWithGPT(
          DISCOVERY_SYSTEM_PROMPT,
          userPrompt
        );

        const candidates = this.parseAndValidateResponse(
          response.content,
          query,
          response.searchResults
        );

        return candidates;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (
          error instanceof ValidationError &&
          attempt < this.maxParseRetries
        ) {
          console.warn(
            `Retry ${attempt + 1}/${this.maxParseRetries}: ${error.message}`
          );
          continue;
        }
      }
    }

    throw lastError ?? new Error("Discovery query failed");
  }

  private parseAndValidateResponse(
    content: string,
    queryUsed: string,
    searchResults: SearchResult[]
  ): DiscoveryResult[] {
    const cleanedContent = this.extractJsonArray(content);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch {
      throw new ValidationError(
        `Failed to parse JSON response: ${content.slice(0, 200)}`
      );
    }

    if (!Array.isArray(parsed)) {
      throw new ValidationError("Response is not an array");
    }

    const validCandidates: DiscoveryResult[] = [];

    for (const item of parsed) {
      if (!this.isValidCandidateShape(item)) {
        continue;
      }

      if (this.hasForbiddenFields(item)) {
        throw new ValidationError(
          `Response contains forbidden fields (emails, issues, evidence, etc.)`
        );
      }

      const candidate = this.normalizeCandidate(item, queryUsed, searchResults);
      validCandidates.push(candidate);
    }

    return validCandidates;
  }

  private extractJsonArray(content: string): string {
    const trimmed = content.trim();

    if (trimmed.startsWith("[")) {
      const endIndex = trimmed.lastIndexOf("]");
      if (endIndex !== -1) {
        return trimmed.slice(0, endIndex + 1);
      }
    }

    const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return trimmed;
  }

  private isValidCandidateShape(item: unknown): item is RawCandidate {
    if (typeof item !== "object" || item === null) {
      return false;
    }

    const obj = item as Record<string, unknown>;

    if (typeof obj.company_name !== "string" || !obj.company_name.trim()) {
      return false;
    }

    return true;
  }

  private hasForbiddenFields(item: Record<string, unknown>): boolean {
    const keys = Object.keys(item).map((k) => k.toLowerCase());

    for (const forbidden of FORBIDDEN_FIELDS) {
      if (keys.some((k) => k.includes(forbidden))) {
        return true;
      }
    }

    const stringValues = Object.values(item)
      .filter((v) => typeof v === "string")
      .map((v) => (v as string).toLowerCase());

    for (const value of stringValues) {
      if (
        value.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/) ||
        value.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)
      ) {
        return true;
      }
    }

    return false;
  }

  private normalizeCandidate(
    item: RawCandidate,
    queryUsed: string,
    searchResults: SearchResult[]
  ): DiscoveryResult {
    const domainCandidates = this.normalizeStringArray(item.domain_candidates);
    const profileUrls = this.normalizeStringArray(item.profile_urls);

    let searchProvenance: SearchProvenance[] = [];

    if (Array.isArray(item.search_provenance)) {
      searchProvenance = item.search_provenance
        .filter((p): p is SearchProvenance => {
          if (typeof p !== "object" || p === null) return false;
          const prov = p as Record<string, unknown>;
          return (
            typeof prov.queryUsed === "string" &&
            typeof prov.resultUrl === "string" &&
            typeof prov.snippet === "string"
          );
        })
        .slice(0, 3);
    }

    if (searchProvenance.length === 0 && searchResults.length > 0) {
      searchProvenance = searchResults.slice(0, 3).map((r) => ({
        queryUsed,
        resultUrl: r.url,
        snippet: r.snippet,
      }));
    }

    const confidence =
      typeof item.discovery_confidence === "number"
        ? Math.max(0, Math.min(100, Math.round(item.discovery_confidence)))
        : 50;

    return {
      company_name: item.company_name.trim(),
      domain_candidates: domainCandidates,
      profile_urls: profileUrls,
      search_provenance: searchProvenance,
      discovery_confidence: confidence,
      discovered_by: "gpt_search",
    };
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim());
  }

  private getCandidateKey(candidate: DiscoveryResult): string {
    const namePart = candidate.company_name.toLowerCase().trim();
    const domainPart =
      candidate.domain_candidates.length > 0
        ? candidate.domain_candidates[0].toLowerCase()
        : "";

    return `${namePart}::${domainPart}`;
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

interface RawCandidate {
  company_name: string;
  domain_candidates?: unknown;
  profile_urls?: unknown;
  search_provenance?: unknown[];
  discovery_confidence?: unknown;
  [key: string]: unknown;
}

export async function discoverCandidates(
  input: DiscoveryInput
): Promise<DiscoveryResult[]> {
  const service = new DiscoveryService();
  return service.discoverCandidates(input);
}
