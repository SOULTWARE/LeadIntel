/**
 * Discovery Service Tests
 *
 * Tests that the discovery service:
 * 1. Returns correct DiscoveryResult structure
 * 2. Retries when extraneous fields exist
 * 3. Deduplicates candidates
 * 4. Rejects forbidden fields (emails, issues, etc.)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiscoveryService } from "../services/discoveryService";
import type { ISearchAdapter, SearchResult } from "../lib/searchAdapter";
import type { DiscoveryResult } from "../src/types/pipeline";

function createMockSearchAdapter(
  responses: Array<{ content: string; searchResults: SearchResult[] }>
): ISearchAdapter {
  let callIndex = 0;

  return {
    search: vi.fn().mockResolvedValue({
      query: "test",
      results: [],
      provider: "openai",
    }),
    searchWithGPT: vi.fn().mockImplementation(async () => {
      const response = responses[Math.min(callIndex, responses.length - 1)];
      callIndex++;
      return response;
    }),
  };
}

describe("DiscoveryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("discoverCandidates", () => {
    it("returns correct DiscoveryResult structure", async () => {
      const validResponse = JSON.stringify([
        {
          company_name: "Acme Corp",
          domain_candidates: ["acme.com", "acmecorp.com"],
          profile_urls: [
            "https://linkedin.com/company/acme",
            "https://maps.google.com/acme",
          ],
          search_provenance: [
            {
              queryUsed: "software companies in NYC",
              resultUrl: "https://example.com/acme",
              snippet: "Acme Corp is a software company",
            },
          ],
          discovery_confidence: 85,
        },
      ]);

      const mockAdapter = createMockSearchAdapter([
        {
          content: validResponse,
          searchResults: [
            {
              url: "https://example.com/acme",
              title: "Acme Corp",
              snippet: "Acme Corp is a software company",
            },
          ],
        },
      ]);

      const service = new DiscoveryService({
        searchAdapter: mockAdapter,
        maxQueriesPerRound: 1,
      });

      const results = await service.discoverCandidates({
        industry: "software",
        location: "NYC",
        count: 1,
        leadPurpose: "B2B sales",
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        company_name: "Acme Corp",
        domain_candidates: ["acme.com", "acmecorp.com"],
        profile_urls: expect.arrayContaining([
          "https://linkedin.com/company/acme",
        ]),
        discovery_confidence: 85,
        discovered_by: "gpt_search",
      });
      expect(results[0].search_provenance).toHaveLength(1);
      expect(results[0].search_provenance[0].queryUsed).toBe(
        "software companies in NYC"
      );
    });

    it("retries when response contains extraneous fields", async () => {
      const invalidResponse = JSON.stringify([
        {
          company_name: "Bad Corp",
          domain_candidates: ["bad.com"],
          profile_urls: [],
          email: "contact@bad.com",
          issues: ["They have poor service"],
          discovery_confidence: 70,
        },
      ]);

      const validResponse = JSON.stringify([
        {
          company_name: "Good Corp",
          domain_candidates: ["good.com"],
          profile_urls: ["https://linkedin.com/company/good"],
          search_provenance: [],
          discovery_confidence: 80,
        },
      ]);

      const mockAdapter = createMockSearchAdapter([
        { content: invalidResponse, searchResults: [] },
        { content: validResponse, searchResults: [] },
      ]);

      const service = new DiscoveryService({
        searchAdapter: mockAdapter,
        maxQueriesPerRound: 1,
        maxParseRetries: 2,
      });

      const results = await service.discoverCandidates({
        industry: "consulting",
        location: "LA",
        count: 1,
        leadPurpose: "partnerships",
      });

      expect(mockAdapter.searchWithGPT).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(1);
      expect(results[0].company_name).toBe("Good Corp");
      expect(results[0].discovered_by).toBe("gpt_search");
    });

    it("deduplicates candidates by company_name + domain_candidate", async () => {
      const responseWithDuplicates = JSON.stringify([
        {
          company_name: "Dupe Corp",
          domain_candidates: ["dupe.com"],
          profile_urls: [],
          discovery_confidence: 75,
        },
        {
          company_name: "Dupe Corp",
          domain_candidates: ["dupe.com"],
          profile_urls: ["https://different-url.com"],
          discovery_confidence: 80,
        },
        {
          company_name: "Unique Corp",
          domain_candidates: ["unique.com"],
          profile_urls: [],
          discovery_confidence: 70,
        },
      ]);

      const mockAdapter = createMockSearchAdapter([
        { content: responseWithDuplicates, searchResults: [] },
      ]);

      const service = new DiscoveryService({
        searchAdapter: mockAdapter,
        maxQueriesPerRound: 1,
      });

      const results = await service.discoverCandidates({
        industry: "retail",
        location: "Chicago",
        count: 10,
        leadPurpose: "sales",
      });

      const dupeCount = results.filter(
        (r) => r.company_name === "Dupe Corp"
      ).length;
      expect(dupeCount).toBe(1);
    });

    it("rejects responses with email addresses", async () => {
      const responseWithEmail = JSON.stringify([
        {
          company_name: "Email Corp",
          domain_candidates: ["email.com"],
          profile_urls: [],
          contact_email: "info@email.com",
          discovery_confidence: 90,
        },
      ]);

      const validResponse = JSON.stringify([
        {
          company_name: "Clean Corp",
          domain_candidates: ["clean.com"],
          profile_urls: [],
          discovery_confidence: 85,
        },
      ]);

      const mockAdapter = createMockSearchAdapter([
        { content: responseWithEmail, searchResults: [] },
        { content: validResponse, searchResults: [] },
      ]);

      const service = new DiscoveryService({
        searchAdapter: mockAdapter,
        maxQueriesPerRound: 1,
        maxParseRetries: 2,
      });

      const results = await service.discoverCandidates({
        industry: "tech",
        location: "SF",
        count: 1,
        leadPurpose: "outreach",
      });

      expect(results[0].company_name).toBe("Clean Corp");
    });

    it("rejects responses with phone numbers", async () => {
      const responseWithPhone = JSON.stringify([
        {
          company_name: "Phone Corp",
          domain_candidates: ["phone.com"],
          profile_urls: [],
          phone: "555-123-4567",
          discovery_confidence: 90,
        },
      ]);

      const validResponse = JSON.stringify([
        {
          company_name: "No Phone Corp",
          domain_candidates: ["nophone.com"],
          profile_urls: [],
          discovery_confidence: 85,
        },
      ]);

      const mockAdapter = createMockSearchAdapter([
        { content: responseWithPhone, searchResults: [] },
        { content: validResponse, searchResults: [] },
      ]);

      const service = new DiscoveryService({
        searchAdapter: mockAdapter,
        maxQueriesPerRound: 1,
        maxParseRetries: 2,
      });

      const results = await service.discoverCandidates({
        industry: "finance",
        location: "Boston",
        count: 1,
        leadPurpose: "leads",
      });

      expect(results[0].company_name).toBe("No Phone Corp");
    });

    it("handles empty domain_candidates gracefully", async () => {
      const responseNoDomain = JSON.stringify([
        {
          company_name: "No Domain Corp",
          domain_candidates: [],
          profile_urls: ["https://linkedin.com/company/nodomain"],
          discovery_confidence: 60,
        },
      ]);

      const mockAdapter = createMockSearchAdapter([
        { content: responseNoDomain, searchResults: [] },
      ]);

      const service = new DiscoveryService({
        searchAdapter: mockAdapter,
        maxQueriesPerRound: 1,
      });

      const results = await service.discoverCandidates({
        industry: "healthcare",
        location: "Denver",
        count: 1,
        leadPurpose: "partnerships",
      });

      expect(results).toHaveLength(1);
      expect(results[0].domain_candidates).toEqual([]);
      expect(results[0].profile_urls).toContain(
        "https://linkedin.com/company/nodomain"
      );
    });

    it("clamps discovery_confidence to 0-100 range", async () => {
      const responseInvalidConfidence = JSON.stringify([
        {
          company_name: "Over Confident Corp",
          domain_candidates: ["over.com"],
          profile_urls: [],
          discovery_confidence: 150,
        },
        {
          company_name: "Under Confident Corp",
          domain_candidates: ["under.com"],
          profile_urls: [],
          discovery_confidence: -20,
        },
      ]);

      const mockAdapter = createMockSearchAdapter([
        { content: responseInvalidConfidence, searchResults: [] },
      ]);

      const service = new DiscoveryService({
        searchAdapter: mockAdapter,
        maxQueriesPerRound: 1,
      });

      const results = await service.discoverCandidates({
        industry: "education",
        location: "Seattle",
        count: 2,
        leadPurpose: "sales",
      });

      expect(results[0].discovery_confidence).toBe(100);
      expect(results[1].discovery_confidence).toBe(0);
    });

    it("extracts JSON from markdown code blocks", async () => {
      const markdownResponse = `Here are the companies I found:

\`\`\`json
[
  {
    "company_name": "Markdown Corp",
    "domain_candidates": ["markdown.com"],
    "profile_urls": [],
    "discovery_confidence": 75
  }
]
\`\`\`

Let me know if you need more!`;

      const mockAdapter = createMockSearchAdapter([
        { content: markdownResponse, searchResults: [] },
      ]);

      const service = new DiscoveryService({
        searchAdapter: mockAdapter,
        maxQueriesPerRound: 1,
      });

      const results = await service.discoverCandidates({
        industry: "marketing",
        location: "Austin",
        count: 1,
        leadPurpose: "clients",
      });

      expect(results).toHaveLength(1);
      expect(results[0].company_name).toBe("Markdown Corp");
    });

    it("uses search results for provenance when not provided by model", async () => {
      const responseNoProvenance = JSON.stringify([
        {
          company_name: "Provenance Corp",
          domain_candidates: ["prov.com"],
          profile_urls: [],
          discovery_confidence: 80,
        },
      ]);

      const searchResults: SearchResult[] = [
        {
          url: "https://search-result.com/prov",
          title: "Provenance Corp - Official",
          snippet: "Found via search engine",
        },
      ];

      const mockAdapter = createMockSearchAdapter([
        { content: responseNoProvenance, searchResults },
      ]);

      const service = new DiscoveryService({
        searchAdapter: mockAdapter,
        maxQueriesPerRound: 1,
      });

      const results = await service.discoverCandidates({
        industry: "legal",
        location: "DC",
        count: 1,
        leadPurpose: "referrals",
      });

      expect(results[0].search_provenance).toHaveLength(1);
      expect(results[0].search_provenance[0].resultUrl).toBe(
        "https://search-result.com/prov"
      );
    });
  });
});
