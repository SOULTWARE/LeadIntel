import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CheckCircle2,
  DatabaseZap,
  Download,
  Mail,
  MailCheck,
  Radar,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

export type BlogPost = {
  slug: string;
  title: string;
  heading: string;
  description: string;
  excerpt: string;
  keyword: string;
  publishedAt: string;
  category: string;
  theme: "blue" | "emerald";
  keywords: string[];
  badge: {
    icon: LucideIcon;
    label: string;
  };
  quickTakeaway: {
    eyebrow: string;
    title: string;
    description: string;
  };
  toc: Array<{
    id: string;
    label: string;
  }>;
  content: ReactNode;
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
  };
  sidebar: {
    title: string;
    items: string[];
  };
};

export function getBlogPostPath(slug: string) {
  return `/blog/${slug}`;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "scrape-linkedin-leads",
    title: "How to Scrape LinkedIn Leads (Step-by-Step Guide)",
    heading: "How to Scrape LinkedIn Leads",
    description:
      "Learn how to extract LinkedIn leads and find emails efficiently.",
    excerpt:
      "A step-by-step LinkedIn prospecting workflow for extracting lead data, enriching contacts, and reducing manual research time.",
    keyword: "scrape LinkedIn leads",
    publishedAt: "2026-03-28T00:00:00.000Z",
    category: "LinkedIn lead generation",
    theme: "blue",
    keywords: [
      "LinkedIn lead scraping",
      "LinkedIn prospecting",
      "find LinkedIn emails",
      "B2B lead extraction",
    ],
    badge: {
      icon: Search,
      label: "LinkedIn sourcing guide",
    },
    quickTakeaway: {
      eyebrow: "LinkedIn takeaway",
      title:
        "The fastest LinkedIn workflow is to define your audience, filter hard, extract clean lead data, and enrich with verified emails.",
      description:
        "Manual prospecting can work, but it breaks once you need consistency and volume. The winning setup combines targeted search with automated enrichment.",
    },
    toc: [
      {
        id: "step-1-define-your-target-audience",
        label: "Step 1: Define your target audience",
      },
      {
        id: "step-2-search-on-linkedin",
        label: "Step 2: Search on LinkedIn",
      },
      {
        id: "step-3-extract-lead-data",
        label: "Step 3: Extract lead data",
      },
      {
        id: "step-4-find-emails",
        label: "Step 4: Find emails",
      },
      {
        id: "automate-the-process",
        label: "Automate the process",
      },
    ],
    content: (
      <>
        <section
          id="step-1-define-your-target-audience"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Step 1: Define Your Target Audience
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            LinkedIn is the best platform for B2B prospecting.
          </p>
          <div className="mt-8 rounded-[1.75rem] border border-blue-100 bg-blue-50/80 p-6">
            <p className="text-sm font-semibold leading-7 text-slate-700">
              Choose industry, job title, and company size. The tighter your
              targeting is up front, the easier it becomes to scrape LinkedIn
              leads that actually match your offer.
            </p>
          </div>
        </section>

        <section
          id="step-2-search-on-linkedin"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Step 2: Search on LinkedIn
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Use filters to narrow down your results.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Filter by industry to keep your list relevant.",
              "Use job title filters to focus on the right buyer persona.",
              "Narrow by company size so the leads match your service range.",
            ].map((tip) => (
              <div
                key={tip}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5"
              >
                <p className="text-sm font-semibold leading-7 text-slate-700">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="step-3-extract-lead-data"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Step 3: Extract Lead Data
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Collect names, roles, and companies.
          </p>
          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <DatabaseZap className="h-5 w-5" />
              </div>
              <p className="text-sm leading-7 text-slate-700">
                The goal at this stage is to create a clean prospect list with
                enough company and role context to support enrichment and
                outreach. Incomplete records create more cleanup later.
              </p>
            </div>
          </div>
        </section>

        <section
          id="step-4-find-emails"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Step 4: Find Emails
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Use tools to enrich your data.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Add verified contact details",
                description:
                  "Email discovery works best once names, roles, and company domains are already clean.",
                icon: MailCheck,
              },
              {
                title: "Keep deliverability in mind",
                description:
                  "Verification matters because scraped leads are only useful if your messages can actually reach them.",
                icon: Mail,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="automate-the-process"
          className="scroll-mt-28 rounded-[2.25rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.72)] md:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-300">
            Automate the process
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Reduce manual scraping and enrichment work
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Instead of doing everything manually, tools like LeadIntel automate
            lead extraction and enrichment.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Capture structured lead data faster",
              "Enrich prospects with verified emails",
              "Move qualified LinkedIn leads into outreach-ready workflows",
            ].map((benefit) => (
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
      </>
    ),
    cta: {
      eyebrow: "Automate LinkedIn prospecting",
      title: "Automate LinkedIn lead generation with LeadIntel.",
      description:
        "Turn LinkedIn searches into structured lead lists with faster extraction, enrichment, and outreach preparation.",
      primaryHref: "/login",
      primaryLabel: "Start free",
      secondaryHref: "/pricing",
      secondaryLabel: "View pricing",
    },
    sidebar: {
      title: "LinkedIn workflow",
      items: [
        "Define the exact buyer profile before searching.",
        "Use filters to keep the lead list focused.",
        "Enrich scraped records with verified emails.",
      ],
    },
  },
  {
    slug: "best-lead-generation-tools-agencies",
    title: "Best Lead Generation Tools for Agencies in 2026",
    heading: "Best Lead Generation Tools for Agencies",
    description:
      "Discover the best lead generation tools agencies use to scale client acquisition.",
    excerpt:
      "A practical breakdown of what agencies should expect from modern lead generation software, and why stale databases keep killing campaigns.",
    keyword: "lead generation tools for agencies",
    publishedAt: "2026-03-28T00:00:00.000Z",
    category: "Lead generation software",
    theme: "emerald",
    keywords: [
      "best lead generation tools",
      "agency prospecting tools",
      "client acquisition software",
      "B2B lead generation for agencies",
    ],
    badge: {
      icon: Bot,
      label: "Agency growth stack",
    },
    quickTakeaway: {
      eyebrow: "Agency takeaway",
      title:
        "The best lead generation tools for agencies reduce manual work and improve lead quality at the same time.",
      description:
        "If a tool cannot keep data fresh, automate qualification, and hand off clean exports, it slows delivery instead of helping client acquisition.",
    },
    toc: [
      {
        id: "what-makes-a-good-lead-generation-tool",
        label: "What makes a good lead generation tool?",
      },
      {
        id: "common-problems-with-tools",
        label: "Common problems with tools",
      },
      {
        id: "modern-solution",
        label: "Modern solution",
      },
      {
        id: "why-it-matters",
        label: "Why it matters",
      },
    ],
    content: (
      <>
        <section
          id="what-makes-a-good-lead-generation-tool"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            What Makes a Good Lead Generation Tool?
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Agencies need scalable ways to generate leads without relying only
            on referrals.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Accurate data",
                description:
                  "A good tool helps agencies work from current prospect data instead of stale lists that waste outreach volume.",
                icon: Radar,
              },
              {
                title: "Email extraction",
                description:
                  "Contact discovery should be built into the workflow so teams can move from research to outreach without extra tools.",
                icon: MailCheck,
              },
              {
                title: "Automation",
                description:
                  "Agencies need automation to handle sourcing, enrichment, and qualification across multiple client campaigns.",
                icon: Bot,
              },
              {
                title: "Easy export",
                description:
                  "Clean exports matter because leads still need to flow into CRMs, outbound platforms, and reporting workflows.",
                icon: Download,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="common-problems-with-tools"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Common Problems with Tools
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Many tools rely on outdated databases and provide low-quality leads.
          </p>
          <div className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div className="space-y-3 text-sm leading-7 text-slate-700">
                <p>
                  Agencies pay twice for low-quality data: once for the tool,
                  and again when account teams waste time cleaning bad lists or
                  running outreach that never reaches the right buyer.
                </p>
                <p>
                  That becomes more painful when a team is managing several
                  client campaigns at once and every list needs to be ready for
                  action quickly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="modern-solution"
          className="scroll-mt-28 rounded-[2.25rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.72)] md:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
            Modern solution
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Use real-time lead generation tools built for execution
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Real-time lead generation tools like LeadIntel provide fresh and
            verified data.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Current prospect data instead of aging static databases",
              "Built-in contact discovery for faster outbound setup",
              "Automated enrichment that helps agencies qualify accounts faster",
            ].map((benefit) => (
              <div
                key={benefit}
                className="rounded-[1.5rem] border border-slate-800 bg-white/5 p-5"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <p className="text-sm font-semibold leading-7 text-slate-200">
                    {benefit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="why-it-matters"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Why It Matters
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Better leads = more replies = more clients.
          </p>
          <p className="mt-4 text-base leading-7 text-slate-600">
            For agencies, stronger lead quality compounds across the whole
            funnel. Better data improves targeting, cleaner contact info
            improves deliverability, and tighter qualification improves the odds
            that outreach turns into pipeline.
          </p>
        </section>
      </>
    ),
    cta: {
      eyebrow: "Start now",
      title: "Start generating leads today with LeadIntel.",
      description:
        "Build a repeatable client acquisition workflow with fresher data, contact discovery, and exports your agency team can use immediately.",
      primaryHref: "/login",
      primaryLabel: "Start free",
      secondaryHref: "/pricing",
      secondaryLabel: "View pricing",
    },
    sidebar: {
      title: "What agencies need",
      items: [
        "Fresh data that can support ongoing prospecting.",
        "Verified contact discovery without extra cleanup.",
        "Exports that fit existing client delivery workflows.",
      ],
    },
  },
  {
    slug: "how-to-find-b2b-leads",
    title: "How to Find B2B Leads in 2026 (Complete Guide)",
    heading: "How to Find B2B Leads in 2026",
    description:
      "Learn how to find high-quality B2B leads using modern strategies, tools, and automation.",
    excerpt:
      "A concise guide to finding better B2B leads with LinkedIn prospecting, search operators, cold outreach, and automation.",
    keyword: "find B2B leads",
    publishedAt: "2026-03-28T00:00:00.000Z",
    category: "B2B lead generation",
    theme: "blue",
    keywords: [
      "B2B lead generation",
      "how to find business leads",
      "LinkedIn prospecting",
      "cold outreach automation",
    ],
    badge: {
      icon: DatabaseZap,
      label: "2026 lead generation guide",
    },
    quickTakeaway: {
      eyebrow: "Quick takeaway",
      title:
        "To find B2B leads reliably in 2026, combine precise targeting, current data, and outreach automation.",
      description:
        "The teams growing fastest are using live data and tighter prospect qualification before they send a single message.",
    },
    toc: [
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
    ],
    content: (
      <>
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
              defining who you serve best: vertical, company size, buyer role,
              geography, and likely pain points. Clear targeting makes every
              sourcing method below work better.
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
              channels with enrichment so you can prioritize the right accounts
              quickly.
            </p>
          </div>
          <div className="mt-8 grid gap-6">
            {[
              {
                title: "LinkedIn Prospecting",
                body: "LinkedIn remains the most powerful platform for B2B lead generation. Use filters like industry, job title, and company size.",
                icon: Search,
              },
              {
                title: "Google Search Operators",
                body: "Use advanced search queries to find targeted leads across the web.",
                icon: Sparkles,
              },
              {
                title: "Cold Outreach",
                body: "Email and LinkedIn outreach still convert well when targeting is accurate.",
                icon: Mail,
              },
            ].map((strategy, index) => (
              <section
                key={strategy.title}
                className="rounded-[1.85rem] border border-slate-200 bg-slate-50/80 p-6 md:p-7"
              >
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
            Manual research is slow, inefficient, and often results in outdated
            or incorrect data.
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
              Tools like LeadIntel allow you to move from searching to sending
              much faster while improving accuracy.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Find leads instantly",
              "Extract verified emails",
              "Enrich contact data automatically",
            ].map((benefit) => (
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
      </>
    ),
    cta: {
      eyebrow: "Ready to scale prospecting?",
      title: "Try LeadIntel for free and generate leads in minutes.",
      description:
        "Replace stale lists and manual lead research with a workflow built for modern B2B targeting, enrichment, and outreach.",
      primaryHref: "/login",
      primaryLabel: "Start free",
      secondaryHref: "/pricing",
      secondaryLabel: "View pricing",
    },
    sidebar: {
      title: "Why this page ranks",
      items: [
        'Clear keyword targeting around "find B2B leads".',
        "Scannable sections with internal jump links.",
        "Article metadata, canonical URL, and JSON-LD schema.",
      ],
    },
  },
];

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}
