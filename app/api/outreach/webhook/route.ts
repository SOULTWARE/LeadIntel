import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import {
  mapOutreachEventTypeToMetric,
  OUTREACH_EVENT_TYPES,
} from "@/lib/leads/outreachEvents";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const EventSchema = z
  .object({
    eventId: z.string().min(1),
    type: z.enum(OUTREACH_EVENT_TYPES),
    occurredAt: z.string().datetime().optional(),
    leadId: z.string().min(1).optional(),
    contactId: z.string().min(1).optional(),
    email: z.string().email().optional(),
    messageId: z.string().min(1).optional(),
    campaignName: z.string().min(1).optional(),
    batchCode: z.string().min(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.leadId && !value.contactId && !value.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each event requires leadId, contactId, or email.",
      });
    }
  });

const BodySchema = z.object({
  provider: z.string().min(1),
  events: z.array(EventSchema).min(1),
});

type EventInput = z.infer<typeof EventSchema>;

type ResolvedEventTarget = {
  leadId: string;
  contactId: string | null;
  campaignId: string | null;
  batchId: string | null;
  email: string | null;
};

function getWebhookSecretCandidate(request: NextRequest): string {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-outreach-webhook-secret")?.trim() || "";
}

function hasValidWebhookSecret(
  expectedSecret: string,
  candidateSecret: string,
): boolean {
  const expected = Buffer.from(expectedSecret);
  const candidate = Buffer.from(candidateSecret);
  if (expected.length !== candidate.length) return false;
  return timingSafeEqual(expected, candidate);
}

function normalizeEmail(email?: string): string | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

async function resolveEventTarget(
  event: EventInput,
): Promise<ResolvedEventTarget | null> {
  const normalizedEmail = normalizeEmail(event.email);

  if (event.contactId) {
    const contact = await prisma.contact.findUnique({
      where: { id: event.contactId },
      select: {
        id: true,
        email: true,
        leadId: true,
        lead: {
          select: {
            id: true,
            campaignId: true,
            batchId: true,
            primaryContactId: true,
            email: true,
          },
        },
      },
    });

    if (contact) {
      return {
        leadId: contact.leadId,
        contactId: contact.id,
        campaignId: contact.lead.campaignId,
        batchId: contact.lead.batchId,
        email: normalizedEmail || contact.email || contact.lead.email || null,
      };
    }
  }

  if (event.leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: event.leadId },
      select: {
        id: true,
        email: true,
        campaignId: true,
        batchId: true,
        primaryContactId: true,
        contacts: normalizedEmail
          ? {
              where: { email: normalizedEmail },
              select: { id: true, email: true },
              take: 1,
            }
          : false,
      },
    });

    if (lead) {
      return {
        leadId: lead.id,
        contactId: Array.isArray(lead.contacts)
          ? lead.contacts[0]?.id || lead.primaryContactId || null
          : lead.primaryContactId || null,
        campaignId: lead.campaignId,
        batchId: lead.batchId,
        email:
          normalizedEmail ||
          (Array.isArray(lead.contacts) ? lead.contacts[0]?.email : null) ||
          lead.email ||
          null,
      };
    }
  }

  if (!normalizedEmail) {
    return null;
  }

  const matchingContacts = await prisma.contact.findMany({
    where: { email: normalizedEmail },
    select: {
      id: true,
      leadId: true,
      isPrimary: true,
      lead: {
        select: {
          id: true,
          email: true,
          campaignId: true,
          batchId: true,
          primaryContactId: true,
          campaign: {
            select: {
              name: true,
            },
          },
          batch: {
            select: {
              code: true,
            },
          },
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    take: 5,
  });

  const filteredContacts = matchingContacts.filter((contact) => {
    if (event.campaignName && contact.lead.campaign?.name !== event.campaignName) {
      return false;
    }
    if (event.batchCode && contact.lead.batch?.code !== event.batchCode) {
      return false;
    }
    return true;
  });

  const uniqueContactLeads = Array.from(
    new Map(filteredContacts.map((contact) => [contact.leadId, contact])).values(),
  );

  if (uniqueContactLeads.length === 1) {
    const match = uniqueContactLeads[0];
    return {
      leadId: match.leadId,
      contactId: match.id,
      campaignId: match.lead.campaignId,
      batchId: match.lead.batchId,
      email: normalizedEmail || match.lead.email || null,
    };
  }

  const matchingLeads = await prisma.lead.findMany({
    where: {
      email: normalizedEmail,
      campaign: event.campaignName ? { is: { name: event.campaignName } } : undefined,
      batch: event.batchCode ? { is: { code: event.batchCode } } : undefined,
    },
    select: {
      id: true,
      email: true,
      campaignId: true,
      batchId: true,
      primaryContactId: true,
    },
    take: 2,
  });

  if (matchingLeads.length !== 1) {
    return null;
  }

  const match = matchingLeads[0];
  return {
    leadId: match.id,
    contactId: match.primaryContactId || null,
    campaignId: match.campaignId,
    batchId: match.batchId,
    email: normalizedEmail || match.email || null,
  };
}

async function ingestEvent(provider: string, event: EventInput) {
  const target = await resolveEventTarget(event);
  if (!target) {
    return {
      status: "skipped" as const,
      reason: "Unable to resolve a unique lead for this event.",
    };
  }

  const metricField = mapOutreachEventTypeToMetric(event.type);
  const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date();

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.outreachEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider,
          externalEventId: event.eventId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return "duplicate" as const;
    }

    await tx.outreachEvent.create({
      data: {
        provider,
        externalEventId: event.eventId,
        messageId: event.messageId,
        type: event.type,
        occurredAt,
        email: target.email || undefined,
        leadId: target.leadId,
        contactId: target.contactId || undefined,
        campaignId: target.campaignId || undefined,
        batchId: target.batchId || undefined,
        payloadJson: event as unknown as Prisma.InputJsonValue,
      },
    });

    if (metricField) {
      const leadUpdate: Prisma.LeadUpdateInput = {
        [metricField]: { increment: 1 },
      };

      await tx.lead.update({
        where: { id: target.leadId },
        data: leadUpdate,
      });
    }

    if (event.type === "SENT" && target.batchId) {
      await tx.leadBatch.updateMany({
        where: {
          id: target.batchId,
          status: {
            in: ["DRAFT", "READY", "EXPORTED"],
          },
        },
        data: {
          status: "ACTIVE",
        },
      });
    }

    return "processed" as const;
  });

  return {
    status: result,
    leadId: target.leadId,
  };
}

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.OUTREACH_WEBHOOK_SECRET;
    if (!configuredSecret) {
      return NextResponse.json(
        { success: false, error: "OUTREACH_WEBHOOK_SECRET is not configured" },
        { status: 503 },
      );
    }

    const candidateSecret = getWebhookSecretCandidate(request);
    if (!candidateSecret || !hasValidWebhookSecret(configuredSecret, candidateSecret)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload" },
        { status: 400 },
      );
    }

    let processed = 0;
    let duplicates = 0;
    let skipped = 0;
    const results: Array<{
      eventId: string;
      status: "processed" | "duplicate" | "skipped";
      leadId?: string;
      reason?: string;
    }> = [];

    for (const event of parsed.data.events) {
      const outcome = await ingestEvent(parsed.data.provider, event);

      if (outcome.status === "processed") processed += 1;
      if (outcome.status === "duplicate") duplicates += 1;
      if (outcome.status === "skipped") skipped += 1;

      results.push({
        eventId: event.eventId,
        status: outcome.status,
        leadId: outcome.leadId,
        reason: outcome.reason,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: parsed.data.provider,
        processed,
        duplicates,
        skipped,
        results,
      },
    });
  } catch (error) {
    console.error("[API /api/outreach/webhook] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
