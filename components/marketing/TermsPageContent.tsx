"use client";

import {
  AlertTriangle,
  Ban,
  CreditCard,
  FileText,
  Globe,
  RefreshCw,
  Scale,
  Shield,
} from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "Acceptance of terms",
    body: "Using LeadIntel Pro means you agree to the terms that govern access to the product, its workflows, and the surrounding service.",
  },
  {
    icon: Shield,
    title: "Service description",
    body: "The product provides lead sourcing, qualification, contact discovery, outreach drafting, and related account workflows. Features may evolve over time.",
  },
  {
    icon: Scale,
    title: "User responsibilities",
    body: "You are responsible for lawful use of the platform, protection of account credentials, and compliance with the rules that govern your own outreach activities.",
  },
  {
    icon: Ban,
    title: "Prohibited use",
    body: "The service may not be used for unlawful outreach, abuse of rate limits, harassment, resale of unauthorized data, or attempts to compromise the system.",
  },
  {
    icon: CreditCard,
    title: "Payment terms",
    body: "Subscriptions are billed in advance. Usage allowances reset each billing cycle, while add-ons are one-time purchases subject to their own availability window.",
  },
  {
    icon: RefreshCw,
    title: "Cancellation and termination",
    body: "Subscriptions can be canceled from account controls. Access typically continues through the end of the current billing period unless the account is terminated for policy violations.",
  },
  {
    icon: AlertTriangle,
    title: "Disclaimers",
    body: "The service is provided as-is. Data quality, contact discovery, and third-party responses can vary, and no absolute accuracy guarantee is made for external data sources.",
  },
  {
    icon: Globe,
    title: "Governing law",
    body: "The service is governed by the applicable laws and venue defined by the operator of LeadIntel Pro.",
  },
];

export default function TermsPageContent() {
  return (
    <main className="page-shell flex flex-col gap-8 pb-24 pt-10 lg:gap-10 lg:pt-14">
      <section className="surface space-y-5 p-6 lg:p-8">
        <div className="eyebrow">Terms of service</div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          The rules that govern use of the LeadIntel Pro workspace.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          These terms summarize the responsibilities attached to using the
          product, including subscriptions, acceptable use, operational
          disclaimers, and account management.
        </p>
        <div className="section-label">Effective date: December 24, 2025</div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="surface p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-blue-700">
                <section.icon className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-semibold text-slate-950">
                {section.title}
              </h2>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <section className="surface p-6 lg:p-8">
        <div className="section-label">Questions</div>
        <p className="mt-2 text-base text-slate-600">
          For legal or terms-related questions, contact{" "}
          <a
            href="mailto:legal@leadintelpro.com"
            className="font-semibold text-blue-700"
          >
            legal@leadintelpro.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
