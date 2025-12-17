/**
 * Fetch Service Tests
 *
 * Tests that the fetch service:
 * 1. Stores snapshots correctly
 * 2. Respects robots.txt disallow rules
 * 3. Handles DNS verification
 * 4. Extracts plain text from HTML
 * 5. Sorts resources by priority
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FetchService } from "../services/fetchService";
import type { DiscoveryResult } from "../src/types/pipeline";

vi.mock("../db", () => ({
  prisma: {
    snapshot: {
      create: vi.fn().mockImplementation(({ data }) => ({
        id: "snapshot-123",
        ...data,
      })),
    },
    verifiedResource: {
      create: vi.fn().mockImplementation(({ data }) => ({
        id: "resource-123",
        ...data,
      })),
    },
  },
}));

function createMockFetch(
  responses: Record<string, { status: number; body: string; headers?: Record<string, string> }>
) {
  return vi.fn().mockImplementation(async (url: string | URL | Request, _options?: RequestInit) => {
    const urlStr = String(url);

    for (const [pattern, response] of Object.entries(responses)) {
      if (urlStr.includes(pattern)) {
        const headers = new Map(Object.entries(response.headers ?? {}));
        headers.set("content-type", "text/html");

        return {
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          url: urlStr,
          headers: {
            get: (key: string) => headers.get(key.toLowerCase()) ?? null,
            entries: () => headers.entries(),
          },
          text: async () => response.body,
        };
      }
    }

    return {
      ok: false,
      status: 404,
      url: urlStr,
      headers: {
        get: () => null,
        entries: () => new Map().entries(),
      },
      text: async () => "",
    };
  });
}

function createMockDnsLookup(validDomains: string[]) {
  return vi.fn().mockImplementation(async (domain: string) => {
    if (validDomains.includes(domain)) {
      return [{ type: "A", value: "93.184.216.34" }];
    }
    return [];
  });
}

const mockCandidate: DiscoveryResult = {
  company_name: "Test Company",
  domain_candidates: ["testcompany.com"],
  profile_urls: ["https://linkedin.com/company/testcompany"],
  search_provenance: [
    {
      queryUsed: "test company",
      resultUrl: "https://example.com",
      snippet: "Test Company is...",
    },
  ],
  discovery_confidence: 80,
  discovered_by: "gpt_search",
};

describe("FetchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyAndFetch", () => {
    it("stores snapshots for fetched pages", async () => {
      const mockFetch = createMockFetch({
        "testcompany.com/": {
          status: 200,
          body: "<html><body><h1>Welcome to Test Company</h1></body></html>",
        },
        "testcompany.com/about": {
          status: 200,
          body: "<html><body><h1>About Us</h1></body></html>",
        },
        "testcompany.com/contact": { status: 404, body: "" },
        "testcompany.com/services": { status: 404, body: "" },
        "testcompany.com/order": { status: 404, body: "" },
        "testcompany.com/book": { status: 404, body: "" },
        "robots.txt": { status: 404, body: "" },
      });

      const mockDns = createMockDnsLookup(["testcompany.com"]);

      const service = new FetchService({
        fetchFn: mockFetch as unknown as typeof fetch,
        dnsLookup: mockDns,
        maxConcurrentFetches: 5,
      });

      const result = await service.verifyAndFetch(mockCandidate);

      expect(result.candidateId).toContain("test-company");
      expect(result.verifiedResources.length).toBeGreaterThan(0);

      const homepageResource = result.verifiedResources.find(
        (r) => r.source_type === "homepage"
      );
      expect(homepageResource).toBeDefined();
      expect(homepageResource?.http_status).toBe(200);
      expect(homepageResource?.body_text).toContain("Welcome to Test Company");
      expect(homepageResource?.raw_html_snapshot_path).toContain("snapshots/");
    });

    it("skips paths disallowed by robots.txt", async () => {
      const robotsTxt = `
User-agent: *
Disallow: /about
Disallow: /services
Allow: /
`;

      const mockFetch = createMockFetch({
        "robots.txt": { status: 200, body: robotsTxt },
        "testcompany.com/": {
          status: 200,
          body: "<html><body>Homepage</body></html>",
        },
        "testcompany.com/about": {
          status: 200,
          body: "<html><body>About</body></html>",
        },
        "testcompany.com/contact": { status: 404, body: "" },
        "testcompany.com/services": {
          status: 200,
          body: "<html><body>Services</body></html>",
        },
        "testcompany.com/order": { status: 404, body: "" },
        "testcompany.com/book": { status: 404, body: "" },
      });

      const mockDns = createMockDnsLookup(["testcompany.com"]);

      const service = new FetchService({
        fetchFn: mockFetch as unknown as typeof fetch,
        dnsLookup: mockDns,
        maxConcurrentFetches: 5,
      });

      const result = await service.verifyAndFetch(mockCandidate);

      const aboutResource = result.verifiedResources.find(
        (r) => r.source_type === "about"
      );
      expect(aboutResource?.skip_reason).toBe("disallowed_by_robots");

      const servicesResource = result.verifiedResources.find(
        (r) => r.source_type === "services"
      );
      expect(servicesResource?.skip_reason).toBe("disallowed_by_robots");

      const homepageResource = result.verifiedResources.find(
        (r) => r.source_type === "homepage"
      );
      expect(homepageResource?.skip_reason).toBeUndefined();
    });

    it("falls back to profile URLs when no valid domain", async () => {
      const candidateNoDomain: DiscoveryResult = {
        company_name: "Profile Only Company",
        domain_candidates: [],
        profile_urls: [
          "https://linkedin.com/company/profileonly",
          "https://facebook.com/profileonly",
        ],
        search_provenance: [],
        discovery_confidence: 60,
        discovered_by: "gpt_search",
      };

      const mockFetch = createMockFetch({
        "linkedin.com/company/profileonly": {
          status: 200,
          body: "<html><body>LinkedIn Profile</body></html>",
        },
        "facebook.com/profileonly": {
          status: 200,
          body: "<html><body>Facebook Page</body></html>",
        },
      });

      const mockDns = createMockDnsLookup([]);

      const service = new FetchService({
        fetchFn: mockFetch as unknown as typeof fetch,
        dnsLookup: mockDns,
        maxConcurrentFetches: 5,
      });

      const result = await service.verifyAndFetch(candidateNoDomain);

      expect(result.verifiedResources.length).toBe(2);

      const linkedinResource = result.verifiedResources.find(
        (r) => r.source_type === "linkedin"
      );
      expect(linkedinResource).toBeDefined();
      expect(linkedinResource?.body_text).toContain("LinkedIn Profile");

      const facebookResource = result.verifiedResources.find(
        (r) => r.source_type === "facebook"
      );
      expect(facebookResource).toBeDefined();
    });

    it("handles DNS verification failure", async () => {
      const candidateInvalidDomain: DiscoveryResult = {
        company_name: "Invalid Domain Company",
        domain_candidates: ["invalid-domain-xyz.com"],
        profile_urls: [],
        search_provenance: [],
        discovery_confidence: 50,
        discovered_by: "gpt_search",
      };

      const mockFetch = createMockFetch({});
      const mockDns = createMockDnsLookup([]);

      const service = new FetchService({
        fetchFn: mockFetch as unknown as typeof fetch,
        dnsLookup: mockDns,
        maxConcurrentFetches: 5,
      });

      const result = await service.verifyAndFetch(candidateInvalidDomain);

      expect(result.failedReasons).toBeDefined();
      expect(result.failedReasons?.some((r) => r.includes("No valid DNS"))).toBe(
        true
      );
    });

    it("extracts plain text from HTML correctly", async () => {
      const htmlWithScripts = `
        <html>
          <head>
            <script>console.log("should be removed")</script>
            <style>.hidden { display: none; }</style>
          </head>
          <body>
            <h1>Main Title</h1>
            <p>This is the content.</p>
            <script>alert("also removed")</script>
            <!-- This comment should be removed -->
            <div>More text here.</div>
          </body>
        </html>
      `;

      const mockFetch = createMockFetch({
        "testcompany.com/": { status: 200, body: htmlWithScripts },
        "testcompany.com/about": { status: 404, body: "" },
        "testcompany.com/contact": { status: 404, body: "" },
        "testcompany.com/services": { status: 404, body: "" },
        "testcompany.com/order": { status: 404, body: "" },
        "testcompany.com/book": { status: 404, body: "" },
        "robots.txt": { status: 404, body: "" },
      });

      const mockDns = createMockDnsLookup(["testcompany.com"]);

      const service = new FetchService({
        fetchFn: mockFetch as unknown as typeof fetch,
        dnsLookup: mockDns,
        maxConcurrentFetches: 5,
      });

      const result = await service.verifyAndFetch(mockCandidate);

      const homepage = result.verifiedResources.find(
        (r) => r.source_type === "homepage"
      );
      expect(homepage?.body_text).toContain("Main Title");
      expect(homepage?.body_text).toContain("This is the content");
      expect(homepage?.body_text).not.toContain("console.log");
      expect(homepage?.body_text).not.toContain("display: none");
      expect(homepage?.body_text).not.toContain("This comment");
    });

    it("sorts resources by priority (homepage first)", async () => {
      const mockFetch = createMockFetch({
        "testcompany.com/": { status: 200, body: "<html>Homepage</html>" },
        "testcompany.com/about": { status: 200, body: "<html>About</html>" },
        "testcompany.com/contact": { status: 200, body: "<html>Contact</html>" },
        "testcompany.com/services": { status: 200, body: "<html>Services</html>" },
        "testcompany.com/order": { status: 404, body: "" },
        "testcompany.com/book": { status: 404, body: "" },
        "robots.txt": { status: 404, body: "" },
      });

      const mockDns = createMockDnsLookup(["testcompany.com"]);

      const service = new FetchService({
        fetchFn: mockFetch as unknown as typeof fetch,
        dnsLookup: mockDns,
        maxConcurrentFetches: 5,
      });

      const result = await service.verifyAndFetch(mockCandidate);

      const types = result.verifiedResources.map((r) => r.source_type);

      expect(types[0]).toBe("homepage");

      const aboutIndex = types.indexOf("about");
      const contactIndex = types.indexOf("contact");
      const servicesIndex = types.indexOf("services");

      if (aboutIndex !== -1 && contactIndex !== -1) {
        expect(aboutIndex).toBeLessThan(contactIndex);
      }
      if (contactIndex !== -1 && servicesIndex !== -1) {
        expect(contactIndex).toBeLessThan(servicesIndex);
      }
    });

    it("truncates body text at 20000 characters", async () => {
      const longContent = "A".repeat(25000);
      const longHtml = `<html><body>${longContent}</body></html>`;

      const mockFetch = createMockFetch({
        "testcompany.com/": { status: 200, body: longHtml },
        "testcompany.com/about": { status: 404, body: "" },
        "testcompany.com/contact": { status: 404, body: "" },
        "testcompany.com/services": { status: 404, body: "" },
        "testcompany.com/order": { status: 404, body: "" },
        "testcompany.com/book": { status: 404, body: "" },
        "robots.txt": { status: 404, body: "" },
      });

      const mockDns = createMockDnsLookup(["testcompany.com"]);

      const service = new FetchService({
        fetchFn: mockFetch as unknown as typeof fetch,
        dnsLookup: mockDns,
        maxConcurrentFetches: 5,
      });

      const result = await service.verifyAndFetch(mockCandidate);

      const homepage = result.verifiedResources.find(
        (r) => r.source_type === "homepage"
      );
      expect(homepage?.body_text.length).toBeLessThanOrEqual(20000);
    });

    it("identifies source types from profile URLs correctly", async () => {
      const candidateWithProfiles: DiscoveryResult = {
        company_name: "Multi Profile Company",
        domain_candidates: [],
        profile_urls: [
          "https://www.instagram.com/multiprofile",
          "https://www.facebook.com/multiprofile",
          "https://www.linkedin.com/company/multiprofile",
          "https://maps.google.com/place/multiprofile",
          "https://www.yelp.com/biz/multiprofile",
        ],
        search_provenance: [],
        discovery_confidence: 70,
        discovered_by: "gpt_search",
      };

      const mockFetch = createMockFetch({
        "instagram.com": { status: 200, body: "<html>Instagram</html>" },
        "facebook.com": { status: 200, body: "<html>Facebook</html>" },
        "linkedin.com": { status: 200, body: "<html>LinkedIn</html>" },
        "maps.google.com": { status: 200, body: "<html>Maps</html>" },
        "yelp.com": { status: 200, body: "<html>Yelp</html>" },
      });

      const mockDns = createMockDnsLookup([]);

      const service = new FetchService({
        fetchFn: mockFetch as unknown as typeof fetch,
        dnsLookup: mockDns,
        maxConcurrentFetches: 5,
      });

      const result = await service.verifyAndFetch(candidateWithProfiles);

      const types = result.verifiedResources.map((r) => r.source_type);
      expect(types).toContain("instagram");
      expect(types).toContain("facebook");
      expect(types).toContain("linkedin");
      expect(types).toContain("maps");
      expect(types).toContain("review");
    });
  });
});
