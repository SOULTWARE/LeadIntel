"use client";

import { motion } from "framer-motion";
import { ArrowRight, Database, Search, Sparkles } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import HeroActions from "@/components/HeroActions";

const heroStats = [
  { label: "Verified sourcing", value: "Structured sessions" },
  { label: "AI qualification", value: "Fit before outreach" },
  { label: "Outbound readiness", value: "Draft and export fast" },
];

export function LandingHeroRevamp({ user }: { user: SupabaseUser | null }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
    >
      <div className="surface space-y-8 p-6 lg:p-8">
        <div className="eyebrow">
          <Sparkles className="h-4 w-4" />
          Lead intelligence workspace
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl xl:text-7xl">
            Professional lead sourcing without the clutter.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            LeadIntel Pro gives outbound teams a single workflow for sourcing
            verified businesses, qualifying fit with AI, and preparing
            outreach-ready records for action.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div key={stat.label} className="surface-muted p-4">
              <div className="section-label">{stat.label}</div>
              <div className="mt-2 text-sm font-semibold text-slate-950">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <HeroActions user={user} />
      </div>

      <div className="surface overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-label">Product snapshot</div>
              <div className="mt-1 text-lg font-semibold text-slate-950">
                Lead workflow overview
              </div>
            </div>
            <span className="chip-accent">Live-like preview</span>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 md:grid-cols-[0.36fr_0.64fr]">
          <div className="space-y-4 bg-slate-950 p-6 text-white">
            <div className="section-label text-slate-500">Navigation</div>
            {[
              { icon: Search, label: "Sourcing workspace", active: true },
              { icon: Database, label: "Saved lead sessions" },
              { icon: Sparkles, label: "Account and billing" },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-md border px-3 py-3 ${
                  item.active
                    ? "border-blue-500/40 bg-blue-600/10 text-white"
                    : "border-slate-800 bg-slate-900 text-slate-300"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-6 bg-white p-6">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: "Sessions", value: "14" },
                { label: "Qualified leads", value: "428" },
                { label: "Ready to export", value: "61" },
              ].map((metric) => (
                <div key={metric.label} className="surface-muted p-4">
                  <div className="section-label">{metric.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="surface-muted space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="section-label">Sourcing workflow</div>
                    <div className="mt-1 text-base font-semibold text-slate-950">
                      Target to territory to qualification brief
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="surface border-slate-200 bg-white p-4">
                    <div className="section-label">Categories</div>
                    <div className="mt-2 text-sm text-slate-700">
                      Dental clinics, orthodontists
                    </div>
                  </div>
                  <div className="surface border-slate-200 bg-white p-4">
                    <div className="section-label">Locations</div>
                    <div className="mt-2 text-sm text-slate-700">
                      Miami, Tampa, Orlando
                    </div>
                  </div>
                </div>
              </div>

              <div className="surface-muted space-y-4 p-5">
                <div className="section-label">Lead actions</div>
                {[
                  "Run AI enhancement on selected leads",
                  "Queue email discovery in batch",
                  "Export filtered records to CSV",
                ].map((item) => (
                  <div
                    key={item}
                    className="surface border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
