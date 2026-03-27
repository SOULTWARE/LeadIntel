"use client";

import { motion } from "framer-motion";
import { Sparkles, Database, Search, MapPin, Calendar } from "lucide-react";
import HeroActions from "../HeroActions";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function LandingHero({ user }: { user: SupabaseUser | null }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]"
    >
      <section className="space-y-8 rounded-[2.75rem] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12">
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600"
        >
          <Sparkles size={14} />
          AI Lead Intelligence
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="max-w-3xl text-5xl font-black leading-[1.02] tracking-tight text-slate-900 md:text-7xl"
        >
          AI lead generation software for{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            verified local business prospecting.
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="max-w-xl text-lg leading-8 text-slate-500 md:text-xl"
        >
          Find businesses by category and city, enrich each lead with AI fit
          scoring, discover contact details, and export outreach-ready prospect
          lists from one focused workflow.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="grid gap-3 sm:grid-cols-3"
        >
          {[
            { label: "Verified sourcing", value: "High precision" },
            { label: "AI enrichment", value: "Compatibility scoring" },
            { label: "Outbound ready", value: "Draft + export" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                {stat.label}
              </div>
              <div className="mt-2 text-sm font-black tracking-tight text-slate-900">
                {stat.value}
              </div>
            </div>
          ))}
        </motion.div>

        <HeroActions user={user} />
      </section>

      <motion.div variants={itemVariants} className="relative">
        <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-blue-100 to-indigo-100 opacity-60 blur-2xl animate-pulse" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2.75rem] border border-slate-200/70 bg-white/80 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl group">
          <div className="absolute inset-0">
            <div className="relative left-1/2 -translate-x-1/2 origin-top scale-[0.72] w-[138.89%] h-[138.89%]">
              <div className="bg-[#f8fafc]">
                <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
                  <div className="px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="font-extrabold text-xl tracking-tighter text-blue-600">
                        LeadIntel<span className="text-slate-900">Pro</span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <h2 className="text-slate-500 font-medium text-sm tracking-tight flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Qualified Leads Intelligence
                      </h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        New Search
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-8">
                  <div className="flex items-start justify-between gap-8">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        RETURN HOME
                      </div>
                      <h3 className="text-4xl font-black tracking-tight leading-[0.95]">
                        <span className="text-slate-900">INTELLIGENCE </span>
                        <span className="text-blue-600">DASHBOARD</span>
                      </h3>
                      <p className="text-slate-500 font-medium">
                        Manage your 4 sourcing sessions and 97 prospects.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-100/50 overflow-hidden w-[260px]">
                      <div className="grid grid-cols-2">
                        <div className="p-5 text-center border-r border-slate-100">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Total Sessions
                          </div>
                          <div className="mt-2 text-2xl font-black text-slate-900">
                            4
                          </div>
                        </div>
                        <div className="p-5 text-center">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Total Prospects
                          </div>
                          <div className="mt-2 text-2xl font-black text-blue-600">
                            97
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {[
                      {
                        title: "Restaurant - New Mexico",
                        date: "12/30/2025",
                        loc: "new mexico",
                        leads: 10,
                      },
                      {
                        title: "Clinic - New Mexico",
                        date: "12/27/2025",
                        loc: "new mexico",
                        leads: 20,
                      },
                      {
                        title: "Clinic - New Mexico",
                        date: "12/27/2025",
                        loc: "new mexico",
                        leads: 9,
                      },
                      {
                        title: "Restaurants - New Mexico",
                        date: "12/23/2025",
                        loc: "New Mexico",
                        leads: 58,
                      },
                    ].map((s, i) => (
                      <div
                        key={`${s.title}-${s.date}-${i}`}
                        className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-100/50 overflow-hidden"
                      >
                        <div className="p-7">
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                              {s.date}
                            </div>
                          </div>
                          <div className="mt-5 space-y-2">
                            <div className="font-black text-slate-900 uppercase tracking-tight text-base leading-tight">
                              {s.title}
                            </div>
                            <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {s.loc}
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-slate-100 px-7 py-5 flex items-center justify-between">
                          <div className="flex items-baseline gap-3">
                            <div className="text-2xl font-black text-slate-900">
                              {s.leads}
                            </div>
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                              Qualified Leads
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black">
                            <span className="relative -top-px">›</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
