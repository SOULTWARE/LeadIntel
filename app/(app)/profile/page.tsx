import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";
import { creditsService } from "@/services/creditsService";
import ProfileBillingActions from "@/components/ProfileBillingActions";

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
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { user, plan, subscription, baseBalance, addonBalance } = await getProfileData();
  const checkoutStatus = typeof searchParams.checkout === "string" ? searchParams.checkout : null;
  const totalCredits = baseBalance + addonBalance.remaining;
  const hasPlan = Boolean(plan);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black tracking-tight">Profile</h1>
          <p className="text-slate-500">Manage your plan and credits.</p>
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

        <section className="grid gap-6 md:grid-cols-3">
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
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Base credits</div>
                <div className="text-2xl font-black text-slate-900">{baseBalance}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Addon credits</div>
                <div className="text-2xl font-black text-slate-900">{addonBalance.remaining}</div>
                {addonBalance.expiresAt && (
                  <div className="text-xs text-slate-500">
                    Expires {new Date(addonBalance.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-2 text-sm text-slate-600">
              <div>Max leads per search: {plan?.maxLeadsPerSearch ?? "—"}</div>
              <div>Enhanced leads/month: {plan?.maxEnhancedLeadsPerMonth ?? "—"}</div>
              <div>Email discoveries/month: {plan?.maxEmailDiscoveriesPerMonth ?? "—"}</div>
              <div>Email verifications/month: {plan?.maxEmailVerificationsPerMonth ?? "—"}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Billing</div>
            <div className="mt-3">
              <ProfileBillingActions hasPlan={hasPlan} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
