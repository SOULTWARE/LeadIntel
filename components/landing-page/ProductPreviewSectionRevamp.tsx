'use client';

import { motion } from 'framer-motion';
import { BarChart3, Database, Mail, Search, Sparkles, Users } from 'lucide-react';

const previewSections = [
  {
    title: 'Sourcing workspace',
    copy: 'Configure the search, define territories, and set the qualification prompt that AI will use later.',
    icon: Search,
    points: ['Session naming', 'Location scoping', 'Qualification brief'],
  },
  {
    title: 'Saved sessions',
    copy: 'Reopen historical searches, review filtered lead lists, and keep session context intact over time.',
    icon: Database,
    points: ['Session history', 'Lead filtering', 'CSV export'],
  },
  {
    title: 'Lead operations',
    copy: 'Inspect fit, generate outreach drafts, and queue contact discovery from a single lead-management surface.',
    icon: Mail,
    points: ['AI scores', 'Email drafts', 'Batch discovery'],
  },
];

export function ProductPreviewSectionRevamp() {
  return (
    <section className="surface space-y-8 p-6 lg:p-8">
      <div className="space-y-3">
        <div className="eyebrow">Product preview</div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Three surfaces, one coherent workflow.</h2>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          The app is organized around a small number of clear work areas so users can move between sourcing, review, and outreach without relearning the interface.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {previewSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="surface-muted overflow-hidden"
          >
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-blue-700">
                  <section.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="section-label">Workspace area</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">{section.title}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm leading-6 text-slate-600">{section.copy}</p>

              <div className="grid gap-3">
                {section.points.map((point) => (
                  <div key={point} className="surface border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {point}
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Users, label: 'Teams' },
                  { icon: Sparkles, label: 'AI' },
                  { icon: BarChart3, label: 'Ops' },
                ].map((item) => (
                  <div key={`${section.title}-${item.label}`} className="rounded-md border border-slate-200 bg-white px-3 py-3 text-center">
                    <item.icon className="mx-auto h-4 w-4 text-blue-700" />
                    <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
