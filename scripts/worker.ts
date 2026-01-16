import "dotenv/config";

import { prisma } from "../db";
import { jobQueueService } from "../services/jobQueueService";
import { contactDiscoveryService } from "../services/contactDiscoveryService";
import { kickboxService } from "../services/kickboxService";
import { websiteDiscoveryService } from "../services/websiteDiscoveryService";
import { creditsService } from "../services/creditsService";
import { CreditAction, getCreditCost } from "../lib/credits/costs";
import { sleep } from "../lib/utils";
import { EmailVerificationStatus, LeadProcessingState, type Job, type Prisma } from "@prisma/client";

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
    console.log(`[worker] EMAIL_DISCOVER missing website; attempting discovery leadId=${leadId}`);
    const hostname = await websiteDiscoveryService.discoverWebsiteHostname({
      name: lead.name,
      address: lead.address,
      location: lead.location,
    });

    if (hostname) {
      console.log(`[worker] EMAIL_DISCOVER discovered website=${hostname} leadId=${leadId}`);
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          website: hostname,
        },
      });
      lead = { ...lead, website: hostname };
    } else {
      console.log(`[worker] EMAIL_DISCOVER website discovery returned null leadId=${leadId}`);
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

  const email = emails[0];

  if (!email) {
    console.log(`[worker] EMAIL_DISCOVER no emails found leadId=${leadId} website=${lead.website}`);
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        processingState: "EMAIL_NOT_FOUND" as unknown as LeadProcessingState,
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

  console.log(`[worker] EMAIL_DISCOVER found email=${email} leadId=${leadId}`);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      email,
      processingState: LeadProcessingState.EMAIL_DISCOVERED,
    },
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
    idempotencyKey: `verify:email:${email.toLowerCase()}`,
    payload: { leadId, email },
  });
}

async function processEmailVerifyJob(job: Job): Promise<void> {
  const payload = getPayloadObject(job);
  const leadId = payload.leadId;
  const email = payload.email;

  if (!leadId || !email) {
    throw new Error("EMAIL_VERIFY job missing payload.leadId or payload.email");
  }

  if (typeof leadId !== "string" || typeof email !== "string") {
    throw new Error("EMAIL_VERIFY job payload.leadId and payload.email must be strings");
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    console.log(`[worker] EMAIL_VERIFY lead not found leadId=${leadId}`);
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

  console.log(`[worker] EMAIL_VERIFY result leadId=${leadId} email=${result.normalizedEmail} status=${result.status}`);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      email: result.normalizedEmail,
      emailVerificationStatus: result.status as EmailVerificationStatus,
      emailVerifiedAt: new Date(),
      emailVerificationProvider: "kickbox",
      processingState: LeadProcessingState.VERIFIED,
    },
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

  console.log(`[worker] started workerId=${workerId}`);

  while (true) {
    const job = await jobQueueService.claimNext(workerId);

    if (!job) {
      await sleep(250);
      continue;
    }

    try {
      console.log(`[worker] claimed job id=${job.id} type=${job.type} attempts=${job.attempts}`);
      await processJob(job);
      await jobQueueService.succeed(job.id);
      console.log(`[worker] succeeded job id=${job.id} type=${job.type}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";

      const shouldDeadLetter = job.attempts >= job.maxAttempts;
      if (shouldDeadLetter) {
        try {
          const payload = getPayloadObject(job);
          const leadId = payload.leadId;
          if (typeof leadId === "string" && leadId.length > 0) {
            const lead = await prisma.lead.findUnique({ where: { id: leadId } });
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
        } catch {}
      }

      await jobQueueService.fail(job.id, msg);
      console.log(`[worker] failed job id=${job.id} type=${job.type} error=${msg}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
