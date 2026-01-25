import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customers";
import {
  STRIPE_ADDON_PRICE_ID,
  STRIPE_CANCEL_URL,
  STRIPE_PRO_PRICE_ID,
  STRIPE_STARTER_PRICE_ID,
  STRIPE_SUCCESS_URL,
} from "@/lib/stripe/config";

const ACTIVE_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
] as const;

const CheckoutRequestSchema = z.object({
  type: z.enum(["subscription", "addon"]),
  plan: z.enum(["starter", "pro"]).optional(),
});

function getPriceId(input: { type: "subscription" | "addon"; plan?: "starter" | "pro" }): string | null {
  if (input.type === "addon") {
    return STRIPE_ADDON_PRICE_ID || null;
  }

  if (input.plan === "starter") {
    return STRIPE_STARTER_PRICE_ID || null;
  }

  if (input.plan === "pro") {
    return STRIPE_PRO_PRICE_ID || null;
  }

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

  const parsed = CheckoutRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  if (parsed.data.type === "subscription" && !parsed.data.plan) {
    return NextResponse.json({ success: false, error: "Plan is required" }, { status: 400 });
  }

  if (parsed.data.type === "subscription") {
    const existingSubscription = await prisma.stripeSubscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ACTIVE_SUBSCRIPTION_STATUSES as unknown as string[] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingSubscription) {
      try {
        const canceled = await stripe.subscriptions.cancel(existingSubscription.subscriptionId, {
          invoice_now: false,
          prorate: true,
        });

        await prisma.stripeSubscription.update({
          where: { subscriptionId: existingSubscription.subscriptionId },
          data: {
            status: canceled.status,
            currentPeriodStart: new Date(canceled.current_period_start * 1000),
            currentPeriodEnd: new Date(canceled.current_period_end * 1000),
          },
        });
      } catch (error) {
        console.error("[Checkout] Failed to cancel existing subscription", error);
        return NextResponse.json(
          { success: false, error: "Unable to update existing subscription" },
          { status: 500 }
        );
      }
    }
  }

  const priceId = getPriceId(parsed.data);
  if (!priceId) {
    return NextResponse.json({ success: false, error: "Missing Stripe price ID" }, { status: 500 });
  }

  const customerId = await getOrCreateStripeCustomer({ userId: user.id, email: user.email });

  const session = await stripe.checkout.sessions.create({
    mode: parsed.data.type === "subscription" ? "subscription" : "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: STRIPE_SUCCESS_URL,
    cancel_url: STRIPE_CANCEL_URL,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
      type: parsed.data.type,
      plan: parsed.data.plan ?? "",
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      url: session.url,
    },
  });
}
