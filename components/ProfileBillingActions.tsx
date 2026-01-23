'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type PlanName = "starter" | "pro";

const PLAN_DETAILS: Record<PlanName, { label: string; price: string; bullets: string[] }> = {
  starter: {
    label: "Starter",
    price: "$29",
    bullets: ["1,000 Enhanced Leads", "1,000 Email Discoveries", "50 max leads per search"],
  },
  pro: {
    label: "Pro",
    price: "$79",
    bullets: ["5,000 Enhanced Leads", "5,000 Email Discoveries", "200 max leads per search"],
  },
};

async function startCheckout(type: "subscription" | "addon", plan?: PlanName) {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, plan }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Checkout failed");
  }

  const url = data.data?.url as string | undefined;
  if (!url) {
    throw new Error("Missing Stripe checkout URL");
  }

  window.location.href = url;
}

async function openPortal() {
  const response = await fetch("/api/billing/portal", { method: "POST" });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Unable to open billing portal");
  }

  const url = data.data?.url as string | undefined;
  if (!url) {
    throw new Error("Missing portal URL");
  }

  window.location.href = url;
}

export default function ProfileBillingActions({
  hasPlan,
  currentPlan,
}: {
  hasPlan: boolean;
  currentPlan: PlanName | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<null | "starter" | "pro" | "addon" | "portal">(null);
  const autoStartedRef = useRef(false);
  const [changingPlan, setChangingPlan] = useState<PlanName | null>(null);
  const [localPlan, setLocalPlan] = useState<PlanName | null>(currentPlan);

  useEffect(() => {
    setLocalPlan(currentPlan);
  }, [currentPlan]);

  const handleCheckout = async (plan: PlanName) => {
    setLoading(plan);
    try {
      await startCheckout("subscription", plan);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setLoading(null);
    }
  };

  useEffect(() => {
    if (autoStartedRef.current || loading || hasPlan) return;
    const plan = searchParams.get("plan");
    if (plan === "starter" || plan === "pro") {
      autoStartedRef.current = true;
      // Defer to avoid synchronous state updates directly inside the effect
      setTimeout(() => handleCheckout(plan), 0);
    }
  }, [hasPlan, loading, searchParams]);

  const handleAddon = async () => {
    setLoading("addon");
    try {
      await startCheckout("addon");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      await openPortal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open portal");
      setLoading(null);
    }
  };

  const handlePlanChange = async (plan: PlanName) => {
    setChangingPlan(plan);
    try {
      const response = await fetch("/api/billing/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to change plan");
      }

      toast.success("Plan updated. Stripe will apply prorations automatically.");
      setLocalPlan(plan);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change plan");
    } finally {
      setChangingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {(["starter", "pro"] as PlanName[]).map((plan) => {
          const details = PLAN_DETAILS[plan];
          const isCurrentPlan = hasPlan && localPlan === plan;
          const isProcessing = (!hasPlan && loading === plan) || (hasPlan && changingPlan === plan);

          const handleClick = () => {
            if (hasPlan) {
              if (isCurrentPlan) return;
              return handlePlanChange(plan);
            }
            return handleCheckout(plan);
          };

          return (
            <button
              key={plan}
              type="button"
              onClick={handleClick}
              disabled={isProcessing || isCurrentPlan}
              className={`rounded-2xl border px-6 py-5 text-left shadow-sm transition ${
                plan === "pro"
                  ? "border-blue-600 bg-slate-900 text-white hover:bg-slate-800"
                  : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md"
              } ${isCurrentPlan ? "opacity-70" : ""}`}
            >
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                {details.label}
              </div>
              <div className="mt-2 text-3xl font-black">{details.price}</div>
              <div className="text-sm text-slate-500">Monthly subscription</div>
              <ul className="mt-4 space-y-1 text-xs font-semibold text-slate-500">
                {details.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <div className="mt-4 text-sm font-bold text-blue-600">
                {isCurrentPlan
                  ? "Current plan"
                  : isProcessing
                    ? hasPlan
                      ? "Updating..."
                      : "Redirecting..."
                    : hasPlan
                      ? `Switch to ${details.label}`
                      : `Choose ${details.label}`}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div>
          <div className="text-sm font-black text-slate-900">Add-on credits</div>
          <div className="text-sm text-slate-500">500 credits for $10 (expires in 3 months)</div>
        </div>
        <button
          type="button"
          onClick={handleAddon}
          disabled={loading !== null}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        >
          {loading === "addon" ? "Redirecting..." : "Buy add-on"}
        </button>
      </div>

      {hasPlan && (
        <button
          type="button"
          onClick={handlePortal}
          disabled={loading !== null}
          className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          {loading === "portal" ? "Opening..." : "Manage plan in Stripe"}
        </button>
      )}
    </div>
  );
}
