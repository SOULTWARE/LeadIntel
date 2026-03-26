import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { PlanType } from "@prisma/client";

import { prisma } from "@/db";
import { PLAN_LIMITS } from "@/lib/polar/plans";
import { getPlanTypeByProductId } from "@/lib/polar/products";
import { polar } from "@/lib/polar/server";
import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";
import {
  POLAR_PRO_PRODUCT_ID,
  POLAR_STARTER_PRODUCT_ID,
} from "@/lib/polar/config";

const ChangePlanSchema = z.object({
  plan: z.enum(["starter", "pro"]),
});

const ACTIVE_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
] as const;

type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

function getProductIdForPlan(plan: "starter" | "pro") {
  if (plan === "starter") return POLAR_STARTER_PRODUCT_ID;
  if (plan === "pro") return POLAR_PRO_PRODUCT_ID;
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const parsed = ChangePlanSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const productId = getProductIdForPlan(parsed.data.plan);
  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Plan is not configured" },
      { status: 500 },
    );
  }

  const subscriptionRecord = await prisma.polarSubscription.findFirst({
    where: {
      userId: user.id,
      status: { in: ACTIVE_STATUSES as unknown as ActiveStatus[] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscriptionRecord) {
    return NextResponse.json(
      { success: false, error: "No active subscription to update" },
      { status: 404 },
    );
  }

  if (subscriptionRecord.productId === productId) {
    return NextResponse.json({
      success: true,
      data: { message: "Already on the selected plan" },
    });
  }

  const updatedSubscription = await polar.subscriptions.update({
    id: subscriptionRecord.subscriptionId,
    subscriptionUpdate: { productId },
  });

  const newPeriodStart = new Date(updatedSubscription.currentPeriodStart);
  const newPeriodEnd = updatedSubscription.currentPeriodEnd
    ? new Date(updatedSubscription.currentPeriodEnd)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.polarSubscription.update({
    where: { subscriptionId: subscriptionRecord.subscriptionId },
    data: {
      productId,
      status: updatedSubscription.status,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
    },
  });

  const planType = parsed.data.plan === "pro" ? PlanType.PRO : PlanType.STARTER;
  const limits = PLAN_LIMITS[planType];
  const previousPlan = getPlanTypeByProductId(subscriptionRecord.productId);

  await creditsService.syncPlanCredits({
    userId: user.id,
    plan: planType,
    periodStart: newPeriodStart,
    periodEnd: newPeriodEnd,
    previousPlan,
  });

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
