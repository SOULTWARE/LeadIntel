'use client';

import { motion } from 'framer-motion';
import { homeFaqs } from '@/lib/seo';

export function HomeFaqSection() {
  return (
    <section
      id="faq"
      className="space-y-10 rounded-[2.75rem] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12"
    >
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600">
          FAQ
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          Answers for search engines, buyers, and AI assistants.
        </h2>
        <p className="text-lg leading-relaxed text-slate-500">
          These are the questions teams usually ask before evaluating lead generation software.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {homeFaqs.map((entry, index) => (
          <motion.article
            key={entry.question}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-sm"
          >
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              {entry.question}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{entry.answer}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
