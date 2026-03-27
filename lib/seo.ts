import type { Metadata } from "next";

export const siteConfig = {
  name: "LeadIntel Pro",
  shortName: "LeadIntel",
  companyName: "Soultware",
  siteUrl: "https://leadintelpro.com",
  description:
    "Lead intelligence software that helps teams find verified local business leads, score fit with AI, discover emails, and export outreach-ready prospect lists.",
  logoPath: "/icons/icon-full-512.png",
  emails: {
    hello: "hello@leadintelpro.com",
    support: "support@leadintelpro.com",
    sales: "sales@leadintelpro.com",
    privacy: "privacy@leadintelpro.com",
    legal: "legal@leadintelpro.com",
  },
} as const;

export const homeFaqs = [
  {
    question: "What is LeadIntel Pro?",
    answer:
      "LeadIntel Pro is AI lead generation and lead intelligence software for teams that need verified local business leads, fit scoring, contact discovery, and outreach-ready exports in one workflow.",
  },
  {
    question: "How does LeadIntel Pro find leads?",
    answer:
      "The platform combines licensed business data providers and public business records to source location-based prospects by category and geography before AI enrichment starts.",
  },
  {
    question: "Does LeadIntel Pro help with cold outreach?",
    answer:
      "Yes. LeadIntel Pro generates AI summaries, fit signals, likely pain points, and outreach hooks so reps can personalize email outreach faster.",
  },
  {
    question: "Who is LeadIntel Pro built for?",
    answer:
      "LeadIntel Pro is designed for outbound sales teams, agencies, local growth marketers, founders, and consultants who prospect local or regional businesses.",
  },
  {
    question: "Can I export leads after enrichment?",
    answer:
      "Yes. Teams can save qualified leads, organize them into sessions, and export selected records for CRM, spreadsheet, or outbound workflows.",
  },
] as const;

export const pricingFaqs = [
  {
    question: "How does pricing work?",
    answer:
      "LeadIntel Pro uses monthly plans with included lead intelligence credits. Credits cover sourcing-related enrichment actions such as AI fit scoring, outreach drafts, and related workflows.",
  },
  {
    question: "What happens when I run out of credits?",
    answer:
      "You can purchase add-on credit packs when your team exceeds its monthly allowance, so you do not need to upgrade plans just to finish a campaign.",
  },
  {
    question: "Do unused monthly credits roll over?",
    answer:
      "No. Monthly plan usage resets at the start of each billing cycle, while add-on credits remain available until they expire.",
  },
  {
    question: "Which plan fits a small team?",
    answer:
      "Starter is aimed at solo operators and smaller teams running lighter outbound campaigns. Pro is built for agencies and teams that need more AI discovery volume each month.",
  },
] as const;

type FaqEntry = {
  question: string;
  answer: string;
};

type MarketingMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

type WebPageSchemaInput = {
  type?: string;
  name: string;
  path: string;
  description: string;
};

export function createMarketingMetadata({
  title,
  description,
  path,
  keywords = [],
}: MarketingMetadataInput): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function getCanonicalUrl(path: string) {
  return new URL(path, siteConfig.siteUrl).toString();
}

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.siteUrl}/#organization`,
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    logo: getCanonicalUrl(siteConfig.logoPath),
    description: siteConfig.description,
    email: siteConfig.emails.hello,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: siteConfig.emails.sales,
        availableLanguage: ["English"],
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: siteConfig.emails.support,
        availableLanguage: ["English"],
      },
    ],
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.siteUrl}/#website`,
    url: siteConfig.siteUrl,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: {
      "@id": `${siteConfig.siteUrl}/#organization`,
    },
    inLanguage: "en-US",
  };
}

export function createSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteConfig.siteUrl}/#software`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Lead intelligence and sales prospecting software",
    operatingSystem: "Web",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "29",
      highPrice: "79",
      offerCount: "2",
      url: getCanonicalUrl("/pricing"),
    },
    provider: {
      "@id": `${siteConfig.siteUrl}/#organization`,
    },
    featureList: [
      "Verified business data sourcing",
      "AI lead scoring and compatibility analysis",
      "Email discovery and validation",
      "Outreach hook and email draft generation",
      "CSV-ready lead exports",
    ],
  };
}

export function createWebPageSchema({
  type = "WebPage",
  name,
  path,
  description,
}: WebPageSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${getCanonicalUrl(path)}#webpage`,
    url: getCanonicalUrl(path),
    name,
    description,
    isPartOf: {
      "@id": `${siteConfig.siteUrl}/#website`,
    },
    about: {
      "@id": `${siteConfig.siteUrl}/#software`,
    },
    inLanguage: "en-US",
  };
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

export function createFaqSchema(entries: readonly FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export function createContactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${getCanonicalUrl("/contact")}#contact`,
    url: getCanonicalUrl("/contact"),
    name: `Contact ${siteConfig.name}`,
    description:
      "Contact LeadIntel Pro for sales, support, partnerships, and general product questions.",
    mainEntity: {
      "@id": `${siteConfig.siteUrl}/#organization`,
    },
  };
}
