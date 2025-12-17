/**
 * Fetch Service for Lead Intel
 *
 * ⚠️ IMMUTABLE RULE: NO AI-CLAIMS WITHOUT SNAPSHOT
 * See: src/docs/architecture.md
 *
 * This service verifies and fetches candidate resources.
 * All fetched content is stored as snapshots for verification.
 */

import { promises as dns } from "dns";
import { prisma } from "../db";
import type {
  DiscoveryResult,
  VerifiedResource,
  VerifyAndFetchResult,
  SourceType,
} from "../src/types/pipeline";

const MAX_BODY_TEXT_LENGTH = 20000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

const PAGE_PATHS = [
  "/",
  "/about",
  "/about-us",
  "/aboutus",
  "/contact",
  "/contact-us",
  "/team",
  "/our-team",
  "/leadership",
  "/management",
  "/staff",
  "/people",
  "/services",
  "/locations",
  "/careers",
  "/jobs",
];

const SOURCE_TYPE_PRIORITY: SourceType[] = [
  "homepage",
  "about",
  "team",
  "leadership",
  "contact",
  "services",
  "careers",
  "locations",
  "linkedin",
  "facebook",
  "instagram",
  "maps",
  "review",
  "directory",
];

export interface FetchServiceConfig {
  maxConcurrentFetches?: number;
  userAgent?: string;
  fetchFn?: typeof fetch;
  dnsLookup?: typeof dnsLookupWrapper;
}

interface RobotsRules {
  disallowedPaths: string[];
  allowedPaths: string[];
}

interface FetchResult {
  url: string;
  status: number;
  contentType: string;
  html: string;
  headers: Record<string, string>;
}

export class FetchService {
  private maxConcurrentFetches: number;
  private userAgent: string;
  private fetchFn: typeof fetch;
  private dnsLookup: typeof dnsLookupWrapper;
  private robotsCache: Map<string, RobotsRules> = new Map();

  constructor(config: FetchServiceConfig = {}) {
    this.maxConcurrentFetches =
      config.maxConcurrentFetches ??
      parseInt(process.env.MAX_CONCURRENT_FETCHES ?? "10", 10);
    this.userAgent =
      config.userAgent ??
      process.env.FETCH_USER_AGENT ??
      "LeadIntel/1.0 (+https://leadintel.io/bot)";
    this.fetchFn = config.fetchFn ?? fetch;
    this.dnsLookup = config.dnsLookup ?? dnsLookupWrapper;
  }

  async verifyAndFetch(
    candidate: DiscoveryResult,
    existingCandidateId?: string
  ): Promise<VerifyAndFetchResult> {
    const candidateId = existingCandidateId ?? this.generateCandidateId(candidate);
    const verifiedResources: VerifiedResource[] = [];
    const failedReasons: string[] = [];

    let validDomain: string | null = null;
    for (const domain of candidate.domain_candidates) {
      const isValid = await this.verifyDomain(domain);
      if (isValid) {
        validDomain = domain;
        break;
      }
    }

    if (validDomain) {
      const domainResources = await this.fetchDomainPages(
        validDomain,
        candidateId,
        candidate.company_name,
        failedReasons
      );
      verifiedResources.push(...domainResources);
    } else if (candidate.domain_candidates.length > 0) {
      failedReasons.push(
        `No valid DNS records for domains: ${candidate.domain_candidates.join(", ")}`
      );
    }

    if (verifiedResources.length === 0 || !validDomain) {
      const profileResources = await this.fetchProfileUrls(
        candidate.profile_urls,
        candidateId,
        candidate.company_name,
        failedReasons
      );
      verifiedResources.push(...profileResources);
    }

    const sortedResources = this.sortByPriority(verifiedResources);

    return {
      candidateId,
      verifiedResources: sortedResources,
      failedReasons: failedReasons.length > 0 ? failedReasons : undefined,
    };
  }

  private generateCandidateId(candidate: DiscoveryResult): string {
    const namePart = candidate.company_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 50);
    const timestamp = Date.now().toString(36);
    return `${namePart}-${timestamp}`;
  }

  private async verifyDomain(domain: string): Promise<boolean> {
    try {
      const records = await this.dnsLookup(domain);
      return records.length > 0;
    } catch {
      return false;
    }
  }

  private async fetchDomainPages(
    domain: string,
    candidateId: string,
    candidateName: string,
    failedReasons: string[]
  ): Promise<VerifiedResource[]> {
    const baseUrl = `https://${domain}`;
    const resources: VerifiedResource[] = [];

    const robotsRules = await this.fetchRobotsTxt(baseUrl);

    const fetchTasks = PAGE_PATHS.map((path) => ({
      path,
      url: `${baseUrl}${path}`,
      sourceType: this.pathToSourceType(path),
    }));

    const results = await this.executeWithConcurrency(
      fetchTasks,
      async (task) => {
        if (this.isDisallowedByRobots(task.path, robotsRules)) {
          return {
            task,
            result: null,
            skipReason: "disallowed_by_robots",
          };
        }

        try {
          const result = await this.fetchWithRetry(task.url);
          return { task, result, skipReason: null };
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Unknown fetch error";
          failedReasons.push(`Failed to fetch ${task.url}: ${msg}`);
          return { task, result: null, skipReason: `fetch_error: ${msg}` };
        }
      }
    );

    for (const { task, result, skipReason } of results) {
      if (skipReason === "disallowed_by_robots") {
        resources.push(
          this.createSkippedResource(
            candidateId,
            task.url,
            task.sourceType,
            "disallowed_by_robots"
          )
        );
        continue;
      }

      if (!result) continue;

      if (result.status === 404) continue;

      const resource = await this.createVerifiedResource(
        candidateId,
        candidateName,
        task.url,
        task.sourceType,
        result
      );
      resources.push(resource);
    }

    return resources;
  }

  private async fetchProfileUrls(
    profileUrls: string[],
    candidateId: string,
    candidateName: string,
    failedReasons: string[]
  ): Promise<VerifiedResource[]> {
    const resources: VerifiedResource[] = [];

    const fetchTasks = profileUrls.map((url) => ({
      url,
      sourceType: this.urlToSourceType(url),
    }));

    const results = await this.executeWithConcurrency(
      fetchTasks,
      async (task) => {
        try {
          const result = await this.fetchWithRetry(task.url);
          return { task, result, error: null };
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Unknown fetch error";
          failedReasons.push(`Failed to fetch ${task.url}: ${msg}`);
          return { task, result: null, error: msg };
        }
      }
    );

    for (const { task, result } of results) {
      if (!result) continue;

      const resource = await this.createVerifiedResource(
        candidateId,
        candidateName,
        task.url,
        task.sourceType,
        result
      );
      resources.push(resource);
    }

    return resources;
  }

  private async fetchRobotsTxt(baseUrl: string): Promise<RobotsRules> {
    const cacheKey = baseUrl;
    if (this.robotsCache.has(cacheKey)) {
      return this.robotsCache.get(cacheKey)!;
    }

    const rules: RobotsRules = {
      disallowedPaths: [],
      allowedPaths: [],
    };

    try {
      const response = await this.fetchFn(`${baseUrl}/robots.txt`, {
        headers: { "User-Agent": this.userAgent },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const text = await response.text();
        const parsed = this.parseRobotsTxt(text);
        rules.disallowedPaths = parsed.disallowedPaths;
        rules.allowedPaths = parsed.allowedPaths;
      }
    } catch {
      // robots.txt not available, allow all
    }

    this.robotsCache.set(cacheKey, rules);
    return rules;
  }

  private parseRobotsTxt(content: string): RobotsRules {
    const rules: RobotsRules = {
      disallowedPaths: [],
      allowedPaths: [],
    };

    const lines = content.split("\n");
    let inOurSection = false;
    let inWildcardSection = false;

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.startsWith("user-agent:")) {
        const agent = trimmed.slice("user-agent:".length).trim();
        inOurSection =
          agent === "*" ||
          agent.includes("leadintel") ||
          agent.includes("bot");
        inWildcardSection = agent === "*";
      } else if (inOurSection || inWildcardSection) {
        if (trimmed.startsWith("disallow:")) {
          const path = line
            .slice(line.toLowerCase().indexOf("disallow:") + 9)
            .trim();
          if (path) {
            rules.disallowedPaths.push(path);
          }
        } else if (trimmed.startsWith("allow:")) {
          const path = line
            .slice(line.toLowerCase().indexOf("allow:") + 6)
            .trim();
          if (path) {
            rules.allowedPaths.push(path);
          }
        }
      }
    }

    return rules;
  }

  private isDisallowedByRobots(path: string, rules: RobotsRules): boolean {
    for (const allowed of rules.allowedPaths) {
      if (this.pathMatches(path, allowed)) {
        return false;
      }
    }

    for (const disallowed of rules.disallowedPaths) {
      if (this.pathMatches(path, disallowed)) {
        return true;
      }
    }

    return false;
  }

  private pathMatches(path: string, pattern: string): boolean {
    if (pattern === "/") {
      return path === "/";
    }

    if (pattern.endsWith("*")) {
      return path.startsWith(pattern.slice(0, -1));
    }

    return path === pattern || path.startsWith(pattern + "/");
  }

  private async fetchWithRetry(url: string): Promise<FetchResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const headResponse = await this.fetchFn(url, {
          method: "HEAD",
          headers: { "User-Agent": this.userAgent },
          signal: AbortSignal.timeout(10000),
          redirect: "follow",
        });

        if (!this.isRetryableStatus(headResponse.status)) {
          if (headResponse.status === 404) {
            return {
              url,
              status: 404,
              contentType: "",
              html: "",
              headers: {},
            };
          }
        }

        const getResponse = await this.fetchFn(url, {
          method: "GET",
          headers: { "User-Agent": this.userAgent },
          signal: AbortSignal.timeout(30000),
          redirect: "follow",
        });

        const contentType = getResponse.headers.get("content-type") ?? "";
        const html = await getResponse.text();

        const headers: Record<string, string> = {};
        for (const [key, value] of getResponse.headers.entries()) {
          if (this.isSparseHeader(key)) {
            headers[key] = value;
          }
        }

        return {
          url: getResponse.url,
          status: getResponse.status,
          contentType,
          html,
          headers,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES) {
          await this.sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error(`Failed to fetch ${url}`);
  }

  private isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private isSparseHeader(key: string): boolean {
    const sparseHeaders = [
      "content-type",
      "content-length",
      "last-modified",
      "etag",
      "cache-control",
      "x-robots-tag",
    ];
    return sparseHeaders.includes(key.toLowerCase());
  }

  private async createVerifiedResource(
    candidateId: string,
    candidateName: string,
    url: string,
    sourceType: SourceType,
    fetchResult: FetchResult
  ): Promise<VerifiedResource> {
    const bodyText = this.extractPlainText(fetchResult.html);
    const truncatedBodyText = bodyText.slice(0, MAX_BODY_TEXT_LENGTH);

    // If sourceType is unknown, try to infer it from the actual fetched URL
    let finalSourceType = sourceType;
    if (sourceType === "unknown") {
      finalSourceType = this.inferSourceTypeFromUrl(fetchResult.url);
    }

    const snapshot = await prisma.snapshot.create({
      data: {
        url: fetchResult.url,
        httpStatus: fetchResult.status,
        contentType: fetchResult.contentType,
        html: fetchResult.html,
        textExtract: truncatedBodyText,
        sourceType: finalSourceType,
        headers: fetchResult.headers,
        candidateId,
        candidateName,
        fetchedAt: new Date(),
      },
    });

    const verifiedResource = await prisma.verifiedResource.create({
      data: {
        candidateRef: candidateId,
        sourceUrl: fetchResult.url,
        sourceType: finalSourceType,
        httpStatus: fetchResult.status,
        contentType: fetchResult.contentType,
        bodyText: truncatedBodyText,
        rawHtmlSnapshotPath: `snapshots/${snapshot.id}`,
        fetchedAt: new Date(),
        headers: fetchResult.headers,
        snapshotId: snapshot.id,
      },
    });

    return {
      id: verifiedResource.id,
      candidate_ref: candidateId,
      source_url: fetchResult.url,
      source_type: finalSourceType,
      http_status: fetchResult.status,
      content_type: fetchResult.contentType,
      body_text: truncatedBodyText,
      raw_html_snapshot_path: `snapshots/${snapshot.id}`,
      fetched_at: verifiedResource.fetchedAt,
      headers: fetchResult.headers,
      snapshot_id: snapshot.id,
    };
  }

  private createSkippedResource(
    candidateId: string,
    url: string,
    sourceType: SourceType,
    skipReason: string
  ): VerifiedResource {
    return {
      id: `skipped-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      candidate_ref: candidateId,
      source_url: url,
      source_type: sourceType,
      http_status: 0,
      content_type: "",
      body_text: "",
      raw_html_snapshot_path: "",
      fetched_at: new Date(),
      headers: {},
      skip_reason: skipReason,
    };
  }

  private extractPlainText(html: string): string {
    let text = html;

    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

    text = text.replace(/<!--[\s\S]*?-->/g, "");

    text = text.replace(/<[^>]+>/g, " ");

    text = text.replace(/&nbsp;/gi, " ");
    text = text.replace(/&amp;/gi, "&");
    text = text.replace(/&lt;/gi, "<");
    text = text.replace(/&gt;/gi, ">");
    text = text.replace(/&quot;/gi, '"');
    text = text.replace(/&#39;/gi, "'");
    text = text.replace(/&[a-z]+;/gi, " ");

    text = text.replace(/\s+/g, " ").trim();

    return text;
  }

  private pathToSourceType(path: string): SourceType {
    // Normalize path: remove trailing slash and convert to lowercase
    const normalizedPath = path.replace(/\/$/, '').toLowerCase() || '/';

    const mapping: Record<string, SourceType> = {
      "/": "homepage",
      "/about": "about",
      "/about-us": "about",
      "/aboutus": "about",
      "/contact": "contact",
      "/contact-us": "contact",
      "/services": "services",
      "/team": "team",
      "/our-team": "team",
      "/leadership": "leadership",
      "/management": "leadership",
      "/staff": "team",
      "/people": "team",
      "/locations": "locations",
      "/careers": "careers",
      "/jobs": "careers",
    };
    return mapping[normalizedPath] ?? "unknown";
  }

  private inferSourceTypeFromUrl(fullUrl: string): SourceType {
    try {
      const url = new URL(fullUrl);
      const path = url.pathname;

      // First try pathToSourceType
      const typeFromPath = this.pathToSourceType(path);
      if (typeFromPath !== "unknown") {
        return typeFromPath;
      }

      // Then try urlToSourceType for external profiles
      return this.urlToSourceType(fullUrl);
    } catch {
      return "unknown";
    }
  }

  private urlToSourceType(url: string): SourceType {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("instagram.com")) return "instagram";
    if (lowerUrl.includes("facebook.com")) return "facebook";
    if (lowerUrl.includes("linkedin.com")) return "linkedin";
    if (lowerUrl.includes("maps.google") || lowerUrl.includes("google.com/maps"))
      return "maps";
    if (
      lowerUrl.includes("yelp.com") ||
      lowerUrl.includes("trustpilot") ||
      lowerUrl.includes("reviews")
    )
      return "review";

    return "directory";
  }

  private sortByPriority(resources: VerifiedResource[]): VerifiedResource[] {
    return resources.sort((a, b) => {
      const priorityA = SOURCE_TYPE_PRIORITY.indexOf(a.source_type);
      const priorityB = SOURCE_TYPE_PRIORITY.indexOf(b.source_type);
      return priorityA - priorityB;
    });
  }

  private async executeWithConcurrency<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = fn(item).then((result) => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= this.maxConcurrentFetches) {
        await Promise.race(executing);
        const completed = executing.filter(
          (p) => (p as Promise<void> & { settled?: boolean }).settled
        );
        for (const c of completed) {
          const idx = executing.indexOf(c);
          if (idx !== -1) executing.splice(idx, 1);
        }
      }
    }

    await Promise.all(executing);
    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function dnsLookupWrapper(
  domain: string
): Promise<Array<{ type: string; value: string }>> {
  const results: Array<{ type: string; value: string }> = [];

  try {
    const aRecords = await dns.resolve4(domain);
    for (const record of aRecords) {
      results.push({ type: "A", value: record });
    }
  } catch {
    // No A records
  }

  try {
    const aaaaRecords = await dns.resolve6(domain);
    for (const record of aaaaRecords) {
      results.push({ type: "AAAA", value: record });
    }
  } catch {
    // No AAAA records
  }

  try {
    const cnameRecords = await dns.resolveCname(domain);
    for (const record of cnameRecords) {
      results.push({ type: "CNAME", value: record });
    }
  } catch {
    // No CNAME records
  }

  return results;
}

export async function verifyAndFetch(
  candidate: DiscoveryResult
): Promise<VerifyAndFetchResult> {
  const service = new FetchService();
  return service.verifyAndFetch(candidate);
}
