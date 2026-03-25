'use client';

import { motion } from 'framer-motion';
import { Database, Mail, Search, Sparkles } from 'lucide-react';

const steps = [
  {
    title: 'Define target markets',
    description: 'Set categories, locations, and the qualification brief that defines what good looks like.',
    icon: Search,
  },
  {
    title: 'Run verified sourcing',
    description: 'Pull business records into structured sessions that can be reopened later without starting over.',
    icon: Database,
  },
  {
    title: 'Score fit with AI',
    description: 'Use one qualification prompt to identify relevance, pain points, and messaging hooks across a lead batch.',
    icon: Sparkles,
  },
  {
    title: 'Move to outreach',
    description: 'Queue contact discovery, review drafts, and export the exact records your team wants to work.',
    icon: Mail,
  },
];

export function WorkflowSectionRevamp() {
  return (
    <section className="surface space-y-8 p-6 lg:p-8">
      <div className="space-y-3">
        <div className="eyebrow">Workflow</div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">A workflow that reads like an operating system, not a demo page.</h2>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Every screen in the product is designed around the same sequence: source, qualify, inspect, and act. That makes the UI easier to learn and faster to operate under real outbound pressure.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="surface-muted space-y-4 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-blue-700">
                <step.icon className="h-4 w-4" />
              </div>
              <div className="section-label">{String(index + 1).padStart(2, '0')}</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
