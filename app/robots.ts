import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";
import { publicSitePaths } from "@/lib/routing";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: publicSitePaths,
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
        allow: publicSitePaths,
        disallow: ["/api/", "/auth/"],
      },
    ],
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    host: siteConfig.siteUrl,
  };
}
