import { prisma } from '@/db';
import { validateLeadPayload, type LeadPayload } from '@/lib/validators/leadSchema';
import { getAIClient, type AIMessage } from './ai';
import { env } from '@/lib/env';

export interface LeadGenerationInput {
  industry: string;
  location: string;
  count: number;
  leadPurpose: string;
  senderName: string;
  senderCompany: string;
}

export interface LeadGenerationResult {
  success: boolean;
  validLeads: Array<{ id: string; companyName: string; requiresReview: boolean }>;
  invalidLeads: Array<{ index: number; errors: string[] }>;
  skippedLeads: Array<{ index: number; reason: string }>;
  totalProcessed: number;
}

function extractDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

const LEAD_GENERATION_SYSTEM_PROMPT = `You are an expert B2B lead researcher. Your task is to identify high-quality leads based on evidence-based research.

CRITICAL RULES:
1. OUTPUT JSON ONLY - No explanations, no markdown, just valid JSON
2. NO HALLUCINATED DATA - Every piece of information must come from a verifiable source
3. Every issue MUST include source_evidence with:
   - source_url: A real, accessible HTTPS URL where you found this information
   - snippet: The exact text excerpt from the source that supports your claim
4. Do NOT invent company names, websites, emails, or any contact information
5. All URLs must be HTTPS
6. lead_score and confidence_score must be between 0 and 100
7. Verified contacts (is_verified: true) MUST have a source_url proving verification

PURPOSE-ALIGNED SCORING:
- lead_score is composed of: need_score (0-40) + fit_score (0-30) + accessibility_score (0-30)
- need_score: ONLY issues directly aligned with the stated LEAD PURPOSE can score above 10/40
  - If issues are NOT clearly aligned with the lead purpose, cap need_score at 10/40
  - If issues ARE directly aligned AND revenue-impacting, allow full 40/40
- Include "score_explainer" field explaining how the score was calculated and purpose alignment

SAFETY RULE:
- If NO issues are found that align with the stated lead purpose:
  - Return empty issues array: "issues": []
  - Cap lead_score at maximum 30
  - Include "next_steps_recommendation": "No issues aligned with stated outreach purpose. Outreach not recommended."

OUTPUT SCHEMA:
{
  "leads": [
    {
      "company_name": "string (required)",
      "website": "https://... (optional)",
      "industry": "string (optional)",
      "employee_count": number (optional),
      "location": "string (optional)",
      "description": "string (optional)",
      "lead_score": number 0-100 (required),
      "confidence_score": number 0-100 (required),
      "score_explainer": "string explaining score breakdown and purpose alignment (required)",
      "next_steps_recommendation": "string (required)",
      "decision_makers": [
        {
          "first_name": "string (required)",
          "last_name": "string (required)",
          "title": "string (optional)",
          "role": "string (optional)",
          "contacts": [
            {
              "type": "email|phone|linkedin|twitter|other",
              "value": "string",
              "is_primary": boolean,
              "is_verified": boolean,
              "source_url": "https://... (required if is_verified=true)"
            }
          ]
        }
      ],
      "issues": [
        {
          "title": "string (required)",
          "description": "string (optional)",
          "category": "string (optional)",
          "severity": "low|medium|high|critical (optional)",
          "confidence_score": number 0-100 (optional),
          "purpose_aligned": boolean (required - true if directly relevant to lead purpose),
          "source_evidence": {
            "source_type": "string (required)",
            "source_url": "https://... (required)",
            "snippet": "string - exact excerpt from source (required)",
            "raw_content": "string (optional)"
          }
        }
      ],
      "email_drafts": [
        {
          "subject": "string (required)",
          "body": "string (required) - must be aligned with lead purpose and identified issues",
          "version": 1,
          "status": "draft"
        }
      ]
    }
  ]
}`;

function buildUserPrompt(input: LeadGenerationInput): string {
  return `You are generating leads specifically for the following business purpose:
"${input.leadPurpose}"

Only identify problems and opportunities that directly justify this purpose.
If no such problems are found for a company, do not include that company as a lead.

Research and identify ${input.count} high-quality B2B leads matching these criteria:

INDUSTRY: ${input.industry}
LOCATION: ${input.location}

CONTEXT:
- Sender: ${input.senderName} from ${input.senderCompany}
- Lead Purpose: ${input.leadPurpose}

REQUIREMENTS:
1. Find companies that have pain points DIRECTLY RELEVANT to: "${input.leadPurpose}"
2. ONLY identify issues that justify the stated lead purpose - ignore unrelated issues even if found
3. Generate value propositions and email drafts strictly aligned with the lead purpose
4. Find decision makers with their contact information
5. Score each lead based on purpose alignment and likelihood to engage
6. For each issue, mark "purpose_aligned": true only if it directly relates to the lead purpose

SCORING GUIDANCE:
- If issues are clearly aligned with "${input.leadPurpose}" and revenue-impacting: allow full need_score (up to 40)
- If issues are NOT aligned with the stated purpose: cap need_score at 10/40
- Explain the score breakdown in score_explainer

Return ONLY valid JSON matching the schema. No explanations.`;
}

function extractLeadsFromResponse(content: string): unknown[] {
  try {
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed.leads && Array.isArray(parsed.leads)) {
      return parsed.leads;
    }

    if (typeof parsed === 'object' && parsed !== null) {
      return [parsed];
    }

    return [];
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    return [];
  }
}

interface PersistLeadResult {
  id: string;
  requiresReview: boolean;
}

async function persistLead(lead: LeadPayload, leadPurpose: string): Promise<PersistLeadResult> {
  const domain = extractDomain(lead.website);
  const requiresReview = (lead.confidence_score ?? 0) < env.MIN_CONFIDENCE_THRESHOLD;

  const result = await prisma.$transaction(async (tx) => {
    // Check for duplicate domain
    if (domain) {
      const existingLead = await tx.lead.findUnique({
        where: { domain },
        select: { id: true, companyName: true },
      });

      if (existingLead) {
        throw new Error(`Duplicate domain: ${domain} already exists for ${existingLead.companyName}`);
      }
    }

    // Create lead with all relations in a transaction
    const created = await tx.lead.create({
      data: {
        companyName: lead.company_name,
        website: lead.website,
        domain,
        industry: lead.industry,
        employeeCount: lead.employee_count,
        location: lead.location,
        description: lead.description,
        leadScore: lead.lead_score,
        confidenceScore: lead.confidence_score,
        requiresReview,
        leadPurpose,
        aiRawOutput: lead.ai_raw_output as object ?? null,
        decisionMakers: {
          create: lead.decision_makers.map((dm) => ({
            firstName: dm.first_name,
            lastName: dm.last_name,
            title: dm.title,
            role: dm.role,
            aiRawOutput: dm.ai_raw_output as object ?? null,
            contacts: {
              create: dm.contacts.map((c) => ({
                type: c.type,
                value: c.value,
                isPrimary: c.is_primary,
                isVerified: c.is_verified,
              })),
            },
          })),
        },
        issues: {
          create: lead.issues.map((issue) => ({
            title: issue.title,
            description: issue.description,
            category: issue.category,
            severity: issue.severity,
            confidenceScore: issue.confidence_score,
            aiRawOutput: issue.ai_raw_output as object ?? null,
            sourceEvidence: {
              create: {
                sourceType: issue.source_evidence.source_type,
                sourceUrl: issue.source_evidence.source_url,
                snippet: issue.source_evidence.snippet,
                rawContent: issue.source_evidence.raw_content,
                aiRawOutput: issue.source_evidence.ai_raw_output as object ?? null,
              },
            },
          })),
        },
        emailDrafts: {
          create: lead.email_drafts.map((draft) => ({
            subject: draft.subject,
            body: draft.body,
            version: draft.version,
            status: draft.status,
            aiRawOutput: draft.ai_raw_output as object ?? null,
          })),
        },
      },
    });

    return created;
  });

  return { id: result.id, requiresReview };
}

export async function generateLeads(
  input: LeadGenerationInput
): Promise<LeadGenerationResult> {
  const aiClient = getAIClient();

  const messages: AIMessage[] = [
    { role: 'system', content: LEAD_GENERATION_SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(input) },
  ];

  console.log(`[LeadGeneration] Requesting ${input.count} leads for ${input.industry} in ${input.location}`);

  let response;
  try {
    response = await aiClient.complete({
      messages,
      responseFormat: 'json',
    });
  } catch (error) {
    console.error('[LeadGeneration] AI request failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      input: { industry: input.industry, location: input.location, count: input.count },
      timestamp: new Date().toISOString(),
    });
    throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log(`[LeadGeneration] Received AI response (${response.content.length} chars)`);

  const rawLeads = extractLeadsFromResponse(response.content);

  if (rawLeads.length === 0) {
    console.error('[LeadGeneration] AI returned no parseable leads:', {
      responsePreview: response.content.slice(0, 500),
      timestamp: new Date().toISOString(),
    });
  }

  const result: LeadGenerationResult = {
    success: true,
    validLeads: [],
    invalidLeads: [],
    skippedLeads: [],
    totalProcessed: rawLeads.length,
  };

  for (let i = 0; i < rawLeads.length; i++) {
    const rawLead = rawLeads[i];
    const validation = validateLeadPayload(rawLead);

    if (!validation.success) {
      const errors = validation.errors.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );

      console.warn(`[LeadGeneration] Lead ${i} rejected:`, errors);

      result.invalidLeads.push({ index: i, errors });
      continue;
    }

    try {
      const persistResult = await persistLead(validation.data, input.leadPurpose);

      const status = persistResult.requiresReview ? 'persisted (requires review)' : 'persisted';
      console.log(`[LeadGeneration] Lead ${i} ${status}: ${persistResult.id}`);

      result.validLeads.push({
        id: persistResult.id,
        companyName: validation.data.company_name,
        requiresReview: persistResult.requiresReview,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';

      // Check if it's a duplicate domain error
      if (errorMessage.includes('Duplicate domain')) {
        console.warn(`[LeadGeneration] Lead ${i} skipped:`, errorMessage);
        result.skippedLeads.push({ index: i, reason: errorMessage });
      } else {
        console.error(`[LeadGeneration] Lead ${i} failed to persist:`, errorMessage);
        result.invalidLeads.push({
          index: i,
          errors: [`Database error: ${errorMessage}`],
        });
      }
    }
  }

  result.success = result.validLeads.length > 0;

  console.log(
    `[LeadGeneration] Complete: ${result.validLeads.length} valid, ${result.invalidLeads.length} invalid, ${result.skippedLeads.length} skipped`
  );

  return result;
}
