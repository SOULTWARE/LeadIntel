import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";
import InternalLayoutSetter from "@/components/InternalLayoutSetter";
import ProfileTabs from "@/components/ProfileTabs";
import ProfileBillingActions from "@/components/ProfileBillingActions";
import {
  reconcileAddonCredits,
  resolveProfileBillingState,
} from "@/lib/polar/profile";
import { User as UserIcon } from "lucide-react";

async function getProfileData(input: { shouldReconcileAddonCredits: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const billingState = await resolveProfileBillingState(user.id, user.email);
  const baseBalance = await creditsService.getBalance(user.id);
  const initialAddonBalance = await creditsService.getAddonBalance(user.id);
  const shouldReconcileAddonCredits = input.shouldReconcileAddonCredits;

  if (shouldReconcileAddonCredits) {
    await reconcileAddonCredits(user.id, user.email);
  }

  const addonBalance = shouldReconcileAddonCredits
    ? await creditsService.getAddonBalance(user.id)
    : initialAddonBalance;

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
  const checkoutStatus =
    typeof resolvedSearchParams.checkout === "string"
      ? resolvedSearchParams.checkout
      : null;
  const { user, plan, subscription, baseBalance, addonBalance } =
    await getProfileData({
      shouldReconcileAddonCredits: checkoutStatus === "success",
    });
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
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-[0_24px_80px_-40px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">
              Redirecting
            </div>
            <h1 className="mt-3 text-2xl font-black">Opening Checkout...</h1>
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
      <div className="space-y-8">
        <section className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.25)] backdrop-blur-xl lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">
              <UserIcon className="h-4 w-4" />
              Account overview
            </div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Manage your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                profile, billing, and credits
              </span>
              .
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-500 md:text-lg">
              Keep your account details current and your subscription state
              visible so the workspace always feels ready for the next launch.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                Plan
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight">
                {plan?.plan ?? "None"}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-lg shadow-blue-100/40">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                Base credits
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-blue-600">
                {baseBalance}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 shadow-lg shadow-emerald-100/40">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-500">
                Add-ons
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-emerald-600">
                {addonBalance.remaining}
              </div>
            </div>
          </div>
        </section>

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
