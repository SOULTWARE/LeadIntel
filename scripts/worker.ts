import "dotenv/config";

import { prisma } from "../db";
import { jobQueueService } from "../services/jobQueueService";
import { contactDiscoveryService } from "../services/contactDiscoveryService";
import { kickboxService } from "../services/kickboxService";
import { websiteDiscoveryService } from "../services/websiteDiscoveryService";
import { sleep } from "../lib/utils";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} environment variable is not set`);
  return v;
}

async function processEmailDiscoverJob(job: any): Promise<void> {
  const leadId = job.payload?.leadId as string | undefined;
  if (!leadId) {
    throw new Error("EMAIL_DISCOVER job missing payload.leadId");
  }

  console.log(`[worker] EMAIL_DISCOVER start leadId=${leadId}`);

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
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
      lead.website = hostname;
    } else {
      console.log(`[worker] EMAIL_DISCOVER website discovery returned null leadId=${leadId}`);
    }
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      processingState: "EMAIL_DISCOVERING" as any,
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
        processingState: "FAILED" as any,
      },
    });
    return;
  }

  console.log(`[worker] EMAIL_DISCOVER found email=${email} leadId=${leadId}`);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      email,
      processingState: "EMAIL_DISCOVERED" as any,
    },
  });

  await jobQueueService.enqueue({
    type: "EMAIL_VERIFY",
    idempotencyKey: `verify:email:${email.toLowerCase()}`,
    payload: { leadId, email },
  });
}

async function processEmailVerifyJob(job: any): Promise<void> {
  const leadId = job.payload?.leadId as string | undefined;
  const email = job.payload?.email as string | undefined;

  if (!leadId || !email) {
    throw new Error("EMAIL_VERIFY job missing payload.leadId or payload.email");
  }

  console.log(`[worker] EMAIL_VERIFY start leadId=${leadId} email=${email}`);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      processingState: "VERIFYING" as any,
    },
  });

  const result = await kickboxService.verifyEmail(email);

  console.log(`[worker] EMAIL_VERIFY result leadId=${leadId} email=${result.normalizedEmail} status=${result.status}`);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      email: result.normalizedEmail,
      emailVerificationStatus: result.status as any,
      emailVerifiedAt: new Date(),
      emailVerificationProvider: "kickbox",
      processingState: "VERIFIED" as any,
    },
  });
}

async function processJob(job: any): Promise<void> {
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
      await jobQueueService.fail(job.id, msg);
      console.log(`[worker] failed job id=${job.id} type=${job.type} error=${msg}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
