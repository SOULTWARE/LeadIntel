"use client";

import { Clock, HelpCircle, Mail, MessageSquare } from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Support",
    description: "Account questions, technical issues, and workflow help.",
    contact: "support@leadintelpro.com",
    href: "mailto:support@leadintelpro.com",
  },
  {
    icon: MessageSquare,
    title: "Sales",
    description: "Pricing questions, volume usage, and team fit discussions.",
    contact: "sales@leadintelpro.com",
    href: "mailto:sales@leadintelpro.com",
  },
  {
    icon: HelpCircle,
    title: "General",
    description: "Partnerships, press, and broader product inquiries.",
    contact: "hello@leadintelpro.com",
    href: "mailto:hello@leadintelpro.com",
  },
];

export default function ContactPageContent() {
  return (
    <main className="page-shell flex flex-col gap-10 pb-24 pt-10 lg:gap-12 lg:pt-14">
      <section className="surface space-y-5 p-6 text-center lg:p-8">
        <div className="eyebrow mx-auto">Contact</div>
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          Talk to the team behind the workspace.
        </h1>
        <p className="mx-auto max-w-3xl text-base leading-7 text-slate-600">
          Whether you need product help, want to discuss pricing, or have a
          general question, the fastest path is email.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {contactMethods.map((method) => (
          <a
            key={method.title}
            href={method.href}
            className="surface p-6 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-blue-700">
              <method.icon className="h-4 w-4" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950">
              {method.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {method.description}
            </p>
            <div className="mt-4 text-sm font-semibold text-blue-700">
              {method.contact}
            </div>
          </a>
        ))}
      </section>

      <section className="surface grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div className="space-y-3">
          <div className="eyebrow">
            <Clock className="h-4 w-4" />
            Response window
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Most messages receive a reply within one business day.
          </h2>
          <p className="text-sm leading-7 text-slate-600">
            Include the account email, the workflow you were using, and any
            relevant error details so we can respond with context instead of a
            generic first reply.
          </p>
        </div>
        <div className="surface-muted p-5">
          <div className="section-label">Best way to get help fast</div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>
              Describe the exact screen or workflow where the issue happened.
            </li>
            <li>
              Include the session name if the question relates to a sourcing
              run.
            </li>
            <li>
              Mention whether the issue affected billing, credits, or AI
              results.
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
