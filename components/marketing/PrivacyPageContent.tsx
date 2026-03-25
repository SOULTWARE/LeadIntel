"use client";

import { Database, Eye, Lock, Mail, Shield, Trash2 } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "Information we collect",
    items: [
      "Account details such as email and display name.",
      "Usage information required to operate sourcing and AI workflows.",
      "Lead records you save within the product workspace.",
      "Billing information processed by our payment provider.",
    ],
  },
  {
    icon: Eye,
    title: "How the data is used",
    items: [
      "To provide the lead sourcing and qualification workflows.",
      "To process transactions and manage subscriptions.",
      "To send support replies, service updates, and security notices.",
      "To improve the product through operational analysis and debugging.",
    ],
  },
  {
    icon: Shield,
    title: "Protection and controls",
    items: [
      "Traffic is encrypted in transit.",
      "Access to operational systems is limited and controlled.",
      "Data handling is reviewed as part of normal product operations.",
      "Users can request deletion of account data.",
    ],
  },
  {
    icon: Lock,
    title: "Sharing and disclosure",
    items: [
      "We do not sell personal information.",
      "Information may be shared with providers needed to operate the service.",
      "Data may be disclosed where required by law or legal process.",
    ],
  },
  {
    icon: Mail,
    title: "Communications",
    items: [
      "Transactional messages related to the account or service.",
      "Optional product communications, where applicable.",
      "Important operational or security notices.",
    ],
  },
  {
    icon: Trash2,
    title: "Retention and deletion",
    items: [
      "Account data is retained while the account remains active.",
      "Deletion requests are supported through account controls or support.",
      "Some records may be retained temporarily for compliance or backup reasons.",
    ],
  },
];

export default function PrivacyPageContent() {
  return (
    <main className="page-shell flex flex-col gap-8 pb-24 pt-10 lg:gap-10 lg:pt-14">
      <section className="surface space-y-5 p-6 lg:p-8">
        <div className="eyebrow">Privacy policy</div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          A straightforward view of how data is handled inside LeadIntel Pro.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          This policy explains the categories of information collected to
          operate the product and how that information is used, stored, and
          protected.
        </p>
        <div className="section-label">Last updated: December 24, 2025</div>
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
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="surface flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div>
          <div className="section-label">Questions</div>
          <p className="mt-2 text-base text-slate-600">
            For privacy-related questions, reach out to the team directly.
          </p>
        </div>
        <a href="mailto:privacy@leadintelpro.com" className="btn-primary">
          privacy@leadintelpro.com
        </a>
      </section>
    </main>
  );
}
