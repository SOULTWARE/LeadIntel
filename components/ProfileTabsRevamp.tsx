"use client";

import { useEffect, useMemo, useState } from "react";
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

export type ProfileTabsRevampProps = {
  userEmail: string;
  userName: string;
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
  if (percent >= 60) return "bg-emerald-600";
  if (percent >= 30) return "bg-amber-500";
  return "bg-rose-600";
}

function resolveProfileSection(hash: string) {
  const normalized = hash.replace(/^#/, "");

  if (normalized === "usage" || normalized === "billing" || normalized === "notifications" || normalized === "profile") {
    return normalized;
  }

  return "profile";
}

const sectionOrder = ["profile", "usage", "billing", "notifications"] as const;

export default function ProfileTabsRevamp(props: ProfileTabsRevampProps) {
  const {
    userEmail,
    userName,
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncSectionFromHash = () => {
      setActive(resolveProfileSection(window.location.hash));
    };

    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);

    return () => {
      window.removeEventListener("hashchange", syncSectionFromHash);
    };
  }, []);

  const periodEnd = useMemo(
    () => formatDate(subscription?.currentPeriodEnd ?? plan?.periodEnd ?? null),
    [subscription?.currentPeriodEnd, plan?.periodEnd],
  );

  const planPrice = planPriceLabel(plan?.plan ?? null);

  const setSection = (section: string) => {
    setActive(section);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${section}`);
    }
  };

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
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setStatusMessage(message);
      setIsError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-5 p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="eyebrow">Account workspace</div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Profile, usage, billing, and account controls.</h2>
              <p className="section-copy mt-2 max-w-3xl">
                Keep identity settings current, monitor credit consumption, manage the subscription, and handle account-level actions from one workspace.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface-muted p-4">
              <div className="section-label">Plan</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">{plan?.plan ?? "No plan"}</div>
            </div>
            <div className="surface-muted p-4">
              <div className="section-label">Base credits</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">{baseBalance}</div>
            </div>
            <div className="surface-muted p-4">
              <div className="section-label">Add-on credits</div>
              <div className="mt-2 text-xl font-semibold text-blue-700">{addonBalance.remaining}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-5">
          {sectionOrder.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setSection(section)}
              className={`btn ${active === section ? "border-blue-700 bg-blue-700 text-white hover:bg-blue-600" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {section}
            </button>
          ))}
        </div>
      </section>

      {active === "profile" && (
        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="surface space-y-5 p-5 lg:p-6">
            <div>
              <div className="section-label">Profile</div>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Update account details</h3>
              <p className="mt-2 text-sm text-slate-600">Display name and password changes are saved through Supabase authentication.</p>
            </div>

            <form className="space-y-4">
              <label className="block space-y-2">
                <span className="section-label">Name</span>
                <input
                  id="profile-name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="field-input"
                  placeholder="Your name"
                />
              </label>

              <label className="block space-y-2">
                <span className="section-label">Email</span>
                <input id="profile-email" type="email" value={profileEmail} readOnly className="field-input bg-slate-50 text-slate-500" />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="section-label">Current password</span>
                  <input
                    id="profile-current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="field-input"
                    placeholder="Required to save"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="section-label">New password</span>
                  <input
                    id="profile-password"
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="field-input"
                    placeholder="Leave blank to keep current password"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    void handleSaveProfile();
                  }}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={(event) => {
                    event.preventDefault();
                    setProfileName(userName);
                    setProfilePassword("");
                    setCurrentPassword("");
                  }}
                >
                  Reset
                </button>
              </div>

              {statusMessage ? (
                <div className={`text-sm font-medium ${isError ? "text-rose-700" : "text-emerald-700"}`} role="status">
                  {statusMessage}
                </div>
              ) : null}
            </form>
          </div>

          <div className="space-y-6">
            <div className="surface space-y-4 p-5 lg:p-6">
              <div className="section-label">Snapshot</div>
              <div className="grid gap-3">
                <div className="surface-muted p-4">
                  <div className="section-label">Signed in</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">{profileEmail}</div>
                </div>
                <div className="surface-muted p-4">
                  <div className="section-label">Display name</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">{profileName || "Not set"}</div>
                </div>
                <div className="surface-muted p-4">
                  <div className="section-label">Plan</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">{plan?.plan ?? "No active plan"}</div>
                </div>
              </div>
            </div>

            <div className="surface space-y-4 p-5 lg:p-6">
              <div className="section-label text-rose-700">Danger zone</div>
              <p className="text-sm text-slate-600">
                Delete your account and usage history. This cannot be undone and the email will be blocked from signing up again.
              </p>
              <DeleteAccountButton email={profileEmail} />
            </div>
          </div>
        </section>
      )}

      {active === "usage" && (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="surface space-y-5 p-5 lg:p-6">
            <div>
              <div className="section-label">Usage</div>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Credit balances and consumption</h3>
              <p className="mt-2 text-sm text-slate-600">Base credits reset with the plan cycle. Add-ons are consumed after base credits are exhausted.</p>
            </div>

            <div className="space-y-4">
              <div className="surface-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="section-label">Plan credits</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">{baseBalance} available</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {plan?.maxEnhancedLeadsPerMonth ? `${plan.maxEnhancedLeadsPerMonth} monthly cap` : "No cap configured"}
                  </div>
                </div>
                {plan?.maxEnhancedLeadsPerMonth ? (
                  <div className="mt-4 space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      {(() => {
                        const remainingPercent = getUsagePercent(baseBalance, plan.maxEnhancedLeadsPerMonth);
                        const usedPercent = 100 - remainingPercent;
                        return (
                          <div
                            className={`h-full ${getUsageColorClass(remainingPercent)}`}
                            style={{ width: `${usedPercent}%` }}
                            aria-label="Plan credits used"
                          />
                        );
                      })()}
                    </div>
                    <p className="text-xs text-slate-500">Used percentage of the current plan period.</p>
                  </div>
                ) : null}
              </div>

              <div className="surface-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="section-label">Add-on credits</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">{addonBalance.remaining} remaining</div>
                  </div>
                  <div className="text-xs text-slate-500">{addonBalance.expiresAt ? `Expires ${formatDate(addonBalance.expiresAt)}` : "No expiry recorded"}</div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    {(() => {
                      const remainingPercent = getUsagePercent(addonBalance.remaining, ADDON_CREDITS_AMOUNT);
                      const usedPercent = 100 - remainingPercent;
                      return (
                        <div
                          className={`h-full ${getUsageColorClass(remainingPercent)}`}
                          style={{ width: `${usedPercent}%` }}
                          aria-label="Add-on credits used"
                        />
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-500">Add-ons stay available until consumed or expired.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="surface space-y-4 p-5 lg:p-6">
            <div className="section-label">Summary</div>
            <div className="space-y-3">
              <div className="surface-muted p-4">
                <div className="section-label">Current plan</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">
                  {plan?.plan ?? "No active subscription"} {planPrice ? <span className="text-sm text-slate-500">({planPrice})</span> : null}
                </div>
              </div>
              <div className="surface-muted p-4">
                <div className="section-label">Billing period</div>
                <div className="mt-2 text-sm font-medium text-slate-700">
                  {periodEnd ? `Ends ${periodEnd}` : "No billing period available"}
                </div>
              </div>
              <div className="surface-muted p-4">
                <div className="section-label">Next step</div>
                <p className="mt-2 text-sm text-slate-600">Open the billing section to switch plans or buy add-on credits.</p>
              </div>
            </div>
            <button type="button" onClick={() => setSection("billing")} className="btn-accent">
              Open billing
            </button>
          </div>
        </section>
      )}

      {active === "billing" && (
        <section className="surface space-y-6 p-5 lg:p-6">
          <div className="space-y-3">
            <div className="section-label">Billing</div>
            <h3 className="text-xl font-semibold text-slate-950">Subscription and payment controls</h3>
            <p className="text-sm text-slate-600">
              Your account is currently on {plan?.plan ?? "no active plan"}
              {planPrice ? ` (${planPrice})` : ""}.
              {periodEnd ? ` Current period ends on ${periodEnd}.` : " Connect a plan to see renewal details."}
            </p>
            {subscription?.status ? <p className="text-sm text-slate-500">Subscription status: {subscription.status}</p> : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="surface-muted p-4">
              <div className="section-label">Payment details</div>
              <p className="mt-2 text-sm text-slate-600">Update payment method and billing address through the billing portal.</p>
            </div>
            <div className="surface-muted p-4">
              <div className="section-label">Invoices</div>
              <p className="mt-2 text-sm text-slate-600">Use the portal to review and download invoices for past billing cycles.</p>
            </div>
            <div className="surface-muted p-4">
              <div className="section-label">Add-ons</div>
              <p className="mt-2 text-sm text-slate-600">Buy temporary credits when monthly usage spikes beyond your subscription allowance.</p>
            </div>
          </div>

          <ProfileBillingActions hasPlan={hasPlan} currentPlan={currentPlanName} />
        </section>
      )}

      {active === "notifications" && (
        <section className="surface space-y-4 p-5 lg:p-6">
          <div className="section-label">Notifications</div>
          <h3 className="text-xl font-semibold text-slate-950">Alerts and account updates</h3>
          <div className="surface-inset p-10 text-center">
            <p className="text-sm text-slate-500">You currently have no notifications.</p>
          </div>
        </section>
      )}
    </div>
  );
}
