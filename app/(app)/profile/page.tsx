import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";
import InternalLayoutSetter from "@/components/InternalLayoutSetter";
import ProfileTabsRevamp from "@/components/ProfileTabsRevamp";
import ProfileBillingActions from "@/components/ProfileBillingActions";
import { resolveProfileBillingState } from "@/lib/polar/profile";
import { User as UserIcon } from "lucide-react";

async function getProfileData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const billingState = await resolveProfileBillingState(user.id, user.email);
  const baseBalance = await creditsService.getBalance(user.id);
  const addonBalance = await creditsService.getAddonBalance(user.id);

  return {
    user,
    plan: billingState.plan,
    subscription: billingState.subscription,
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
  const { user, plan, subscription, baseBalance, addonBalance } =
    await getProfileData();
  const checkoutStatus =
    typeof resolvedSearchParams.checkout === "string"
      ? resolvedSearchParams.checkout
      : null;
  const selectedPlan =
    typeof resolvedSearchParams.plan === "string"
      ? resolvedSearchParams.plan
      : null;
  const hasPlan = Boolean(plan);
  const currentPlanName =
    plan?.plan === "PRO" ? "pro" : plan?.plan === "STARTER" ? "starter" : null;
  const userName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    "";

  const addonBalanceForClient = {
    remaining: addonBalance.remaining,
    expiresAt: addonBalance.expiresAt
      ? addonBalance.expiresAt.toISOString()
      : null,
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
        currentPeriodEnd: subscription?.currentPeriodEnd
          ? subscription.currentPeriodEnd.toISOString()
          : null,
      }
    : null;

  if (selectedPlan && !checkoutStatus) {
    return (
      <>
        <InternalLayoutSetter
          title="Profile"
          icon={<UserIcon className="w-4 h-4" />}
        />
        <div className="page-stack">
          <section className="surface p-8 text-center">
            <div className="section-label">Redirecting</div>
            <h1 className="mt-3 text-2xl font-semibold">Opening checkout...</h1>
            <p className="mt-3 text-sm text-slate-500">
              If you are not redirected automatically, wait a few seconds or
              refresh the page.
            </p>
          </section>
          <div className="sr-only">
            <ProfileBillingActions
              hasPlan={hasPlan}
              currentPlan={currentPlanName}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalLayoutSetter
        title="Profile"
        icon={<UserIcon className="w-4 h-4" />}
      />
      <div className="page-stack">
        <section className="surface grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="space-y-4">
            <div className="eyebrow">
              <UserIcon className="h-4 w-4" />
              Account overview
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Manage identity, credits, billing, and account controls from one
              place.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600">
              The account workspace centralizes subscription visibility, credit
              usage, and profile controls so operational details stay as clear
              as the lead workflow itself.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="metric-card bg-slate-950 text-white">
              <div className="metric-label text-slate-400">Plan</div>
              <div className="metric-value text-white">
                {plan?.plan ?? "None"}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Base credits</div>
              <div className="metric-value text-blue-700">{baseBalance}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Add-ons</div>
              <div className="metric-value text-emerald-700">
                {addonBalance.remaining}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {checkoutStatus === "success" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Checkout complete. Your plan will update shortly.
            </div>
          )}
          {checkoutStatus === "cancel" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              Checkout canceled. You can try again anytime.
            </div>
          )}
        </div>

        <ProfileTabsRevamp
          userEmail={user.email ?? ""}
          userName={userName}
          baseBalance={baseBalance}
          addonBalance={addonBalanceForClient}
          plan={planForClient}
          subscription={subscriptionForClient}
          hasPlan={hasPlan}
          currentPlanName={currentPlanName}
        />
      </div>
    </>
  );
}
