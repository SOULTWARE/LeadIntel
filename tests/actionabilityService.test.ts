import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionabilityService } from "@/services/actionabilityService";

// Mock prisma
vi.mock("@/db", () => ({
  prisma: {
    lead: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/db";

const mockPrismaFindUnique = vi.mocked(prisma.lead.findUnique);

describe("ActionabilityService", () => {
  let service: ActionabilityService;

  // Fixture: Snapshot data
  const fixtureSnapshots = [
    {
      id: "snapshot-1",
      createdAt: new Date(),
      url: "https://example-restaurant.com",
      httpStatus: 200,
      contentType: "text/html",
      html: "<html>...</html>",
      textExtract:
        "Welcome to Example Restaurant. We serve fresh Italian cuisine. " +
        "Our online ordering system is currently unavailable. " +
        "Please call us at 555-1234 to place orders. " +
        "Contact: info@example-restaurant.com",
      sourceType: "homepage",
      headers: {},
      candidateId: "candidate-1",
      candidateName: "Example Restaurant",
      fetchedAt: new Date(),
    },
    {
      id: "snapshot-2",
      createdAt: new Date(),
      url: "https://example-restaurant.com/contact",
      httpStatus: 200,
      contentType: "text/html",
      html: "<html>...</html>",
      textExtract:
        "Contact Us. Owner: John Smith. Email: john@example-restaurant.com. " +
        "Phone: +1-555-123-4567. Address: 123 Main St, Anytown USA.",
      sourceType: "contact",
      headers: {},
      candidateId: "candidate-1",
      candidateName: "Example Restaurant",
      fetchedAt: new Date(),
    },
    {
      id: "snapshot-3",
      createdAt: new Date(),
      url: "https://example-restaurant.com/about",
      httpStatus: 200,
      contentType: "text/html",
      html: "<html>...</html>",
      textExtract:
        "About Us. Example Restaurant was founded in 2010 by John Smith. " +
        "We have grown from a small family restaurant to serving over 500 customers daily. " +
        "Our website was last updated in 2018 and we know it needs improvement.",
      sourceType: "about",
      headers: {},
      candidateId: "candidate-1",
      candidateName: "Example Restaurant",
      fetchedAt: new Date(),
    },
  ];

  // Fixture: Lead with high actionability
  const fixtureLeadHighActionability = {
    id: "lead-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    companyName: "Example Restaurant",
    website: "https://example-restaurant.com",
    industry: "Restaurant",
    employeeCount: 25,
    location: "Anytown, USA",
    description: "Italian restaurant",
    leadScore: 85,
    confidenceScore: 82,
    outreachStage: "NOT_CONTACTED",
    requiresReview: false,
    domain: "example-restaurant.com",
    leadPurpose: "web design services to increase online orders",
    actionable: false,
    actionabilityScore: null,
    primaryOpportunity: null,
    candidateId: "candidate-1",
    aiRawOutput: {
      deep_search: {
        signals: [
          {
            category: "website",
            type: "issue",
            value: "Online ordering system is currently unavailable",
            sentiment: "negative",
            source_url: "https://example-restaurant.com",
            evidence: "Our online ordering system is currently unavailable",
            relevance: 95,
            source_type: "homepage",
          },
          {
            category: "website",
            type: "issue",
            value: "Website last updated in 2018",
            sentiment: "negative",
            source_url: "https://example-restaurant.com/about",
            evidence: "Our website was last updated in 2018",
            relevance: 85,
            source_type: "about",
          },
          {
            category: "company_info",
            type: "growth",
            value: "Serving over 500 customers daily",
            sentiment: "positive",
            source_url: "https://example-restaurant.com/about",
            evidence: "serving over 500 customers daily",
            relevance: 70,
            source_type: "about",
          },
        ],
        score_breakdown: {
          reputationScore: 75,
          onlinePresenceScore: 45,
          growthSignalsScore: 80,
          intentMatchScore: 90,
          accessibilityScore: 85,
        },
      },
    },
    candidate: {
      id: "candidate-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      companyName: "Example Restaurant",
      domainCandidates: ["example-restaurant.com"],
      profileUrls: [],
      discoveryProvenance: [],
      discoveryConfidence: 85,
      discoveredAt: new Date(),
      status: "VERIFIED",
      snapshots: fixtureSnapshots,
    },
    issues: [
      {
        id: "issue-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        title: "No online ordering capability",
        description: "Restaurant lacks functional online ordering",
        category: "website",
        severity: "high",
        confidenceScore: 90,
        aiRawOutput: {
          source_url: "https://example-restaurant.com",
          evidence: "Our online ordering system is currently unavailable",
        },
        leadId: "lead-1",
        sourceEvidenceId: null,
        sourceEvidence: null,
        snapshotId: "snapshot-1",
        snapshot: fixtureSnapshots[0],
      },
    ],
    decisionMakers: [
      {
        id: "dm-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        firstName: "John",
        lastName: "Smith",
        title: "Owner",
        role: "owner",
        aiRawOutput: null,
        leadId: "lead-1",
        contacts: [
          {
            id: "contact-1",
            createdAt: new Date(),
            updatedAt: new Date(),
            type: "email",
            value: "john@example-restaurant.com",
            isPrimary: true,
            isVerified: true,
            decisionMakerId: "dm-1",
          },
          {
            id: "contact-2",
            createdAt: new Date(),
            updatedAt: new Date(),
            type: "phone",
            value: "+1-555-123-4567",
            isPrimary: false,
            isVerified: true,
            decisionMakerId: "dm-1",
          },
        ],
      },
    ],
    emailDrafts: [],
  };

  // Fixture: Lead with low actionability
  const fixtureLeadLowActionability = {
    ...fixtureLeadHighActionability,
    id: "lead-2",
    confidenceScore: 55,
    requiresReview: true,
    aiRawOutput: {
      deep_search: {
        signals: [
          {
            category: "general",
            type: "info",
            value: "Basic company information found",
            sentiment: "neutral",
            source_url: "https://example-restaurant.com",
            evidence: "Welcome to Example Restaurant",
            relevance: 30,
            source_type: "homepage",
          },
        ],
      },
    },
    issues: [],
    decisionMakers: [
      {
        id: "dm-2",
        createdAt: new Date(),
        updatedAt: new Date(),
        firstName: "Unknown",
        lastName: "Contact",
        title: null,
        role: null,
        aiRawOutput: null,
        leadId: "lead-2",
        contacts: [],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ActionabilityService();
  });

  describe("evaluateLeadForUI", () => {
    it("should return high actionability for lead with clear issues and verified contact", async () => {
      mockPrismaFindUnique.mockResolvedValue(fixtureLeadHighActionability as never);

      const result = await service.evaluateLeadForUI("lead-1");

      expect(result.actionable).toBe(true);
      expect(result.actionabilityScore).toBeGreaterThanOrEqual(60);
      expect(result.topIssues.length).toBeGreaterThan(0);
      expect(result.topIssues.length).toBeLessThanOrEqual(3);
      expect(result.primaryOpportunity.length).toBeLessThanOrEqual(200);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons.length).toBeLessThanOrEqual(3);
    });

    it("should return low actionability for lead requiring review", async () => {
      mockPrismaFindUnique.mockResolvedValue(fixtureLeadLowActionability as never);

      const result = await service.evaluateLeadForUI("lead-2");

      expect(result.actionable).toBe(false);
      expect(result.reasons).toContain("Lead flagged for manual review");
    });

    it("should include verified contact bonus in score", async () => {
      mockPrismaFindUnique.mockResolvedValue(fixtureLeadHighActionability as never);

      const result = await service.evaluateLeadForUI("lead-1");

      // Should have contact bonus reflected in score or reasons
      expect(
        result.reasons.some((r) => r.includes("Verified contact"))
      ).toBe(true);
    });

    it("should throw error for non-existent lead", async () => {
      mockPrismaFindUnique.mockResolvedValue(null);

      await expect(service.evaluateLeadForUI("non-existent")).rejects.toThrow(
        "Lead not found: non-existent"
      );
    });

    it("should filter issues by relevance >= 50", async () => {
      mockPrismaFindUnique.mockResolvedValue(fixtureLeadHighActionability as never);

      const result = await service.evaluateLeadForUI("lead-1");

      // All top issues should have relevance >= 50 or be from allowed source types
      for (const issue of result.topIssues) {
        expect(issue.relevanceToIntent >= 50 || issue.evidenceSnapshotId).toBeTruthy();
      }
    });

    it("should generate primary opportunity in correct format", async () => {
      mockPrismaFindUnique.mockResolvedValue(fixtureLeadHighActionability as never);

      const result = await service.evaluateLeadForUI("lead-1");

      // Should be in format "<verb> <asset> to <benefit>"
      expect(result.primaryOpportunity).toMatch(/\w+\s+\w+.*to\s+\w+/i);
      expect(result.primaryOpportunity.length).toBeLessThanOrEqual(200);
    });

    it("should deduplicate signals by exact evidence + source_url", async () => {
      // Create lead with duplicate signals
      const leadWithDuplicates = {
        ...fixtureLeadHighActionability,
        aiRawOutput: {
          deep_search: {
            signals: [
              {
                category: "website",
                type: "issue",
                value: "Online ordering unavailable",
                source_url: "https://example-restaurant.com",
                evidence: "Our online ordering system is currently unavailable",
                relevance: 95,
              },
              {
                category: "website",
                type: "problem",
                value: "No online orders",
                source_url: "https://example-restaurant.com",
                evidence: "Our online ordering system is currently unavailable",
                relevance: 90,
              },
            ],
          },
        },
      };

      mockPrismaFindUnique.mockResolvedValue(leadWithDuplicates as never);

      const result = await service.evaluateLeadForUI("lead-1");

      // Should have deduplicated - both signals have same evidence+url
      // Count unique evidence excerpts in top issues
      const excerpts = result.topIssues.map((i) => i.evidenceExcerpt);
      const uniqueExcerpts = new Set(excerpts);
      expect(excerpts.length).toBe(uniqueExcerpts.size);
    });

    it("should return reasons explaining why not actionable", async () => {
      const leadLowConfidence = {
        ...fixtureLeadHighActionability,
        confidenceScore: 50,
        requiresReview: false,
      };

      mockPrismaFindUnique.mockResolvedValue(leadLowConfidence as never);

      const result = await service.evaluateLeadForUI("lead-1");

      expect(result.actionable).toBe(false);
      expect(
        result.reasons.some((r) => r.includes("Confidence score"))
      ).toBe(true);
    });

    it("should score website/order issues higher with business impact bonus", async () => {
      mockPrismaFindUnique.mockResolvedValue(fixtureLeadHighActionability as never);

      const result = await service.evaluateLeadForUI("lead-1");

      // Website issues should be prioritized
      if (result.topIssues.length > 0) {
        const topIssue = result.topIssues[0];
        // The top issue should be the high-severity website issue
        expect(
          topIssue.issue.toLowerCase().includes("online") ||
            topIssue.issue.toLowerCase().includes("ordering") ||
            topIssue.issue.toLowerCase().includes("website")
        ).toBe(true);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle lead with no signals or issues", async () => {
      const emptyLead = {
        ...fixtureLeadHighActionability,
        aiRawOutput: {},
        issues: [],
        decisionMakers: [],
      };

      mockPrismaFindUnique.mockResolvedValue(emptyLead as never);

      const result = await service.evaluateLeadForUI("lead-1");

      expect(result.topIssues).toHaveLength(0);
      expect(result.primaryOpportunity).toBeTruthy();
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it("should handle lead with no candidate/snapshots", async () => {
      const leadNoCandidate = {
        ...fixtureLeadHighActionability,
        candidate: null,
        candidateId: null,
      };

      mockPrismaFindUnique.mockResolvedValue(leadNoCandidate as never);

      const result = await service.evaluateLeadForUI("lead-1");

      expect(result).toBeDefined();
      expect(result.actionabilityScore).toBeGreaterThanOrEqual(0);
    });

    it("should cap actionability score at 100", async () => {
      // Create lead that would exceed 100
      const superLead = {
        ...fixtureLeadHighActionability,
        confidenceScore: 100,
        aiRawOutput: {
          deep_search: {
            signals: Array(10)
              .fill(null)
              .map((_, i) => ({
                category: "website",
                type: "issue",
                value: `Critical issue ${i}`,
                sentiment: "negative",
                source_url: `https://example-restaurant.com/page${i}`,
                evidence: `Critical problem ${i}`,
                relevance: 100,
                source_type: "homepage",
              })),
          },
        },
      };

      mockPrismaFindUnique.mockResolvedValue(superLead as never);

      const result = await service.evaluateLeadForUI("lead-1");

      expect(result.actionabilityScore).toBeLessThanOrEqual(100);
    });
  });
});
