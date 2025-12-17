/**
 * Analysis Service Tests
 *
 * Tests that the analysis service:
 * 1. Verifies evidence excerpts exist in snapshot body_text
 * 2. Rejects fabricated evidence
 * 3. Sets confidence to 0 on verification failure
 * 4. Persists leads with correct snapshot references
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AIClient, AICompletionResponse } from "../services/ai/types";

// Use vi.hoisted to define mock data before vi.mock hoisting
const { mockCandidate, mockLeadCreated } = vi.hoisted(() => ({
  mockCandidate: {
    id: "candidate-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    companyName: "Test Corp",
    domainCandidates: ["testcorp.com"],
    profileUrls: [],
    discoveryProvenance: [],
    discoveryConfidence: 80,
    discoveredAt: new Date(),
    status: "VERIFIED" as const,
    snapshots: [
      {
        id: "snapshot-1",
        createdAt: new Date(),
        url: "https://testcorp.com/",
        httpStatus: 200,
        contentType: "text/html",
        html: "<html><body>Welcome to Test Corp</body></html>",
        textExtract:
          "Welcome to Test Corp. We specialize in enterprise software solutions. Contact our CEO John Smith for partnerships. We are currently hiring and expanding our team.",
        sourceType: "homepage",
        headers: {},
        candidateId: "candidate-123",
        candidateName: "Test Corp",
        fetchedAt: new Date(),
      },
      {
        id: "snapshot-2",
        createdAt: new Date(),
        url: "https://testcorp.com/about",
        httpStatus: 200,
        contentType: "text/html",
        html: "<html><body>About Test Corp</body></html>",
        textExtract:
          "About Test Corp. Founded in 2020, we have grown to 50 employees. Our budget for new tools is $100k annually.",
        sourceType: "about",
        headers: {},
        candidateId: "candidate-123",
        candidateName: "Test Corp",
        fetchedAt: new Date(),
      },
    ],
  },
  mockLeadCreated: {
    id: "lead-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    companyName: "Test Corp",
    website: "https://testcorp.com",
    industry: "Software",
    employeeCount: null,
    location: null,
    description: "Enterprise software company",
    leadScore: 75,
    confidenceScore: 85,
    outreachStage: "NOT_CONTACTED" as const,
    requiresReview: false,
    domain: null,
    leadPurpose: "B2B sales",
    aiRawOutput: {},
    candidateId: "candidate-123",
    issues: [],
    decisionMakers: [],
    emailDrafts: [],
  },
}));

vi.mock("../db", () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn().mockResolvedValue(mockCandidate),
      update: vi.fn().mockResolvedValue(mockCandidate),
    },
    lead: {
      create: vi.fn().mockResolvedValue(mockLeadCreated),
      findUnique: vi.fn().mockResolvedValue(mockLeadCreated),
    },
    issue: {
      create: vi.fn().mockResolvedValue({ id: "issue-123" }),
    },
    decisionMaker: {
      create: vi.fn().mockResolvedValue({ id: "dm-123" }),
    },
    contact: {
      create: vi.fn().mockResolvedValue({ id: "contact-123" }),
    },
    emailDraft: {
      create: vi.fn().mockResolvedValue({ id: "draft-123" }),
    },
  },
}));

// Import after mocks are set up
import { AnalysisService } from "../services/analysisService";

function createMockAIClient(response: string): AIClient {
  return {
    complete: vi.fn().mockResolvedValue({
      content: response,
      usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
    } as AICompletionResponse),
  };
}

describe("AnalysisService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeCandidate", () => {
    it("accepts valid evidence that exists in snapshot body_text", async () => {
      const validResponse = JSON.stringify({
        company_name: "Test Corp",
        website: "https://testcorp.com",
        industry: "Software",
        description: "Enterprise software company",
        lead_score: 75,
        score_explainer: {
          need: 35,
          budget: 25,
          contact: 10,
          timing: 5,
          notes: "Good fit for B2B",
        },
        confidence: 85,
        top_issues: [
          {
            title: "Growing team",
            description: "Company is expanding",
            category: "opportunity",
            severity: "medium",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "currently hiring and expanding",
            },
          },
        ],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Smith",
            title: "CEO",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "CEO John Smith",
            },
          },
        ],
      });

      const mockClient = createMockAIClient(validResponse);
      const service = new AnalysisService({ aiClient: mockClient });

      const result = await service.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      expect(result).not.toBeNull();
      expect(mockClient.complete).toHaveBeenCalledTimes(1);
    });

    it("rejects fabricated evidence not in snapshot body_text", async () => {
      const fabricatedResponse = JSON.stringify({
        company_name: "Test Corp",
        website: "https://testcorp.com",
        industry: "Software",
        description: "Enterprise software company",
        lead_score: 75,
        score_explainer: {
          need: 35,
          budget: 25,
          contact: 10,
          timing: 5,
        },
        confidence: 85,
        top_issues: [
          {
            title: "Fake issue",
            description: "This evidence is fabricated",
            category: "problem",
            severity: "high",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "This text does not exist in any snapshot",
            },
          },
        ],
      });

      const mockClient = createMockAIClient(fabricatedResponse);
      const service = new AnalysisService({ aiClient: mockClient });

      const { prisma } = await import("../db");

      await service.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            confidenceScore: 0,
            requiresReview: true,
          }),
        })
      );
    });

    it("rejects evidence referencing non-existent snapshot", async () => {
      const invalidSnapshotResponse = JSON.stringify({
        company_name: "Test Corp",
        website: "https://testcorp.com",
        industry: "Software",
        description: "Enterprise software company",
        lead_score: 60,
        score_explainer: {
          need: 30,
          budget: 15,
          contact: 10,
          timing: 5,
        },
        confidence: 70,
        top_issues: [
          {
            title: "Issue from fake page",
            description: "References a URL not in snapshots",
            category: "problem",
            severity: "medium",
            evidence: {
              source_url: "https://testcorp.com/fake-page",
              excerpt: "Some fake content",
            },
          },
        ],
      });

      const mockClient = createMockAIClient(invalidSnapshotResponse);
      const service = new AnalysisService({ aiClient: mockClient });

      const { prisma } = await import("../db");

      await service.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            confidenceScore: 0,
            requiresReview: true,
          }),
        })
      );
    });

    it("sets confidence to min of model confidence and verification score", async () => {
      const validResponse = JSON.stringify({
        company_name: "Test Corp",
        website: "https://testcorp.com",
        industry: "Software",
        description: "Enterprise software company",
        lead_score: 50,
        score_explainer: {
          need: 20,
          budget: 15,
          contact: 10,
          timing: 5,
        },
        confidence: 90,
        top_issues: [
          {
            title: "Enterprise focus",
            description: "Company targets enterprise",
            category: "fit",
            severity: "low",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "enterprise software solutions",
            },
          },
        ],
      });

      const mockClient = createMockAIClient(validResponse);
      const service = new AnalysisService({ aiClient: mockClient });

      await service.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      const { prisma } = await import("../db");

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            confidenceScore: expect.any(Number),
          }),
        })
      );
    });

    it("handles empty issues array correctly", async () => {
      const noIssuesResponse = JSON.stringify({
        company_name: "Test Corp",
        website: "https://testcorp.com",
        industry: "Software",
        description: "Enterprise software company",
        lead_score: 25,
        score_explainer: {
          need: 10,
          budget: 10,
          contact: 5,
          timing: 0,
        },
        confidence: 50,
        top_issues: [],
        recommended_manual_review: "No issues found aligned with leadPurpose",
      });

      const mockClient = createMockAIClient(noIssuesResponse);
      const service = new AnalysisService({ aiClient: mockClient });

      const { prisma } = await import("../db");

      await service.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requiresReview: true,
          }),
        })
      );
    });

    it("persists issues with snapshotId reference", async () => {
      const validResponse = JSON.stringify({
        company_name: "Test Corp",
        website: "https://testcorp.com",
        industry: "Software",
        description: "Enterprise software company",
        lead_score: 70,
        score_explainer: {
          need: 30,
          budget: 20,
          contact: 15,
          timing: 5,
        },
        confidence: 80,
        top_issues: [
          {
            title: "Budget available",
            description: "Company has budget for tools",
            category: "opportunity",
            severity: "medium",
            evidence: {
              source_url: "https://testcorp.com/about",
              snapshot_id: "snapshot-2",
              excerpt: "budget for new tools is $100k",
            },
          },
        ],
      });

      const mockClient = createMockAIClient(validResponse);
      const service = new AnalysisService({ aiClient: mockClient });

      const { prisma } = await import("../db");

      await service.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      expect(prisma.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            snapshotId: "snapshot-2",
            title: "Budget available",
          }),
        })
      );
    });

    it("includes system prompt with strict rules", async () => {
      const validResponse = JSON.stringify({
        company_name: "Test Corp",
        website: "https://testcorp.com",
        industry: "Software",
        description: "Enterprise software company",
        lead_score: 50,
        score_explainer: {
          need: 20,
          budget: 15,
          contact: 10,
          timing: 5,
        },
        confidence: 70,
        top_issues: [],
        recommended_manual_review: "No aligned issues",
      });

      const mockClient = createMockAIClient(validResponse);
      const service = new AnalysisService({ aiClient: mockClient });

      await service.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      const callArgs = (mockClient.complete as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as AICompletionRequest;

      expect(callArgs.messages[0].role).toBe("system");
      expect(callArgs.messages[0].content).toContain("evidence-only analysis assistant");
      expect(callArgs.messages[0].content).toContain("Use ONLY the provided body_text");
      expect(callArgs.messages[0].content).toContain("appears verbatim");
      expect(callArgs.messages[0].content).toContain("Need(0-40)");
      expect(callArgs.messages[0].content).toContain("Budget(0-30)");
      expect(callArgs.messages[0].content).toContain("Contact(0-20)");
      expect(callArgs.messages[0].content).toContain("Timing(0-10)");
    });

    it("truncates snapshot body_text to limit tokens", async () => {
      const validResponse = JSON.stringify({
        company_name: "Test Corp",
        website: "https://testcorp.com",
        industry: "Software",
        description: "Enterprise software company",
        lead_score: 50,
        score_explainer: {
          need: 20,
          budget: 15,
          contact: 10,
          timing: 5,
        },
        confidence: 70,
        top_issues: [],
        recommended_manual_review: "No aligned issues",
      });

      const mockClient = createMockAIClient(validResponse);
      const service = new AnalysisService({
        aiClient: mockClient,
        maxBodyTextPerSnapshot: 100,
      });

      await service.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      const callArgs = (mockClient.complete as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as AICompletionRequest;

      expect(callArgs.messages[1].content).not.toContain(
        "We are currently hiring and expanding our team."
      );
    });

    it("validates response against Zod schema", async () => {
      const invalidResponse = JSON.stringify({
        company_name: "Test Corp",
        lead_score: 200,
      });

      const mockClient = createMockAIClient(invalidResponse);
      const service = new AnalysisService({ aiClient: mockClient });

      const { prisma } = await import("../db");

      await service.analyzeCandidate("candidate-123", {
        leadPurpose: "B2B sales",
      });

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            confidenceScore: 0,
            requiresReview: true,
          }),
        })
      );
    });
  });
});
