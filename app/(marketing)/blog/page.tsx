import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import { blogPosts, getBlogPostPath } from "@/lib/blog";
import {
  createBreadcrumbSchema,
  createMarketingMetadata,
  createOrganizationSchema,
  createSoftwareApplicationSchema,
  createWebPageSchema,
  createWebSiteSchema,
} from "@/lib/seo";

const title = "Lead Generation Blog";
const description =
  "Lead generation guides, strategies, and tooling advice for agencies, founders, and outbound teams.";

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: "/blog",
  keywords: [
    "lead generation blog",
    "B2B lead generation guides",
    "agency prospecting blog",
  ],
});

export default function BlogIndexPage() {
  return (
    <>
      <StructuredData
        data={[
          createOrganizationSchema(),
          createWebSiteSchema(),
          createSoftwareApplicationSchema(),
          createWebPageSchema({
            name: title,
            path: "/blog",
            description,
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-14 px-6 pb-32 pt-16 lg:px-8">
        <section className="rounded-[2.75rem] border border-white/70 bg-white/80 p-8 shadow-[0_32px_120px_-52px_rgba(15,23,42,0.38)] backdrop-blur-2xl md:p-12">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-600">
              Blog
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              Lead generation insights for teams that need better pipeline.
            </h1>
            <p className="text-lg leading-8 text-slate-600 md:text-xl">
              Articles on finding better leads, choosing better tools, and
              building a more repeatable outbound workflow.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="rounded-[2.25rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl"
            >
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    {post.category}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    {post.keyword}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    <Link
                      href={getBlogPostPath(post.slug)}
                      className="transition-colors hover:text-blue-600"
                    >
                      {post.heading}
                    </Link>
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    {post.excerpt}
                  </p>
                </div>
                <Link
                  href={getBlogPostPath(post.slug)}
                  className="inline-flex items-center gap-2 text-sm font-black text-slate-900 transition-colors hover:text-blue-600"
                >
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
