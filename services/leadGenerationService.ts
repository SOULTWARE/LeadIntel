import { prisma } from '@/db';
import { validateLeadPayload, type LeadPayload } from '@/lib/validators/leadSchema';
import { getAIClient, type AIMessage } from './ai';

export interface LeadGenerationInput {
  industry: string;
  location: string;
  count: number;
  senderName: string;
  senderCompany: string;
}

export interface LeadGenerationResult {
  success: boolean;
  validLeads: Array<{ id: string; companyName: string }>;
  invalidLeads: Array<{ index: number; errors: string[] }>;
  totalProcessed: number;
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
          "source_evidence": {
            "source_type": "string (required)",
            "source_url": "https://... (required)",
            "snippet": "string - exact excerpt from source (required)",
            "raw_content": "string (optional)"
          }
        }
      ],
      "email_drafts": []
    }
  ]
}`;

function buildUserPrompt(input: LeadGenerationInput): string {
  return `Research and identify ${input.count} high-quality B2B leads matching these criteria:

INDUSTRY: ${input.industry}
LOCATION: ${input.location}

CONTEXT:
- Sender: ${input.senderName} from ${input.senderCompany}
- Purpose: Outbound sales outreach

REQUIREMENTS:
1. Find companies that likely have pain points ${input.senderCompany} can solve
2. Identify specific, evidence-based issues each company faces
3. Find decision makers with their contact information
4. Score each lead based on fit and likelihood to engage

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

async function persistLead(lead: LeadPayload): Promise<string> {
  const result = await prisma.lead.create({
    data: {
      companyName: lead.company_name,
      website: lead.website,
      industry: lead.industry,
      employeeCount: lead.employee_count,
      location: lead.location,
      description: lead.description,
      leadScore: lead.lead_score,
      confidenceScore: lead.confidence_score,
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

  return result.id;
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

  const response = await aiClient.complete({
    messages,
    responseFormat: 'json',
  });

  console.log(`[LeadGeneration] Received AI response (${response.content.length} chars)`);

  const rawLeads = extractLeadsFromResponse(response.content);

  const result: LeadGenerationResult = {
    success: true,
    validLeads: [],
    invalidLeads: [],
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
      const leadId = await persistLead(validation.data);

      console.log(`[LeadGeneration] Lead ${i} persisted: ${leadId}`);

      result.validLeads.push({
        id: leadId,
        companyName: validation.data.company_name,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';

      console.error(`[LeadGeneration] Lead ${i} failed to persist:`, errorMessage);

      result.invalidLeads.push({
        index: i,
        errors: [`Database error: ${errorMessage}`],
      });
    }
  }

  result.success = result.validLeads.length > 0;

  console.log(
    `[LeadGeneration] Complete: ${result.validLeads.length} valid, ${result.invalidLeads.length} invalid`
  );

  return result;
}
