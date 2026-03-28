import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

const themeClasses = {
  blue: {
    badge:
      "border border-blue-100 bg-blue-50 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600",
    heroCard:
      "rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.65)]",
    heroEyebrow: "text-blue-300",
    sidebarHover: "hover:bg-slate-50 hover:text-blue-600",
    ctaWrapper:
      "overflow-hidden rounded-[2.5rem] border border-blue-200/60 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.6)] md:p-10",
    ctaEyebrow: "text-blue-100",
    ctaCopy: "text-blue-100",
  },
  emerald: {
    badge:
      "border border-emerald-100 bg-emerald-50 text-[10px] font-black uppercase tracking-[0.35em] text-emerald-700",
    heroCard:
      "rounded-[2rem] border border-emerald-200/60 bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-950 p-6 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.55)]",
    heroEyebrow: "text-emerald-100",
    sidebarHover: "hover:bg-slate-50 hover:text-emerald-700",
    ctaWrapper:
      "overflow-hidden rounded-[2.5rem] border border-emerald-200/60 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.6)] md:p-10",
    ctaEyebrow: "text-emerald-100",
    ctaCopy: "text-emerald-50/90",
  },
} as const;

export default function BlogPostPage({ post }: { post: BlogPost }) {
  const theme = themeClasses[post.theme];
  const BadgeIcon = post.badge.icon;

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-12 px-6 pb-32 pt-16 lg:px-8">
      <section className="overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/80 p-8 shadow-[0_32px_120px_-52px_rgba(15,23,42,0.38)] backdrop-blur-2xl md:p-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="space-y-8">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${theme.badge}`}
            >
              <BadgeIcon className="h-4 w-4" />
              {post.badge.label}
            </div>

            <div className="space-y-5">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">
                Keyword: {post.keyword}
              </p>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
                {post.heading}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
                {post.description}
              </p>
            </div>
          </div>

          <div className={theme.heroCard}>
            <p
              className={`text-[10px] font-black uppercase tracking-[0.35em] ${theme.heroEyebrow}`}
            >
              {post.quickTakeaway.eyebrow}
            </p>
            <p className="mt-4 text-2xl font-black leading-tight">
              {post.quickTakeaway.title}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/80">
              {post.quickTakeaway.description}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <article className="space-y-8">{post.content}</article>

        <aside className="space-y-6 lg:sticky lg:top-28">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
              On this page
            </p>
            <nav className="mt-4 space-y-2">
              {post.toc.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`block rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition-colors ${theme.sidebarHover}`}
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
              {post.sidebar.title}
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              {post.sidebar.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <section className={theme.ctaWrapper}>
        <p
          className={`text-[10px] font-black uppercase tracking-[0.35em] ${theme.ctaEyebrow}`}
        >
          {post.cta.eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
          {post.cta.title}
        </h2>
        <p className={`mt-4 max-w-2xl text-base leading-7 ${theme.ctaCopy}`}>
          {post.cta.description}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={post.cta.primaryHref}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 transition-transform hover:-translate-y-0.5"
          >
            {post.cta.primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={post.cta.secondaryHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-white/15"
          >
            {post.cta.secondaryLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
