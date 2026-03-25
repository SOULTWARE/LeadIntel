import "dotenv/config";

import { prisma } from "../db";
import { jobQueueService } from "../services/jobQueueService";
import { contactDiscoveryService } from "../services/contactDiscoveryService";
import { kickboxService } from "../services/kickboxService";
import { websiteDiscoveryService } from "../services/websiteDiscoveryService";
import { creditsService } from "../services/creditsService";
import { CreditAction, getCreditCost } from "../lib/credits/costs";
import { rankDiscoveredContacts } from "../lib/leads/contacts";
import { sleep } from "../lib/utils";
import {
  EmailVerificationStatus,
  LeadProcessingState,
  type Job,
  type Prisma,
} from "@prisma/client";
import { LOCK_EXPIRY_MS } from "../services/jobQueueService";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} environment variable is not set`);
  return v;
}

function getPayloadObject(job: Job): Record<string, unknown> {
  const payload = job.payload as Prisma.JsonValue | null;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }
  return payload as Record<string, unknown>;
}

function getRoleHints(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

async function processEmailDiscoverJob(job: Job): Promise<void> {
  const payload = getPayloadObject(job);
  const leadId = payload.leadId;
  if (!leadId) {
    throw new Error("EMAIL_DISCOVER job missing payload.leadId");
  }

  if (typeof leadId !== "string") {
    throw new Error("EMAIL_DISCOVER job payload.leadId must be a string");
  }

  console.log(`[worker] EMAIL_DISCOVER start leadId=${leadId}`);

  let lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    console.log(`[worker] EMAIL_DISCOVER lead not found leadId=${leadId}`);
    return;
  }

  if (!lead.website) {
    console.log(
      `[worker] EMAIL_DISCOVER missing website; attempting discovery leadId=${leadId}`,
    );
    const hostname = await websiteDiscoveryService.discoverWebsiteHostname({
      name: lead.name,
      address: lead.address,
      location: lead.location,
    });

    if (hostname) {
      console.log(
        `[worker] EMAIL_DISCOVER discovered website=${hostname} leadId=${leadId}`,
      );
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          website: hostname,
        },
      });
      lead = { ...lead, website: hostname };
    } else {
      console.log(
        `[worker] EMAIL_DISCOVER website discovery returned null leadId=${leadId}`,
      );
    }
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      processingState: LeadProcessingState.EMAIL_DISCOVERING,
    },
  });

  const emails = await contactDiscoveryService.findEmails(lead.website, {
    name: lead.name,
    address: lead.address || undefined,
  });

  const rankedContacts = rankDiscoveredContacts({
    emails,
    roleHints: [
      lead.primaryDecisionMakerRole,
      ...getRoleHints(lead.decisionMakerRoles as Prisma.JsonValue | null),
    ].filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    ),
    source: "contact-discovery",
    discoveryMethod: lead.website ? "domain-search+website" : "domain-search",
  });

  const primaryCandidate = rankedContacts[0];

  if (!primaryCandidate) {
    console.log(
      `[worker] EMAIL_DISCOVER no emails found leadId=${leadId} website=${lead.website}`,
    );
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        processingState: LeadProcessingState.EMAIL_NOT_FOUND,
      },
    });

    try {
      await creditsService.releaseHold({
        userId: lead.userId,
        action: CreditAction.EMAIL_DISCOVER,
        idempotencyKey: job.idempotencyKey,
      });
    } catch {}

    return;
  }

  console.log(
    `[worker] EMAIL_DISCOVER found ${rankedContacts.length} contact(s) leadId=${leadId} primary=${primaryCandidate.email}`,
  );

  const { primaryContactId } = await prisma.$transaction(async (tx) => {
    await tx.contact.updateMany({
      where: { leadId },
      data: { isPrimary: false },
    });

    let resolvedPrimaryContactId: string | null = null;

    for (const candidate of rankedContacts) {
      const contact = await tx.contact.upsert({
        where: {
          leadId_email: {
            leadId,
            email: candidate.email,
          },
        },
        update: {
          fullName: candidate.fullName,
          roleTitle: candidate.roleTitle,
          department: candidate.department,
          seniority: candidate.seniority,
          confidenceScore: candidate.confidenceScore,
          source: candidate.source,
          discoveryMethod: candidate.discoveryMethod,
          isDecisionMaker: candidate.isDecisionMaker,
          companyId: lead.companyId || undefined,
        },
        create: {
          userId: lead.userId,
          leadId,
          companyId: lead.companyId || undefined,
          fullName: candidate.fullName,
          roleTitle: candidate.roleTitle,
          department: candidate.department,
          seniority: candidate.seniority,
          email: candidate.email,
          confidenceScore: candidate.confidenceScore,
          source: candidate.source,
          discoveryMethod: candidate.discoveryMethod,
          isDecisionMaker: candidate.isDecisionMaker,
          isPrimary: false,
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (candidate.email === primaryCandidate.email) {
        resolvedPrimaryContactId = contact.id;
      }
    }

    if (!resolvedPrimaryContactId) {
      throw new Error(`Unable to resolve primary contact for lead ${leadId}`);
    }

    await tx.contact.update({
      where: { id: resolvedPrimaryContactId },
      data: { isPrimary: true },
    });

    await tx.lead.update({
      where: { id: leadId },
      data: {
        email: primaryCandidate.email,
        primaryContactId: resolvedPrimaryContactId,
        primaryDecisionMakerRole:
          primaryCandidate.roleTitle || lead.primaryDecisionMakerRole,
        processingState: LeadProcessingState.EMAIL_DISCOVERED,
      },
    });

    return { primaryContactId: resolvedPrimaryContactId };
  });

  try {
    await creditsService.captureHold({
      userId: lead.userId,
      action: CreditAction.EMAIL_DISCOVER,
      idempotencyKey: job.idempotencyKey,
    });
  } catch {}

  await jobQueueService.enqueue({
    type: "EMAIL_VERIFY",
    idempotencyKey: `verify:email:${primaryCandidate.email.toLowerCase()}`,
    payload: {
      leadId,
      email: primaryCandidate.email,
      contactId: primaryContactId,
    },
  });
}

async function processEmailVerifyJob(job: Job): Promise<void> {
  const payload = getPayloadObject(job);
  const leadId = payload.leadId;
  const email = payload.email;
  const contactId = payload.contactId;

  if (!leadId || !email) {
    throw new Error("EMAIL_VERIFY job missing payload.leadId or payload.email");
  }

  if (
    typeof leadId !== "string" ||
    typeof email !== "string" ||
    (contactId !== undefined && typeof contactId !== "string")
  ) {
    throw new Error(
      "EMAIL_VERIFY job payload.leadId, payload.email, and payload.contactId must be strings",
    );
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    console.log(`[worker] EMAIL_VERIFY lead not found leadId=${leadId}`);
    return;
  }

  const contact = contactId
    ? await prisma.contact.findUnique({ where: { id: contactId } })
    : await prisma.contact.findFirst({
        where: {
          leadId,
          email: email.toLowerCase(),
        },
      });

  if (contact && contact.leadId !== leadId) {
    console.log(
      `[worker] EMAIL_VERIFY contact does not belong to lead leadId=${leadId} contactId=${contact.id}`,
    );
    return;
  }

  if (
    !contact &&
    lead.email &&
    lead.email.toLowerCase() !== email.toLowerCase()
  ) {
    console.log(
      `[worker] EMAIL_VERIFY skipping update due to email mismatch leadId=${leadId} stored=${lead.email} payload=${email}`,
    );
    return;
  }

  const holdAmount = getCreditCost(CreditAction.EMAIL_VERIFY);
  if (holdAmount > 0) {
    await creditsService.createHold({
      userId: lead.userId,
      action: CreditAction.EMAIL_VERIFY,
      amount: holdAmount,
      idempotencyKey: job.idempotencyKey,
      meta: { leadId, email },
    });
  }

  console.log(`[worker] EMAIL_VERIFY start leadId=${leadId} email=${email}`);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      processingState: LeadProcessingState.VERIFYING,
    },
  });

  const result = await kickboxService.verifyEmail(email);

  console.log(
    `[worker] EMAIL_VERIFY result leadId=${leadId} email=${result.normalizedEmail} status=${result.status}`,
  );

  if (
    !contact &&
    lead.email &&
    lead.email.toLowerCase() !== result.normalizedEmail.toLowerCase()
  ) {
    console.log(
      `[worker] EMAIL_VERIFY skipping update due to normalized email mismatch leadId=${leadId} stored=${lead.email} normalized=${result.normalizedEmail}`,
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (contact) {
      await tx.contact.update({
        where: { id: contact.id },
        data: {
          email: result.normalizedEmail,
          emailVerificationStatus: result.status as EmailVerificationStatus,
          emailVerifiedAt: new Date(),
          emailVerificationProvider: "kickbox",
          isPrimary: contact.isPrimary,
        },
      });
    }

    const shouldSyncLead =
      !contact ||
      contact.isPrimary ||
      lead.primaryContactId === contact.id ||
      lead.email?.toLowerCase() === email.toLowerCase();

    if (shouldSyncLead) {
      await tx.lead.update({
        where: { id: leadId },
        data: {
          email: result.normalizedEmail,
          emailVerificationStatus: result.status as EmailVerificationStatus,
          emailVerifiedAt: new Date(),
          emailVerificationProvider: "kickbox",
          primaryContactId: contact?.id || lead.primaryContactId,
          processingState: LeadProcessingState.VERIFIED,
        },
      });
    }
  });

  if (holdAmount > 0) {
    try {
      await creditsService.captureHold({
        userId: lead.userId,
        action: CreditAction.EMAIL_VERIFY,
        idempotencyKey: job.idempotencyKey,
      });
    } catch {}
  }
}

async function processJob(job: Job): Promise<void> {
  if (job.type === "EMAIL_DISCOVER") {
    await processEmailDiscoverJob(job);
    return;
  }

  if (job.type === "EMAIL_VERIFY") {
    await processEmailVerifyJob(job);
    return;
  }

  throw new Error(`Unhandled job type: ${job.type}`);
}

async function main() {
  requireEnv("DATABASE_URL");
  requireEnv("SEARCH_API_KEY");
  requireEnv("HUNTER_API_KEY");
  requireEnv("KICKBOX_API_KEY");

  const workerId = `worker-${process.pid}`;
  const heartbeatMs = Math.max(1, Math.floor(LOCK_EXPIRY_MS / 2));

  console.log(`[worker] started workerId=${workerId}`);

  while (true) {
    const job = await jobQueueService.claimNext(workerId);

    if (!job) {
      await sleep(250);
      continue;
    }

    let heartbeat: NodeJS.Timeout | null = null;
    try {
      console.log(
        `[worker] claimed job id=${job.id} type=${job.type} attempts=${job.attempts}`,
      );

      heartbeat = setInterval(async () => {
        try {
          const refreshed = await jobQueueService.refreshLock(job.id, workerId);
          if (!refreshed) {
            console.warn(
              `[worker] failed to refresh lock job id=${job.id} type=${job.type}; another worker may claim it`,
            );
          }
        } catch (hbErr) {
          console.error(
            `[worker] heartbeat error job id=${job.id} type=${job.type} error=${hbErr instanceof Error ? hbErr.message : String(hbErr)}`,
          );
        }
      }, heartbeatMs);

      await processJob(job);
      await jobQueueService.succeed(job.id);
      console.log(`[worker] succeeded job id=${job.id} type=${job.type}`);
    } catch (err) {
      if (heartbeat) clearInterval(heartbeat);
      const msg = err instanceof Error ? err.message : "Unknown error";

      const shouldDeadLetter = job.attempts >= job.maxAttempts;
      if (shouldDeadLetter) {
        try {
          const payload = getPayloadObject(job);
          const leadId = payload.leadId;
          if (typeof leadId === "string" && leadId.length > 0) {
            const lead = await prisma.lead.findUnique({
              where: { id: leadId },
            });
            if (lead) {
              if (job.type === "EMAIL_DISCOVER") {
                await creditsService.releaseHold({
                  userId: lead.userId,
                  action: CreditAction.EMAIL_DISCOVER,
                  idempotencyKey: job.idempotencyKey,
                });
              }
              if (job.type === "EMAIL_VERIFY") {
                await creditsService.releaseHold({
                  userId: lead.userId,
                  action: CreditAction.EMAIL_VERIFY,
                  idempotencyKey: job.idempotencyKey,
                });
              }
            }
          }
        } catch (releaseErr) {
          console.error(
            `[worker] failed to release credits on dead-letter job id=${job.id} type=${job.type} error=${releaseErr instanceof Error ? releaseErr.message : String(releaseErr)}`,
          );
        }
      }

      await jobQueueService.fail(job.id, msg);
      console.log(
        `[worker] failed job id=${job.id} type=${job.type} error=${msg}`,
      );
    } finally {
      if (heartbeat) clearInterval(heartbeat);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
