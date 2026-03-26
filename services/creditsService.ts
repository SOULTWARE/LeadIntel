import { PlanType, type Prisma } from "@prisma/client";

import { prisma } from "../db";
import {
  CreditAction,
  PRO_INITIAL_CREDITS,
  STARTER_INITIAL_CREDITS,
  type CreditAction as CreditActionType,
} from "../lib/credits/costs";

export class InsufficientCreditsError extends Error {
  readonly name = "InsufficientCreditsError";
}

function buildLedgerIdempotencyKey(input: {
  userId: string;
  action: CreditActionType;
  idempotencyKey: string;
}): string {
  return `credits:${input.action}:${input.userId}:${input.idempotencyKey}`;
}

type CreditLedgerEntryStatusType = "HOLD" | "CAPTURED" | "RELEASED";
type CreditLedgerEntryTypeType = "CREDIT" | "DEBIT";

type CreateHoldResult = {
  id: string;
  userId: string;
  status: CreditLedgerEntryStatusType;
  amount: number;
  idempotencyKey: string;
};

type AddonBalanceRecord = {
  userId: string;
  remaining: number;
  expiresAt: Date | null;
};

const CreditLedgerEntryStatus: Record<
  Uppercase<CreditLedgerEntryStatusType>,
  CreditLedgerEntryStatusType
> = {
  HOLD: "HOLD",
  CAPTURED: "CAPTURED",
  RELEASED: "RELEASED",
};

const CreditLedgerEntryType: Record<
  Uppercase<CreditLedgerEntryTypeType>,
  CreditLedgerEntryTypeType
> = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
};

const TRANSACTION_OPTIONS = { timeout: 15000, maxWait: 5000 } as const;

function getInitialCreditsForPlan(plan: PlanType): number {
  if (plan === PlanType.PRO) {
    return PRO_INITIAL_CREDITS;
  }

  if (plan === PlanType.STARTER) {
    return STARTER_INITIAL_CREDITS;
  }

  return 0;
}

async function getInitialCreditsForUser(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<number> {
  const plan = await tx.userPlan.findUnique({
    where: { userId },
    select: { plan: true },
  });

  return plan ? getInitialCreditsForPlan(plan.plan) : 0;
}

async function getAddonBalance(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<AddonBalanceRecord | null> {
  const existing = await tx.addonCreditBalance.findUnique({
    where: { userId },
  });
  if (!existing) return null;

  if (existing.expiresAt && existing.expiresAt.getTime() <= Date.now()) {
    if (existing.remaining !== 0 || existing.expiresAt !== null) {
      await tx.addonCreditBalance.update({
        where: { userId },
        data: { remaining: 0, expiresAt: null },
      });
    }
    return {
      userId,
      remaining: 0,
      expiresAt: null,
    };
  }

  return {
    userId: existing.userId,
    remaining: existing.remaining,
    expiresAt: existing.expiresAt,
  };
}

export class CreditsService {
  async syncPlanCredits(input: {
    userId: string;
    plan: PlanType;
    periodStart: Date;
    periodEnd: Date;
    previousPlan?: PlanType | null;
    previousPeriodStart?: Date | null;
  }): Promise<{ userId: string; balance: number }> {
    const nextInitial = getInitialCreditsForPlan(input.plan);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const [existingBalance, storedPlan] = await Promise.all([
        tx.creditBalance.findUnique({ where: { userId: input.userId } }),
        tx.userPlan.findUnique({
          where: { userId: input.userId },
          select: { plan: true, periodStart: true },
        }),
      ]);

      const storedPlanMatchesTarget =
        storedPlan?.plan === input.plan &&
        storedPlan.periodStart.getTime() === input.periodStart.getTime();
      const previousPlan = storedPlanMatchesTarget
        ? input.plan
        : (input.previousPlan ?? storedPlan?.plan ?? null);
      const previousPeriodStart = storedPlanMatchesTarget
        ? input.periodStart
        : (input.previousPeriodStart ?? storedPlan?.periodStart ?? null);
      const sameBillingPeriod =
        previousPeriodStart?.getTime() === input.periodStart.getTime();

      let nextBalance = nextInitial;

      if (existingBalance) {
        if (previousPlan && sameBillingPeriod) {
          const previousInitial = getInitialCreditsForPlan(previousPlan);
          const previousRemaining = Math.min(
            Math.max(existingBalance.balance, 0),
            previousInitial,
          );
          const used = Math.max(0, previousInitial - previousRemaining);
          nextBalance = Math.max(0, nextInitial - used);
        } else if (!previousPlan && existingBalance.balance > 0) {
          nextBalance = Math.min(existingBalance.balance, nextInitial);
        }
      }

      const balance = await tx.creditBalance.upsert({
        where: { userId: input.userId },
        update: { balance: nextBalance },
        create: {
          userId: input.userId,
          balance: nextBalance,
        },
      });

      return {
        userId: balance.userId,
        balance: balance.balance,
      };
    }, TRANSACTION_OPTIONS);
  }

  async ensureInitialized(
    userId: string,
  ): Promise<{ userId: string; balance: number }> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const initial = await getInitialCreditsForUser(tx, userId);

      const balance = await tx.creditBalance.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          balance: initial,
        },
      });

      await tx.creditLedgerEntry.upsert({
        where: {
          idempotencyKey: buildLedgerIdempotencyKey({
            userId,
            action: CreditAction.TOPUP,
            idempotencyKey: "initial",
          }),
        },
        update: {},
        create: {
          userId,
          type: CreditLedgerEntryType.CREDIT,
          status: CreditLedgerEntryStatus.CAPTURED,
          action: CreditAction.TOPUP,
          amount: initial,
          idempotencyKey: buildLedgerIdempotencyKey({
            userId,
            action: CreditAction.TOPUP,
            idempotencyKey: "initial",
          }),
          metaJson: {
            source: "initial",
          },
        },
      });

      return balance;
    }, TRANSACTION_OPTIONS);
  }

  async getBalance(userId: string): Promise<number> {
    const balance = await prisma.creditBalance.findUnique({
      where: { userId },
    });
    if (!balance) {
      const created = await this.ensureInitialized(userId);
      return created.balance;
    }
    return balance.balance;
  }

  async getAddonBalance(userId: string): Promise<AddonBalanceRecord> {
    const existing = await prisma.addonCreditBalance.findUnique({
      where: { userId },
    });
    if (!existing) {
      const created = await prisma.addonCreditBalance.create({
        data: {
          userId,
          remaining: 0,
          expiresAt: null,
        },
      });

      return {
        userId: created.userId,
        remaining: created.remaining,
        expiresAt: created.expiresAt,
      };
    }

    if (existing.expiresAt && existing.expiresAt.getTime() <= Date.now()) {
      if (existing.remaining !== 0 || existing.expiresAt !== null) {
        const updated = await prisma.addonCreditBalance.update({
          where: { userId },
          data: { remaining: 0, expiresAt: null },
        });

        return {
          userId: updated.userId,
          remaining: updated.remaining,
          expiresAt: updated.expiresAt,
        };
      }

      return {
        userId: existing.userId,
        remaining: 0,
        expiresAt: null,
      };
    }

    return {
      userId: existing.userId,
      remaining: existing.remaining,
      expiresAt: existing.expiresAt,
    };
  }

  async createHold(input: {
    userId: string;
    action: CreditActionType;
    amount: number;
    idempotencyKey: string;
    meta?: Record<string, unknown>;
  }): Promise<CreateHoldResult> {
    if (input.amount <= 0) {
      throw new Error("Hold amount must be > 0");
    }

    const ledgerKey = buildLedgerIdempotencyKey({
      userId: input.userId,
      action: input.action,
      idempotencyKey: input.idempotencyKey,
    });

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const creditBalance = tx.creditBalance;
      const creditLedgerEntry = tx.creditLedgerEntry;
      const addonCreditBalance = tx.addonCreditBalance;
      const initial = await getInitialCreditsForUser(tx, input.userId);

      await creditBalance.upsert({
        where: { userId: input.userId },
        update: {},
        create: {
          userId: input.userId,
          balance: initial,
        },
      });

      await creditLedgerEntry.upsert({
        where: {
          idempotencyKey: buildLedgerIdempotencyKey({
            userId: input.userId,
            action: CreditAction.TOPUP,
            idempotencyKey: "initial",
          }),
        },
        update: {},
        create: {
          userId: input.userId,
          type: CreditLedgerEntryType.CREDIT,
          status: CreditLedgerEntryStatus.CAPTURED,
          action: CreditAction.TOPUP,
          amount: initial,
          idempotencyKey: buildLedgerIdempotencyKey({
            userId: input.userId,
            action: CreditAction.TOPUP,
            idempotencyKey: "initial",
          }),
          metaJson: {
            source: "initial",
          },
        },
      });

      const existing = await creditLedgerEntry.findUnique({
        where: { idempotencyKey: ledgerKey },
      });
      if (existing) {
        return existing;
      }

      const base = await creditBalance.findUnique({
        where: { userId: input.userId },
      });
      const baseBalance = base?.balance ?? 0;

      if (baseBalance >= input.amount) {
        const updated = await creditBalance.updateMany({
          where: {
            userId: input.userId,
            balance: {
              gte: input.amount,
            },
          },
          data: {
            balance: {
              decrement: input.amount,
            },
          },
        });

        if (updated.count !== 1) {
          throw new InsufficientCreditsError("Insufficient credits");
        }

        return creditLedgerEntry.create({
          data: {
            userId: input.userId,
            type: CreditLedgerEntryType.DEBIT,
            status: CreditLedgerEntryStatus.HOLD,
            action: input.action,
            amount: input.amount,
            idempotencyKey: ledgerKey,
            metaJson: {
              ...(input.meta ?? {}),
              source: "base",
            } as Prisma.InputJsonValue,
          },
        });
      }

      if (baseBalance > 0) {
        throw new InsufficientCreditsError("Insufficient credits");
      }

      const addon = await getAddonBalance(tx, input.userId);
      const addonRemaining = addon?.remaining ?? 0;

      if (addonRemaining < input.amount) {
        throw new InsufficientCreditsError("Insufficient credits");
      }

      await addonCreditBalance.update({
        where: { userId: input.userId },
        data: {
          remaining: {
            decrement: input.amount,
          },
        },
      });

      return creditLedgerEntry.create({
        data: {
          userId: input.userId,
          type: CreditLedgerEntryType.DEBIT,
          status: CreditLedgerEntryStatus.HOLD,
          action: input.action,
          amount: input.amount,
          idempotencyKey: ledgerKey,
          metaJson: {
            ...(input.meta ?? {}),
            source: "addon",
          } as Prisma.InputJsonValue,
        },
      });
    }, TRANSACTION_OPTIONS);
  }

  async captureHold(input: {
    userId: string;
    action: CreditActionType;
    idempotencyKey: string;
    finalAmount?: number;
  }): Promise<void> {
    const ledgerKey = buildLedgerIdempotencyKey({
      userId: input.userId,
      action: input.action,
      idempotencyKey: input.idempotencyKey,
    });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const creditBalance = tx.creditBalance;
      const creditLedgerEntry = tx.creditLedgerEntry;
      const addonCreditBalance = tx.addonCreditBalance;

      const entry = await creditLedgerEntry.findUnique({
        where: { idempotencyKey: ledgerKey },
      });
      if (!entry) {
        throw new Error("Hold not found");
      }

      if (entry.status === CreditLedgerEntryStatus.CAPTURED) {
        return;
      }

      if (entry.status !== CreditLedgerEntryStatus.HOLD) {
        throw new Error(`Cannot capture hold in status ${entry.status}`);
      }

      const finalAmount =
        typeof input.finalAmount === "number" &&
        Number.isFinite(input.finalAmount)
          ? Math.max(0, Math.floor(input.finalAmount))
          : entry.amount;

      if (finalAmount > entry.amount) {
        throw new Error("finalAmount cannot exceed held amount");
      }

      const refund = entry.amount - finalAmount;
      const source =
        entry.metaJson &&
        typeof entry.metaJson === "object" &&
        !Array.isArray(entry.metaJson)
          ? (entry.metaJson as Record<string, unknown>).source
          : null;

      if (refund > 0) {
        if (source === "addon") {
          await addonCreditBalance.update({
            where: { userId: input.userId },
            data: {
              remaining: {
                increment: refund,
              },
            },
          });
        } else {
          await creditBalance.update({
            where: { userId: input.userId },
            data: {
              balance: {
                increment: refund,
              },
            },
          });
        }
      }

      await creditLedgerEntry.update({
        where: { id: entry.id },
        data: {
          status: CreditLedgerEntryStatus.CAPTURED,
          amount: finalAmount,
        },
      });
    }, TRANSACTION_OPTIONS);
  }

  async releaseHold(input: {
    userId: string;
    action: CreditActionType;
    idempotencyKey: string;
  }): Promise<void> {
    const ledgerKey = buildLedgerIdempotencyKey({
      userId: input.userId,
      action: input.action,
      idempotencyKey: input.idempotencyKey,
    });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const creditBalance = tx.creditBalance;
      const addonCreditBalance = tx.addonCreditBalance;
      const creditLedgerEntry = tx.creditLedgerEntry;

      const entry = await creditLedgerEntry.findUnique({
        where: { idempotencyKey: ledgerKey },
      });
      if (!entry) {
        return;
      }

      if (entry.status === CreditLedgerEntryStatus.RELEASED) {
        return;
      }

      if (entry.status !== CreditLedgerEntryStatus.HOLD) {
        throw new Error(`Cannot release hold in status ${entry.status}`);
      }

      await creditLedgerEntry.update({
        where: { id: entry.id },
        data: {
          status: CreditLedgerEntryStatus.RELEASED,
        },
      });

      const source =
        entry.metaJson &&
        typeof entry.metaJson === "object" &&
        !Array.isArray(entry.metaJson)
          ? (entry.metaJson as Record<string, unknown>).source
          : null;

      if (source === "addon") {
        await addonCreditBalance.update({
          where: { userId: input.userId },
          data: {
            remaining: {
              increment: entry.amount,
            },
          },
        });
      } else {
        await creditBalance.update({
          where: { userId: input.userId },
          data: {
            balance: {
              increment: entry.amount,
            },
          },
        });
      }
    }, TRANSACTION_OPTIONS);
  }

  async addAddonCredits(input: {
    userId: string;
    amount: number;
    monthsToExtend: number;
    idempotencyKey: string;
  }): Promise<AddonBalanceRecord> {
    if (input.amount <= 0) {
      throw new Error("Credit amount must be > 0");
    }

    if (input.monthsToExtend <= 0) {
      throw new Error("monthsToExtend must be > 0");
    }

    if (!input.idempotencyKey) {
      throw new Error("idempotencyKey is required");
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const creditLedgerEntry = tx.creditLedgerEntry;
      const addonCreditBalance = tx.addonCreditBalance;
      const existing = await getAddonBalance(tx, input.userId);

      const ledgerKey = buildLedgerIdempotencyKey({
        userId: input.userId,
        action: CreditAction.TOPUP,
        idempotencyKey: input.idempotencyKey,
      });

      const prior = await creditLedgerEntry.findUnique({
        where: { idempotencyKey: ledgerKey },
      });
      if (prior) {
        return (
          existing ?? {
            userId: input.userId,
            remaining: 0,
            expiresAt: null,
          }
        );
      }

      const now = new Date();
      const baseDate =
        existing?.expiresAt && existing.expiresAt.getTime() > now.getTime()
          ? existing.expiresAt
          : now;
      const newExpiresAt = new Date(baseDate);
      newExpiresAt.setMonth(newExpiresAt.getMonth() + input.monthsToExtend);

      const updated = await addonCreditBalance.upsert({
        where: { userId: input.userId },
        update: {
          remaining: {
            increment: input.amount,
          },
          expiresAt: newExpiresAt,
        },
        create: {
          userId: input.userId,
          remaining: input.amount,
          expiresAt: newExpiresAt,
        },
      });

      await creditLedgerEntry.create({
        data: {
          userId: input.userId,
          type: CreditLedgerEntryType.CREDIT,
          status: CreditLedgerEntryStatus.CAPTURED,
          action: CreditAction.TOPUP,
          amount: input.amount,
          idempotencyKey: ledgerKey,
          metaJson: {
            source: "addon",
            expiresAt: newExpiresAt,
          },
        },
      });

      return {
        userId: updated.userId,
        remaining: updated.remaining,
        expiresAt: updated.expiresAt,
      };
    }, TRANSACTION_OPTIONS);
  }

  async addCredits(input: {
    userId: string;
    amount: number;
    idempotencyKey: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    if (input.amount <= 0) {
      throw new Error("Credit amount must be > 0");
    }

    const ledgerKey = buildLedgerIdempotencyKey({
      userId: input.userId,
      action: CreditAction.TOPUP,
      idempotencyKey: input.idempotencyKey,
    });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const creditBalance = tx.creditBalance;
      const creditLedgerEntry = tx.creditLedgerEntry;

      const existing = await creditLedgerEntry.findUnique({
        where: { idempotencyKey: ledgerKey },
      });
      if (existing) return;

      const initial = await getInitialCreditsForUser(tx, input.userId);
      await creditBalance.upsert({
        where: { userId: input.userId },
        update: {},
        create: {
          userId: input.userId,
          balance: initial,
        },
      });

      await creditLedgerEntry.upsert({
        where: {
          idempotencyKey: buildLedgerIdempotencyKey({
            userId: input.userId,
            action: CreditAction.TOPUP,
            idempotencyKey: "initial",
          }),
        },
        update: {},
        create: {
          userId: input.userId,
          type: CreditLedgerEntryType.CREDIT,
          status: CreditLedgerEntryStatus.CAPTURED,
          action: CreditAction.TOPUP,
          amount: initial,
          idempotencyKey: buildLedgerIdempotencyKey({
            userId: input.userId,
            action: CreditAction.TOPUP,
            idempotencyKey: "initial",
          }),
          metaJson: {
            source: "initial",
          },
        },
      });

      await creditLedgerEntry.create({
        data: {
          userId: input.userId,
          type: CreditLedgerEntryType.CREDIT,
          status: CreditLedgerEntryStatus.CAPTURED,
          action: CreditAction.TOPUP,
          amount: input.amount,
          idempotencyKey: ledgerKey,
          metaJson: input.meta as Prisma.InputJsonValue | undefined,
        },
      });

      await creditBalance.update({
        where: { userId: input.userId },
        data: {
          balance: {
            increment: input.amount,
          },
        },
      });
    }, TRANSACTION_OPTIONS);
  }
}

export const creditsService = new CreditsService();
