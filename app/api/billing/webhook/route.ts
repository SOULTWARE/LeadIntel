import { PlanType, type Prisma } from "@prisma/client";
import { Webhooks } from "@polar-sh/nextjs";

import { prisma } from "@/db";
import { PLAN_LIMITS, ADDON_CREDITS_AMOUNT, ADDON_CREDITS_MONTHS } from "@/lib/polar/plans";
import { getPlanTypeByProductId, isAddonProductId } from "@/lib/polar/products";
import { STARTER_INITIAL_CREDITS, PRO_INITIAL_CREDITS } from "@/lib/credits/costs";
import { creditsService } from "@/services/creditsService";

async function upsertUserPlan(input: {
  userId: string;
  plan: PlanType;
  periodStart: Date;
  periodEnd: Date;
}) {
  const limits = PLAN_LIMITS[input.plan];

  await prisma.userPlan.upsert({
    where: { userId: input.userId },
    update: {
      plan: input.plan,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      maxLeadsPerSearch: limits.maxLeadsPerSearch,
      maxEnhancedLeadsPerMonth: limits.maxEnhancedLeadsPerMonth,
      maxEmailDiscoveriesPerMonth: limits.maxEmailDiscoveriesPerMonth,
      maxEmailVerificationsPerMonth: limits.maxEmailVerificationsPerMonth,
    },
    create: {
      userId: input.userId,
      plan: input.plan,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      maxLeadsPerSearch: limits.maxLeadsPerSearch,
      maxEnhancedLeadsPerMonth: limits.maxEnhancedLeadsPerMonth,
      maxEmailDiscoveriesPerMonth: limits.maxEmailDiscoveriesPerMonth,
      maxEmailVerificationsPerMonth: limits.maxEmailVerificationsPerMonth,
    },
  });
}

async function ensurePlanCredits(userId: string, plan: PlanType) {
  const initial = plan === PlanType.PRO ? PRO_INITIAL_CREDITS : STARTER_INITIAL_CREDITS;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.creditBalance.findUnique({ where: { userId } });

    if (!existing) {
      await tx.creditBalance.create({ data: { userId, balance: initial } });
      return;
    }

    if (existing.balance < initial) {
      await tx.creditBalance.update({ where: { userId }, data: { balance: initial } });
    }
  });
}

async function upsertPolarSubscription(input: {
  userId: string;
  subscriptionId: string;
  productId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}) {
  await prisma.polarSubscription.upsert({
    where: { subscriptionId: input.subscriptionId },
    update: {
      userId: input.userId,
      productId: input.productId,
      status: input.status,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
    },
    create: {
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      productId: input.productId,
      status: input.status,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
    },
  });
}

function resolveUserId(customer: { externalId?: string | null; id: string } | null): string | null {
  if (!customer) return null;
  return customer.externalId || null;
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onSubscriptionActive: async (payload) => {
    const userId = resolveUserId(payload.data.customer);
    if (!userId) return;

    const productId = payload.data.productId;
    const plan = getPlanTypeByProductId(productId);
    if (!plan) return;

    const periodStart = new Date(payload.data.currentPeriodStart);
    const periodEnd = payload.data.currentPeriodEnd
      ? new Date(payload.data.currentPeriodEnd)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await upsertPolarSubscription({
      userId,
      subscriptionId: payload.data.id,
      productId,
      status: payload.data.status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });

    await upsertUserPlan({ userId, plan, periodStart, periodEnd });
    await ensurePlanCredits(userId, plan);

    await prisma.polarCustomer.upsert({
      where: { userId },
      update: { customerId: payload.data.customer.id },
      create: { userId, customerId: payload.data.customer.id },
    });
  },

  onSubscriptionUpdated: async (payload) => {
    const userId = resolveUserId(payload.data.customer);
    if (!userId) return;

    const productId = payload.data.productId;
    const plan = getPlanTypeByProductId(productId);
    if (!plan) return;

    const periodStart = new Date(payload.data.currentPeriodStart);
    const periodEnd = payload.data.currentPeriodEnd
      ? new Date(payload.data.currentPeriodEnd)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await upsertPolarSubscription({
      userId,
      subscriptionId: payload.data.id,
      productId,
      status: payload.data.status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });

    await upsertUserPlan({ userId, plan, periodStart, periodEnd });
    await ensurePlanCredits(userId, plan);
  },

  onSubscriptionCanceled: async (payload) => {
    const userId = resolveUserId(payload.data.customer);
    if (!userId) return;

    await prisma.polarSubscription.updateMany({
      where: { subscriptionId: payload.data.id },
      data: { status: payload.data.status ?? "canceled" },
    });
  },

  onOrderPaid: async (payload) => {
    const userId = resolveUserId(payload.data.customer);
    if (!userId) return;

    const productId = payload.data.productId;
    if (!isAddonProductId(productId)) return;

    await creditsService.addAddonCredits({
      userId,
      amount: ADDON_CREDITS_AMOUNT,
      monthsToExtend: ADDON_CREDITS_MONTHS,
      idempotencyKey: payload.data.id,
    });

    await prisma.polarCustomer.upsert({
      where: { userId },
      update: { customerId: payload.data.customer.id },
      create: { userId, customerId: payload.data.customer.id },
    });
  },
});
