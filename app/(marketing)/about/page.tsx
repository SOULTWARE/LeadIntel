"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Target,
  Sparkles,
  TrendingUp,
  Heart,
  ArrowRight,
  Globe,
  Rocket,
} from "lucide-react";
import AboutPageContent from "@/components/marketing/AboutPageContent";

export default function AboutPage() {
  return <AboutPageContent />;
}

void LegacyAboutPage;

function LegacyAboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const values = [
    {
      icon: Target,
      title: "Precision",
      description:
        "Every lead matters. We focus on delivering accurate, relevant data that drives real results.",
    },
    {
      icon: Sparkles,
      title: "Intelligence",
      description:
        "AI-powered insights that go beyond raw data to reveal genuine business opportunities.",
    },
    {
      icon: Rocket,
      title: "Efficiency",
      description:
        "Save hours of manual research. Get qualified leads in minutes, not days.",
    },
    {
      icon: Heart,
      title: "User-First",
      description:
        "Built by outbound professionals, for outbound professionals. Every feature serves a purpose.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Leads Enhanced" },
    { value: "500+", label: "Active Users" },
    { value: "95%", label: "Satisfaction Rate" },
    { value: "24/7", label: "Platform Uptime" },
  ];

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-20 px-6 pb-32 pt-16 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-24"
      >
        {/* Hero Section */}
        <section className="mx-auto max-w-4xl space-y-6 rounded-[2.5rem] border border-white/70 bg-white/75 p-8 text-center shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-emerald-600"
          >
            <Zap size={14} />
            About Us
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl"
          >
            Making outbound{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              smarter.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl leading-relaxed text-slate-500"
          >
            Lead Intel Pro was born from a simple frustration: traditional lead
            generation is broken. Too much time wasted on unqualified prospects,
            too little insight into who&apos;s actually a fit.
          </motion.p>
        </section>

        {/* Story Section */}
        <motion.section
          variants={itemVariants}
          className="grid items-center gap-8 rounded-[2.5rem] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:grid-cols-2 md:p-12"
        >
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900">Our Story</h2>
            <div className="space-y-4 leading-relaxed text-slate-600">
              <p>
                We spent years in the trenches of outbound sales and marketing.
                Hours upon hours manually researching companies, trying to
                figure out which businesses might actually benefit from reaching
                out.
              </p>
              <p>
                The problem wasn&apos;t finding leads—it was finding the{" "}
                <strong>right</strong> leads. The ones who would actually
                respond. The ones with genuine business problems we could solve.
              </p>
              <p>
                So we built Lead Intel Pro: a platform that combines verified
                data sourcing with AI-driven analysis to surface leads that
                aren&apos;t just contact information, but genuine opportunities.
              </p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-10 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.22)]">
            <div className="space-y-8">
              <Globe size={48} className="text-green-600" />
              <blockquote className="text-2xl font-bold text-slate-900 leading-snug">
                &quot;We believe every business deserves access to intelligent
                lead discovery—not just enterprises with massive research
                teams.&quot;
              </blockquote>
              <div className="text-slate-500 font-medium">
                — The Lead Intel Pro Team
              </div>
            </div>
          </div>
        </motion.section>

        {/* Values Section */}
        <motion.section
          variants={itemVariants}
          className="space-y-10 rounded-[2.5rem] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12"
        >
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-4">
              What Drives Us
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Our values guide every decision we make, from product features to
              customer support.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <value.icon size={22} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section
          variants={itemVariants}
          className="rounded-[2.5rem] border border-slate-900/90 bg-slate-950 p-10 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.65)] md:p-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Mission Section */}
        <motion.section
          variants={itemVariants}
          className="mx-auto max-w-3xl space-y-6 rounded-[2.5rem] border border-white/70 bg-white/75 p-8 text-center shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12"
        >
          <TrendingUp size={40} className="text-green-600 mx-auto" />
          <h2 className="text-3xl font-black text-slate-900">Our Mission</h2>
          <p className="text-xl text-slate-500 leading-relaxed">
            To empower sales teams, marketers, and entrepreneurs with
            intelligent lead discovery tools that save time, increase conversion
            rates, and make outbound campaigns more effective than ever.
          </p>
        </motion.section>

        {/* CTA Section */}
        <motion.section variants={itemVariants} className="text-center">
          <div className="rounded-[2.5rem] border border-emerald-200/50 bg-gradient-to-r from-emerald-600 to-teal-600 p-12 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.5)]">
            <h2 className="text-3xl font-black mb-4">Ready to work smarter?</h2>
            <p className="text-green-100 mb-8 max-w-lg mx-auto">
              Join hundreds of teams already using Lead Intel Pro to find and
              connect with their ideal customers.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-black text-emerald-600 transition-colors hover:bg-green-50"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}
