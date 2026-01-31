import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobQueueService } from "@/services/jobQueueService";
import { prisma } from "@/db";

type JobRecord = {
  id: string;
  status: string;
  runAt: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  attempts: number;
  maxAttempts: number;
};

vi.mock("@/db", () => ({
  prisma: {
    job: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("JobQueueService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => fn(prisma));
  });

  it("enqueues job with defaults", async () => {
    await jobQueueService.enqueue({
      type: "EMAIL_DISCOVER",
      idempotencyKey: "job-1",
    });

    expect(prisma.job.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idempotencyKey: "job-1" },
        create: expect.objectContaining({
          type: "EMAIL_DISCOVER",
          idempotencyKey: "job-1",
          maxAttempts: 5,
        }),
      })
    );
  });

  it("returns null when no job is claimable", async () => {
    vi.mocked(prisma.job.findFirst).mockResolvedValue(null);

    const result = await jobQueueService.claimNext("worker-1");

    expect(result).toBeNull();
  });

  it("claims next job when available", async () => {
    const job: JobRecord = {
      id: "job-1",
      status: "QUEUED",
      runAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      attempts: 0,
      maxAttempts: 3,
    };

    vi.mocked(prisma.job.findFirst).mockResolvedValue(job as never);
    vi.mocked(prisma.job.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.job.findUnique).mockResolvedValue({ ...job, status: "RUNNING" } as never);

    const result = await jobQueueService.claimNext("worker-1");

    expect(result?.status).toBe("RUNNING");
    expect(prisma.job.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job-1", status: "QUEUED" },
        data: expect.objectContaining({ status: "RUNNING", lockedBy: "worker-1" }),
      })
    );
  });

  it("fails job and dead-letters when max attempts reached", async () => {
    const job: JobRecord = {
      id: "job-1",
      status: "RUNNING",
      runAt: new Date(),
      lockedAt: new Date(),
      lockedBy: "worker-1",
      attempts: 2,
      maxAttempts: 2,
    };

    vi.mocked(prisma.job.findUnique).mockResolvedValue(job as never);

    await jobQueueService.fail("job-1", "Boom");

    expect(prisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job-1" },
        data: expect.objectContaining({ status: "DEAD", lastError: "Boom" }),
      })
    );
  });

  it("refreshLock returns true when updated", async () => {
    vi.mocked(prisma.job.updateMany).mockResolvedValue({ count: 1 } as never);

    const result = await jobQueueService.refreshLock("job-1", "worker-1");

    expect(result).toBe(true);
  });
});
