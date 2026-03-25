'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

type CreditSummary = {
  baseBalance: number;
  addonRemaining: number;
  addonExpiresAt: string | null;
  total: number;
};

export default function CreditBalanceBanner() {
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/credits/summary")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.success) return null;
        return data.data as CreditSummary;
      })
      .then((data) => {
        if (!isMounted) return;
        setSummary(data);
        setLoaded(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loaded) return null;
  if (!summary) return null;
  if (summary.total >= 10) return null;

  return (
    <div className="border-b border-amber-200/60 bg-amber-50/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="text-sm font-semibold text-amber-900">
          Low credits alert: {summary.total} remaining. Top up to keep running jobs.
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white/80 px-4 py-2 text-sm font-black text-amber-900 transition-transform hover:-translate-y-0.5"
        >
          Buy add-on credits
        </Link>
      </div>
    </div>
  );
}
