/**
 * Analysis Service for Lead Intel
 *
 * ⚠️ IMMUTABLE RULE: NO AI-CLAIMS WITHOUT SNAPSHOT
 * See: src/docs/architecture.md
 *
 * This service analyzes candidates using ONLY fetched snapshots.
 * All evidence must be verified against stored snapshot content.
 */

import { z } from "zod";
import { prisma } from "../db";
import { OpenAIClient } from "./ai/openaiClient";
import type { AIClient } from "./ai/types";
import {
  verifyEvidenceAgainstSnapshots,
  type Snapshot as ValidatorSnapshot,
} from "../lib/validators/leadSchema";

const MAX_SNAPSHOTS = 5;
const MAX_BODY_TEXT_PER_SNAPSHOT = 4000;
const MAX_EXCERPT_LENGTH = 150;

const ANALYSIS_SYSTEM_PROMPT = `You are an evidence-only analysis assistant. You will be given:
- company_name
- leadPurpose (why user needs leads)
- an ordered list of snapshot objects: {snapshot_id, source_url, source_type, body_text}

Rules:
1) Use ONLY the provided body_text values to find evidence. Do not reference or invent any pages not included here.
2) For every factual claim (issue, contact presence, decision maker, phone, email, social), include source_url that exists in the snapshot list and an evidence excerpt of max 25 words that appears verbatim in that snapshot's body_text.
3) If you cannot find a decision maker name or a verified email/phone in snapshots, set those fields to null.
4) Compute lead_score with rubric: Need(0-40), Budget(0-30), Contact(0-20), Timing(0-10). Show component scoring in score_explainer.
5) Confidence: return a numeric 0-100. If any verification rule cannot be satisfied, set confidence < 70.
6) Output EXACTLY a JSON object that matches the lead schema. No markdown, no extra text.
7) If there are no issues aligned with leadPurpose, set top_issues: [] and lead_score <= 30 and include recommended_manual_review.
End rules.`;

const EvidenceSchema = z.object({
  source_url: z.string(),
  snapshot_id: z.string().optional(),
  excerpt: z.string().max(MAX_EXCERPT_LENGTH),
});

const IssueSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  evidence: EvidenceSchema,
});

const DecisionMakerSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  title: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  evidence: EvidenceSchema.optional(),
});

const ScoreExplainerSchema = z.object({
  need: z.number().min(0).max(40),
  budget: z.number().min(0).max(30),
  contact: z.number().min(0).max(20),
  timing: z.number().min(0).max(10),
  notes: z.string().optional(),
});

const EmailDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

const AnalysisOutputSchema = z.object({
  company_name: z.string(),
  website: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lead_score: z.number().min(0).max(100),
  score_explainer: ScoreExplainerSchema,
  confidence: z.number().min(0).max(100),
  top_issues: z.array(IssueSchema),
  decision_makers: z.array(DecisionMakerSchema).optional().nullable(),
  email_drafts: z.array(EmailDraftSchema).optional(),
  recommended_manual_review: z.string().optional().nullable(),
});

type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

interface SnapshotPayload {
  snapshot_id: string;
  source_url: string;
  source_type: string;
  body_text: string;
}

interface AnalyzeOptions {
  sender_name?: string;
  sender_company?: string;
  leadPurpose?: string;
}

interface VerificationResult {
  valid: boolean;
  score: number;
  failedIssues: Array<{
    issueTitle: string;
    reason: string;
    excerpt: string;
  }>;
}

export interface AnalysisServiceConfig {
  aiClient?: AIClient;
  maxSnapshots?: number;
  maxBodyTextPerSnapshot?: number;
}

export class AnalysisService {
  private aiClient: AIClient;
  private maxSnapshots: number;
  private maxBodyTextPerSnapshot: number;

  constructor(config: AnalysisServiceConfig = {}) {
    this.aiClient =
      config.aiClient ??
      new OpenAIClient({
        apiKey: process.env.OPENAI_API_KEY ?? "",
        model: process.env.AI_MODEL ?? "gpt-4o",
        maxTokens: 4096,
        temperature: 0.1,
      });
    this.maxSnapshots = config.maxSnapshots ?? MAX_SNAPSHOTS;
    this.maxBodyTextPerSnapshot =
      config.maxBodyTextPerSnapshot ?? MAX_BODY_TEXT_PER_SNAPSHOT;
  }

  async analyzeCandidate(
    candidateId: string,
    opts: AnalyzeOptions = {}
  ): Promise<ReturnType<typeof prisma.lead.findUnique> | null> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        snapshots: {
          orderBy: { fetchedAt: "desc" },
          take: this.maxSnapshots,
        },
      },
    });

    if (!candidate) {
      console.error(`Candidate not found: ${candidateId}`);
      return null;
    }

    if (candidate.snapshots.length === 0) {
      console.error(`No snapshots found for candidate: ${candidateId}`);
      return null;
    }

    const snapshotPayloads = this.assembleSnapshotPayloads(candidate.snapshots);
    const snapshotMap = this.buildSnapshotMap(candidate.snapshots);

    const userPrompt = this.buildUserPrompt(
      candidate.companyName,
      opts.leadPurpose ?? "general business development",
      snapshotPayloads,
      opts.sender_name,
      opts.sender_company
    );

    let analysisOutput: AnalysisOutput;
    let rawAIResponse: string;

    try {
      const response = await this.aiClient.complete({
        messages: [
          { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        responseFormat: "json",
      });

      rawAIResponse = response.content;
      const parsed = JSON.parse(rawAIResponse);
      analysisOutput = AnalysisOutputSchema.parse(parsed);
    } catch (error) {
      console.error("Analysis failed:", error);
      return this.createFailedLead(
        candidateId,
        candidate.companyName,
        opts.leadPurpose,
        `analysis_error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const validatorSnapshots: ValidatorSnapshot[] = candidate.snapshots.map((s) => ({
      id: s.id,
      url: s.url,
      textExtract: s.textExtract,
      sourceType: s.sourceType,
    }));

    const validatorVerification = verifyEvidenceAgainstSnapshots(
      analysisOutput as unknown as Parameters<typeof verifyEvidenceAgainstSnapshots>[0],
      validatorSnapshots
    );

    const verification = this.verifyEvidence(analysisOutput, snapshotMap);

    const allErrors = [...validatorVerification.errors];
    const hasFailures = !validatorVerification.ok || !verification.valid;

    let finalConfidence: number;
    let requiresReview = false;
    let reviewReason: string | null = null;

    if (hasFailures) {
      finalConfidence = 0;
      requiresReview = true;
      const failedItems = [
        ...allErrors,
        ...verification.failedIssues.map((f) => f.issueTitle),
      ];
      reviewReason = `evidence_mismatch: ${failedItems.join("; ")}`;

      console.warn("Evidence verification failed:", {
        candidateId,
        validatorErrors: validatorVerification.errors,
        failedIssues: verification.failedIssues,
        rawResponse: rawAIResponse,
      });
    } else {
      finalConfidence = Math.min(
        analysisOutput.confidence,
        verification.score
      );
    }

    if (analysisOutput.recommended_manual_review) {
      requiresReview = true;
      reviewReason = analysisOutput.recommended_manual_review;
    }

    const lead = await this.persistLead(
      candidateId,
      analysisOutput,
      finalConfidence,
      requiresReview,
      reviewReason,
      opts.leadPurpose,
      rawAIResponse,
      snapshotMap
    );

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: "CONVERTED" },
    });

    return lead;
  }

  private assembleSnapshotPayloads(
    snapshots: Array<{
      id: string;
      url: string;
      sourceType: string | null;
      textExtract: string | null;
    }>
  ): SnapshotPayload[] {
    return snapshots.map((s) => ({
      snapshot_id: s.id,
      source_url: s.url,
      source_type: s.sourceType ?? "unknown",
      body_text: (s.textExtract ?? "").slice(0, this.maxBodyTextPerSnapshot),
    }));
  }

  private buildSnapshotMap(
    snapshots: Array<{
      id: string;
      url: string;
      textExtract: string | null;
    }>
  ): Map<string, { id: string; url: string; bodyText: string }> {
    const map = new Map<string, { id: string; url: string; bodyText: string }>();

    for (const s of snapshots) {
      map.set(s.id, {
        id: s.id,
        url: s.url,
        bodyText: s.textExtract ?? "",
      });
      map.set(s.url, {
        id: s.id,
        url: s.url,
        bodyText: s.textExtract ?? "",
      });
    }

    return map;
  }

  private buildUserPrompt(
    companyName: string,
    leadPurpose: string,
    snapshots: SnapshotPayload[],
    senderName?: string,
    senderCompany?: string
  ): string {
    const snapshotList = snapshots
      .map(
        (s, i) =>
          `[Snapshot ${i + 1}]
snapshot_id: ${s.snapshot_id}
source_url: ${s.source_url}
source_type: ${s.source_type}
body_text:
${s.body_text}
---`
      )
      .join("\n\n");

    let prompt = `Analyze the following company for lead qualification.

company_name: ${companyName}
leadPurpose: ${leadPurpose}
`;

    if (senderName || senderCompany) {
      prompt += `\nContext: Analysis requested by ${senderName ?? "user"}${senderCompany ? ` from ${senderCompany}` : ""}\n`;
    }

    prompt += `
Scoring rubric:
- Need (0-40): How well does the company's situation align with leadPurpose? Cap score if misaligned.
- Budget (0-30): Evidence of purchasing power or active spending
- Contact (0-20): Presence of decision maker names, emails, phones
- Timing (0-10): Urgency indicators, hiring, expansion, recent activity

Available snapshots (use ONLY these for evidence):

${snapshotList}

Return a JSON object matching the lead schema. Include evidence.excerpt as exact verbatim substrings from body_text.`;

    return prompt;
  }

  private verifyEvidence(
    output: AnalysisOutput,
    snapshotMap: Map<string, { id: string; url: string; bodyText: string }>
  ): VerificationResult {
    const failedIssues: VerificationResult["failedIssues"] = [];
    let totalChecks = 0;
    let passedChecks = 0;

    for (const issue of output.top_issues) {
      totalChecks++;

      const snapshotKey = issue.evidence.snapshot_id ?? issue.evidence.source_url;
      const snapshot = snapshotMap.get(snapshotKey);

      if (!snapshot) {
        failedIssues.push({
          issueTitle: issue.title,
          reason: `Snapshot not found: ${snapshotKey}`,
          excerpt: issue.evidence.excerpt,
        });
        continue;
      }

      const normalizedExcerpt = this.normalizeText(issue.evidence.excerpt);
      const normalizedBody = this.normalizeText(snapshot.bodyText);

      if (!normalizedBody.includes(normalizedExcerpt)) {
        failedIssues.push({
          issueTitle: issue.title,
          reason: "Excerpt not found verbatim in snapshot body_text",
          excerpt: issue.evidence.excerpt,
        });
        continue;
      }

      passedChecks++;
    }

    if (output.decision_makers) {
      for (const dm of output.decision_makers) {
        if (dm.evidence) {
          totalChecks++;

          const snapshotKey = dm.evidence.snapshot_id ?? dm.evidence.source_url;
          const snapshot = snapshotMap.get(snapshotKey);

          if (!snapshot) {
            failedIssues.push({
              issueTitle: `Decision maker: ${dm.first_name} ${dm.last_name}`,
              reason: `Snapshot not found: ${snapshotKey}`,
              excerpt: dm.evidence.excerpt,
            });
            continue;
          }

          const normalizedExcerpt = this.normalizeText(dm.evidence.excerpt);
          const normalizedBody = this.normalizeText(snapshot.bodyText);

          if (!normalizedBody.includes(normalizedExcerpt)) {
            failedIssues.push({
              issueTitle: `Decision maker: ${dm.first_name} ${dm.last_name}`,
              reason: "Excerpt not found verbatim in snapshot body_text",
              excerpt: dm.evidence.excerpt,
            });
            continue;
          }

          passedChecks++;
        }
      }
    }

    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    return {
      valid: failedIssues.length === 0,
      score,
      failedIssues,
    };
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .trim();
  }

  private async persistLead(
    candidateId: string,
    output: AnalysisOutput,
    confidence: number,
    requiresReview: boolean,
    reviewReason: string | null,
    leadPurpose: string | undefined,
    rawAIResponse: string,
    snapshotMap: Map<string, { id: string; url: string; bodyText: string }>
  ): Promise<ReturnType<typeof prisma.lead.findUnique>> {
    const lead = await prisma.lead.create({
      data: {
        companyName: output.company_name,
        website: output.website,
        industry: output.industry,
        location: output.location,
        description: output.description,
        leadScore: output.lead_score,
        confidenceScore: confidence,
        requiresReview,
        leadPurpose,
        candidateId,
        aiRawOutput: {
          response: JSON.parse(rawAIResponse),
          score_explainer: output.score_explainer,
          review_reason: reviewReason,
          verification_passed: !requiresReview || reviewReason !== "evidence_mismatch",
        },
      },
    });

    for (const issue of output.top_issues) {
      const snapshotKey = issue.evidence.snapshot_id ?? issue.evidence.source_url;
      const snapshot = snapshotMap.get(snapshotKey);

      await prisma.issue.create({
        data: {
          leadId: lead.id,
          title: issue.title,
          description: issue.description,
          category: issue.category,
          severity: issue.severity,
          snapshotId: snapshot?.id,
          aiRawOutput: {
            evidence: issue.evidence,
          },
        },
      });
    }

    if (output.decision_makers) {
      for (const dm of output.decision_makers) {
        const decisionMaker = await prisma.decisionMaker.create({
          data: {
            leadId: lead.id,
            firstName: dm.first_name,
            lastName: dm.last_name,
            title: dm.title,
            role: dm.role,
            aiRawOutput: dm.evidence ? { evidence: dm.evidence } : undefined,
          },
        });

        if (dm.email) {
          await prisma.contact.create({
            data: {
              decisionMakerId: decisionMaker.id,
              type: "email",
              value: dm.email,
              isPrimary: true,
              isVerified: false,
            },
          });
        }

        if (dm.phone) {
          await prisma.contact.create({
            data: {
              decisionMakerId: decisionMaker.id,
              type: "phone",
              value: dm.phone,
              isPrimary: false,
              isVerified: false,
            },
          });
        }
      }
    }

    if (output.email_drafts) {
      for (const draft of output.email_drafts) {
        await prisma.emailDraft.create({
          data: {
            leadId: lead.id,
            subject: draft.subject,
            body: draft.body,
            status: "draft",
          },
        });
      }
    }

    return prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        issues: true,
        decisionMakers: { include: { contacts: true } },
        emailDrafts: true,
      },
    });
  }

  private async createFailedLead(
    candidateId: string,
    companyName: string,
    leadPurpose: string | undefined,
    reason: string
  ): Promise<ReturnType<typeof prisma.lead.findUnique>> {
    const lead = await prisma.lead.create({
      data: {
        companyName,
        leadScore: 0,
        confidenceScore: 0,
        requiresReview: true,
        leadPurpose,
        candidateId,
        aiRawOutput: {
          error: reason,
          failed_at: new Date().toISOString(),
        },
      },
    });

    return prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        issues: true,
        decisionMakers: { include: { contacts: true } },
        emailDrafts: true,
      },
    });
  }
}

export async function analyzeCandidate(
  candidateId: string,
  opts?: AnalyzeOptions
): Promise<ReturnType<typeof prisma.lead.findUnique> | null> {
  const service = new AnalysisService();
  return service.analyzeCandidate(candidateId, opts);
}
