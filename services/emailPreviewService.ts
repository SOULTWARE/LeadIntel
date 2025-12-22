/**
 * Email Preview Service
 *
 * Generates email preview variations based on lead opportunities.
 * Does NOT send emails - preview only.
 */

import { OpenAIClient } from "./ai/openaiClient";
import type { TopIssue } from "./actionabilityService";

export type EmailTone = "concise" | "professional" | "direct";

export interface EmailPreviewInput {
  companyName: string;
  primaryOpportunity: string;
  topIssues: TopIssue[];
  senderName: string;
  senderCompany: string;
  tone?: EmailTone;
}

export interface EmailVariation {
  subject: string;
  body: string;
}

export interface EmailPreviewResult {
  emails: EmailVariation[];
}

const TONE_INSTRUCTIONS: Record<EmailTone, string> = {
  concise: "Be brief and to the point. Use short sentences. Get to the value proposition quickly.",
  professional: "Use formal business language. Be respectful and thorough. Include proper greetings.",
  direct: "Be straightforward and action-oriented. Lead with the problem. Minimize pleasantries.",
};

export class EmailPreviewService {
  private aiClient: OpenAIClient;

  constructor() {
    this.aiClient = new OpenAIClient({
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: process.env.AI_MODEL ?? "gpt-4o",
      maxTokens: 1024,
      temperature: 0.7,
    });
  }

  /**
   * Generate 2 email variations based on lead data.
   */
  async generateEmailPreviews(input: EmailPreviewInput): Promise<EmailPreviewResult> {
    const { companyName, primaryOpportunity, topIssues, senderName, senderCompany, tone = "professional" } = input;

    // Build issue context for the prompt
    const issueContext = topIssues.slice(0, 3).map((issue, index) => {
      const sourceType = this.extractSourceType(issue.evidenceExcerpt, issue.issue);
      return `Issue ${index + 1}: "${issue.issue}" (${issue.severity} severity)
  - Evidence source: ${sourceType}
  - Evidence excerpt: "${issue.evidenceExcerpt.slice(0, 100)}..."`;
    }).join("\n\n");

    const prompt = this.buildPrompt({
      companyName,
      primaryOpportunity,
      issueContext,
      senderName,
      senderCompany,
      toneInstruction: TONE_INSTRUCTIONS[tone],
    });

    try {
      const response = await this.aiClient.complete({
        messages: [
          { role: "system", content: this.getSystemPrompt() },
          { role: "user", content: prompt },
        ],
        responseFormat: "json",
      });

      const parsed = JSON.parse(response.content);

      // Validate and extract emails
      const emails: EmailVariation[] = [];

      if (parsed.email1) {
        emails.push({
          subject: parsed.email1.subject ?? "Quick Question",
          body: this.sanitizeBody(parsed.email1.body ?? ""),
        });
      }

      if (parsed.email2) {
        emails.push({
          subject: parsed.email2.subject ?? "Quick Question",
          body: this.sanitizeBody(parsed.email2.body ?? ""),
        });
      }

      // Fallback if AI didn't return proper structure
      if (emails.length === 0) {
        emails.push(...this.generateFallbackEmails(input));
      }

      return { emails };
    } catch (error) {
      console.error("[EmailPreviewService] AI generation failed:", error);
      // Return fallback emails on error
      return { emails: this.generateFallbackEmails(input) };
    }
  }

  /**
   * Extract source type from evidence for natural mention in email.
   */
  private extractSourceType(evidenceExcerpt: string, issueTitle: string): string {
    const lower = (evidenceExcerpt + " " + issueTitle).toLowerCase();

    if (lower.includes("yelp")) return "Yelp reviews";
    if (lower.includes("tripadvisor") || lower.includes("trip advisor")) return "TripAdvisor reviews";
    if (lower.includes("google review") || lower.includes("google maps")) return "Google reviews";
    if (lower.includes("facebook")) return "your Facebook page";
    if (lower.includes("instagram")) return "your Instagram";
    if (lower.includes("linkedin")) return "your LinkedIn profile";
    if (lower.includes("contact")) return "your contact page";
    if (lower.includes("about")) return "your About page";
    if (lower.includes("homepage") || lower.includes("home page")) return "your homepage";
    if (lower.includes("menu")) return "your menu page";
    if (lower.includes("order") || lower.includes("ordering")) return "your ordering system";

    return "your website";
  }

  private getSystemPrompt(): string {
    return `You are an expert cold email copywriter specializing in B2B outreach for digital services.

Your emails are:
- Short (80-140 words body)
- Value-focused, not salesy
- Reference specific evidence about the prospect
- Include a soft, helpful CTA

RULES:
1. Never include raw URLs in the email body
2. Reference the evidence source naturally (e.g., "I noticed on your contact page..." or "TripAdvisor reviews mention...")
3. Mention the specific issue you can help with
4. End with a "free 5-point snapshot" offer and 15-minute call CTA
5. Subject lines should be curiosity-driven, under 50 chars
6. Return valid JSON only

OUTPUT FORMAT:
{
  "email1": { "subject": "...", "body": "..." },
  "email2": { "subject": "...", "body": "..." }
}`;
  }

  private buildPrompt(params: {
    companyName: string;
    primaryOpportunity: string;
    issueContext: string;
    senderName: string;
    senderCompany: string;
    toneInstruction: string;
  }): string {
    return `Generate 2 email variations for outreach to ${params.companyName}.

PRIMARY OPPORTUNITY: ${params.primaryOpportunity}

IDENTIFIED ISSUES:
${params.issueContext}

SENDER: ${params.senderName} from ${params.senderCompany}

TONE: ${params.toneInstruction}

REQUIREMENTS:
- Email 1: Focus on the primary opportunity, mention one issue as evidence
- Email 2: Lead with a different issue, tie back to the opportunity
- Both must reference the evidence source type naturally (NOT raw URLs)
- Both must end with: offer a "free 5-point snapshot" and 15-minute call
- Keep body between 80-140 words
- Subject lines under 50 characters, curiosity-driven

Return JSON with email1 and email2 objects, each having subject and body.`;
  }

  /**
   * Remove any URLs that might have slipped into the body.
   */
  private sanitizeBody(body: string): string {
    // Remove http/https URLs
    return body.replace(/https?:\/\/[^\s]+/g, "[link removed]");
  }

  /**
   * Generate fallback emails if AI fails.
   */
  private generateFallbackEmails(input: EmailPreviewInput): EmailVariation[] {
    const { companyName, primaryOpportunity, topIssues, senderName, senderCompany } = input;

    const topIssue = topIssues[0];
    const issueText = topIssue?.issue ?? "improving your online presence";
    const sourceType = topIssue
      ? this.extractSourceType(topIssue.evidenceExcerpt, topIssue.issue)
      : "your website";

    return [
      {
        subject: `Quick thought on ${companyName}`,
        body: `Hi,

I came across ${companyName} and noticed an opportunity while reviewing ${sourceType}.

${primaryOpportunity || `It looks like there's room to ${issueText.toLowerCase()}`}.

At ${senderCompany}, we help businesses like yours address exactly this. I'd love to offer you a free 5-point snapshot of quick wins for your digital presence.

Would you have 15 minutes this week for a quick call?

Best,
${senderName}`,
      },
      {
        subject: `Idea for ${companyName}`,
        body: `Hi,

While researching ${companyName}, I noticed something on ${sourceType} that caught my attention.

Specifically, ${issueText.toLowerCase()} — this is something we've helped similar businesses solve quickly.

I put together a free 5-point snapshot I'd love to share with you. It covers the highest-impact opportunities I spotted.

Do you have 15 minutes for a brief call this week?

Best,
${senderName}
${senderCompany}`,
      },
    ];
  }
}

export const emailPreviewService = new EmailPreviewService();
