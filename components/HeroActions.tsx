'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
        <Link
          href="/sourcer"
          className="group inline-flex items-center justify-center px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 hover:-translate-y-1"
        >
          Launch Data Sourcing
          <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/results"
          className="inline-flex items-center justify-center px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all hover:-translate-y-1 shadow-sm"
        >
          View Results Dashboard
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
      <Link
        href="/login"
         className="group inline-flex items-center justify-center px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 hover:-translate-y-1"
      >
        Get Started
        <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
      </Link>
      <Link
        href="/pricing"
        className="inline-flex items-center justify-center px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all hover:-translate-y-1 shadow-sm"
      >
        View Pricing
      </Link>
    </motion.div>
  );
}
