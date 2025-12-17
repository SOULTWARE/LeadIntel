/**
 * Pipeline Types for Lead Intel
 *
 * IMMUTABLE RULE: NO AI-CLAIMS WITHOUT SNAPSHOT
 * See: src/docs/architecture.md
 */

/**
 * Candidate discovered by AI search.
 * GPT may ONLY output these fields via search tools.
 */
export interface Candidate {
  name: string;
  domainCandidates: string[];
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    [key: string]: string | undefined;
  };
  directoryEntries?: {
    source: string;
    url: string;
  }[];
  discoveredAt: Date;
}

/**
 * Snapshot of a verified network fetch.
 * All user-facing claims MUST trace back to a snapshot.
 */
export interface Snapshot {
  id: string;
  url: string;
  fetchedAt: Date;
  httpStatus: number;
  contentType: string;
  contentHash: string;
  rawContent: string;
  headers?: Record<string, string>;
  dnsRecords?: {
    type: string;
    value: string;
  }[];
}

/**
 * Source types for verified resources.
 */
export type SourceType =
  | "homepage"
  | "about"
  | "contact"
  | "services"
  | "order"
  | "book"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "maps"
  | "review"
  | "directory";

/**
 * Resource verified via actual network fetch.
 * All user-facing claims MUST trace back to a verified resource.
 */
export interface VerifiedResource {
  id: string;
  candidate_ref: string;
  source_url: string;
  source_type: SourceType;
  http_status: number;
  content_type: string;
  body_text: string;
  raw_html_snapshot_path: string;
  fetched_at: Date;
  headers: Record<string, string>;
  snapshot_id?: string;
  skip_reason?: string;
}

/**
 * Result from verifyAndFetch function.
 */
export interface VerifyAndFetchResult {
  candidateId: string;
  verifiedResources: VerifiedResource[];
  failedReasons?: string[];
}

/**
 * DNS record from lookup.
 */
export interface DnsRecord {
  type: "A" | "AAAA" | "CNAME";
  value: string;
}

/**
 * Search provenance for audit trail.
 * Records the original search hit that led to discovery.
 */
export interface SearchProvenance {
  queryUsed: string;
  resultUrl: string;
  snippet: string;
}

/**
 * Result from AI discovery phase.
 * Contains ONLY candidate data, NO verified claims.
 * GPT MUST NOT output issues, emails, contact details, or evidence.
 */
export interface DiscoveryResult {
  company_name: string;
  domain_candidates: string[];
  profile_urls: string[];
  search_provenance: SearchProvenance[];
  discovery_confidence: number;
  discovered_by: "gpt_search";
}

/**
 * Input for discoverCandidates function.
 */
export interface DiscoveryInput {
  industry: string;
  location: string;
  count: number;
  leadPurpose: string;
}

/**
 * Legacy batch result format (for internal use).
 */
export interface DiscoveryBatchResult {
  query: string;
  searchProvider: "bing" | "serpapi" | "brave" | "openai";
  candidates: DiscoveryResult[];
  searchedAt: Date;
  rawSearchResponse?: unknown;
}

/**
 * Input for analysis phase.
 * Analysis operates ONLY on verified snapshots.
 */
export interface AnalysisInput {
  candidateId: string;
  snapshots: Snapshot[];
  verifiedResources: VerifiedResource[];
}
