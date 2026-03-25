"use client";

import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const values = [
  {
    icon: Compass,
    title: "Operational clarity",
    copy: "The product is built for real lead operations, so every screen emphasizes actionability over decoration.",
  },
  {
    icon: ShieldCheck,
    title: "Signal over noise",
    copy: "We focus on verified sourcing and qualification logic that helps teams decide faster.",
  },
  {
    icon: Sparkles,
    title: "AI with purpose",
    copy: "The AI layer exists to make judgment easier, not to generate filler or hide weak data.",
  },
  {
    icon: Rocket,
    title: "Workflow speed",
    copy: "The entire product is organized to reduce back-and-forth between sourcing, review, and outreach.",
  },
];

export default function AboutPageContent() {
  return (
    <main className="page-shell flex flex-col gap-10 pb-24 pt-10 lg:gap-12 lg:pt-14">
      <section className="surface space-y-5 p-6 lg:p-8">
        <div className="eyebrow">About</div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          LeadIntel Pro was built to make outbound systems more precise,
          readable, and usable.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Traditional lead generation tools pile data, automation, and UI
          clutter into one place. We built this product to do the opposite: make
          sourcing structured, qualification clear, and follow-up work easier to
          execute.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface p-6 lg:p-8">
          <div className="section-label">Our story</div>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              The original problem was not finding businesses. It was deciding
              which businesses were worth attention, what the actual fit was,
              and how to hand that information off to the next step without
              context loss.
            </p>
            <p>
              LeadIntel Pro turns that workflow into a single operating surface:
              source a target market, score fit with AI, inspect the strongest
              records, and move directly into contact discovery or outreach
              drafting.
            </p>
            <p>
              The redesign of the app reflects the same philosophy. It strips
              out decorative UI noise and replaces it with a cleaner hierarchy
              built for daily use by serious teams.
            </p>
          </div>
        </div>

        <div className="surface-dark p-6 lg:p-8">
          <div className="section-label text-slate-400">Mission</div>
          <blockquote className="mt-4 text-2xl font-semibold leading-tight text-white">
            Build a lead workflow that helps teams make better decisions,
            faster.
          </blockquote>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            That means verified sourcing, deliberate qualification logic, and an
            interface that remains legible as usage scales.
          </p>
        </div>
      </section>

      <section className="surface space-y-6 p-6 lg:p-8">
        <div>
          <div className="section-label">Values</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            What drives the product
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {values.map((value) => (
            <div key={value.title} className="surface-muted p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-blue-700">
                <value.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {value.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div>
          <div className="section-label">Get started</div>
          <p className="mt-2 text-base text-slate-600">
            Create an account and see the full sourcing-to-outreach workflow in
            action.
          </p>
        </div>
        <Link href="/login" className="btn-primary">
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
