import { z } from 'zod';

const httpsUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith('https://'), {
    message: 'URL must use HTTPS',
  });

const scoreSchema = z
  .number()
  .min(0, 'Score must be at least 0')
  .max(100, 'Score must be at most 100');

const sourceEvidenceSchema = z.object({
  source_type: z.string(),
  source_url: httpsUrlSchema,
  raw_content: z.string().optional(),
  snippet: z.string().min(1, 'Evidence excerpt is required'),
  retrieved_at: z.string().datetime().optional(),
  ai_raw_output: z.unknown().optional(),
});

const issueSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  confidence_score: scoreSchema.optional(),
  purpose_aligned: z.boolean().default(false),
  source_evidence: sourceEvidenceSchema,
  ai_raw_output: z.unknown().optional(),
});

const contactSchema = z
  .object({
    type: z.enum(['email', 'phone', 'linkedin', 'twitter', 'other']),
    value: z.string().min(1),
    is_primary: z.boolean().default(false),
    is_verified: z.boolean().default(false),
    source_url: httpsUrlSchema.optional(),
  })
  .refine(
    (contact) => {
      if (contact.is_verified && !contact.source_url) {
        return false;
      }
      return true;
    },
    {
      message: 'Verified contacts must have a source_url',
    }
  );

const decisionMakerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  title: z.string().optional(),
  role: z.string().optional(),
  contacts: z.array(contactSchema).default([]),
  ai_raw_output: z.unknown().optional(),
});

const leadSchema = z.object({
  company_name: z.string().min(1),
  website: httpsUrlSchema.optional(),
  industry: z.string().optional(),
  employee_count: z.number().int().positive().optional(),
  location: z.string().optional(),
  description: z.string().optional(),

  lead_score: scoreSchema,
  confidence_score: scoreSchema,
  score_explainer: z.string().optional(),
  next_steps_recommendation: z.string().optional(),

  decision_makers: z.array(decisionMakerSchema).default([]),
  issues: z.array(issueSchema).default([]),
  email_drafts: z
    .array(
      z.object({
        subject: z.string().min(1),
        body: z.string().min(1),
        version: z.number().int().positive().default(1),
        status: z.enum(['draft', 'approved', 'sent']).default('draft'),
        ai_raw_output: z.unknown().optional(),
      })
    )
    .default([]),

  ai_raw_output: z.unknown().optional(),
});

export type LeadPayload = z.infer<typeof leadSchema>;
export type Issue = z.infer<typeof issueSchema>;
export type SourceEvidence = z.infer<typeof sourceEvidenceSchema>;
export type DecisionMaker = z.infer<typeof decisionMakerSchema>;
export type Contact = z.infer<typeof contactSchema>;

export function validateLeadPayload(data: unknown): {
  success: true;
  data: LeadPayload;
} | {
  success: false;
  errors: z.ZodError;
} {
  const result = leadSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

export { leadSchema, issueSchema, sourceEvidenceSchema, decisionMakerSchema, contactSchema };
