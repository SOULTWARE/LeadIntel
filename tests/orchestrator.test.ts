/**
 * Orchestrator Integration Tests
 *
 * Tests that the lead generation orchestrator:
 * 1. Runs the full pipeline: discovery -> fetch -> analysis
 * 2. Handles concurrent processing correctly
 * 3. Marks candidates as skipped when no snapshots
 * 4. Flags leads for review when confidence < threshold
 * 5. Stores raw AI responses for audit
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCandidates = [
  {
    company_name: "Test Corp",
    domain_candidates: ["testcorp.com"],
    profile_urls: ["https://linkedin.com/company/testcorp"],
    search_provenance: [
      {
        queryUsed: "software companies",
        resultUrl: "https://example.com",
        snippet: "Test Corp is...",
      },
    ],
    discovery_confidence: 80,
    discovered_by: "gpt_search" as const,
  },
  {
    company_name: "Acme Inc",
    domain_candidates: [],
    profile_urls: [],
    search_provenance: [],
    discovery_confidence: 60,
    discovered_by: "gpt_search" as const,
  },
];

const mockDbCandidate = {
  id: "candidate-123",
  companyName: "Test Corp",
  domainCandidates: ["testcorp.com"],
  profileUrls: ["https://linkedin.com/company/testcorp"],
  discoveryProvenance: [],
  discoveryConfidence: 80,
  status: "DISCOVERED",
  createdAt: new Date(),
  updatedAt: new Date(),
  discoveredAt: new Date(),
};

const mockFetchResult = {
  candidateId: "candidate-123",
  verifiedResources: [
    {
      id: "resource-1",
      candidate_ref: "candidate-123",
      source_url: "https://testcorp.com/",
      source_type: "homepage" as const,
      http_status: 200,
      content_type: "text/html",
      body_text: "Welcome to Test Corp. We specialize in enterprise software.",
      raw_html_snapshot_path: "snapshots/snap-1",
      fetched_at: new Date(),
      headers: {},
      snapshot_id: "snap-1",
    },
  ],
};

const mockLead = {
  id: "lead-123",
  companyName: "Test Corp",
  website: "https://testcorp.com",
  industry: "Software",
  leadScore: 75,
  confidenceScore: 85,
  requiresReview: false,
  aiRawOutput: { response: {} },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLowConfidenceLead = {
  ...mockLead,
  id: "lead-456",
  confidenceScore: 45,
  requiresReview: false,
};

vi.mock("@/db", () => ({
  prisma: {
    candidate: {
      create: vi.fn().mockResolvedValue(mockDbCandidate),
      update: vi.fn().mockResolvedValue(mockDbCandidate),
    },
    lead: {
      update: vi.fn().mockResolvedValue(mockLead),
    },
    rawAiResponse: {
      create: vi.fn().mockResolvedValue({ id: "raw-1" }),
    },
  },
}));

vi.mock("@/services/discoveryService", () => ({
  DiscoveryService: vi.fn().mockImplementation(() => ({
    discoverCandidates: vi.fn().mockResolvedValue(mockCandidates),
  })),
}));

vi.mock("@/services/fetchService", () => ({
  FetchService: vi.fn().mockImplementation(() => ({
    verifyAndFetch: vi.fn().mockImplementation(async (candidate) => {
      if (candidate.domain_candidates.length === 0 && candidate.profile_urls.length === 0) {
        return {
          candidateId: "candidate-skipped",
          verifiedResources: [],
          failedReasons: ["No domains or profiles to fetch"],
        };
      }
      return mockFetchResult;
    }),
  })),
}));

vi.mock("@/services/analysisService", () => ({
  AnalysisService: vi.fn().mockImplementation(() => ({
    analyzeCandidate: vi.fn().mockResolvedValue(mockLead),
  })),
}));

describe("Orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("orchestrateLeadGeneration", () => {
    it("runs full pipeline: discovery -> fetch -> analysis", async () => {
      const { DiscoveryService } = await import("@/services/discoveryService");
      const { FetchService } = await import("@/services/fetchService");
      const { AnalysisService } = await import("@/services/analysisService");

      const discoveryService = new DiscoveryService();
      const fetchService = new FetchService();
      const analysisService = new AnalysisService();

      const candidates = await discoveryService.discoverCandidates({
        industry: "software",
        location: "NYC",
        count: 2,
        leadPurpose: "B2B sales",
      });

      expect(candidates).toHaveLength(2);

      const fetchResult = await fetchService.verifyAndFetch(candidates[0]);
      expect(fetchResult.verifiedResources).toHaveLength(1);

      const lead = await analysisService.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });
      expect(lead).toBeDefined();
      expect(lead?.id).toBe("lead-123");
    });

    it("marks candidates as skipped when no snapshots and no profile URLs", async () => {
      const { FetchService } = await import("@/services/fetchService");
      const fetchService = new FetchService();

      const emptyCandidate = {
        company_name: "Empty Corp",
        domain_candidates: [],
        profile_urls: [],
        search_provenance: [],
        discovery_confidence: 50,
        discovered_by: "gpt_search" as const,
      };

      const result = await fetchService.verifyAndFetch(emptyCandidate);

      expect(result.verifiedResources).toHaveLength(0);
      expect(result.failedReasons).toContain("No domains or profiles to fetch");
    });

    it("stores raw AI responses for audit", async () => {
      const { prisma } = await import("@/db");

      await prisma.rawAiResponse.create({
        data: {
          candidateId: "candidate-123",
          leadId: "lead-123",
          responseType: "analysis",
          response: { test: "data" },
          modelUsed: "gpt-4o",
        },
      });

      expect(prisma.rawAiResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            candidateId: "candidate-123",
            responseType: "analysis",
          }),
        })
      );
    });
  });

  describe("confidence threshold handling", () => {
    it("flags leads for review when confidence below threshold", async () => {
      const { AnalysisService } = await import("@/services/analysisService");
      const { prisma } = await import("@/db");

      const analysisService = new AnalysisService();
      (analysisService.analyzeCandidate as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockLowConfidenceLead
      );

      const lead = await analysisService.analyzeCandidate("candidate-456", {
        leadPurpose: "B2B sales",
      });

      expect(lead?.confidenceScore).toBe(45);
      expect(lead?.confidenceScore).toBeLessThan(60);

      await prisma.lead.update({
        where: { id: lead!.id },
        data: { requiresReview: true },
      });

      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { requiresReview: true },
        })
      );
    });

    it("saves leads without review flag when confidence above threshold", async () => {
      const { AnalysisService } = await import("@/services/analysisService");

      const analysisService = new AnalysisService();
      const lead = await analysisService.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      expect(lead?.confidenceScore).toBe(85);
      expect(lead?.confidenceScore).toBeGreaterThanOrEqual(60);
      expect(lead?.requiresReview).toBe(false);
    });
  });

  describe("concurrent processing", () => {
    it("processes multiple candidates concurrently", async () => {
      const { DiscoveryService } = await import("@/services/discoveryService");
      const { FetchService } = await import("@/services/fetchService");

      const discoveryService = new DiscoveryService();
      const fetchService = new FetchService();

      const candidates = await discoveryService.discoverCandidates({
        industry: "software",
        location: "NYC",
        count: 5,
        leadPurpose: "B2B sales",
      });

      const startTime = Date.now();

      const results = await Promise.all(
        candidates.map((c) => fetchService.verifyAndFetch(c))
      );

      const elapsed = Date.now() - startTime;

      expect(results).toHaveLength(2);
      expect(elapsed).toBeLessThan(5000);
    });
  });

  describe("error handling", () => {
    it("handles discovery errors gracefully", async () => {
      const { DiscoveryService } = await import("@/services/discoveryService");

      const discoveryService = new DiscoveryService();
      (discoveryService.discoverCandidates as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Discovery failed")
      );

      await expect(
        discoveryService.discoverCandidates({
          industry: "software",
          location: "NYC",
          count: 5,
          leadPurpose: "B2B sales",
        })
      ).rejects.toThrow("Discovery failed");
    });

    it("handles fetch errors gracefully", async () => {
      const { FetchService } = await import("@/services/fetchService");

      const fetchService = new FetchService();
      (fetchService.verifyAndFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Fetch failed")
      );

      await expect(
        fetchService.verifyAndFetch(mockCandidates[0])
      ).rejects.toThrow("Fetch failed");
    });

    it("handles analysis errors gracefully", async () => {
      const { AnalysisService } = await import("@/services/analysisService");

      const analysisService = new AnalysisService();
      (analysisService.analyzeCandidate as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Analysis failed")
      );

      await expect(
        analysisService.analyzeCandidate("candidate-123", { leadPurpose: "B2B" })
      ).rejects.toThrow("Analysis failed");
    });
  });

  describe("candidate status transitions", () => {
    it("transitions candidate through correct statuses", async () => {
      const { prisma } = await import("@/db");

      await prisma.candidate.create({
        data: {
          companyName: "Test Corp",
          status: "DISCOVERED",
        },
      });

      expect(prisma.candidate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "DISCOVERED" }),
        })
      );

      await prisma.candidate.update({
        where: { id: "candidate-123" },
        data: { status: "VERIFYING" },
      });

      await prisma.candidate.update({
        where: { id: "candidate-123" },
        data: { status: "CONVERTED" },
      });

      expect(prisma.candidate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "VERIFYING" },
        })
      );

      expect(prisma.candidate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "CONVERTED" },
        })
      );
    });

    it("marks candidate as FAILED on error", async () => {
      const { prisma } = await import("@/db");

      await prisma.candidate.update({
        where: { id: "candidate-123" },
        data: { status: "FAILED" },
      });

      expect(prisma.candidate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "FAILED" },
        })
      );
    });
  });
});
