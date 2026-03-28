import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

const publicAllowList = [
  "/",
  "/about",
  "/contact",
  "/how-to-find-b2b-leads",
  "/pricing",
  "/privacy",
  "/terms",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: publicAllowList,
        disallow: ["/api/", "/auth/"],
      },
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
        ],
        allow: publicAllowList,
        disallow: ["/api/", "/auth/"],
      },
    ],
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    host: siteConfig.siteUrl,
  };
}
