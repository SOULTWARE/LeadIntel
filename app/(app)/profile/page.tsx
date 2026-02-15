import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";
import { creditsService } from "@/services/creditsService";
import InternalLayoutSetter from "@/components/InternalLayoutSetter";
import ProfileTabs from "@/components/ProfileTabs";
import ProfileBillingActions from "@/components/ProfileBillingActions";
import { User as UserIcon } from "lucide-react";

async function getProfileData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await prisma.userPlan.findUnique({ where: { userId: user.id } });
  const subscription = await prisma.polarSubscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const baseBalance = await creditsService.getBalance(user.id);
  const addonBalance = await creditsService.getAddonBalance(user.id);

  return {
    user,
    plan,
    subscription,
    baseBalance,
    addonBalance,
  };
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { user, plan, subscription, baseBalance, addonBalance } = await getProfileData();
  const checkoutStatus = typeof resolvedSearchParams.checkout === "string" ? resolvedSearchParams.checkout : null;
  const selectedPlan = typeof resolvedSearchParams.plan === "string" ? resolvedSearchParams.plan : null;
  const totalCredits = baseBalance + addonBalance.remaining;
  const hasPlan = Boolean(plan);
  const currentPlanName = plan?.plan === "PRO" ? "pro" : plan?.plan === "STARTER" ? "starter" : null;
  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    "";

  const addonBalanceForClient = {
    remaining: addonBalance.remaining,
    expiresAt: addonBalance.expiresAt ? addonBalance.expiresAt.toISOString() : null,
  };

  const planForClient = plan
    ? {
        ...plan,
        periodEnd: plan?.periodEnd ? plan.periodEnd.toISOString() : null,
      }
    : null;

  const subscriptionForClient = subscription
    ? {
        ...subscription,
        currentPeriodEnd: subscription?.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : null,
      }
    : null;

  if (selectedPlan && !checkoutStatus) {
    return (
      <>
        <InternalLayoutSetter title="Profile" icon={<UserIcon className="w-4 h-4" />} />
        <main className="max-w-2xl mx-auto px-6 py-20">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Redirecting</div>
            <h1 className="mt-3 text-2xl font-black">Opening Checkout...</h1>
            <p className="mt-3 text-sm text-slate-500">
              If you are not redirected automatically, wait a few seconds or refresh the page.
            </p>
          </div>
          <div className="sr-only">
            <ProfileBillingActions hasPlan={hasPlan} currentPlan={currentPlanName} />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <InternalLayoutSetter title="Profile" icon={<UserIcon className="w-4 h-4" />} />
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div className="flex flex-col gap-4">
          {checkoutStatus === "success" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              Checkout complete. Your plan will update shortly.
            </div>
          )}
          {checkoutStatus === "cancel" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              Checkout canceled. You can try again anytime.
            </div>
          )}
        </div>

        <ProfileTabs
          userEmail={user.email ?? ""}
          userName={userName}
          totalCredits={totalCredits}
          baseBalance={baseBalance}
          addonBalance={addonBalanceForClient}
          plan={planForClient}
          subscription={subscriptionForClient}
          hasPlan={hasPlan}
          currentPlanName={currentPlanName}
        />
      </main>
    </>
  );
}
