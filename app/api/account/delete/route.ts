import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason : "user_deleted";
    const email = user.email?.trim().toLowerCase();

    const subscriptions = await prisma.stripeSubscription.findMany({ where: { userId: user.id } });

    for (const subscription of subscriptions) {
      try {
        await stripe.subscriptions.cancel(subscription.subscriptionId, {
          invoice_now: false,
          prorate: true,
        });
      } catch (error) {
        console.error("[api/account/delete] Failed to cancel subscription", subscription.subscriptionId, error);
        return NextResponse.json({ success: false, error: "Unable to cancel subscription" }, { status: 500 });
      }
    }

    await prisma.$transaction(async (tx) => {
      if (email) {
        await tx.blockedEmail.upsert({
          where: { email },
          update: { reason },
          create: { email, reason },
        });
      }

      await tx.creditLedgerEntry.deleteMany({ where: { userId: user.id } });
      await tx.lead.deleteMany({ where: { userId: user.id } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.search.deleteMany({ where: { userId: user.id } });
      await tx.usageCounter.deleteMany({ where: { userId: user.id } });
      await tx.userPlan.deleteMany({ where: { userId: user.id } });
      await tx.creditBalance.deleteMany({ where: { userId: user.id } });
      await tx.addonCreditBalance.deleteMany({ where: { userId: user.id } });
      await tx.stripeSubscription.deleteMany({ where: { userId: user.id } });
      await tx.stripeCustomer.deleteMany({ where: { userId: user.id } });
    });

    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/account/delete]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
