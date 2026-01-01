import { prisma } from "../db";
import type { Job, JobStatus as PrismaJobStatus, JobType as PrismaJobType, Prisma } from "@prisma/client";

export type JobType = PrismaJobType;

export type JobStatus = PrismaJobStatus;

export interface EnqueueJobOptions {
  type: JobType;
  idempotencyKey: string;
  runAt?: Date;
  payload?: Prisma.InputJsonValue;
  maxAttempts?: number;
}

export class JobQueueService {
  async enqueue(options: EnqueueJobOptions): Promise<void> {
    await prisma.job.upsert({
      where: { idempotencyKey: options.idempotencyKey },
      update: {
        runAt: options.runAt || new Date(),
        payload: options.payload,
      },
      create: {
        type: options.type,
        idempotencyKey: options.idempotencyKey,
        runAt: options.runAt || new Date(),
        payload: options.payload,
        maxAttempts: options.maxAttempts ?? 5,
      },
    });
  }

  async claimNext(workerId: string): Promise<Job | null> {
    const now = new Date();
    const lockExpiry = new Date(Date.now() - 5 * 60 * 1000);

    return prisma.$transaction(async (tx) => {
      const candidate = await tx.job.findFirst({
        where: {
          status: "QUEUED",
          runAt: { lte: now },
          OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiry } }],
        },
        orderBy: { runAt: "asc" },
      });

      if (!candidate) return null;

      const updated = await tx.job.updateMany({
        where: {
          id: candidate.id,
          status: "QUEUED",
        },
        data: {
          status: "RUNNING",
          lockedAt: now,
          lockedBy: workerId,
          attempts: { increment: 1 },
        },
      });

      if (updated.count !== 1) return null;

      return tx.job.findUnique({ where: { id: candidate.id } });
    });
  }

  async succeed(jobId: string): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "SUCCEEDED",
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    });
  }

  async fail(jobId: string, errorMessage: string): Promise<void> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return;

    const attempts = job.attempts;
    const maxAttempts = job.maxAttempts;

    const shouldDeadLetter = attempts >= maxAttempts;

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: shouldDeadLetter ? "DEAD" : "QUEUED",
        lockedAt: null,
        lockedBy: null,
        lastError: errorMessage,
        runAt: shouldDeadLetter ? job.runAt : new Date(Date.now() + 30_000),
      },
    });
  }

  async requeueFailed(jobId: string): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "QUEUED",
        lockedAt: null,
        lockedBy: null,
        runAt: new Date(),
      },
    });
  }
}

export const jobQueueService = new JobQueueService();
