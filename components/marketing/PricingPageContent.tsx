"use client";

import Link from "next/link";
import { Check, Info, Mail, Search, Sparkles } from "lucide-react";

const plans = [
  {
    slug: "starter",
    title: "Starter",
    price: "$29",
    tone: "surface",
    features: [
      "1,000 AI discovery credits each month",
      "100 max leads per search",
      "AI scoring, hooks, and email drafts",
      "Unlimited sourcing sessions",
      "CSV export for selected leads",
    ],
  },
  {
    slug: "pro",
    title: "Pro",
    price: "$79",
    tone: "surface-dark",
    features: [
      "5,000 AI discovery credits each month",
      "Higher-volume outbound workflows",
      "Bulk enhancement for larger selections",
      "Priority queue for sourcing jobs",
      "Everything included in Starter",
    ],
  },
];

export default function PricingPageContent() {
  return (
    <main className="page-shell flex flex-col gap-10 pb-24 pt-10 lg:gap-12 lg:pt-14">
      <section className="surface space-y-5 p-6 text-center lg:p-8">
        <div className="eyebrow mx-auto">Pricing</div>
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          Clear plans for teams that need sourcing, qualification, and outreach
          prep in one workflow.
        </h1>
        <p className="mx-auto max-w-3xl text-base leading-7 text-slate-600">
          Credits cover sourcing, AI enrichment, contact discovery, and draft
          generation. Start with a monthly plan and add temporary credits when
          usage spikes.
        </p>
      </section>

      <section className="surface grid gap-4 p-6 lg:grid-cols-3 lg:p-8">
        {[
          {
            icon: Sparkles,
            title: "AI discovery",
            copy: "Every credit can score compatibility, summarize fit, surface hooks, and identify pain points.",
          },
          {
            icon: Search,
            title: "Lead generation",
            copy: "Search sessions pull verified business records before you decide which leads deserve deeper review.",
          },
          {
            icon: Mail,
            title: "Outreach drafting",
            copy: "Generate ready-to-edit drafts for qualified leads directly inside the same workspace.",
          },
        ].map((item) => (
          <div key={item.title} className="surface-muted p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-blue-700">
              <item.icon className="h-4 w-4" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.slug}
            className={
              plan.tone === "surface-dark"
                ? "surface-dark p-6 lg:p-8"
                : "surface p-6 lg:p-8"
            }
          >
            <div className="space-y-4">
              <div className="section-label">{plan.title}</div>
              <div className="text-5xl font-semibold tracking-tight">
                {plan.price}
                <span
                  className={`ml-2 text-base font-medium ${plan.tone === "surface-dark" ? "text-slate-400" : "text-slate-500"}`}
                >
                  /month
                </span>
              </div>
              <ul
                className={`space-y-3 text-sm ${plan.tone === "surface-dark" ? "text-slate-300" : "text-slate-600"}`}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`mt-0.5 h-4 w-4 ${plan.tone === "surface-dark" ? "text-blue-400" : "text-blue-700"}`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/login?plan=${plan.slug}`}
                className={
                  plan.tone === "surface-dark"
                    ? "btn-accent mt-4"
                    : "btn-primary mt-4"
                }
              >
                Choose {plan.title}
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section className="surface flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-2">
          <div className="eyebrow">
            <Info className="h-4 w-4" />
            Add-on credits
          </div>
          <p className="text-base text-slate-600">
            Need extra capacity without changing plans? Buy 500 temporary
            credits for $10 and keep the workflow moving.
          </p>
        </div>
        <Link href="/login" className="btn-secondary">
          Start with an account
        </Link>
      </section>
    </main>
  );
}
