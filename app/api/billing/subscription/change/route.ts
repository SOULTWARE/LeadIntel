import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { PlanType } from "@prisma/client";

import { prisma } from "@/db";
import { PLAN_LIMITS } from "@/lib/stripe/plans";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { STRIPE_PRO_PRICE_ID, STRIPE_STARTER_PRICE_ID } from "@/lib/stripe/config";

const ChangePlanSchema = z.object({
  plan: z.enum(["starter", "pro"]),
});

const ACTIVE_STATUSES = ["active", "trialing", "past_due", "unpaid", "incomplete", "incomplete_expired"] as const;

type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

function getPriceIdForPlan(plan: "starter" | "pro") {
  if (plan === "starter") return STRIPE_STARTER_PRICE_ID;
  if (plan === "pro") return STRIPE_PRO_PRICE_ID;
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ChangePlanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const priceId = getPriceIdForPlan(parsed.data.plan);
  if (!priceId) {
    return NextResponse.json({ success: false, error: "Plan is not configured" }, { status: 500 });
  }

  const subscriptionRecord = await prisma.stripeSubscription.findFirst({
    where: {
      userId: user.id,
      status: { in: ACTIVE_STATUSES as unknown as ActiveStatus[] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscriptionRecord) {
    return NextResponse.json({ success: false, error: "No active subscription to update" }, { status: 404 });
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionRecord.subscriptionId);
  const subscriptionItem = subscription.items?.data?.[0];

  if (!subscriptionItem || !subscriptionItem.id) {
    return NextResponse.json({ success: false, error: "Subscription has no items" }, { status: 400 });
  }

  if (subscriptionItem.price?.id === priceId) {
    return NextResponse.json({ success: true, data: { message: "Already on the selected plan" } });
  }

  const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: false,
    proration_behavior: "create_prorations",
    items: [
      {
        id: subscriptionItem.id,
        price: priceId,
      },
    ],
  });

  const newPeriodStart = new Date(updatedSubscription.current_period_start * 1000);
  const newPeriodEnd = new Date(updatedSubscription.current_period_end * 1000);

  await prisma.stripeSubscription.update({
    where: { subscriptionId: subscription.id },
    data: {
      priceId,
      status: updatedSubscription.status,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
    },
  });

  const planType = parsed.data.plan === "pro" ? PlanType.PRO : PlanType.STARTER;
  const limits = PLAN_LIMITS[planType];

  await prisma.userPlan.upsert({
    where: { userId: user.id },
    update: {
      plan: planType,
      periodStart: newPeriodStart,
      periodEnd: newPeriodEnd,
      maxLeadsPerSearch: limits.maxLeadsPerSearch,
      maxEnhancedLeadsPerMonth: limits.maxEnhancedLeadsPerMonth,
      maxEmailDiscoveriesPerMonth: limits.maxEmailDiscoveriesPerMonth,
      maxEmailVerificationsPerMonth: limits.maxEmailVerificationsPerMonth,
    },
    create: {
      userId: user.id,
      plan: planType,
      periodStart: newPeriodStart,
      periodEnd: newPeriodEnd,
      maxLeadsPerSearch: limits.maxLeadsPerSearch,
      maxEnhancedLeadsPerMonth: limits.maxEnhancedLeadsPerMonth,
      maxEmailDiscoveriesPerMonth: limits.maxEmailDiscoveriesPerMonth,
      maxEmailVerificationsPerMonth: limits.maxEmailVerificationsPerMonth,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
    },
  });
}
