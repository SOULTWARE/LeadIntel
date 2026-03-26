import { PlanType } from "@prisma/client";
import { Webhooks } from "@polar-sh/nextjs";

import { prisma } from "@/db";
import {
  ADDON_CREDITS_AMOUNT,
  ADDON_CREDITS_MONTHS,
  PLAN_LIMITS,
} from "@/lib/polar/plans";
import { getPlanTypeByProductId, isAddonProductId } from "@/lib/polar/products";
import { creditsService } from "@/services/creditsService";

type PolarCustomerPayload = {
  externalId?: string | null;
  id: string;
  metadata?: Record<string, unknown> | null;
} | null;

function getUserIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const candidate = (metadata as Record<string, unknown>).userId;
  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : null;
}

function getBillingFlowType(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const candidate = (metadata as Record<string, unknown>).type;
  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : null;
}

function isAddonOrder(input: {
  metadata?: unknown;
  productId?: string | null;
  product?: { id: string } | null;
}): boolean {
  if (getBillingFlowType(input.metadata) === "addon") {
    return true;
  }

  const productId = input.product?.id ?? input.productId ?? null;
  return typeof productId === "string" && isAddonProductId(productId);
}

async function resolveUserId(input: {
  customer?: PolarCustomerPayload;
  metadata?: unknown;
}): Promise<string | null> {
  if (input.customer?.externalId) {
    return input.customer.externalId;
  }

  const metadataUserId =
    getUserIdFromMetadata(input.metadata) ??
    getUserIdFromMetadata(input.customer?.metadata ?? null);
  if (metadataUserId) {
    return metadataUserId;
  }

  if (!input.customer) {
    return null;
  }

  const mapped = await prisma.polarCustomer.findUnique({
    where: { customerId: input.customer.id },
  });

  return mapped?.userId ?? null;
}

async function upsertPolarCustomer(userId: string, customer: PolarCustomerPayload) {
  if (!customer) {
    return;
  }

  await prisma.polarCustomer.upsert({
    where: { userId },
    update: { customerId: customer.id },
    create: { userId, customerId: customer.id },
  });
}

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

async function handleSubscriptionPayload(payload: {
  data: {
    id: string;
    productId: string;
    status: string;
    customer: PolarCustomerPayload;
    metadata?: Record<string, unknown> | null;
    currentPeriodStart: Date | string;
    currentPeriodEnd?: Date | string | null;
  };
}) {
  const userId = await resolveUserId({
    customer: payload.data.customer,
    metadata: payload.data.metadata,
  });
  if (!userId) {
    return;
  }

  const customer = payload.data.customer;
  if (!customer) {
    return;
  }

  const plan = getPlanTypeByProductId(payload.data.productId);
  if (!plan) {
    return;
  }

  const periodStart = new Date(payload.data.currentPeriodStart);
  const periodEnd = payload.data.currentPeriodEnd
    ? new Date(payload.data.currentPeriodEnd)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await upsertPolarSubscription({
    userId,
    subscriptionId: payload.data.id,
    productId: payload.data.productId,
    status: payload.data.status,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
  });

  await creditsService.syncPlanCredits({
    userId,
    plan,
    periodStart,
    periodEnd,
  });
  await upsertUserPlan({ userId, plan, periodStart, periodEnd });
  await upsertPolarCustomer(userId, customer);
}

async function handleAddonOrderPayload(payload: {
  data: {
    id: string;
    paid: boolean;
    productId?: string | null;
    product?: { id: string } | null;
    customer: PolarCustomerPayload;
    metadata?: Record<string, unknown> | null;
  };
}) {
  if (!payload.data.paid) {
    return;
  }

  if (!isAddonOrder(payload.data)) {
    return;
  }

  const userId = await resolveUserId({
    customer: payload.data.customer,
    metadata: payload.data.metadata,
  });
  if (!userId) {
    return;
  }

  await creditsService.addAddonCredits({
    userId,
    amount: ADDON_CREDITS_AMOUNT,
    monthsToExtend: ADDON_CREDITS_MONTHS,
    idempotencyKey: payload.data.id,
  });

  await upsertPolarCustomer(userId, payload.data.customer);
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
    const userId = await resolveUserId({
      customer: payload.data.customer,
      metadata: payload.data.metadata,
    });
    if (!userId) {
      return;
    }

    await prisma.polarSubscription.updateMany({
      where: { subscriptionId: payload.data.id },
      data: { status: payload.data.status ?? "canceled" },
    });
  },

  onOrderPaid: async (payload) => {
    await handleAddonOrderPayload(payload);
  },

  onOrderCreated: async (payload) => {
    await handleAddonOrderPayload(payload);
  },

  onOrderUpdated: async (payload) => {
    await handleAddonOrderPayload(payload);
  },
});
