'use client';

import Link from 'next/link';
import { ChevronRight, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface HeroActionsProps {
  user: SupabaseUser | null;
}

export default function HeroActions({ user }: HeroActionsProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (user) {
    return (
      <motion.div variants={itemVariants} className="flex flex-col gap-4 pt-4 sm:flex-row">
        <Link
          href="/sourcer"
          className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-950 px-8 py-4 text-base font-black text-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.85)] transition-all hover:-translate-y-0.5 hover:bg-slate-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          Launch Data Sourcing
          <ChevronRight className="transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/results"
          className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-black text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ChevronRight className="h-4 w-4" />
          </span>
          View Results Dashboard
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-4 pt-4 sm:flex-row">
      <Link
        href="/login"
         className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-950 px-8 py-4 text-base font-black text-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.85)] transition-all hover:-translate-y-0.5 hover:bg-slate-900"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
          <Zap className="h-4 w-4" fill="currentColor" />
        </span>
        Get Started
        <ChevronRight className="transition-transform group-hover:translate-x-1" />
      </Link>
      <Link
        href="/pricing"
        className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-black text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ChevronRight className="h-4 w-4" />
        </span>
        View Pricing
      </Link>
    </motion.div>
  );
}
