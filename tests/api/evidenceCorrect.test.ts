/**
 * Tests for POST /api/snapshots/{id}/evidence-correct
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/snapshots/[id]/evidence-correct/route";
import { NextRequest } from "next/server";

// Mock prisma
vi.mock("@/db", () => ({
  prisma: {
    snapshot: {
      findUnique: vi.fn(),
    },
    evidenceVerification: {
      create: vi.fn(),
    },
    issue: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/db";

const mockSnapshotFindUnique = vi.mocked(prisma.snapshot.findUnique);
const mockEvidenceVerificationCreate = vi.mocked(prisma.evidenceVerification.create);
const mockIssueFindUnique = vi.mocked(prisma.issue.findUnique);
const mockIssueUpdate = vi.mocked(prisma.issue.update);

// Fixtures
const sampleSnapshot = {
  id: "snapshot-1",
  url: "https://example.com",
  textExtract: "Welcome to our website. Our online ordering system is currently unavailable. Please call us at 555-1234 to place orders. We serve fresh Italian cuisine daily.",
  issues: [{ id: "issue-1" }],
};

function createRequest(snapshotId: string, body: object): NextRequest {
  return new NextRequest(`http://localhost:3000/api/snapshots/${snapshotId}/evidence-correct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/snapshots/{id}/evidence-correct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent snapshot", async () => {
    mockSnapshotFindUnique.mockResolvedValue(null);

    const request = createRequest("non-existent", {
      snapshotId: "non-existent",
      oldExcerpt: "old text",
      newExcerpt: "new text",
      reason: "correction",
      verifierName: "test-user",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "non-existent" }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Snapshot not found");
  });

  it("should return 400 if snapshotId does not match route parameter", async () => {
    mockSnapshotFindUnique.mockResolvedValue(sampleSnapshot as never);

    const request = createRequest("snapshot-1", {
      snapshotId: "different-snapshot",
      oldExcerpt: "old text",
      newExcerpt: "new text",
      reason: "correction",
      verifierName: "test-user",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "snapshot-1" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("snapshotId must match route parameter");
  });

  it("should return 400 if newExcerpt is missing", async () => {
    mockSnapshotFindUnique.mockResolvedValue(sampleSnapshot as never);

    const request = createRequest("snapshot-1", {
      snapshotId: "snapshot-1",
      oldExcerpt: "old text",
      reason: "correction",
      verifierName: "test-user",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "snapshot-1" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("newExcerpt is required");
  });

  it("should return 400 if verifierName is missing", async () => {
    mockSnapshotFindUnique.mockResolvedValue(sampleSnapshot as never);

    const request = createRequest("snapshot-1", {
      snapshotId: "snapshot-1",
      oldExcerpt: "old text",
      newExcerpt: "new text",
      reason: "correction",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "snapshot-1" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("verifierName is required");
  });

  it("should return 422 if newExcerpt is NOT found in snapshot text", async () => {
    mockSnapshotFindUnique.mockResolvedValue(sampleSnapshot as never);

    const request = createRequest("snapshot-1", {
      snapshotId: "snapshot-1",
      oldExcerpt: "old text",
      newExcerpt: "This text does not exist anywhere in the snapshot",
      reason: "correction",
      verifierName: "test-user",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "snapshot-1" }) });

    expect(response.status).toBe(422);
    const data = await response.json();
    expect(data.error).toBe("New excerpt not found in snapshot");
    expect(data).toHaveProperty("detail");
    expect(data).toHaveProperty("suggestion");
  });

  it("should accept valid excerpt that exists in snapshot (exact match)", async () => {
    mockSnapshotFindUnique.mockResolvedValue(sampleSnapshot as never);
    mockEvidenceVerificationCreate.mockResolvedValue({
      id: "verification-1",
    } as never);

    const request = createRequest("snapshot-1", {
      snapshotId: "snapshot-1",
      oldExcerpt: "wrong text",
      newExcerpt: "Our online ordering system is currently unavailable",
      reason: "Fixed incorrect excerpt",
      verifierName: "test-user",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "snapshot-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.verificationId).toBe("verification-1");
  });

  it("should accept valid excerpt with case-insensitive matching", async () => {
    mockSnapshotFindUnique.mockResolvedValue(sampleSnapshot as never);
    mockEvidenceVerificationCreate.mockResolvedValue({
      id: "verification-1",
    } as never);

    const request = createRequest("snapshot-1", {
      snapshotId: "snapshot-1",
      oldExcerpt: "wrong text",
      newExcerpt: "OUR ONLINE ORDERING SYSTEM IS CURRENTLY UNAVAILABLE", // Uppercase
      reason: "Fixed incorrect excerpt",
      verifierName: "test-user",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "snapshot-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("should create EvidenceVerification record", async () => {
    mockSnapshotFindUnique.mockResolvedValue(sampleSnapshot as never);
    mockEvidenceVerificationCreate.mockResolvedValue({
      id: "verification-1",
    } as never);

    const request = createRequest("snapshot-1", {
      snapshotId: "snapshot-1",
      oldExcerpt: "wrong text",
      newExcerpt: "Our online ordering system is currently unavailable",
      reason: "Fixed incorrect excerpt",
      verifierName: "test-user",
    });
    await POST(request, { params: Promise.resolve({ id: "snapshot-1" }) });

    expect(mockEvidenceVerificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        snapshotId: "snapshot-1",
        originalExcerpt: "wrong text",
        newExcerpt: "Our online ordering system is currently unavailable",
        isValid: true,
        notes: "Fixed incorrect excerpt",
        verifierId: "test-user",
      }),
    });
  });

  it("should update Issue if issueId is provided", async () => {
    mockSnapshotFindUnique.mockResolvedValue(sampleSnapshot as never);
    mockEvidenceVerificationCreate.mockResolvedValue({
      id: "verification-1",
    } as never);
    mockIssueFindUnique.mockResolvedValue({
      id: "issue-1",
      aiRawOutput: {
        evidence: {
          excerpt: "wrong text",
        },
      },
    } as never);
    mockIssueUpdate.mockResolvedValue({} as never);

    const request = createRequest("snapshot-1", {
      snapshotId: "snapshot-1",
      oldExcerpt: "wrong text",
      newExcerpt: "Our online ordering system is currently unavailable",
      reason: "Fixed incorrect excerpt",
      verifierName: "test-user",
      issueId: "issue-1",
    });
    await POST(request, { params: Promise.resolve({ id: "snapshot-1" }) });

    expect(mockIssueUpdate).toHaveBeenCalledWith({
      where: { id: "issue-1" },
      data: {
        aiRawOutput: expect.objectContaining({
          evidence: expect.objectContaining({
            excerpt: "Our online ordering system is currently unavailable",
            manually_verified: true,
            verified_by: "test-user",
          }),
        }),
      },
    });
  });

  it("should handle whitespace normalization in excerpt matching", async () => {
    mockSnapshotFindUnique.mockResolvedValue(sampleSnapshot as never);
    mockEvidenceVerificationCreate.mockResolvedValue({
      id: "verification-1",
    } as never);

    // Extra spaces in the excerpt
    const request = createRequest("snapshot-1", {
      snapshotId: "snapshot-1",
      oldExcerpt: "wrong text",
      newExcerpt: "Our  online   ordering  system   is  currently  unavailable",
      reason: "Fixed incorrect excerpt",
      verifierName: "test-user",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "snapshot-1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
