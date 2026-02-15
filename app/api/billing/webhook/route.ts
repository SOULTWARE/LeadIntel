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

async function resolveUserId(customer: { externalId?: string | null; id: string } | null): Promise<string | null> {
  if (!customer) return null;
  if (customer.externalId) return customer.externalId;

  const mapped = await prisma.polarCustomer.findUnique({
    where: { customerId: customer.id },
  });

  return mapped?.userId ?? null;
}

async function handleSubscriptionPayload(payload: {
  data: {
    id: string;
    productId: string;
    status: string;
    customer: { externalId?: string | null; id: string } | null;
    currentPeriodStart: Date | string;
    currentPeriodEnd?: Date | string | null;
  };
}) {
  const customer = payload.data.customer;
  if (!customer) return;

  const userId = await resolveUserId(payload.data.customer);
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
    update: { customerId: customer.id },
    create: { userId, customerId: customer.id },
  });
}

async function handleAddonOrderPayload(payload: {
  data: {
    id: string;
    paid?: boolean;
    productId?: string | null;
    product?: { id: string } | null;
    customer: { externalId?: string | null; id: string } | null;
  };
}) {
  const customer = payload.data.customer;
  if (!customer) return;

  const userId = await resolveUserId(customer);
  if (!userId) return;

  const productId = payload.data.productId ?? payload.data.product?.id ?? null;
  if (!productId) return;
  if (!isAddonProductId(productId)) return;

  await creditsService.addAddonCredits({
    userId,
    amount: ADDON_CREDITS_AMOUNT,
    monthsToExtend: ADDON_CREDITS_MONTHS,
    idempotencyKey: payload.data.id,
  });

  await prisma.polarCustomer.upsert({
    where: { userId },
    update: { customerId: customer.id },
    create: { userId, customerId: customer.id },
  });
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onSubscriptionCreated: async (payload) => {
    await handleSubscriptionPayload(payload);
  },

  onSubscriptionActive: async (payload) => {
    await handleSubscriptionPayload(payload);
  },

  onSubscriptionUpdated: async (payload) => {
    await handleSubscriptionPayload(payload);
  },

  onSubscriptionCanceled: async (payload) => {
    const userId = await resolveUserId(payload.data.customer);
    if (!userId) return;

    await prisma.polarSubscription.updateMany({
      where: { subscriptionId: payload.data.id },
      data: { status: payload.data.status ?? "canceled" },
    });
  },

  onOrderPaid: async (payload) => {
    await handleAddonOrderPayload(payload);
  },

  onOrderUpdated: async (payload) => {
    if (!payload.data.paid) return;
    await handleAddonOrderPayload(payload);
  },
});
