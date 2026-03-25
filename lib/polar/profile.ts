import { PlanType } from "@prisma/client";

import { prisma } from "@/db";
import { STARTER_INITIAL_CREDITS, PRO_INITIAL_CREDITS } from "@/lib/credits/costs";
import { getPolarCustomerIdByUserId } from "@/lib/polar/customers";
import { PLAN_LIMITS } from "@/lib/polar/plans";
import { polar } from "@/lib/polar/server";
import { getPlanTypeByProductId } from "@/lib/polar/products";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
]);

type SubscriptionSnapshot = {
  subscriptionId: string;
  productId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  customerId?: string | null;
};

export type ResolvedProfilePlan = {
  plan: PlanType;
  periodStart: Date;
  periodEnd: Date;
  maxLeadsPerSearch: number;
  maxEnhancedLeadsPerMonth: number;
  maxEmailDiscoveriesPerMonth: number;
  maxEmailVerificationsPerMonth: number;
};

export type ResolvedProfileSubscription = {
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
};

export type ResolvedProfileBillingState = {
  plan: ResolvedProfilePlan | null;
  subscription: ResolvedProfileSubscription | null;
};

function isActiveSubscriptionStatus(status: string | null | undefined) {
  return Boolean(status && ACTIVE_SUBSCRIPTION_STATUSES.has(status));
}

function mapPlanRecord(plan: {
  plan: PlanType;
  periodStart: Date;
  periodEnd: Date;
  maxLeadsPerSearch: number;
  maxEnhancedLeadsPerMonth: number;
  maxEmailDiscoveriesPerMonth: number;
  maxEmailVerificationsPerMonth: number;
}): ResolvedProfilePlan {
  return {
    plan: plan.plan,
    periodStart: plan.periodStart,
    periodEnd: plan.periodEnd,
    maxLeadsPerSearch: plan.maxLeadsPerSearch,
    maxEnhancedLeadsPerMonth: plan.maxEnhancedLeadsPerMonth,
    maxEmailDiscoveriesPerMonth: plan.maxEmailDiscoveriesPerMonth,
    maxEmailVerificationsPerMonth: plan.maxEmailVerificationsPerMonth,
  };
}

function mapSubscriptionRecord(subscription: {
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
}): ResolvedProfileSubscription {
  return {
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
  };
}

async function resolvePolarCustomerId(userId: string, email?: string | null): Promise<string | null> {
  const existingCustomerId = await getPolarCustomerIdByUserId(userId);
  if (existingCustomerId) {
    return existingCustomerId;
  }

  if (!email) {
    return null;
  }

  try {
    const response = await polar.customers.list({ email, limit: 1 });
    return response.result.items[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function ensurePlanCredits(userId: string, plan: PlanType) {
  const initial = plan === PlanType.PRO ? PRO_INITIAL_CREDITS : STARTER_INITIAL_CREDITS;
  const existing = await prisma.creditBalance.findUnique({ where: { userId } });

  if (!existing) {
    await prisma.creditBalance.create({ data: { userId, balance: initial } });
  }
}

async function persistBillingSnapshot(
  userId: string,
  subscription: SubscriptionSnapshot,
  customerId?: string | null,
): Promise<ResolvedProfileBillingState | null> {
  const planType = getPlanTypeByProductId(subscription.productId);
  if (!planType) return null;

  const limits = PLAN_LIMITS[planType];
  const currentPeriodEnd = subscription.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.polarSubscription.upsert({
      where: { subscriptionId: subscription.subscriptionId },
      update: {
        userId,
        productId: subscription.productId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd,
      },
      create: {
        userId,
        subscriptionId: subscription.subscriptionId,
        productId: subscription.productId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd,
      },
    }),
    prisma.userPlan.upsert({
      where: { userId },
      update: {
        plan: planType,
        periodStart: subscription.currentPeriodStart,
        periodEnd: currentPeriodEnd,
        maxLeadsPerSearch: limits.maxLeadsPerSearch,
        maxEnhancedLeadsPerMonth: limits.maxEnhancedLeadsPerMonth,
        maxEmailDiscoveriesPerMonth: limits.maxEmailDiscoveriesPerMonth,
        maxEmailVerificationsPerMonth: limits.maxEmailVerificationsPerMonth,
      },
      create: {
        userId,
        plan: planType,
        periodStart: subscription.currentPeriodStart,
        periodEnd: currentPeriodEnd,
        maxLeadsPerSearch: limits.maxLeadsPerSearch,
        maxEnhancedLeadsPerMonth: limits.maxEnhancedLeadsPerMonth,
        maxEmailDiscoveriesPerMonth: limits.maxEmailDiscoveriesPerMonth,
        maxEmailVerificationsPerMonth: limits.maxEmailVerificationsPerMonth,
      },
    }),
  ]);

  const resolvedCustomerId = customerId ?? subscription.customerId ?? null;

  if (resolvedCustomerId) {
    await prisma.polarCustomer.upsert({
      where: { userId },
      update: { customerId: resolvedCustomerId },
      create: { userId, customerId: resolvedCustomerId },
    });
  }

  await ensurePlanCredits(userId, planType);

  return {
    plan: {
      plan: planType,
      periodStart: subscription.currentPeriodStart,
      periodEnd: currentPeriodEnd,
      maxLeadsPerSearch: limits.maxLeadsPerSearch,
      maxEnhancedLeadsPerMonth: limits.maxEnhancedLeadsPerMonth,
      maxEmailDiscoveriesPerMonth: limits.maxEmailDiscoveriesPerMonth,
      maxEmailVerificationsPerMonth: limits.maxEmailVerificationsPerMonth,
    },
    subscription: {
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd,
    },
  };
}

async function resolveLiveSubscription(userId: string, email?: string | null): Promise<SubscriptionSnapshot | null> {
  const customerId = await resolvePolarCustomerId(userId, email);
  const requests = customerId
    ? [
        { customerId, active: true, limit: 10 },
        { customerId, limit: 10 },
        { externalCustomerId: userId, active: true, limit: 10 },
        { externalCustomerId: userId, limit: 10 },
      ]
    : [
        { externalCustomerId: userId, active: true, limit: 10 },
        { externalCustomerId: userId, limit: 10 },
      ];

  for (const request of requests) {
    try {
      const response = await polar.subscriptions.list(request);
      const subscription = response.result.items.find((item) => isActiveSubscriptionStatus(item.status));
      if (subscription) {
        return {
          subscriptionId: subscription.id,
          productId: subscription.productId,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          customerId: subscription.customerId,
        };
      }
    } catch {
      // Try the next lookup strategy.
    }
  }

  return null;
}

export async function resolveProfileBillingState(userId: string, email?: string | null): Promise<ResolvedProfileBillingState> {
  const [plan, subscription] = await Promise.all([
    prisma.userPlan.findUnique({ where: { userId } }),
    prisma.polarSubscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (plan) {
    return {
      plan: mapPlanRecord(plan),
      subscription: subscription ? mapSubscriptionRecord(subscription) : null,
    };
  }

  if (subscription && isActiveSubscriptionStatus(subscription.status)) {
    const customerId = await resolvePolarCustomerId(userId, email);
    const resolved = await persistBillingSnapshot(userId, {
      subscriptionId: subscription.subscriptionId,
      productId: subscription.productId,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
    }, customerId);

    if (resolved) {
      return resolved;
    }
  }

  const liveSubscription = await resolveLiveSubscription(userId, email);
  if (liveSubscription) {
    const resolved = await persistBillingSnapshot(userId, liveSubscription, liveSubscription.customerId);
    if (resolved) {
      return resolved;
    }
  }

  return {
    plan: null,
    subscription: subscription ? mapSubscriptionRecord(subscription) : null,
  };
}
