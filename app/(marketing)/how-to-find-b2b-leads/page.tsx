import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  DatabaseZap,
  Mail,
  Search,
  Sparkles,
} from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createMarketingMetadata,
  createOrganizationSchema,
  createSoftwareApplicationSchema,
  createWebPageSchema,
  createWebSiteSchema,
  siteConfig,
} from "@/lib/seo";

const path = "/how-to-find-b2b-leads";
const keyword = "find B2B leads";
const title = "How to Find B2B Leads in 2026 (Complete Guide)";
const description =
  "Learn how to find high-quality B2B leads using modern strategies, tools, and automation.";
const publishedAt = "2026-03-28T00:00:00.000Z";

const baseMetadata = createMarketingMetadata({
  title,
  description,
  path,
  keywords: [
    keyword,
    "B2B lead generation",
    "how to find business leads",
    "LinkedIn prospecting",
    "cold outreach automation",
  ],
});

const guideSections = [
  {
    id: "what-are-b2b-leads",
    label: "What are B2B leads?",
  },
  {
    id: "best-ways-to-find-b2b-leads",
    label: "Best ways to find B2B leads",
  },
  {
    id: "problem-with-manual-lead-generation",
    label: "The problem with manual lead generation",
  },
  {
    id: "a-better-approach",
    label: "A better approach",
  },
  {
    id: "conclusion",
    label: "Conclusion",
  },
] as const;

const leadStrategies = [
  {
    title: "LinkedIn Prospecting",
    icon: Search,
    body: "LinkedIn remains the most powerful platform for B2B lead generation. Use filters like industry, job title, and company size.",
  },
  {
    title: "Google Search Operators",
    icon: Sparkles,
    body: "Use advanced search queries to find targeted leads across the web.",
  },
  {
    title: "Cold Outreach",
    icon: Mail,
    body: "Email and LinkedIn outreach still convert well when targeting is accurate.",
  },
] as const;

const automationBenefits = [
  "Find leads instantly",
  "Extract verified emails",
  "Enrich contact data automatically",
] as const;

export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    absolute: title,
  },
  category: "B2B lead generation",
  openGraph: {
    ...baseMetadata.openGraph,
    type: "article",
    publishedTime: publishedAt,
    modifiedTime: publishedAt,
    authors: [siteConfig.name],
    tags: [keyword, "B2B lead generation", "sales prospecting"],
  },
};

export default function HowToFindB2BLeadsPage() {
  return (
    <>
      <StructuredData
        data={[
          createOrganizationSchema(),
          createWebSiteSchema(),
          createSoftwareApplicationSchema(),
          createWebPageSchema({
            name: title,
            path,
            description,
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "How to Find B2B Leads", path },
          ]),
          createArticleSchema({
            headline: title,
            description,
            path,
            datePublished: publishedAt,
            keywords: [keyword, "B2B lead generation", "sales prospecting"],
          }),
        ]}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-12 px-6 pb-32 pt-16 lg:px-8">
        <section className="overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/80 p-8 shadow-[0_32px_120px_-52px_rgba(15,23,42,0.38)] backdrop-blur-2xl md:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">
                <DatabaseZap className="h-4 w-4" />
                2026 lead generation guide
              </div>

              <div className="space-y-5">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">
                  Keyword: {keyword}
                </p>
                <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
                  How to Find B2B Leads in 2026
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
                  Finding high-quality B2B leads is one of the biggest
                  challenges for agencies, freelancers, and SaaS founders. In
                  2026, buying outdated lead lists no longer works;
                  personalization and real-time data are key.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.65)]">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-300">
                Quick takeaway
              </p>
              <p className="mt-4 text-2xl font-black leading-tight">
                To find B2B leads reliably in 2026, combine precise targeting,
                current data, and outreach automation.
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                The teams growing fastest are using live data and tighter
                prospect qualification before they send a single message.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <article className="space-y-8">
            <section
              id="what-are-b2b-leads"
              className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
            >
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                What Are B2B Leads?
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                B2B leads are businesses or professionals who are potential
                customers for your product or service.
              </p>
              <div className="mt-8 rounded-[1.75rem] border border-blue-100 bg-blue-50/80 p-6">
                <p className="text-sm font-semibold leading-7 text-slate-700">
                  If you want to find B2B leads that actually convert, start by
                  defining who you serve best: vertical, company size, buyer
                  role, geography, and likely pain points. Clear targeting makes
                  every sourcing method below work better.
                </p>
              </div>
            </section>

            <section
              id="best-ways-to-find-b2b-leads"
              className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                  Best Ways to Find B2B Leads
                </h2>
                <p className="text-lg leading-8 text-slate-600">
                  The most effective workflow is to layer proven prospecting
                  channels with enrichment so you can prioritize the right
                  accounts quickly.
                </p>
              </div>

              <div className="mt-8 grid gap-6">
                {leadStrategies.map((strategy, index) => (
                  <section
                    key={strategy.title}
                    className="rounded-[1.85rem] border border-slate-200 bg-slate-50/80 p-6 md:p-7"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                          <strategy.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">
                            {index + 1}. {strategy.title}
                          </h3>
                          <p className="mt-3 text-base leading-7 text-slate-600">
                            {strategy.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section
              id="problem-with-manual-lead-generation"
              className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
            >
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                The Problem with Manual Lead Generation
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Manual research is slow, inefficient, and often results in
                outdated or incorrect data.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  "Hours disappear into repetitive searching and spreadsheet cleanup.",
                  "Prospect data goes stale before outreach starts.",
                  "Inconsistent qualification makes campaigns harder to scale.",
                ].map((problem) => (
                  <div
                    key={problem}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm font-semibold leading-7 text-slate-700">
                      {problem}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section
              id="a-better-approach"
              className="scroll-mt-28 rounded-[2.25rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.72)] md:p-10"
            >
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-300">
                  A better approach
                </p>
                <h2 className="text-3xl font-black tracking-tight">
                  Use automation where manual research breaks down
                </h2>
                <p className="text-lg leading-8 text-slate-300">
                  Tools like LeadIntel allow you to move from searching to
                  sending much faster while improving accuracy.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {automationBenefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="rounded-[1.5rem] border border-slate-800 bg-white/5 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                      <p className="text-sm font-semibold leading-7 text-slate-200">
                        {benefit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              id="conclusion"
              className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
            >
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Conclusion
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                The fastest way to grow in 2026 is to combine automation with
                precise targeting.
              </p>
            </section>

            <section className="overflow-hidden rounded-[2.5rem] border border-blue-200/60 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.6)] md:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-100">
                Ready to scale prospecting?
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
                Try LeadIntel for free and generate leads in minutes.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100">
                Replace stale lists and manual lead research with a workflow
                built for modern B2B targeting, enrichment, and outreach.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-white/15"
                >
                  View pricing
                </Link>
              </div>
            </section>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                On this page
              </p>
              <nav className="mt-4 space-y-2">
                {guideSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600"
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                Why this page ranks
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>
                  Clear keyword targeting around &quot;find B2B leads&quot;.
                </li>
                <li>Scannable sections with internal jump links.</li>
                <li>Article metadata, canonical URL, and JSON-LD schema.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
