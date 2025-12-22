/**
 * Integration Tests for POST /api/leads/{id}/generate-email-preview
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/leads/[id]/generate-email-preview/route";
import { NextRequest } from "next/server";

// Mock prisma
vi.mock("@/db", () => ({
  prisma: {
    lead: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock actionabilityService
vi.mock("@/services/actionabilityService", () => ({
  actionabilityService: {
    evaluateLeadForUI: vi.fn(),
  },
}));

// Mock emailPreviewService
vi.mock("@/services/emailPreviewService", () => ({
  emailPreviewService: {
    generateEmailPreviews: vi.fn(),
  },
}));

import { prisma } from "@/db";
import { actionabilityService } from "@/services/actionabilityService";
import { emailPreviewService } from "@/services/emailPreviewService";

const mockPrismaFindUnique = vi.mocked(prisma.lead.findUnique);
const mockEvaluateLeadForUI = vi.mocked(actionabilityService.evaluateLeadForUI);
const mockGenerateEmailPreviews = vi.mocked(emailPreviewService.generateEmailPreviews);

// Fixtures
const actionableLead = {
  id: "lead-1",
  companyName: "Example Restaurant",
  actionable: true,
  requiresReview: false,
  primaryOpportunity: "Modernize ordering system",
};

const notActionableLead = {
  id: "lead-2",
  companyName: "Example Restaurant",
  actionable: false,
  requiresReview: true,
  primaryOpportunity: null,
};

const sampleActionabilityResult = {
  actionable: true,
  actionabilityScore: 75,
  primaryOpportunity: "Modernize ordering system",
  topIssues: [
    {
      issue: "No online ordering capability",
      severity: "high" as const,
      evidenceSnapshotId: "snapshot-1",
      evidenceExcerpt: "Our online ordering system is currently unavailable",
      relevanceToIntent: 95,
    },
    {
      issue: "Outdated website design",
      severity: "medium" as const,
      evidenceSnapshotId: "snapshot-2",
      evidenceExcerpt: "Website last updated in 2018",
      relevanceToIntent: 85,
    },
  ],
  reasons: ["2 clear opportunities identified"],
};

const sampleEmailVariations = {
  emails: [
    {
      subject: "Quick thought on Example Restaurant",
      body: "Hi,\n\nI noticed your ordering system is currently unavailable...",
    },
    {
      subject: "Idea for your online presence",
      body: "Hi,\n\nWhile researching Example Restaurant, I noticed...",
    },
  ],
};

function createRequest(leadId: string, body: object): NextRequest {
  return new NextRequest(`http://localhost:3000/api/leads/${leadId}/generate-email-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/leads/{id}/generate-email-preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent lead", async () => {
    mockPrismaFindUnique.mockResolvedValue(null);

    const request = createRequest("non-existent", {
      sender_name: "John",
      sender_company: "Acme Inc",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "non-existent" }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Lead not found");
  });

  it("should return 400 if lead is not actionable", async () => {
    mockPrismaFindUnique.mockResolvedValue(notActionableLead as never);

    const request = createRequest("lead-2", {
      sender_name: "John",
      sender_company: "Acme Inc",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-2" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Lead is not actionable");
    expect(data).toHaveProperty("reason");
    expect(data).toHaveProperty("suggestion");
  });

  it("should return 400 if sender_name is missing", async () => {
    mockPrismaFindUnique.mockResolvedValue(actionableLead as never);

    const request = createRequest("lead-1", {
      sender_company: "Acme Inc",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("sender_name is required");
  });

  it("should return 400 if sender_company is missing", async () => {
    mockPrismaFindUnique.mockResolvedValue(actionableLead as never);

    const request = createRequest("lead-1", {
      sender_name: "John",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("sender_company is required");
  });

  it("should return 400 for invalid tone value", async () => {
    mockPrismaFindUnique.mockResolvedValue(actionableLead as never);

    const request = createRequest("lead-1", {
      sender_name: "John",
      sender_company: "Acme Inc",
      tone: "aggressive", // Invalid tone
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("tone must be one of");
  });

  it("should return two email variations for actionable lead", async () => {
    mockPrismaFindUnique.mockResolvedValue(actionableLead as never);
    mockEvaluateLeadForUI.mockResolvedValue(sampleActionabilityResult);
    mockGenerateEmailPreviews.mockResolvedValue(sampleEmailVariations);

    const request = createRequest("lead-1", {
      sender_name: "John Smith",
      sender_company: "Digital Solutions",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.leadId).toBe("lead-1");
    expect(data.companyName).toBe("Example Restaurant");
    expect(data.variations).toHaveLength(2);
    expect(data.variations[0]).toHaveProperty("subject");
    expect(data.variations[0]).toHaveProperty("body");
    expect(data.variations[1]).toHaveProperty("subject");
    expect(data.variations[1]).toHaveProperty("body");
  });

  it("should accept valid tone parameter", async () => {
    mockPrismaFindUnique.mockResolvedValue(actionableLead as never);
    mockEvaluateLeadForUI.mockResolvedValue(sampleActionabilityResult);
    mockGenerateEmailPreviews.mockResolvedValue(sampleEmailVariations);

    const request = createRequest("lead-1", {
      sender_name: "John Smith",
      sender_company: "Digital Solutions",
      tone: "concise",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(200);

    // Verify tone was passed to the service
    expect(mockGenerateEmailPreviews).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "concise",
      })
    );
  });

  it("should return 400 if no opportunities identified", async () => {
    mockPrismaFindUnique.mockResolvedValue(actionableLead as never);
    mockEvaluateLeadForUI.mockResolvedValue({
      ...sampleActionabilityResult,
      topIssues: [], // No issues
    });

    const request = createRequest("lead-1", {
      sender_name: "John Smith",
      sender_company: "Digital Solutions",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("No opportunities identified");
  });

  it("should pass topIssues to email generation service", async () => {
    mockPrismaFindUnique.mockResolvedValue(actionableLead as never);
    mockEvaluateLeadForUI.mockResolvedValue(sampleActionabilityResult);
    mockGenerateEmailPreviews.mockResolvedValue(sampleEmailVariations);

    const request = createRequest("lead-1", {
      sender_name: "John Smith",
      sender_company: "Digital Solutions",
    });
    await POST(request, { params: Promise.resolve({ id: "lead-1" }) });

    expect(mockGenerateEmailPreviews).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: "Example Restaurant",
        primaryOpportunity: "Modernize ordering system",
        topIssues: sampleActionabilityResult.topIssues,
        senderName: "John Smith",
        senderCompany: "Digital Solutions",
      })
    );
  });
});
