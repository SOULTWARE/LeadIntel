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

/**
 * Evidence Verification Utilities
 *
 * ⚠️ IMMUTABLE RULE: NO AI-CLAIMS WITHOUT SNAPSHOT
 * See: src/docs/architecture.md
 *
 * All evidence must be verified against stored snapshot content.
 */

export interface Snapshot {
  id: string;
  url: string;
  textExtract: string | null;
  sourceType?: string | null;
}

export interface EvidenceVerificationResult {
  ok: boolean;
  errors: string[];
}

interface LeadJsonIssue {
  title?: string;
  evidence?: {
    source_url?: string;
    snapshot_id?: string;
    excerpt?: string;
  };
  source_evidence?: {
    source_url?: string;
    snippet?: string;
  };
}

interface LeadJsonDecisionMaker {
  first_name?: string;
  last_name?: string;
  source_url?: string;
  evidence?: {
    source_url?: string;
    snapshot_id?: string;
    excerpt?: string;
  };
  contacts?: LeadJsonContact[];
}

interface LeadJsonContact {
  type?: string;
  value?: string;
  is_verified?: boolean;
  source_url?: string;
}

interface LeadJson {
  top_issues?: LeadJsonIssue[];
  issues?: LeadJsonIssue[];
  decision_makers?: LeadJsonDecisionMaker[];
}

/**
 * E.164 phone number regex pattern.
 * Matches: +1234567890 (7-15 digits after +)
 */
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Normalize text for comparison (lowercase, collapse whitespace, normalize quotes).
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .trim();
}

/**
 * Validate phone number in E.164 format.
 * Returns the cleaned phone if valid, null otherwise.
 */
export function validateE164Phone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  if (E164_REGEX.test(cleaned)) {
    return cleaned;
  }

  if (/^\d{10,11}$/.test(cleaned)) {
    return `+${cleaned.startsWith("1") ? "" : "1"}${cleaned}`;
  }

  return null;
}

/**
 * Build a lookup map from snapshots for efficient verification.
 */
function buildSnapshotMap(
  snapshots: Snapshot[]
): Map<string, { id: string; url: string; bodyText: string }> {
  const map = new Map<string, { id: string; url: string; bodyText: string }>();

  for (const s of snapshots) {
    const entry = {
      id: s.id,
      url: s.url,
      bodyText: s.textExtract ?? "",
    };
    map.set(s.id, entry);
    map.set(s.url, entry);

    try {
      const urlObj = new URL(s.url);
      map.set(urlObj.origin + urlObj.pathname, entry);
    } catch {
      // Invalid URL, skip alternate key
    }
  }

  return map;
}

/**
 * Verify that all evidence in a lead JSON exists in the provided snapshots.
 *
 * Checks:
 * 1. Each issue's evidence.excerpt exists verbatim in matching snapshot
 * 2. Each decision_maker's source_url exists in snapshots
 * 3. Each contact's source_url exists in snapshots
 * 4. Verified emails: source_url snapshot contains the email substring
 * 5. Phone numbers are validated as E.164
 */
export function verifyEvidenceAgainstSnapshots(
  leadJson: LeadJson,
  snapshots: Snapshot[]
): EvidenceVerificationResult {
  const errors: string[] = [];
  const snapshotMap = buildSnapshotMap(snapshots);
  const snapshotUrls = new Set(snapshots.map((s) => s.url));

  const issues = leadJson.top_issues ?? leadJson.issues ?? [];
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const issueLabel = issue.title ?? `Issue #${i + 1}`;

    const evidence = issue.evidence ?? issue.source_evidence;
    if (!evidence) {
      errors.push(`${issueLabel}: Missing evidence object`);
      continue;
    }

    const sourceUrl = evidence.source_url;
    const snapshotId = "snapshot_id" in evidence ? evidence.snapshot_id : undefined;
    const excerpt = "excerpt" in evidence ? evidence.excerpt : "snippet" in evidence ? evidence.snippet : undefined;

    if (!sourceUrl && !snapshotId) {
      errors.push(`${issueLabel}: Missing source_url or snapshot_id in evidence`);
      continue;
    }

    const snapshotKey = snapshotId ?? sourceUrl;
    const snapshot = snapshotMap.get(snapshotKey!);

    if (!snapshot) {
      errors.push(
        `${issueLabel}: Referenced snapshot not found (${snapshotKey}). ` +
          `Available URLs: ${Array.from(snapshotUrls).join(", ")}`
      );
      continue;
    }

    if (!excerpt) {
      errors.push(`${issueLabel}: Missing evidence excerpt`);
      continue;
    }

    const normalizedExcerpt = normalizeText(excerpt);
    const normalizedBody = normalizeText(snapshot.bodyText);

    if (!normalizedBody.includes(normalizedExcerpt)) {
      errors.push(
        `${issueLabel}: Evidence excerpt not found verbatim in snapshot. ` +
          `Excerpt: "${excerpt.slice(0, 50)}..."`
      );
    }
  }

  const decisionMakers = leadJson.decision_makers ?? [];
  for (let i = 0; i < decisionMakers.length; i++) {
    const dm = decisionMakers[i];
    const dmLabel = `${dm.first_name ?? ""} ${dm.last_name ?? ""}`.trim() || `DecisionMaker #${i + 1}`;

    if (dm.source_url) {
      if (!snapshotMap.has(dm.source_url)) {
        errors.push(
          `${dmLabel}: source_url "${dm.source_url}" not found in snapshots`
        );
      }
    }

    if (dm.evidence) {
      const snapshotKey = dm.evidence.snapshot_id ?? dm.evidence.source_url;
      if (snapshotKey) {
        const snapshot = snapshotMap.get(snapshotKey);
        if (!snapshot) {
          errors.push(
            `${dmLabel}: Evidence snapshot not found (${snapshotKey})`
          );
        } else if (dm.evidence.excerpt) {
          const normalizedExcerpt = normalizeText(dm.evidence.excerpt);
          const normalizedBody = normalizeText(snapshot.bodyText);

          if (!normalizedBody.includes(normalizedExcerpt)) {
            errors.push(
              `${dmLabel}: Evidence excerpt not found verbatim in snapshot`
            );
          }
        }
      }
    }

    const contacts = dm.contacts ?? [];
    for (let j = 0; j < contacts.length; j++) {
      const contact = contacts[j];
      const contactLabel = `${dmLabel} contact #${j + 1} (${contact.type ?? "unknown"})`;

      if (contact.source_url) {
        const snapshot = snapshotMap.get(contact.source_url);
        if (!snapshot) {
          errors.push(
            `${contactLabel}: source_url "${contact.source_url}" not found in snapshots`
          );
        } else if (contact.is_verified && contact.type === "email" && contact.value) {
          const normalizedBody = normalizeText(snapshot.bodyText);
          const normalizedEmail = normalizeText(contact.value);

          if (!normalizedBody.includes(normalizedEmail)) {
            errors.push(
              `${contactLabel}: Verified email "${contact.value}" not found in source snapshot`
            );
          }
        }
      } else if (contact.is_verified) {
        errors.push(
          `${contactLabel}: Verified contact must have source_url`
        );
      }

      if (contact.type === "phone" && contact.value) {
        const validatedPhone = validateE164Phone(contact.value);
        if (!validatedPhone) {
          errors.push(
            `${contactLabel}: Phone "${contact.value}" is not valid E.164 format`
          );
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * Combined validation: structure (Zod) + evidence verification.
 */
export function validateAndVerifyLead(
  data: unknown,
  snapshots: Snapshot[]
): {
  success: boolean;
  data?: LeadPayload;
  structureErrors?: z.ZodError;
  evidenceErrors?: string[];
} {
  const structureResult = leadSchema.safeParse(data);

  if (!structureResult.success) {
    return {
      success: false,
      structureErrors: structureResult.error,
    };
  }

  const evidenceResult = verifyEvidenceAgainstSnapshots(
    data as LeadJson,
    snapshots
  );

  if (!evidenceResult.ok) {
    return {
      success: false,
      data: structureResult.data,
      evidenceErrors: evidenceResult.errors,
    };
  }

  return {
    success: true,
    data: structureResult.data,
  };
}
