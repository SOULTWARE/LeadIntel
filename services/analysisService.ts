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

const ANALYSIS_SYSTEM_PROMPT = `You are a lead research specialist. Analyze company websites to extract comprehensive business intelligence.

You will be given:
- company_name
- leadPurpose (why user needs leads - e.g., "I need leads to create websites for")
- an ordered list of snapshot objects: {snapshot_id, source_url, source_type, body_text}

Your mission: Extract ALL available business intelligence from the snapshots.

## EXTRACTION PRIORITIES:

### 1. Company Metadata (CRITICAL - look carefully in body_text)
- **industry**: Infer from content (e.g., "Restaurant", "Healthcare", "Retail", "Manufacturing")
- **location**: Look for addresses, "Located in", city/state mentions, footer content
- **employee_count**: Look for "team of X", "X employees", company size indicators. Estimate if clues exist.
- **description**: Write a 1-2 sentence summary of what the company does

### 2. Decision Makers (search thoroughly)
Look for names + titles in: About Us, Team, Leadership, Contact pages
- CEO, Owner, President, Founder, Manager, Director
- Extract: first_name, last_name, title, role
- Include email/phone if found near their name
- MUST include evidence with exact excerpt from body_text

### 3. Issues/Opportunities (aligned with leadPurpose)
Identify problems or opportunities that match why the user needs leads:
- For "websites": outdated design, no mobile site, slow loading mentions, broken features
- For "marketing": poor social presence, no reviews section, weak calls-to-action
- For "software": manual processes, paper-based mentions, inefficiencies

### 4. Contact Information
- General email (info@, contact@)
- Phone numbers
- Physical address

## SCORING RUBRIC:
- Need (0-40): How much does this company need the user's service based on leadPurpose?
- Budget (0-30): Size indicators, premium positioning, multiple locations = higher budget
- Contact (0-20): Decision maker found = 20, general contact = 10, none = 0
- Timing (0-10): Urgency signals, hiring, expanding, problems mentioned

## RULES:
1) Use ONLY the provided body_text. Never invent content.
2) Every claim needs evidence: {source_url, excerpt (max 25 words from body_text)}
3) If data cannot be found, set to null - don't guess without evidence
4) Output valid JSON only. No markdown, no extra text.
5) If no decision makers found, still return decision_makers: [] (not null)

Be thorough - scan all snapshots carefully for names, titles, locations, and business details.`;

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
  need: z.number().min(0).max(40).optional().default(0),
  budget: z.number().min(0).max(30).optional().default(0),
  contact: z.number().min(0).max(20).optional().default(0),
  timing: z.number().min(0).max(10).optional().default(0),
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
  employee_count: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  lead_score: z.number().min(0).max(100),
  score_explainer: ScoreExplainerSchema,
  confidence: z.number().min(0).max(100),
  top_issues: z.array(IssueSchema),
  decision_makers: z.array(DecisionMakerSchema).optional().nullable(),
  email_drafts: z.array(EmailDraftSchema).optional(),
  recommended_manual_review: z.union([z.string(), z.boolean()]).optional().nullable(),
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
      console.log("[AnalysisService] Raw AI response length:", rawAIResponse.length);

      // Try to extract JSON if wrapped in markdown code blocks
      let jsonContent = rawAIResponse;
      const jsonMatch = rawAIResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }

      // Handle empty or whitespace-only response
      if (!jsonContent || jsonContent.trim() === '') {
        console.error("[AnalysisService] AI returned empty response");
        throw new Error("AI returned empty response");
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error("[AnalysisService] JSON parse error. Content:", jsonContent.substring(0, 500));
        throw new Error(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'parse error'}`);
      }

      // Log what we got for debugging
      console.log("[AnalysisService] Parsed keys:", Object.keys(parsed || {}));

      // If parsed is empty or missing required fields, throw descriptive error
      if (!parsed || typeof parsed !== 'object') {
        throw new Error("AI response is not a valid object");
      }

      // Normalize AI response - handle both flat and nested structures
      // AI sometimes returns nested structure like { company_metadata, scoring, issues_opportunities }
      const flatParsed = this.normalizeAIResponse(parsed);
      console.log("[AnalysisService] Normalized keys:", Object.keys(flatParsed));

      // Normalize score_explainer keys to lowercase (AI sometimes returns capitalized keys)
      if (flatParsed.score_explainer && typeof flatParsed.score_explainer === 'object') {
        const normalizedExplainer: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(flatParsed.score_explainer as Record<string, unknown>)) {
          normalizedExplainer[key.toLowerCase()] = value;
        }
        flatParsed.score_explainer = normalizedExplainer;
      }

      // Company name fallback only - other data comes from AI or research agent
      // Provide score defaults to prevent Zod failures - these are "baseline" scores that indicate
      // AI couldn't properly assess the lead, triggering manual review
      const normalized = {
        company_name: flatParsed.company_name ?? candidate.companyName,
        website: flatParsed.website ?? null,
        industry: flatParsed.industry ?? null,  // Will be researched if missing
        location: flatParsed.location ?? null,  // Will be researched if missing
        employee_count: flatParsed.employee_count ?? null,  // Will be researched if missing
        description: flatParsed.description ?? null,
        // Default to 50 (neutral) if AI didn't provide scores - triggers review
        lead_score: flatParsed.lead_score ?? 50,
        score_explainer: flatParsed.score_explainer ?? { need: 0, budget: 0, contact: 0, timing: 0 },
        confidence: flatParsed.confidence ?? 30,  // Low confidence triggers review
        top_issues: flatParsed.top_issues ?? [],  // Can be empty, research agent will find issues
        decision_makers: flatParsed.decision_makers ?? [],  // Can be empty, research agent will find
        email_drafts: flatParsed.email_drafts ?? [],
        recommended_manual_review: flatParsed.recommended_manual_review ??
          (flatParsed.lead_score === undefined ? "AI could not determine lead score - manual review recommended" : undefined),
      };

      analysisOutput = AnalysisOutputSchema.parse(normalized);
    } catch (error) {
      console.error("Analysis failed:", error);
      // Get website from candidate's domain if available
      const website = candidate.domain ? `https://${candidate.domain}` : null;
      return this.createFailedLead(
        candidateId,
        candidate.companyName,
        opts.leadPurpose,
        `analysis_error: ${error instanceof Error ? error.message : String(error)}`,
        website
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
      reviewReason = typeof analysisOutput.recommended_manual_review === 'string'
        ? analysisOutput.recommended_manual_review
        : 'Manual review recommended';
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
    // Extract contact info from raw AI response
    let contactInfo: { email?: string; phone?: string; address?: string } = {};
    try {
      const rawParsed = JSON.parse(rawAIResponse);
      if (rawParsed.contact_information) {
        contactInfo = {
          email: rawParsed.contact_information.email ?? rawParsed.contact_information.general_email,
          phone: rawParsed.contact_information.phone ?? rawParsed.contact_information.phone_number,
          address: rawParsed.contact_information.address ?? rawParsed.contact_information.physical_address,
        };
      }
    } catch { /* ignore parse errors */ }

    const lead = await prisma.lead.create({
      data: {
        companyName: output.company_name,
        website: output.website,
        industry: output.industry,
        location: output.location,
        employeeCount: output.employee_count,
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
          contact_info: contactInfo,
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

  /**
   * Normalize AI response to handle different structures
   * AI sometimes returns nested structure like { company_metadata, scoring, issues_opportunities }
   * This flattens it to our expected schema
   */
  private normalizeAIResponse(parsed: Record<string, unknown>): Record<string, unknown> {
    // If it already has our expected keys, return as-is
    if (parsed.lead_score !== undefined || parsed.company_name !== undefined) {
      return parsed;
    }

    const result: Record<string, unknown> = {};

    // Extract from company_metadata
    if (parsed.company_metadata && typeof parsed.company_metadata === 'object') {
      const meta = parsed.company_metadata as Record<string, unknown>;
      result.company_name = meta.company_name ?? meta.name;
      result.website = meta.website ?? meta.url;
      result.industry = meta.industry;
      result.location = meta.location ?? meta.headquarters;
      result.employee_count = meta.employee_count ?? meta.employees ?? meta.size;
      result.description = meta.description ?? meta.summary;
    }

    // Extract from scoring
    if (parsed.scoring && typeof parsed.scoring === 'object') {
      const scoring = parsed.scoring as Record<string, unknown>;
      console.log("[AnalysisService] Scoring object keys:", Object.keys(scoring));

      // Extract individual score components
      const needScore = Number(scoring.need ?? scoring.need_score ?? 0);
      const budgetScore = Number(scoring.budget ?? scoring.budget_score ?? 0);
      const contactScore = Number(scoring.contact ?? scoring.contact_score ?? 0);
      const timingScore = Number(scoring.timing ?? scoring.timing_score ?? 0);

      // Build score_explainer from components
      result.score_explainer = { need: needScore, budget: budgetScore, contact: contactScore, timing: timingScore };

      // Calculate lead_score: if not provided directly, compute from components
      // Formula: weighted average of components (need=30%, budget=30%, contact=20%, timing=20%)
      const computedScore = Math.round(needScore * 0.3 + budgetScore * 0.3 + contactScore * 0.2 + timingScore * 0.2);
      result.lead_score = scoring.lead_score ?? scoring.score ?? scoring.total_score ??
                          scoring.overall_score ?? computedScore;

      // Calculate confidence: if not provided, estimate from data completeness
      // Higher confidence if all score components are non-zero
      const componentsProvided = [needScore, budgetScore, contactScore, timingScore].filter(s => s > 0).length;
      const estimatedConfidence = Math.round((componentsProvided / 4) * 70 + 30); // 30-100 range
      result.confidence = scoring.confidence ?? scoring.confidence_score ?? estimatedConfidence;

      console.log("[AnalysisService] Calculated scores:", {
        lead_score: result.lead_score,
        confidence: result.confidence,
        components: { needScore, budgetScore, contactScore, timingScore }
      });

      result.recommended_manual_review = scoring.recommended_manual_review ?? scoring.review_notes ??
                                         scoring.manual_review ?? scoring.notes;
    }

    // Extract from issues_opportunities
    if (parsed.issues_opportunities && typeof parsed.issues_opportunities === 'object') {
      const issues = parsed.issues_opportunities as Record<string, unknown>;
      result.top_issues = issues.issues ?? issues.top_issues ?? issues.opportunities ?? [];
    } else if (Array.isArray(parsed.issues)) {
      result.top_issues = parsed.issues;
    }

    // Extract decision_makers (may already be at top level or nested)
    if (Array.isArray(parsed.decision_makers)) {
      result.decision_makers = parsed.decision_makers;
    } else if (parsed.decision_makers && typeof parsed.decision_makers === 'object') {
      const dm = parsed.decision_makers as Record<string, unknown>;
      result.decision_makers = dm.people ?? dm.contacts ?? dm.list ?? [];
    }

    // Extract contact_information if present - save email, phone, address
    if (parsed.contact_information && typeof parsed.contact_information === 'object') {
      const contact = parsed.contact_information as Record<string, unknown>;
      if (!result.website && contact.website) result.website = contact.website;
      // Store contact info for later use
      result.contact_email = contact.email ?? contact.general_email ?? contact.contact_email;
      result.contact_phone = contact.phone ?? contact.phone_number ?? contact.telephone;
      result.contact_address = contact.address ?? contact.physical_address ?? contact.location;
      console.log("[AnalysisService] Extracted contact info:", {
        email: result.contact_email,
        phone: result.contact_phone
      });
    }

    // Email drafts
    result.email_drafts = parsed.email_drafts ?? parsed.emails ?? [];

    // Carry over any flat fields that might exist
    if (parsed.lead_score !== undefined) result.lead_score = parsed.lead_score;
    if (parsed.confidence !== undefined) result.confidence = parsed.confidence;
    if (parsed.score_explainer !== undefined) result.score_explainer = parsed.score_explainer;
    if (parsed.top_issues !== undefined) result.top_issues = parsed.top_issues;
    if (parsed.recommended_manual_review !== undefined) result.recommended_manual_review = parsed.recommended_manual_review;

    console.log("[AnalysisService] Normalized from nested structure:", {
      hasLeadScore: result.lead_score !== undefined,
      hasConfidence: result.confidence !== undefined,
      hasScoreExplainer: result.score_explainer !== undefined,
    });

    return result;
  }

  private async createFailedLead(
    candidateId: string,
    companyName: string,
    leadPurpose: string | undefined,
    reason: string,
    website?: string | null
  ): Promise<ReturnType<typeof prisma.lead.findUnique>> {
    const lead = await prisma.lead.create({
      data: {
        companyName,
        website: website ?? null,
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
