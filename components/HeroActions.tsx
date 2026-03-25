"use client";

import Link from "next/link";
import { ChevronRight, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 pt-4 sm:flex-row"
      >
        <Link href="/sourcer" className="btn-primary group px-6 py-3 text-base">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          Launch Data Sourcing
          <ChevronRight className="transition-transform group-hover:translate-x-1" />
        </Link>
        <Link href="/results" className="btn-secondary px-6 py-3 text-base">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-blue-700">
            <ChevronRight className="h-4 w-4" />
          </span>
          View Results Dashboard
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col gap-4 pt-4 sm:flex-row"
    >
      <Link href="/login" className="btn-primary group px-6 py-3 text-base">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white">
          <Zap className="h-4 w-4" fill="currentColor" />
        </span>
        Get Started
        <ChevronRight className="transition-transform group-hover:translate-x-1" />
      </Link>
      <Link href="/pricing" className="btn-secondary px-6 py-3 text-base">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-blue-700">
          <ChevronRight className="h-4 w-4" />
        </span>
        View Pricing
      </Link>
    </motion.div>
  );
}
