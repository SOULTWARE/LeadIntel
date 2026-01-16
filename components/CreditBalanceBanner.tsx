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
    <div className="bg-amber-50 border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-semibold text-amber-900">
          Low credits alert: {summary.total} remaining. Top up to keep running jobs.
        </div>
        <Link
          href="/profile"
          className="text-sm font-bold text-amber-900 bg-amber-100 px-4 py-2 rounded-xl hover:bg-amber-200 transition"
        >
          Buy add-on credits
        </Link>
      </div>
    </div>
  );
}
