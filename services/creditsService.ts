import { PlanType } from "@prisma/client";

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

const CreditLedgerEntryStatus: Record<Uppercase<CreditLedgerEntryStatusType>, CreditLedgerEntryStatusType> = {
  HOLD: "HOLD",
  CAPTURED: "CAPTURED",
  RELEASED: "RELEASED",
};

const CreditLedgerEntryType: Record<Uppercase<CreditLedgerEntryTypeType>, CreditLedgerEntryTypeType> = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
};

async function getInitialCreditsForUser(tx: any, userId: string): Promise<number> {
  const plan = await tx.userPlan.findUnique({
    where: { userId },
    select: { plan: true },
  });

  if (plan?.plan === PlanType.PRO) {
    return PRO_INITIAL_CREDITS;
  }

  return STARTER_INITIAL_CREDITS;
}

export class CreditsService {
  async ensureInitialized(userId: string): Promise<{ userId: string; balance: number }> {
    return prisma.$transaction(async (tx) => {
      const creditBalance = (tx as any).creditBalance;
      const creditLedgerEntry = (tx as any).creditLedgerEntry;

      const initial = await getInitialCreditsForUser(tx, userId);

      const balance = await creditBalance.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          balance: initial,
        },
      });

      await creditLedgerEntry.upsert({
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
    });
  }

  async getBalance(userId: string): Promise<number> {
    const balance = await (prisma as any).creditBalance.findUnique({ where: { userId } });
    if (!balance) {
      const created = await this.ensureInitialized(userId);
      return created.balance;
    }
    return balance.balance;
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

    return prisma.$transaction(async (tx) => {
      const creditBalance = (tx as any).creditBalance;
      const creditLedgerEntry = (tx as any).creditLedgerEntry;

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

      const existing = await creditLedgerEntry.findUnique({ where: { idempotencyKey: ledgerKey } });
      if (existing) {
        return existing;
      }

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
          metaJson: input.meta,
        },
      });
    });
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

    await prisma.$transaction(async (tx) => {
      const creditBalance = (tx as any).creditBalance;
      const creditLedgerEntry = (tx as any).creditLedgerEntry;

      const entry = await creditLedgerEntry.findUnique({ where: { idempotencyKey: ledgerKey } });
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
        typeof input.finalAmount === "number" && Number.isFinite(input.finalAmount)
          ? Math.max(0, Math.floor(input.finalAmount))
          : entry.amount;

      if (finalAmount > entry.amount) {
        throw new Error("finalAmount cannot exceed held amount");
      }

      const refund = entry.amount - finalAmount;
      if (refund > 0) {
        await creditBalance.update({
          where: { userId: input.userId },
          data: {
            balance: {
              increment: refund,
            },
          },
        });
      }

      await creditLedgerEntry.update({
        where: { id: entry.id },
        data: {
          status: CreditLedgerEntryStatus.CAPTURED,
          amount: finalAmount,
        },
      });
    });
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

    await prisma.$transaction(async (tx) => {
      const creditBalance = (tx as any).creditBalance;
      const creditLedgerEntry = (tx as any).creditLedgerEntry;

      const entry = await creditLedgerEntry.findUnique({ where: { idempotencyKey: ledgerKey } });
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

      await creditBalance.update({
        where: { userId: input.userId },
        data: {
          balance: {
            increment: entry.amount,
          },
        },
      });
    });
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

    await prisma.$transaction(async (tx) => {
      const creditBalance = (tx as any).creditBalance;
      const creditLedgerEntry = (tx as any).creditLedgerEntry;

      const existing = await creditLedgerEntry.findUnique({ where: { idempotencyKey: ledgerKey } });
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
          metaJson: input.meta,
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
    });
  }
}

export const creditsService = new CreditsService();
