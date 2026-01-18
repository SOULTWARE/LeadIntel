"use client";

import { useMemo, useState } from "react";
import { ADDON_CREDITS_AMOUNT } from "@/lib/stripe/plans";

import ProfileBillingActions from "@/components/ProfileBillingActions";

type Plan = {
  plan: string | null;
  periodEnd?: string | null;
  maxLeadsPerSearch?: number | null;
  maxEnhancedLeadsPerMonth?: number | null;
  maxEmailDiscoveriesPerMonth?: number | null;
  maxEmailVerificationsPerMonth?: number | null;
};

type Subscription = {
  status: string | null;
  currentPeriodEnd?: string | null;
};

export type ProfileTabsProps = {
  userEmail: string;
  totalCredits: number;
  baseBalance: number;
  addonBalance: { remaining: number; expiresAt: string | null };
  plan: Plan | null;
  subscription: Subscription | null;
  hasPlan: boolean;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function planPriceLabel(plan: string | null) {
  if (plan === "PRO") return "$79/month";
  if (plan === "STARTER") return "$29/month";
  return null;
}

function getUsagePercent(remaining: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (remaining / total) * 100));
}

function getUsageColorClass(percent: number) {
  if (percent >= 60) return "bg-emerald-500";
  if (percent >= 30) return "bg-amber-500";
  return "bg-red-500";
}

export default function ProfileTabs(props: ProfileTabsProps) {
  const {
    userEmail,
    totalCredits,
    baseBalance,
    addonBalance,
    plan,
    subscription,
    hasPlan,
  } = props;

  const [active, setActive] = useState<string>("overview");

  const periodEnd = useMemo(
    () => formatDate(subscription?.currentPeriodEnd ?? plan?.periodEnd ?? null),
    [subscription?.currentPeriodEnd, plan?.periodEnd],
  );

  const planPrice = planPriceLabel(plan?.plan ?? null);

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <aside className="h-full">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sticky top-24 space-y-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Account</div>
          <nav className="space-y-1">
            <a
              href="#profile"
              onClick={(e) => {
                e.preventDefault();
                setActive("profile");
              }}
              className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active === "profile" ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Profile
            </a>
            <a
              href="#notifications"
              onClick={(e) => {
                e.preventDefault();
                setActive("notifications");
              }}
              className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active === "notifications" ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Notifications
            </a>
            <a
              href="#settings"
              onClick={(e) => {
                e.preventDefault();
                setActive("settings");
              }}
              className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active === "settings" ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Settings
            </a>
          </nav>

          <div className="h-px w-full bg-slate-100" />

          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Subscription</div>
          <nav className="space-y-1">
            <a
              href="#usage"
              onClick={(e) => {
                e.preventDefault();
                setActive("usage");
              }}
              className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active === "usage" ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Usage
            </a>
            <a
              href="#billing"
              onClick={(e) => {
                e.preventDefault();
                setActive("billing");
              }}
              className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active === "billing" ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Manage Plan
            </a>
          </nav>
        </div>
      </aside>

      <div className="space-y-8">
        {active === "overview" && (
          <section className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Account</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{userEmail}</div>
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
                    <span>{totalCredits} remaining</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    {(() => {
                      const remainingPercent = getUsagePercent(totalCredits, plan.maxEnhancedLeadsPerMonth);
                      const usedPercent = 100 - remainingPercent;
                      const color = getUsageColorClass(remainingPercent);
                      return (
                        <div
                          className={`h-full rounded-full transition-[width] ${color}`}
                          style={{ width: `${usedPercent}%` }}
                          aria-label="Credits used"
                        />
                      );
                    })()}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {active === "notifications" && (
          <section className="grid gap-6 md:grid-cols-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Notifications</div>
              <h2 className="text-xl font-black text-slate-900">Notifications</h2>
              <p className="text-sm text-slate-600">Your current alerts, important updates, and account notifications.</p>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 text-center">
                You currently have no notifications.
              </div>
            </div>
          </section>
        )}

        {active === "usage" && (
          <section className="grid gap-6 md:grid-cols-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Usage</div>
                <h2 className="text-2xl font-black text-slate-900">LeadIntel Usage Summary</h2>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>Track your plan and add-on credits in one place.</p>
                  {plan?.plan ? <p>Current plan: {plan.plan}</p> : <p>No active subscription yet.</p>}
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
                      {plan?.maxEnhancedLeadsPerMonth ? `${baseBalance} remaining` : "No limit set"}
                    </span>
                  </div>
                  {plan?.maxEnhancedLeadsPerMonth ? (
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white">
                      {(() => {
                        const remainingPercent = getUsagePercent(baseBalance, plan.maxEnhancedLeadsPerMonth);
                        const usedPercent = 100 - remainingPercent;
                        const color = getUsageColorClass(remainingPercent);
                        return (
                          <div
                            className={`h-full rounded-full transition-[width] ${color}`}
                            style={{ width: `${usedPercent}%` }}
                            aria-label="Plan credits used"
                          />
                        );
                      })()}
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
                    <span className="text-slate-500">{addonBalance.remaining} remaining</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white">
                    {(() => {
                      const remainingPercent = getUsagePercent(addonBalance.remaining, ADDON_CREDITS_AMOUNT);
                      const usedPercent = 100 - remainingPercent;
                      const color = getUsageColorClass(remainingPercent);
                      return (
                        <div
                          className={`h-full rounded-full transition-[width] ${color}`}
                          style={{ width: `${usedPercent}%` }}
                          aria-label="Add-on credits used"
                        />
                      );
                    })()}
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
        )}

        {active === "billing" && (
          <section className="grid gap-6 md:grid-cols-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Plan Management</div>
                <h2 className="text-xl font-black text-slate-900">Manage your plan</h2>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>
                    Your account is currently on {plan?.plan ? <span className="font-bold text-slate-900">{plan.plan}</span> : "no active plan"}
                    {plan?.plan ? "" : "."}
                    {plan?.plan && planPrice ? <span> ({planPrice})</span> : null}.
                  </p>
                  {periodEnd ? (
                    <p>Current period ends on {periodEnd}{subscription?.status ? ` (${subscription.status})` : ""}.</p>
                  ) : (
                    <p>Connect a plan to see renewal details.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-800">Plan actions</div>
                <p className="text-sm text-slate-600">Use the portal below to switch, cancel, or update payment.</p>
                <p className="text-xs text-slate-500">If you cancel, you keep access until the end of your billing period.</p>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm font-bold text-slate-900">Billing</div>
                <p className="text-sm text-slate-600">
                  {periodEnd ? `Your subscription renews on ${periodEnd}.` : "Your subscription renews based on your Stripe billing cycle."}
                </p>
                <div className="space-y-2 text-sm text-slate-700">
                  <div>
                    <div className="font-semibold text-slate-900">Payment details</div>
                    <p className="text-slate-600">Update the payment method and billing address in the portal.</p>
                  </div>
                  <div className="font-semibold text-slate-900">Invoices</div>
                  <p className="text-slate-600">View and download past invoices in the portal.</p>
                </div>
              </div>

              <div className="mt-4">
                <ProfileBillingActions hasPlan={hasPlan} />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
