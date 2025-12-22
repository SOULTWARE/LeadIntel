/**
 * API Tests for GET /api/leads/{id}/ui
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/leads/[id]/ui/route";
import { NextRequest } from "next/server";

// Mock prisma
vi.mock("@/db", () => ({
  prisma: {
    lead: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock actionabilityService
vi.mock("@/services/actionabilityService", () => ({
  actionabilityService: {
    evaluateLeadForUI: vi.fn(),
  },
}));

import { prisma } from "@/db";
import { actionabilityService } from "@/services/actionabilityService";

const mockPrismaFindUnique = vi.mocked(prisma.lead.findUnique);
const mockPrismaUpdate = vi.mocked(prisma.lead.update);
const mockEvaluateLeadForUI = vi.mocked(actionabilityService.evaluateLeadForUI);

// Fixtures
const sampleSnapshots = [
  {
    id: "snapshot-1",
    createdAt: new Date(),
    url: "https://example.com",
    httpStatus: 200,
    contentType: "text/html",
    html: "<html></html>",
    textExtract: "Our online ordering system is currently unavailable. Please call us.",
    sourceType: "homepage",
    headers: {},
    candidateId: "candidate-1",
    candidateName: "Example",
    fetchedAt: new Date(),
  },
];

const sampleLead = {
  id: "lead-1",
  companyName: "Example Company",
  website: "https://example.com",
  industry: "Restaurant",
  employeeCount: 25,
  location: "New York",
  leadScore: 78,
  confidenceScore: 82,
  outreachStage: "NOT_CONTACTED",
  requiresReview: false,
  actionable: true,
  actionabilityScore: 75,
  primaryOpportunity: "Modernize ordering system",
  aiRawOutput: {
    actionability: {
      computedAt: new Date().toISOString(),
    },
  },
  candidate: {
    snapshots: sampleSnapshots,
  },
  issues: [
    {
      id: "issue-1",
      title: "No online ordering",
      description: "Missing online ordering",
      severity: "high",
      aiRawOutput: {
        evidence: {
          excerpt: "Our online ordering system is currently unavailable",
          source_url: "https://example.com",
        },
      },
      snapshot: sampleSnapshots[0],
      sourceEvidence: null,
    },
  ],
  decisionMakers: [
    {
      contacts: [
        { type: "email", value: "test@example.com", isVerified: true },
        { type: "phone", value: "555-1234", isVerified: false },
      ],
    },
  ],
  emailDrafts: [],
};

function createRequest(leadId: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/leads/${leadId}/ui`, {
    method: "GET",
  });
}

describe("GET /api/leads/{id}/ui", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent lead", async () => {
    mockPrismaFindUnique.mockResolvedValue(null);

    const request = createRequest("non-existent");
    const response = await GET(request, { params: Promise.resolve({ id: "non-existent" }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Lead not found");
  });

  it("should return compact JSON with expected structure", async () => {
    mockPrismaFindUnique.mockResolvedValue(sampleLead as never);

    const request = createRequest("lead-1");
    const response = await GET(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Verify structure
    expect(data).toHaveProperty("lead");
    expect(data).toHaveProperty("contactPaths");
    expect(data).toHaveProperty("keyOpportunities");
    expect(data).toHaveProperty("evidenceSummary");
    expect(data).toHaveProperty("outreachPreview");
    expect(data).toHaveProperty("audit");

    // Verify lead fields
    expect(data.lead.id).toBe("lead-1");
    expect(data.lead.company_name).toBe("Example Company");
    expect(data.lead.actionable).toBe(true);
    expect(data.lead.requiresReview).toBe(false);
  });

  it("should limit keyOpportunities to 3", async () => {
    // Create lead with more than 3 issues
    const leadWithManyIssues = {
      ...sampleLead,
      issues: Array(5).fill(null).map((_, i) => ({
        id: `issue-${i}`,
        title: `Issue ${i}`,
        description: `Description ${i}`,
        severity: i < 2 ? "high" : "medium",
        aiRawOutput: {
          evidence: {
            excerpt: "Our online ordering system is currently unavailable",
            source_url: "https://example.com",
          },
        },
        snapshot: sampleSnapshots[0],
        sourceEvidence: null,
      })),
    };

    mockPrismaFindUnique.mockResolvedValue(leadWithManyIssues as never);

    const request = createRequest("lead-1");
    const response = await GET(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.keyOpportunities.length).toBeLessThanOrEqual(3);
  });

  it("should NOT include rawAIResponse by default", async () => {
    mockPrismaFindUnique.mockResolvedValue(sampleLead as never);

    const request = createRequest("lead-1");
    const response = await GET(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Should not have rawAIResponse in the response
    expect(data).not.toHaveProperty("rawAIResponse");
    expect(data.lead).not.toHaveProperty("aiRawOutput");

    // Audit flag should indicate rawAIResponse is not shown
    expect(data.audit.rawAIResponseShown).toBe(false);
  });

  it("should recompute actionability if stale", async () => {
    const staleLead = {
      ...sampleLead,
      actionabilityScore: null,
      aiRawOutput: {
        actionability: {
          computedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        },
      },
    };

    mockPrismaFindUnique.mockResolvedValue(staleLead as never);
    mockEvaluateLeadForUI.mockResolvedValue({
      actionable: true,
      actionabilityScore: 80,
      primaryOpportunity: "New opportunity",
      topIssues: [],
      reasons: [],
    });
    mockPrismaUpdate.mockResolvedValue(staleLead as never);

    const request = createRequest("lead-1");
    await GET(request, { params: Promise.resolve({ id: "lead-1" }) });

    // Should have called evaluateLeadForUI to recompute
    expect(mockEvaluateLeadForUI).toHaveBeenCalledWith("lead-1");
  });

  it("should include contactPaths with verification status", async () => {
    mockPrismaFindUnique.mockResolvedValue(sampleLead as never);

    const request = createRequest("lead-1");
    const response = await GET(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.contactPaths.email).toEqual({
      value: "test@example.com",
      verified: true,
    });
    expect(data.contactPaths.phone).toEqual({
      value: "555-1234",
      verified: false,
    });
  });

  it("should include evidenceSummary with counts", async () => {
    mockPrismaFindUnique.mockResolvedValue(sampleLead as never);

    const request = createRequest("lead-1");
    const response = await GET(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.evidenceSummary.counts).toHaveProperty("snapshots");
    expect(data.evidenceSummary.counts).toHaveProperty("reviews");
    expect(data.evidenceSummary.counts).toHaveProperty("socials");
    expect(typeof data.evidenceSummary.counts.snapshots).toBe("number");
  });

  it("should include outreachPreview with suggestedAngle", async () => {
    mockPrismaFindUnique.mockResolvedValue(sampleLead as never);

    const request = createRequest("lead-1");
    const response = await GET(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.outreachPreview).toHaveProperty("suggestedAngle");
    expect(typeof data.outreachPreview.suggestedAngle).toBe("string");
  });
});
