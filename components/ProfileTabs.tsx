"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ADDON_CREDITS_AMOUNT } from "@/lib/polar/plans";

import ProfileBillingActions from "@/components/ProfileBillingActions";
import DeleteAccountButton from "@/components/DeleteAccountButton";

type PlanSlug = "starter" | "pro";

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
  userName: string;
  totalCredits: number;
  baseBalance: number;
  addonBalance: { remaining: number; expiresAt: string | null };
  plan: Plan | null;
  subscription: Subscription | null;
  hasPlan: boolean;
  currentPlanName: PlanSlug | null;
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
    userName,
    totalCredits,
    baseBalance,
    addonBalance,
    plan,
    subscription,
    hasPlan,
    currentPlanName,
  } = props;

  const supabase = useMemo(() => createClient(), []);

  const [profileName, setProfileName] = useState(userName);
  const [profileEmail] = useState(userEmail);
  const [profilePassword, setProfilePassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const [active, setActive] = useState<string>("profile");

  const periodEnd = useMemo(
    () => formatDate(subscription?.currentPeriodEnd ?? plan?.periodEnd ?? null),
    [subscription?.currentPeriodEnd, plan?.periodEnd],
  );

  const planPrice = planPriceLabel(plan?.plan ?? null);

  async function handleSaveProfile() {
    const trimmedPassword = profilePassword.trim();
    const nameChanged = profileName.trim() !== userName.trim();

    if (!nameChanged && !trimmedPassword) {
      setStatusMessage("No changes to save.");
      setIsError(false);
      return;
    }

    if (!currentPassword.trim()) {
      setStatusMessage("Enter your current password to save changes.");
      setIsError(true);
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: profileEmail,
        password: currentPassword.trim(),
      });
      if (reauthError) throw reauthError;

      if (nameChanged) {
        const { error } = await supabase.auth.updateUser({ data: { full_name: profileName.trim() } });
        if (error) throw error;
      }

      if (trimmedPassword) {
        const { error } = await supabase.auth.updateUser({ password: trimmedPassword });
        if (error) throw error;
      }

      setStatusMessage("Profile updated.");
      setIsError(false);
      setCurrentPassword("");
      if (trimmedPassword) setProfilePassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setStatusMessage(msg);
      setIsError(true);
    } finally {
      setSaving(false);
    }
  }

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
        {active === "profile" && (
          <section className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Profile</div>
              <h2 className="text-xl font-black text-slate-900">Make it yours</h2>
              <p className="text-sm text-slate-600">Update your display name and password. Email is managed via Supabase auth.</p>

              <form className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="profile-name">
                    Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="profile-email">
                    Email (read-only)
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={profileEmail}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  />
                  <p className="text-xs text-slate-500">Contact support to change the email linked to your Supabase auth.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="profile-current-password">
                    Current password (required)
                  </label>
                  <input
                    id="profile-current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-slate-500">We re-authenticate before updating your profile.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="profile-password">
                    New password
                  </label>
                  <input
                    id="profile-password"
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-slate-500">Leave blank to keep current password.</p>
                </div>

                <div className="flex gap-3 items-center flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      void handleSaveProfile();
                    }}
                    disabled={saving}
                    className={`rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition ${
                      saving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={(e) => {
                      e.preventDefault();
                      setProfileName(userName);
                      setProfilePassword("");
                      setCurrentPassword("");
                    }}
                  >
                    Reset
                  </button>
                  {statusMessage ? (
                    <span
                      className={`text-sm font-semibold ${isError ? "text-red-600" : "text-emerald-700"}`}
                      role="status"
                    >
                      {statusMessage}
                    </span>
                  ) : null}
                </div>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm space-y-6">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Snapshot</div>
                <h3 className="text-lg font-black text-slate-900">Your account at a glance</h3>
                <div className="grid gap-4 text-sm text-slate-700 mt-4">
                  <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-4 py-3">
                    <span className="font-semibold text-slate-800">Signed in</span>
                    <span className="text-slate-600">{profileEmail}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-4 py-3">
                    <span className="font-semibold text-slate-800">Display name</span>
                    <span className="text-slate-600">{profileName || "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-4 py-3">
                    <span className="font-semibold text-slate-800">Plan</span>
                    <span className="text-slate-600">{plan?.plan ?? "No active plan"}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">Keep your details fresh so your teammates see the right info in dashboards and exports.</p>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-white p-5 space-y-3">
                <div className="text-xs font-black uppercase tracking-[0.3em] text-rose-500">Danger zone</div>
                <p className="text-sm text-slate-600">
                  Delete your account and usage history. This cannot be undone and your email will be blocked from signing up again.
                </p>
                <DeleteAccountButton email={profileEmail} />
              </div>
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
                  <button
                    type="button"
                    onClick={() => setActive("billing")}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 text-center cursor-pointer"
                  >
                    Buy credits
                  </button>
                  <button type="button" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 cursor-pointer">
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
                  {periodEnd ? `Your subscription renews on ${periodEnd}.` : "Your subscription renews based on your billing cycle."}
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
                <ProfileBillingActions hasPlan={hasPlan} currentPlan={currentPlanName} />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
