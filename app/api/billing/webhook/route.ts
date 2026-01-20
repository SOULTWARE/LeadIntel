import { NextRequest, NextResponse } from "next/server";
import { PlanType, type Prisma } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/db";
import { stripe } from "@/lib/stripe/server";
import { getUserIdByStripeCustomerId } from "@/lib/stripe/customers";
import { PLAN_LIMITS, ADDON_CREDITS_AMOUNT, ADDON_CREDITS_MONTHS } from "@/lib/stripe/plans";
import { getPlanTypeByPriceId, isAddonPriceId } from "@/lib/stripe/prices";
import { STARTER_INITIAL_CREDITS, PRO_INITIAL_CREDITS } from "@/lib/credits/costs";
import { creditsService } from "@/services/creditsService";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
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

async function upsertStripeSubscription(input: {
  userId: string;
  subscriptionId: string;
  priceId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}) {
  await prisma.stripeSubscription.upsert({
    where: { subscriptionId: input.subscriptionId },
    update: {
      userId: input.userId,
      priceId: input.priceId,
      status: input.status,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
    },
    create: {
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      priceId: input.priceId,
      status: input.status,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
    },
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string | null;
  if (!customerId) return;

  const userId = await getUserIdByStripeCustomerId(customerId);
  if (!userId) return;

  if (session.mode === "payment") {
    const isAddonSession = session.metadata?.type === "addon";
    let isAddonPrice = false;

    if (!isAddonSession) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const priceId = lineItems.data[0]?.price?.id;
      isAddonPrice = Boolean(priceId && isAddonPriceId(priceId));
    }

    if (!isAddonSession && !isAddonPrice) return;

    await creditsService.addAddonCredits({
      userId,
      amount: ADDON_CREDITS_AMOUNT,
      monthsToExtend: ADDON_CREDITS_MONTHS,
      idempotencyKey: session.id,
    });
  }

  if (session.mode === "subscription") {
    const subscriptionId = session.subscription as string | null;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdated(subscription);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string | null;
  if (!customerId) return;

  const userId = await getUserIdByStripeCustomerId(customerId);
  if (!userId) return;

  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (!priceId) return;

  const plan = getPlanTypeByPriceId(priceId);
  if (!plan) return;

  const periodStart = new Date(subscription.current_period_start * 1000);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  await upsertStripeSubscription({
    userId,
    subscriptionId: subscription.id,
    priceId,
    status: subscription.status,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
  });

  await upsertUserPlan({
    userId,
    plan,
    periodStart,
    periodEnd,
  });

  await ensurePlanCredits(userId, plan);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string | null;
  if (!customerId) return;

  const userId = await getUserIdByStripeCustomerId(customerId);
  if (!userId) return;

  await prisma.stripeSubscription.updateMany({
    where: { subscriptionId: subscription.id },
    data: { status: subscription.status ?? "canceled" },
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ success: false, error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (error) {
    console.error("[StripeWebhook] Signature verification failed", error);
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("[StripeWebhook] Handler error", error);
    return NextResponse.json({ success: false, error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
