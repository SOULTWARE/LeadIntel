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
    slug: "lead-generation-vs-scraping",
    title: "Lead Generation vs Lead Scraping",
    heading: "Lead Generation vs Lead Scraping",
    description:
      "Understand the difference between lead generation and scraping.",
    excerpt:
      "A simple breakdown of how lead generation differs from scraping, where each fits, and why the strongest workflows usually combine both.",
    keyword: "lead generation vs scraping",
    publishedAt: "2026-03-28T00:00:00.000Z",
    category: "Lead generation basics",
    theme: "blue",
    keywords: [
      "lead scraping",
      "what is lead generation",
      "data extraction for sales",
      "B2B prospecting workflow",
    ],
    badge: {
      icon: DatabaseZap,
      label: "Prospecting fundamentals",
    },
    quickTakeaway: {
      eyebrow: "Core distinction",
      title:
        "Lead generation finds the right prospects, while scraping extracts the data that helps you act on them.",
      description:
        "Many teams confuse these concepts, but they solve different parts of the prospecting workflow. The strongest systems usually use both together.",
    },
    toc: [
      {
        id: "lead-generation",
        label: "Lead generation",
      },
      {
        id: "lead-scraping",
        label: "Lead scraping",
      },
      {
        id: "best-strategy",
        label: "Best strategy",
      },
    ],
    content: (
      <>
        <section
          id="lead-generation"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Lead Generation
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Finding potential customers.
          </p>
          <div className="mt-8 rounded-[1.75rem] border border-blue-100 bg-blue-50/80 p-6">
            <p className="text-sm font-semibold leading-7 text-slate-700">
              Lead generation is about identifying companies or people who fit
              your offer. It focuses on targeting, qualification, and deciding
              which prospects are worth pursuing in the first place.
            </p>
          </div>
        </section>

        <section
          id="lead-scraping"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Lead Scraping
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Extracting data from platforms.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Scraping is useful for pulling names, companies, roles, and other structured details from public sources.",
              "It helps turn scattered platform data into lists your team can actually review and enrich.",
              "Scraping alone is not enough if the underlying targets are poor-fit or outdated.",
            ].map((point) => (
              <div
                key={point}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5"
              >
                <p className="text-sm font-semibold leading-7 text-slate-700">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="best-strategy"
          className="scroll-mt-28 rounded-[2.25rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.72)] md:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-300">
            Best strategy
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Combine both approaches
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Combine both approaches.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Use lead generation to decide who belongs in your pipeline",
              "Use scraping to collect structured data from relevant sources",
              "Then enrich and verify the data before outreach begins",
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
      eyebrow: "Use both workflows",
      title: "Use LeadIntel for both lead generation and scraping.",
      description:
        "Build better prospect lists by combining targeting, data extraction, and enrichment in one workflow.",
      primaryHref: "/login",
      primaryLabel: "Start free",
      secondaryHref: "/pricing",
      secondaryLabel: "View pricing",
    },
    sidebar: {
      title: "Key distinction",
      items: [
        "Lead generation decides who to target.",
        "Scraping collects the data tied to those targets.",
        "The best systems connect both steps.",
      ],
    },
  },
  {
    slug: "get-clients-for-agency",
    title: "How to Get Clients for Your Agency",
    heading: "How to Get Clients for Your Agency",
    description: "Learn how to acquire clients without paid ads.",
    excerpt:
      "A practical agency growth guide covering cold outreach, LinkedIn networking, and content marketing without relying on paid acquisition.",
    keyword: "get clients for agency",
    publishedAt: "2026-03-28T00:00:00.000Z",
    category: "Agency growth",
    theme: "emerald",
    keywords: [
      "agency client acquisition",
      "how to get agency clients",
      "agency lead generation",
      "client acquisition without ads",
    ],
    badge: {
      icon: Sparkles,
      label: "Agency growth guide",
    },
    quickTakeaway: {
      eyebrow: "Agency takeaway",
      title:
        "Agencies grow faster when client acquisition is consistent, targeted, and built on strong lead quality.",
      description:
        "Paid ads are optional. A repeatable outbound and content engine usually depends more on discipline and lead quality than on budget.",
    },
    toc: [
      {
        id: "methods",
        label: "Methods",
      },
      {
        id: "secret",
        label: "Secret",
      },
    ],
    content: (
      <>
        <section
          id="methods"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Methods
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Getting clients is the biggest challenge for agencies.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Cold outreach",
                description:
                  "Outbound works when you contact the right companies with a clear offer and clean lead data.",
                icon: Mail,
              },
              {
                title: "LinkedIn networking",
                description:
                  "LinkedIn helps agencies build familiarity with founders, operators, and decision-makers before outreach starts.",
                icon: Search,
              },
              {
                title: "Content marketing",
                description:
                  "Useful content creates trust and gives prospects a reason to take your outreach seriously.",
                icon: Sparkles,
              },
            ].map((method) => (
              <div
                key={method.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                    <method.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {method.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {method.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="secret"
          className="scroll-mt-28 rounded-[2.25rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.72)] md:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
            Secret
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Consistency and quality leads
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Consistency and quality leads.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Consistent outreach compounds faster than random bursts of activity",
              "High-quality leads improve reply rates and sales conversations",
              "Better targeting makes every channel work harder",
            ].map((point) => (
              <div
                key={point}
                className="rounded-[1.5rem] border border-slate-800 bg-white/5 p-5"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <p className="text-sm font-semibold leading-7 text-slate-200">
                    {point}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    ),
    cta: {
      eyebrow: "Build pipeline faster",
      title: "Generate clients with LeadIntel.",
      description:
        "Start with stronger lead data so your outreach, networking, and content efforts point at better-fit prospects.",
      primaryHref: "/login",
      primaryLabel: "Start free",
      secondaryHref: "/pricing",
      secondaryLabel: "View pricing",
    },
    sidebar: {
      title: "Agency growth rules",
      items: [
        "Use more than one acquisition channel.",
        "Prioritize consistency over short bursts.",
        "Lead quality shapes conversion rates.",
      ],
    },
  },
  {
    slug: "b2b-prospecting-strategies",
    title: "Top B2B Prospecting Strategies",
    heading: "B2B Prospecting Strategies",
    description: "Learn modern B2B prospecting strategies that work.",
    excerpt:
      "A concise overview of the prospecting strategies that matter most now: better targeting, smarter automation, and coordinated outreach across channels.",
    keyword: "B2B prospecting strategies",
    publishedAt: "2026-03-28T00:00:00.000Z",
    category: "B2B prospecting",
    theme: "blue",
    keywords: [
      "modern prospecting",
      "data-driven prospecting",
      "multi-channel outreach",
      "B2B sales prospecting",
    ],
    badge: {
      icon: Radar,
      label: "Prospecting playbook",
    },
    quickTakeaway: {
      eyebrow: "Prospecting takeaway",
      title:
        "The strongest B2B prospecting strategies combine better data, faster execution, and tighter outreach coordination.",
      description:
        "Prospecting is evolving rapidly, and teams that treat list quality as the foundation usually outperform teams that only optimize messaging volume.",
    },
    toc: [
      {
        id: "best-strategies",
        label: "Best strategies",
      },
      {
        id: "key-insight",
        label: "Key insight",
      },
    ],
    content: (
      <>
        <section
          id="best-strategies"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Best Strategies
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Prospecting is evolving rapidly.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Data-driven targeting",
                description:
                  "The best prospecting starts with accurate company, role, and fit data instead of broad unqualified lists.",
                icon: Radar,
              },
              {
                title: "Automation",
                description:
                  "Automation helps teams source, enrich, and qualify prospects faster without repeating manual list-building work.",
                icon: Bot,
              },
              {
                title: "Multi-channel outreach",
                description:
                  "Prospects respond better when email, LinkedIn, and other touchpoints work together around the same targeting strategy.",
                icon: Sparkles,
              },
            ].map((strategy) => (
              <div
                key={strategy.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    <strategy.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {strategy.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {strategy.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="key-insight"
          className="scroll-mt-28 rounded-[2.25rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.72)] md:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-300">
            Key insight
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Data quality determines success
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Data quality determines success.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Better data sharpens targeting before outreach begins",
              "Verified records improve efficiency across every channel",
              "High-quality lists make automation and personalization more effective",
            ].map((insight) => (
              <div
                key={insight}
                className="rounded-[1.5rem] border border-slate-800 bg-white/5 p-5"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                  <p className="text-sm font-semibold leading-7 text-slate-200">
                    {insight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    ),
    cta: {
      eyebrow: "Upgrade your workflow",
      title: "Improve your prospecting with LeadIntel.",
      description:
        "Use stronger data and faster enrichment to build better prospect lists before your team starts outreach.",
      primaryHref: "/login",
      primaryLabel: "Start free",
      secondaryHref: "/pricing",
      secondaryLabel: "View pricing",
    },
    sidebar: {
      title: "Prospecting rules",
      items: [
        "Target from data instead of assumptions.",
        "Use automation to reduce repetitive research.",
        "Treat data quality as the base layer for outreach.",
      ],
    },
  },
  {
    slug: "find-startup-leads",
    title: "How to Find Startup Leads",
    heading: "How to Find Startup Leads",
    description: "Learn how to discover startup leads for outreach and sales.",
    excerpt:
      "A practical guide to finding startup leads across public platforms and turning scattered company data into an outreach-ready list.",
    keyword: "find startup leads",
    publishedAt: "2026-03-28T00:00:00.000Z",
    category: "Startup prospecting",
    theme: "emerald",
    keywords: [
      "startup lead generation",
      "startup prospecting",
      "find startup founders",
      "startup outreach leads",
    ],
    badge: {
      icon: Sparkles,
      label: "Startup sourcing guide",
    },
    quickTakeaway: {
      eyebrow: "Startup takeaway",
      title:
        "The fastest way to find startup leads is to pull them from multiple public sources into one clean workflow.",
      description:
        "Startup data is usually fragmented across directories, social platforms, and launch communities. Centralized sourcing makes outreach faster and more consistent.",
    },
    toc: [
      {
        id: "where-to-find-them",
        label: "Where to find them",
      },
      {
        id: "challenges",
        label: "Challenges",
      },
      {
        id: "solution",
        label: "Solution",
      },
    ],
    content: (
      <>
        <section
          id="where-to-find-them"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Where to Find Them
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Startups are ideal clients for many services.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Product Hunt",
                description:
                  "A strong source for newly launched products and active startup teams looking for early growth.",
                icon: Sparkles,
              },
              {
                title: "LinkedIn",
                description:
                  "Useful for finding founders, operators, and startup employees by role, industry, and company stage.",
                icon: Search,
              },
              {
                title: "Startup directories",
                description:
                  "Directories help surface company names, categories, websites, and other lead signals across the ecosystem.",
                icon: DatabaseZap,
              },
            ].map((source) => (
              <div
                key={source.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                    <source.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {source.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {source.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="challenges"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Challenges
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Data is scattered across platforms.
          </p>
          <div className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <p className="text-sm leading-7 text-slate-700">
                Startup prospecting gets messy fast when one source has launch
                visibility, another has employee details, and another has the
                website or category. Manual collection creates fragmented lists
                and slows down qualification.
              </p>
            </div>
          </div>
        </section>

        <section
          id="solution"
          className="scroll-mt-28 rounded-[2.25rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.72)] md:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
            Solution
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Use tools that centralize startup lead data
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Use tools that centralize lead data.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Pull startup leads from multiple discovery channels faster",
              "Keep company and contact data in one place for qualification",
              "Move from research to outreach without manual cleanup",
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
      </>
    ),
    cta: {
      eyebrow: "Startup lead discovery",
      title: "Discover startup leads instantly with LeadIntel.",
      description:
        "Centralize scattered startup data into one prospecting workflow so your team can qualify leads and start outreach faster.",
      primaryHref: "/login",
      primaryLabel: "Start free",
      secondaryHref: "/pricing",
      secondaryLabel: "View pricing",
    },
    sidebar: {
      title: "Startup sourcing rules",
      items: [
        "Use multiple sources instead of relying on one directory.",
        "Centralize fragmented startup data before outreach starts.",
        "Prioritize workflows that reduce manual list cleanup.",
      ],
    },
  },
  {
    slug: "find-emails-of-leads",
    title: "How to Find Emails of Potential Clients",
    heading: "How to Find Emails of Leads",
    description: "Discover how to find verified emails for your leads.",
    excerpt:
      "A practical look at the fastest way to find verified emails for B2B leads without relying on guesswork or stale databases.",
    keyword: "find emails of leads",
    publishedAt: "2026-03-28T00:00:00.000Z",
    category: "Email discovery",
    theme: "blue",
    keywords: [
      "find verified emails",
      "lead email finder",
      "B2B email discovery",
      "email enrichment tools",
    ],
    badge: {
      icon: MailCheck,
      label: "Email discovery guide",
    },
    quickTakeaway: {
      eyebrow: "Email takeaway",
      title:
        "The fastest path to better outreach is verified contact data, not more guessing.",
      description:
        "The quality of your email list sets the ceiling for reply rates. Better discovery and verification beat bigger lists almost every time.",
    },
    toc: [
      {
        id: "methods",
        label: "Methods",
      },
      {
        id: "recommended-approach",
        label: "Recommended approach",
      },
    ],
    content: (
      <>
        <section
          id="methods"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Methods
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Email is still the backbone of B2B outreach.
          </p>
          <div className="mt-8 grid gap-4">
            {[
              {
                title: "Guessing Emails",
                description: "Unreliable and inefficient.",
                detail:
                  "Pattern guessing can work occasionally, but it creates a lot of wasted effort and leaves too much room for bounce risk.",
                icon: Search,
              },
              {
                title: "Buying Databases",
                description: "Often outdated.",
                detail:
                  "Large databases may look convenient, but stale contact records usually mean lower deliverability and weaker targeting.",
                icon: TriangleAlert,
              },
              {
                title: "Using Tools",
                description: "Best option for accuracy.",
                detail:
                  "Email discovery tools are the strongest option when they combine enrichment with verification and current prospect data.",
                icon: MailCheck,
              },
            ].map((method) => (
              <div
                key={method.title}
                className="rounded-[1.85rem] border border-slate-200 bg-slate-50/80 p-6 md:p-7"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    <method.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">
                      {method.title}
                    </h3>
                    <p className="mt-3 text-base font-semibold leading-7 text-slate-700">
                      {method.description}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {method.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="recommended-approach"
          className="scroll-mt-28 rounded-[2.25rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.72)] md:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-300">
            Recommended approach
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Find verified contact data before outreach starts
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Use tools like LeadIntel to find verified emails instantly.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Reduce wasted time on manual guessing",
              "Avoid relying on stale purchased lists",
              "Move verified contacts directly into outbound workflows",
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
      eyebrow: "Speed up email discovery",
      title: "Find emails faster with LeadIntel.",
      description:
        "Build cleaner lead lists with verified emails so your outreach starts with better data and fewer deliverability problems.",
      primaryHref: "/login",
      primaryLabel: "Start free",
      secondaryHref: "/pricing",
      secondaryLabel: "View pricing",
    },
    sidebar: {
      title: "Email discovery rules",
      items: [
        "Do not rely on guessing if accuracy matters.",
        "Treat bought databases as stale unless verified.",
        "Use enrichment tools to improve speed and quality.",
      ],
    },
  },
  {
    slug: "cold-email-lead-generation",
    title: "Cold Email Lead Generation Guide (2026)",
    heading: "Cold Email Lead Generation",
    description: "Learn how to generate leads using cold email effectively.",
    excerpt:
      "A practical cold email workflow focused on targeting, personalization, and lead quality before a campaign goes live.",
    keyword: "cold email lead generation",
    publishedAt: "2026-03-28T00:00:00.000Z",
    category: "Cold email prospecting",
    theme: "emerald",
    keywords: [
      "cold email leads",
      "cold outreach targeting",
      "email prospecting",
      "verified leads for cold email",
    ],
    badge: {
      icon: Mail,
      label: "Cold email playbook",
    },
    quickTakeaway: {
      eyebrow: "Cold email takeaway",
      title:
        "Cold email performs best when list quality is high before the first message is sent.",
      description:
        "Strong copy helps, but poor targeting kills response rates. Better lead selection and verified contact data usually matter more than sending more volume.",
    },
    toc: [
      {
        id: "what-makes-cold-email-work",
        label: "What makes cold email work?",
      },
      {
        id: "biggest-mistake",
        label: "Biggest mistake",
      },
      {
        id: "fix",
        label: "Fix",
      },
      {
        id: "better-approach",
        label: "Better approach",
      },
    ],
    content: (
      <>
        <section
          id="what-makes-cold-email-work"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            What Makes Cold Email Work?
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Cold email remains one of the highest ROI channels.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Good targeting",
                description:
                  "The best campaigns start with leads that match your niche, offer, and buyer profile.",
              },
              {
                title: "Personalization",
                description:
                  "Emails perform better when the message reflects the prospect's role, company context, or likely pain point.",
              },
              {
                title: "Strong subject lines",
                description:
                  "You only get a reply if the email gets opened, so the subject line still matters.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6"
              >
                <h3 className="text-xl font-black text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="biggest-mistake"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Biggest Mistake
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Sending emails to poor-quality leads.
          </p>
          <div className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <p className="text-sm leading-7 text-slate-700">
                Low-quality data creates a chain reaction: bad fit leads lower
                reply rates, weak contact data hurts deliverability, and the
                team starts changing copy when the real issue is list quality.
              </p>
            </div>
          </div>
        </section>

        <section
          id="fix"
          className="scroll-mt-28 rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl md:p-10"
        >
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Fix
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Focus on data quality first.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Define the exact audience before building a list.",
              "Verify company, role, and contact details before launch.",
              "Only personalize after the prospect list is clean.",
            ].map((point) => (
              <div
                key={point}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold leading-7 text-slate-700">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="better-approach"
          className="scroll-mt-28 rounded-[2.25rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.72)] md:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
            Better approach
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Build cold email campaigns on verified prospect data
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Use LeadIntel to generate verified leads before sending emails.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Source cleaner leads before writing copy",
              "Enrich records with contact data that is ready for outreach",
              "Reduce wasted cold email volume on poor-fit prospects",
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
      </>
    ),
    cta: {
      eyebrow: "Improve your list quality",
      title: "Get better leads for your cold emails with LeadIntel.",
      description:
        "Generate cleaner prospect lists before you send a single campaign so your targeting, personalization, and reply rates all start from a stronger base.",
      primaryHref: "/login",
      primaryLabel: "Start free",
      secondaryHref: "/pricing",
      secondaryLabel: "View pricing",
    },
    sidebar: {
      title: "Cold email checklist",
      items: [
        "Target the right audience before writing copy.",
        "Do not send to poor-quality or incomplete records.",
        "Verify leads first, then scale email volume.",
      ],
    },
  },
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
