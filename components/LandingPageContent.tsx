'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { LandingHero } from './landing-page/LandingHero';
import { WorkflowSection } from './landing-page/WorkflowSection';
import { ProductPreviewSection } from './landing-page/ProductPreviewSection';

interface LandingPageContentProps {
  user: SupabaseUser | null;
}

export default function LandingPageContent({ user }: LandingPageContentProps) {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-24 px-6 pb-32 pt-16 lg:px-8">
      <section className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur-2xl lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Lead intelligence workspace
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Hunter-first discovery, AI enhancement, and outreach drafting in one clean workflow built for fast-moving teams.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-auto">
          {[
            { label: 'Verified leads', value: 'High precision' },
            { label: 'AI enrichment', value: 'One-click' },
            { label: 'Outreach ready', value: 'Export fast' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-lg shadow-slate-900/10">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{item.label}</div>
              <div className="mt-1 text-sm font-black tracking-tight">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-24">
      <LandingHero user={user} />

      <WorkflowSection />

      <ProductPreviewSection />
      </section>
    </main>
  );
}
