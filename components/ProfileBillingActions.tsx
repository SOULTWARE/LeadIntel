'use client';

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

type PlanName = "starter" | "pro";

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

export default function ProfileBillingActions({ hasPlan }: { hasPlan: boolean }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<null | "starter" | "pro" | "addon" | "portal">(null);
  const autoStartedRef = useRef(false);

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
    if (autoStartedRef.current || loading) return;
    const plan = searchParams.get("plan");
    if (plan === "starter" || plan === "pro") {
      autoStartedRef.current = true;
      // Defer to avoid synchronous state updates directly inside the effect
      setTimeout(() => handleCheckout(plan), 0);
    }
  }, [loading, searchParams]);

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => handleCheckout("starter")}
          disabled={loading !== null}
          className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
        >
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Starter</div>
          <div className="mt-2 text-3xl font-black text-slate-900">$29</div>
          <div className="text-sm text-slate-500">Monthly subscription</div>
          <div className="mt-4 text-sm font-bold text-blue-600">
            {loading === "starter" ? "Redirecting..." : "Choose Starter"}
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleCheckout("pro")}
          disabled={loading !== null}
          className="rounded-2xl border border-blue-600 bg-slate-900 px-6 py-5 text-left text-white shadow-lg shadow-blue-200 transition hover:bg-slate-800"
        >
          <div className="text-xs font-black uppercase tracking-widest text-blue-300">Pro</div>
          <div className="mt-2 text-3xl font-black">$79</div>
          <div className="text-sm text-slate-300">Monthly subscription</div>
          <div className="mt-4 text-sm font-bold text-blue-200">
            {loading === "pro" ? "Redirecting..." : "Choose Pro"}
          </div>
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div>
          <div className="text-sm font-black text-slate-900">Add-on credits</div>
          <div className="text-sm text-slate-500">50 credits for $5 (expires in 3 months)</div>
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
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          {loading === "portal" ? "Opening..." : "Manage plan in Stripe"}
        </button>
      )}
    </div>
  );
}
