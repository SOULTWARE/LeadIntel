import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailPreviewService, type EmailPreviewInput } from "@/services/emailPreviewService";

// Mock OpenAI client
vi.mock("@/services/ai/openaiClient", () => ({
  OpenAIClient: vi.fn().mockImplementation(() => ({
    complete: vi.fn(),
  })),
}));

import { OpenAIClient } from "@/services/ai/openaiClient";

const mockComplete = vi.fn();

describe("EmailPreviewService", () => {
  let service: EmailPreviewService;

  const fixtureInput: EmailPreviewInput = {
    companyName: "Acme Restaurant",
    primaryOpportunity: "Modernize ordering system to recover lost online revenue",
    topIssues: [
      {
        issue: "No online ordering capability",
        severity: "high",
        evidenceSnapshotId: "snap-1",
        evidenceExcerpt: "Our online ordering system is currently unavailable. Please call to place orders.",
        relevanceToIntent: 95,
      },
      {
        issue: "Outdated website design",
        severity: "medium",
        evidenceSnapshotId: "snap-2",
        evidenceExcerpt: "Website last updated in 2018 according to footer copyright",
        relevanceToIntent: 80,
      },
      {
        issue: "Poor mobile experience",
        severity: "medium",
        evidenceSnapshotId: "snap-3",
        evidenceExcerpt: "Menu not readable on mobile devices, requires zooming",
        relevanceToIntent: 75,
      },
    ],
    senderName: "John Smith",
    senderCompany: "Digital Solutions Inc",
    tone: "professional",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementation
    (OpenAIClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      complete: mockComplete,
    }));

    service = new EmailPreviewService();
  });

  describe("generateEmailPreviews", () => {
    it("should generate 2 email variations from AI response", async () => {
      mockComplete.mockResolvedValue({
        content: JSON.stringify({
          email1: {
            subject: "Quick thought on Acme Restaurant",
            body: "Hi,\n\nI noticed your ordering system is currently unavailable on your website. This could be costing you significant revenue from customers who prefer to order online.\n\nAt Digital Solutions Inc, we specialize in helping restaurants like yours get online ordering up and running quickly.\n\nI'd love to offer you a free 5-point snapshot of opportunities I spotted. Would you have 15 minutes for a quick call?\n\nBest,\nJohn Smith",
          },
          email2: {
            subject: "Idea for your online presence",
            body: "Hi,\n\nWhile researching Acme Restaurant, I noticed your website footer still shows 2018. An outdated design can impact how customers perceive your business.\n\nModernizing your ordering system could help recover lost online revenue and attract more customers.\n\nI've put together a free 5-point snapshot I'd love to share. Do you have 15 minutes this week?\n\nBest,\nJohn Smith\nDigital Solutions Inc",
          },
        }),
      });

      const result = await service.generateEmailPreviews(fixtureInput);

      expect(result.emails).toHaveLength(2);
      expect(result.emails[0].subject).toBe("Quick thought on Acme Restaurant");
      expect(result.emails[0].body).toContain("ordering system");
      expect(result.emails[1].subject).toBe("Idea for your online presence");
    });

    it("should return fallback emails when AI fails", async () => {
      mockComplete.mockRejectedValue(new Error("API error"));

      const result = await service.generateEmailPreviews(fixtureInput);

      expect(result.emails).toHaveLength(2);
      expect(result.emails[0].subject).toContain("Acme Restaurant");
      expect(result.emails[0].body).toContain("free 5-point snapshot");
      expect(result.emails[0].body).toContain("15 minutes");
    });

    it("should return fallback emails when AI returns invalid JSON", async () => {
      mockComplete.mockResolvedValue({
        content: "This is not valid JSON",
      });

      const result = await service.generateEmailPreviews(fixtureInput);

      expect(result.emails).toHaveLength(2);
      expect(result.emails[0].body).toContain("John Smith");
    });

    it("should sanitize URLs from email body", async () => {
      mockComplete.mockResolvedValue({
        content: JSON.stringify({
          email1: {
            subject: "Test",
            body: "Check out https://example.com for more info.",
          },
          email2: {
            subject: "Test 2",
            body: "Visit http://test.com/page today.",
          },
        }),
      });

      const result = await service.generateEmailPreviews(fixtureInput);

      expect(result.emails[0].body).not.toContain("https://");
      expect(result.emails[0].body).toContain("[link removed]");
      expect(result.emails[1].body).not.toContain("http://");
    });

    it("should use different tone instructions", async () => {
      mockComplete.mockResolvedValue({
        content: JSON.stringify({
          email1: { subject: "Test", body: "Test body" },
          email2: { subject: "Test 2", body: "Test body 2" },
        }),
      });

      // Test concise tone
      await service.generateEmailPreviews({
        ...fixtureInput,
        tone: "concise",
      });

      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("brief and to the point"),
            }),
          ]),
        })
      );
    });

    it("should extract source type from evidence for natural mention", async () => {
      const inputWithYelp: EmailPreviewInput = {
        ...fixtureInput,
        topIssues: [
          {
            issue: "Poor reviews on Yelp",
            severity: "high",
            evidenceSnapshotId: "snap-1",
            evidenceExcerpt: "Multiple Yelp reviews mention slow service and cold food",
            relevanceToIntent: 90,
          },
        ],
      };

      mockComplete.mockResolvedValue({
        content: JSON.stringify({
          email1: { subject: "Test", body: "Test" },
          email2: { subject: "Test 2", body: "Test 2" },
        }),
      });

      await service.generateEmailPreviews(inputWithYelp);

      // The prompt should reference Yelp reviews
      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("Yelp reviews"),
            }),
          ]),
        })
      );
    });

    it("should handle empty top issues with fallback", async () => {
      // Make AI fail so fallback is used
      mockComplete.mockRejectedValue(new Error("AI unavailable"));

      const inputNoIssues: EmailPreviewInput = {
        ...fixtureInput,
        topIssues: [],
      };

      const result = await service.generateEmailPreviews(inputNoIssues);

      expect(result.emails).toHaveLength(2);
      expect(result.emails[0].body).toContain("your website");
    });
  });

  describe("source type extraction", () => {
    it("should detect TripAdvisor mentions", async () => {
      mockComplete.mockResolvedValue({
        content: JSON.stringify({
          email1: { subject: "Test", body: "Test" },
          email2: { subject: "Test 2", body: "Test 2" },
        }),
      });

      await service.generateEmailPreviews({
        ...fixtureInput,
        topIssues: [
          {
            issue: "Reviews mention issues",
            severity: "high",
            evidenceSnapshotId: "snap-1",
            evidenceExcerpt: "TripAdvisor reviews show 3-star average",
            relevanceToIntent: 85,
          },
        ],
      });

      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("TripAdvisor reviews"),
            }),
          ]),
        })
      );
    });

    it("should detect contact page mentions", async () => {
      mockComplete.mockResolvedValue({
        content: JSON.stringify({
          email1: { subject: "Test", body: "Test" },
          email2: { subject: "Test 2", body: "Test 2" },
        }),
      });

      await service.generateEmailPreviews({
        ...fixtureInput,
        topIssues: [
          {
            issue: "Missing phone number",
            severity: "medium",
            evidenceSnapshotId: "snap-1",
            evidenceExcerpt: "Contact page only shows email form, no phone",
            relevanceToIntent: 70,
          },
        ],
      });

      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("your contact page"),
            }),
          ]),
        })
      );
    });
  });
});
