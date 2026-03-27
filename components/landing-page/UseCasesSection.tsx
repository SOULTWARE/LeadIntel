'use client';

import { motion } from 'framer-motion';
import { Briefcase, Building2, Megaphone, Target } from 'lucide-react';

const useCases = [
  {
    icon: Target,
    title: 'Outbound sales teams',
    description:
      'Prioritize target accounts with AI scoring, pain-point summaries, and cleaner business data before reps start prospecting.',
  },
  {
    icon: Megaphone,
    title: 'Agencies running local outreach',
    description:
      'Source businesses by city, niche, or region and qualify lists faster for local SEO, paid media, or lead gen service campaigns.',
  },
  {
    icon: Building2,
    title: 'Local growth operators',
    description:
      'Research dentists, clinics, restaurants, home services, and other local categories without stitching together multiple tools.',
  },
  {
    icon: Briefcase,
    title: 'Founders and consultants',
    description:
      'Build a repeatable prospecting workflow that turns market research into outreach-ready lead lists with less manual review.',
  },
] as const;

export function UseCasesSection() {
  return (
    <section className="space-y-10 rounded-[2.75rem] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12">
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-emerald-600">
          Common Use Cases
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          Built for teams that sell to local and regional businesses.
        </h2>
        <p className="text-lg leading-relaxed text-slate-500">
          If your workflow depends on finding qualified business leads by category, city, and fit,
          LeadIntel Pro gives you a clearer path from search to outreach.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {useCases.map((useCase, index) => (
          <motion.article
            key={useCase.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-sm"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <useCase.icon className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {useCase.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              {useCase.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
