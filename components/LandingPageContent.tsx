"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { LandingHeroRevamp } from "./landing-page/LandingHeroRevamp";
import { WorkflowSectionRevamp } from "./landing-page/WorkflowSectionRevamp";
import { ProductPreviewSectionRevamp } from "./landing-page/ProductPreviewSectionRevamp";

interface LandingPageContentProps {
  user: SupabaseUser | null;
}

export default function LandingPageContent({ user }: LandingPageContentProps) {
  return (
    <main className="page-shell flex flex-col gap-16 pb-24 pt-10 lg:gap-20 lg:pt-14">
      <section className="surface grid gap-4 px-6 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-2">
          <div className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Lead intelligence workspace
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            A flatter, more professional UI for teams that need structured
            sourcing, faster qualification, and a workflow that stays readable
            as usage scales.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-auto">
          {[
            { label: "Verified leads", value: "High precision" },
            { label: "AI enrichment", value: "Batch scoring" },
            { label: "Outreach ready", value: "Draft + export" },
          ].map((item) => (
            <div
              key={item.label}
              className="surface-muted min-w-[180px] px-4 py-3"
            >
              <div className="section-label">{item.label}</div>
              <div className="mt-1 text-sm font-semibold tracking-tight text-slate-950">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-16 lg:space-y-20">
        <LandingHeroRevamp user={user} />
        <WorkflowSectionRevamp />
        <ProductPreviewSectionRevamp />
      </section>
    </main>
  );
}
