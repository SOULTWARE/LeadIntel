import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";
import { creditsService } from "@/services/creditsService";
import ProfileBillingActions from "@/components/ProfileBillingActions";
import InternalLayoutSetter from "@/components/InternalLayoutSetter";
import { User as UserIcon } from "lucide-react";

async function getProfileData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [plan, subscription, baseBalance, addonBalance] = await Promise.all([
    (prisma as any).userPlan.findUnique({ where: { userId: user.id } }),
    (prisma as any).stripeSubscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    creditsService.getBalance(user.id),
    creditsService.getAddonBalance(user.id),
  ]);

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

  if (selectedPlan && !checkoutStatus) {
    return (
      <>
        <InternalLayoutSetter title="Profile" icon={<UserIcon className="w-4 h-4" />} />
        <main className="max-w-2xl mx-auto px-6 py-20">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Redirecting</div>
            <h1 className="mt-3 text-2xl font-black">Opening Stripe Checkout...</h1>
            <p className="mt-3 text-sm text-slate-500">
              If you are not redirected automatically, wait a few seconds or refresh the page.
            </p>
          </div>
          <div className="sr-only">
            <ProfileBillingActions hasPlan={hasPlan} />
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

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="h-full">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sticky top-24 space-y-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Account</div>
              <nav className="space-y-1">
                <a href="#overview" className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Profile
                </a>
                <a href="#notifications" className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Notifications
                </a>
                <a href="#settings" className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Settings
                </a>
              </nav>

              <div className="h-px w-full bg-slate-100" />

              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Subscription</div>
              <nav className="space-y-1">
                <a href="#credits" className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Usage
                </a>
                <a href="#billing" className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Manage Plan
                </a>
              </nav>
            </div>
          </aside>

          <div className="space-y-8">
            <section id="overview" className="grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Account</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{user.email}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Plan</div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  {plan?.plan ?? "No active plan"}
                </div>
                {subscription?.status && (
                  <div className="mt-1 text-sm text-slate-500">Status: {subscription.status}</div>
                )}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Total credits</div>
                <div className="mt-2 text-3xl font-black text-blue-600">{totalCredits}</div>
                {plan?.maxEnhancedLeadsPerMonth ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Available</span>
                      <span>
                        {totalCredits} / {plan.maxEnhancedLeadsPerMonth}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-[width]"
                        style={{
                          width: `${Math.min(100, (totalCredits / plan.maxEnhancedLeadsPerMonth) * 100)}%`,
                        }}
                        aria-label="Credits remaining"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section id="credits" className="grid gap-6 md:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="space-y-2">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Usage</div>
                  <h2 className="text-2xl font-black text-slate-900">LeadIntel Usage Summary</h2>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>Track your plan and add-on credits in one place.</p>
                    {plan?.plan ? (
                      <p>Current plan: {plan.plan}</p>
                    ) : (
                      <p>No active subscription yet.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Plan credits</div>
                      <div className="text-xs uppercase font-black tracking-widest text-slate-400">Available vs monthly limit</div>
                    </div>
                    <div className="text-right text-xs text-slate-500">Base credits refresh with your subscription.</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>{baseBalance} available</span>
                      <span className="text-slate-500">
                        {plan?.maxEnhancedLeadsPerMonth ? `${plan.maxEnhancedLeadsPerMonth} monthly` : "No limit set"}
                      </span>
                    </div>
                    {plan?.maxEnhancedLeadsPerMonth ? (
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.min(100, (baseBalance / plan.maxEnhancedLeadsPerMonth) * 100)}%` }}
                          aria-label="Plan credits remaining"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Add-on credits</div>
                      <div className="text-xs uppercase font-black tracking-widest text-slate-400">Current balance</div>
                    </div>
                    <div className="text-right text-xs text-slate-500">Used after base credits are exhausted.</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>{addonBalance.remaining} remaining</span>
                      <span className="text-slate-500">
                        {addonBalance.expiresAt ? `Expires ${new Date(addonBalance.expiresAt).toLocaleDateString()}` : "No expiry"}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: addonBalance.remaining > 0 ? "100%" : "0%" }}
                        aria-label="Add-on credits remaining"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-700">
                  <p>
                    Once base credits are used, add-ons keep your premium enrichments running. Purchase more anytime.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <a href="#billing" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 text-center">
                      Manage / purchase credits
                    </a>
                    <button type="button" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50">
                      Refer a friend for bonus credits
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section id="billing" className="grid gap-6 md:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Billing</div>
                <div className="mt-3">
                  <ProfileBillingActions hasPlan={hasPlan} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
