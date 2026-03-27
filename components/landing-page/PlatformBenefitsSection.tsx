'use client';

import { motion } from 'framer-motion';
import { Database, Mail, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: Database,
    title: 'Verified local business sourcing',
    description:
      'Build prospect lists by business category and geography using licensed data providers and public business records instead of relying on stale spreadsheets.',
  },
  {
    icon: Sparkles,
    title: 'AI lead scoring before outreach',
    description:
      'Generate fit summaries, pain points, and compatibility signals so your team can focus on higher-intent leads first.',
  },
  {
    icon: Mail,
    title: 'Contact discovery and export readiness',
    description:
      'Move from discovery to contact research and outreach prep in one workflow, then export only the leads worth acting on.',
  },
] as const;

export function PlatformBenefitsSection() {
  return (
    <section className="space-y-10 rounded-[2.75rem] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12">
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">
          Lead Intelligence Software
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          Lead generation software built for high-intent outbound teams.
        </h2>
        <p className="text-lg leading-relaxed text-slate-500">
          LeadIntel Pro helps sales teams, agencies, and operators source local business leads,
          enrich them with AI, discover contacts, and move qualified accounts into outreach faster.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-sm"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <benefit.icon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {benefit.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              {benefit.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
