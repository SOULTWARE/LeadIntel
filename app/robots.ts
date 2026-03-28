import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";
import { publicSitePaths } from "@/lib/routing";

export default function robots(): MetadataRoute.Robots {
  const allowPaths = [...publicSitePaths];

  return {
    rules: [
      {
        userAgent: "*",
        allow: allowPaths,
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
        allow: allowPaths,
        disallow: ["/api/", "/auth/"],
      },
    ],
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    host: siteConfig.siteUrl,
  };
}
