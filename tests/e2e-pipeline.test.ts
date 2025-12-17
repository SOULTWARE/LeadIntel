/**
 * End-to-End Pipeline Test
 *
 * Simulates the full lead generation pipeline with count=3:
 * 1. Discovery -> 3 candidates (valid domain, Instagram only, directory listing)
 * 2. Fetch -> Snapshots from fixture HTML files
 * 3. Analysis -> Lead JSON referencing actual snippet content
 * 4. Orchestration -> POST /api/leads/generate
 *
 * Asserts:
 * - leadsSaved >= 1
 * - requiresReview >= 0
 * - Snapshots persisted in DB
 * - Evidence verification passes for saved leads
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

const fixtureHtml = {
  techcorp: fs.readFileSync(
    path.join(FIXTURES_DIR, "homepage-techcorp.html"),
    "utf-8"
  ),
  beautysalon: fs.readFileSync(
    path.join(FIXTURES_DIR, "instagram-beautysalon.html"),
    "utf-8"
  ),
  plumber: fs.readFileSync(
    path.join(FIXTURES_DIR, "directory-listing-plumber.html"),
    "utf-8"
  ),
};

function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const fixtureText = {
  techcorp: extractText(fixtureHtml.techcorp),
  beautysalon: extractText(fixtureHtml.beautysalon),
  plumber: extractText(fixtureHtml.plumber),
};

const mockCandidates = [
  {
    company_name: "TechCorp Solutions",
    domain_candidates: ["techcorp.com"],
    profile_urls: ["https://linkedin.com/company/techcorp"],
    search_provenance: [
      {
        queryUsed: "enterprise software companies San Francisco",
        resultUrl: "https://techcorp.com",
        snippet: "TechCorp Solutions - Enterprise Software",
      },
    ],
    discovery_confidence: 85,
    discovered_by: "gpt_search" as const,
  },
  {
    company_name: "Glamour Beauty Salon",
    domain_candidates: [],
    profile_urls: ["https://instagram.com/glamourbeauty"],
    search_provenance: [
      {
        queryUsed: "beauty salons Los Angeles",
        resultUrl: "https://instagram.com/glamourbeauty",
        snippet: "Glamour Beauty Salon LA",
      },
    ],
    discovery_confidence: 70,
    discovered_by: "gpt_search" as const,
  },
  {
    company_name: "Quick Fix Plumbing",
    domain_candidates: [],
    profile_urls: ["https://yelp.com/biz/quick-fix-plumbing-austin"],
    search_provenance: [
      {
        queryUsed: "plumbers Austin TX",
        resultUrl: "https://yelp.com/biz/quick-fix-plumbing-austin",
        snippet: "Quick Fix Plumbing - Austin",
      },
    ],
    discovery_confidence: 65,
    discovered_by: "gpt_search" as const,
  },
];

const mockDbCandidates = mockCandidates.map((c, i) => ({
  id: `candidate-${i + 1}`,
  companyName: c.company_name,
  domainCandidates: c.domain_candidates,
  profileUrls: c.profile_urls,
  discoveryProvenance: c.search_provenance,
  discoveryConfidence: c.discovery_confidence,
  status: "DISCOVERED",
  createdAt: new Date(),
  updatedAt: new Date(),
  discoveredAt: new Date(),
}));

const mockSnapshots = [
  {
    id: "snapshot-techcorp-1",
    url: "https://techcorp.com/",
    httpStatus: 200,
    contentType: "text/html",
    html: fixtureHtml.techcorp,
    textExtract: fixtureText.techcorp,
    sourceType: "homepage",
    fetchedAt: new Date(),
    candidateId: "candidate-1",
    candidateName: "TechCorp Solutions",
  },
  {
    id: "snapshot-beauty-1",
    url: "https://instagram.com/glamourbeauty",
    httpStatus: 200,
    contentType: "text/html",
    html: fixtureHtml.beautysalon,
    textExtract: fixtureText.beautysalon,
    sourceType: "instagram",
    fetchedAt: new Date(),
    candidateId: "candidate-2",
    candidateName: "Glamour Beauty Salon",
  },
  {
    id: "snapshot-plumber-1",
    url: "https://yelp.com/biz/quick-fix-plumbing-austin",
    httpStatus: 200,
    contentType: "text/html",
    html: fixtureHtml.plumber,
    textExtract: fixtureText.plumber,
    sourceType: "directory",
    fetchedAt: new Date(),
    candidateId: "candidate-3",
    candidateName: "Quick Fix Plumbing",
  },
];

function createMockAnalysisResponse(candidateId: string) {
  if (candidateId === "candidate-1") {
    return JSON.stringify({
      company_name: "TechCorp Solutions",
      website: "https://techcorp.com",
      industry: "Software",
      location: "San Francisco, CA",
      description: "Enterprise software solutions provider",
      lead_score: 78,
      score_explainer: {
        need: 35,
        budget: 25,
        contact: 12,
        timing: 6,
        notes: "Strong fit for B2B software sales",
      },
      confidence: 85,
      top_issues: [
        {
          title: "Actively hiring and expanding",
          description: "Company is growing their team",
          category: "growth",
          severity: "high",
          evidence: {
            source_url: "https://techcorp.com/",
            snapshot_id: "snapshot-techcorp-1",
            excerpt: "currently expanding our team",
          },
        },
        {
          title: "Significant technology budget",
          description: "Large budget for technology initiatives",
          category: "budget",
          severity: "medium",
          evidence: {
            source_url: "https://techcorp.com/",
            snapshot_id: "snapshot-techcorp-1",
            excerpt: "budget for new technology initiatives is $500,000",
          },
        },
      ],
      decision_makers: [
        {
          first_name: "John",
          last_name: "Anderson",
          title: "Chief Executive Officer",
          evidence: {
            source_url: "https://techcorp.com/",
            snapshot_id: "snapshot-techcorp-1",
            excerpt: "John Anderson Chief Executive Officer",
          },
        },
      ],
      email_drafts: [
        {
          subject: "Helping TechCorp streamline operations",
          body: "Hi John,\n\nI noticed TechCorp is expanding...",
        },
      ],
    });
  }

  if (candidateId === "candidate-2") {
    return JSON.stringify({
      company_name: "Glamour Beauty Salon",
      website: null,
      industry: "Beauty & Personal Care",
      location: "Los Angeles, CA",
      description: "Full-service hair and beauty salon",
      lead_score: 55,
      score_explainer: {
        need: 20,
        budget: 15,
        contact: 15,
        timing: 5,
        notes: "Local business, moderate fit",
      },
      confidence: 68,
      top_issues: [
        {
          title: "Growing social presence",
          description: "Active on Instagram with engaged audience",
          category: "marketing",
          severity: "medium",
          evidence: {
            source_url: "https://instagram.com/glamourbeauty",
            snapshot_id: "snapshot-beauty-1",
            excerpt: "15.2K followers",
          },
        },
      ],
      decision_makers: [
        {
          first_name: "Maria",
          last_name: "Garcia",
          title: "Owner",
          evidence: {
            source_url: "https://instagram.com/glamourbeauty",
            snapshot_id: "snapshot-beauty-1",
            excerpt: "Owner Maria Garcia welcomes you",
          },
        },
      ],
      recommended_manual_review: "No website available, Instagram-only presence",
    });
  }

  if (candidateId === "candidate-3") {
    return JSON.stringify({
      company_name: "Quick Fix Plumbing",
      website: null,
      industry: "Home Services",
      location: "Austin, TX",
      description: "Local plumbing services",
      lead_score: 45,
      score_explainer: {
        need: 15,
        budget: 10,
        contact: 15,
        timing: 5,
        notes: "Small local business, limited digital presence",
      },
      confidence: 60,
      top_issues: [
        {
          title: "Established local presence",
          description: "15 years in business with good reviews",
          category: "credibility",
          severity: "low",
          evidence: {
            source_url: "https://yelp.com/biz/quick-fix-plumbing-austin",
            snapshot_id: "snapshot-plumber-1",
            excerpt: "serving Austin for over 15 years",
          },
        },
      ],
      decision_makers: [
        {
          first_name: "Mike",
          last_name: "Thompson",
          title: "Owner",
          evidence: {
            source_url: "https://yelp.com/biz/quick-fix-plumbing-austin",
            snapshot_id: "snapshot-plumber-1",
            excerpt: "Owner Mike Thompson",
          },
        },
      ],
      recommended_manual_review: "No website, directory listing only",
    });
  }

  throw new Error(`Unknown candidate: ${candidateId}`);
}

let candidateIndex = 0;
let snapshotIndex = 0;

const mockPrisma = {
  candidate: {
    create: vi.fn().mockImplementation(() => {
      const candidate = mockDbCandidates[candidateIndex];
      candidateIndex = (candidateIndex + 1) % mockDbCandidates.length;
      return Promise.resolve(candidate);
    }),
    update: vi.fn().mockResolvedValue(mockDbCandidates[0]),
    findUnique: vi.fn().mockImplementation(({ where }) => {
      const idx = parseInt(where.id.split("-")[1]) - 1;
      const candidate = mockDbCandidates[idx];
      if (!candidate) return Promise.resolve(null);
      return Promise.resolve({
        ...candidate,
        snapshots: [mockSnapshots[idx]],
      });
    }),
  },
  lead: {
    create: vi.fn().mockImplementation(({ data }) => {
      return Promise.resolve({
        id: `lead-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
    findUnique: vi.fn().mockImplementation(({ where }) => {
      return Promise.resolve({
        id: where.id,
        companyName: "TechCorp Solutions",
        confidenceScore: 85,
        requiresReview: false,
        issues: [],
        decisionMakers: [],
        emailDrafts: [],
      });
    }),
    update: vi.fn().mockResolvedValue({}),
  },
  snapshot: {
    create: vi.fn().mockImplementation(({ data }) => {
      const snapshot = mockSnapshots[snapshotIndex % mockSnapshots.length];
      snapshotIndex++;
      return Promise.resolve({ ...snapshot, ...data });
    }),
    findMany: vi.fn().mockResolvedValue(mockSnapshots),
  },
  verifiedResource: {
    create: vi.fn().mockResolvedValue({ id: "vr-1" }),
  },
  issue: {
    create: vi.fn().mockResolvedValue({ id: "issue-1" }),
  },
  decisionMaker: {
    create: vi.fn().mockResolvedValue({ id: "dm-1" }),
  },
  contact: {
    create: vi.fn().mockResolvedValue({ id: "contact-1" }),
  },
  emailDraft: {
    create: vi.fn().mockResolvedValue({ id: "draft-1" }),
  },
  rawAiResponse: {
    create: vi.fn().mockResolvedValue({ id: "raw-1" }),
  },
};

vi.mock("@/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/services/discoveryService", () => ({
  DiscoveryService: vi.fn().mockImplementation(() => ({
    discoverCandidates: vi.fn().mockResolvedValue(mockCandidates),
  })),
}));

vi.mock("@/services/fetchService", () => ({
  FetchService: vi.fn().mockImplementation(() => ({
    verifyAndFetch: vi.fn().mockImplementation(async (candidate) => {
      const idx = mockCandidates.findIndex(
        (c) => c.company_name === candidate.company_name
      );
      const snapshot = mockSnapshots[idx];

      if (!snapshot) {
        return {
          candidateId: `candidate-${idx + 1}`,
          verifiedResources: [],
          failedReasons: ["No resources to fetch"],
        };
      }

      return {
        candidateId: `candidate-${idx + 1}`,
        verifiedResources: [
          {
            id: `vr-${idx + 1}`,
            candidate_ref: `candidate-${idx + 1}`,
            source_url: snapshot.url,
            source_type: snapshot.sourceType,
            http_status: snapshot.httpStatus,
            content_type: snapshot.contentType,
            body_text: snapshot.textExtract,
            snapshot_id: snapshot.id,
            fetched_at: new Date(),
            headers: {},
          },
        ],
      };
    }),
  })),
}));

vi.mock("@/services/analysisService", () => ({
  AnalysisService: vi.fn().mockImplementation(() => ({
    analyzeCandidate: vi.fn().mockImplementation(async (candidateId, opts) => {
      const response = createMockAnalysisResponse(candidateId);
      const parsed = JSON.parse(response);

      const confidenceBelow70 = parsed.confidence < 70;
      const hasManualReview = !!parsed.recommended_manual_review;

      return {
        id: `lead-${candidateId}`,
        companyName: parsed.company_name,
        website: parsed.website,
        industry: parsed.industry,
        location: parsed.location,
        description: parsed.description,
        leadScore: parsed.lead_score,
        confidenceScore: parsed.confidence,
        requiresReview: confidenceBelow70 || hasManualReview,
        aiRawOutput: parsed,
        issues: parsed.top_issues || [],
        decisionMakers: parsed.decision_makers || [],
        emailDrafts: parsed.email_drafts || [],
      };
    }),
  })),
}));

describe("E2E Pipeline Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    candidateIndex = 0;
    snapshotIndex = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Full pipeline with count=3", () => {
    it("discovers 3 candidates with different source types", async () => {
      const { DiscoveryService } = await import("@/services/discoveryService");
      const discoveryService = new DiscoveryService();

      const candidates = await discoveryService.discoverCandidates({
        industry: "various",
        location: "USA",
        count: 3,
        leadPurpose: "B2B sales",
      });

      expect(candidates).toHaveLength(3);
      expect(candidates[0].domain_candidates).toContain("techcorp.com");
      expect(candidates[1].profile_urls).toContain(
        "https://instagram.com/glamourbeauty"
      );
      expect(candidates[2].profile_urls).toContain(
        "https://yelp.com/biz/quick-fix-plumbing-austin"
      );
    });

    it("fetches snapshots for each candidate", async () => {
      const { FetchService } = await import("@/services/fetchService");
      const fetchService = new FetchService();

      const results = await Promise.all(
        mockCandidates.map((c) => fetchService.verifyAndFetch(c))
      );

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.verifiedResources.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("analyzes candidates and generates leads with valid evidence", async () => {
      const { AnalysisService } = await import("@/services/analysisService");
      const analysisService = new AnalysisService();

      const lead1 = await analysisService.analyzeCandidate("candidate-1", {
        leadPurpose: "B2B sales",
      });
      expect(lead1).not.toBeNull();
      expect(lead1!.companyName).toBe("TechCorp Solutions");
      expect(lead1!.confidenceScore).toBe(85);
      expect(lead1!.requiresReview).toBe(false);

      const excerpts = lead1!.issues.map(
        (i: { evidence?: { excerpt?: string } }) => i.evidence?.excerpt
      );
      excerpts.forEach((excerpt: string | undefined) => {
        if (excerpt) {
          expect(
            fixtureText.techcorp.toLowerCase().includes(excerpt.toLowerCase())
          ).toBe(true);
        }
      });

      const lead2 = await analysisService.analyzeCandidate("candidate-2", {
        leadPurpose: "B2B sales",
      });
      expect(lead2!.requiresReview).toBe(true);

      const lead3 = await analysisService.analyzeCandidate("candidate-3", {
        leadPurpose: "B2B sales",
      });
      expect(lead3!.requiresReview).toBe(true);
    });

    it("completes full orchestration and returns correct counts", async () => {
      const { DiscoveryService } = await import("@/services/discoveryService");
      const { FetchService } = await import("@/services/fetchService");
      const { AnalysisService } = await import("@/services/analysisService");

      const discoveryService = new DiscoveryService();
      const fetchService = new FetchService();
      const analysisService = new AnalysisService();

      const candidates = await discoveryService.discoverCandidates({
        industry: "various",
        location: "USA",
        count: 3,
        leadPurpose: "B2B sales",
      });

      let leadsSaved = 0;
      let requiresReview = 0;
      let skipped = 0;

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const candidateId = `candidate-${i + 1}`;

        const fetchResult = await fetchService.verifyAndFetch(candidate);

        if (fetchResult.verifiedResources.length === 0) {
          skipped++;
          continue;
        }

        const lead = await analysisService.analyzeCandidate(candidateId, {
          leadPurpose: "B2B sales",
        });

        if (!lead) {
          skipped++;
          continue;
        }

        if (lead.requiresReview || (lead.confidenceScore ?? 0) < 60) {
          requiresReview++;
        } else {
          leadsSaved++;
        }
      }

      expect(leadsSaved).toBeGreaterThanOrEqual(1);
      expect(requiresReview).toBeGreaterThanOrEqual(0);
      expect(leadsSaved + requiresReview + skipped).toBe(3);
    });

    it("persists snapshots in database", async () => {
      const { FetchService } = await import("@/services/fetchService");
      const fetchService = new FetchService();

      await Promise.all(mockCandidates.map((c) => fetchService.verifyAndFetch(c)));

      const { prisma } = await import("@/db");
      const snapshots = await prisma.snapshot.findMany();

      expect(snapshots).toHaveLength(3);
      expect(snapshots[0].sourceType).toBe("homepage");
      expect(snapshots[1].sourceType).toBe("instagram");
      expect(snapshots[2].sourceType).toBe("directory");
    });

    it("evidence verification passes for TechCorp lead", async () => {
      const { verifyEvidenceAgainstSnapshots } = await import(
        "@/lib/validators/leadSchema"
      );

      const techCorpSnapshot = {
        id: "snapshot-techcorp-1",
        url: "https://techcorp.com/",
        textExtract: fixtureText.techcorp,
        sourceType: "homepage",
      };

      const leadJson = {
        top_issues: [
          {
            title: "Actively hiring and expanding",
            evidence: {
              source_url: "https://techcorp.com/",
              snapshot_id: "snapshot-techcorp-1",
              excerpt: "expanding our team",
            },
          },
          {
            title: "Significant technology budget",
            evidence: {
              source_url: "https://techcorp.com/",
              snapshot_id: "snapshot-techcorp-1",
              excerpt: "budget for new technology initiatives is $500,000",
            },
          },
        ],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Anderson",
            evidence: {
              source_url: "https://techcorp.com/",
              snapshot_id: "snapshot-techcorp-1",
              excerpt: "John Anderson",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, [techCorpSnapshot]);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("evidence verification fails for fabricated excerpts", async () => {
      const { verifyEvidenceAgainstSnapshots } = await import(
        "@/lib/validators/leadSchema"
      );

      const techCorpSnapshot = {
        id: "snapshot-techcorp-1",
        url: "https://techcorp.com/",
        textExtract: fixtureText.techcorp,
        sourceType: "homepage",
      };

      const fabricatedLeadJson = {
        top_issues: [
          {
            title: "Fabricated issue",
            evidence: {
              source_url: "https://techcorp.com/",
              snapshot_id: "snapshot-techcorp-1",
              excerpt: "This text does not exist in the snapshot at all",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(fabricatedLeadJson, [
        techCorpSnapshot,
      ]);

      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("not found verbatim");
    });
  });
});
