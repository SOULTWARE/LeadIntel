import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { getStripeCustomerIdByUserId } from "@/lib/stripe/customers";
import { STRIPE_PORTAL_RETURN_URL } from "@/lib/stripe/config";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const customerId = await getStripeCustomerIdByUserId(user.id);
  if (!customerId) {
    return NextResponse.json({ success: false, error: "Missing Stripe customer" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: STRIPE_PORTAL_RETURN_URL,
  });

  return NextResponse.json({
    success: true,
    data: { url: session.url },
  });
}
