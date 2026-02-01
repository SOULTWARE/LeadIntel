'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Mail, Search, Info } from 'lucide-react';

export default function PricingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-24"
      >
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100">
            <Zap size={14} />
            Simple Pricing
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
            Pay for what you <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">actually use.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl text-slate-500 leading-relaxed">
            Subscribe to monthly lead intelligence credits that cover sourcing, AI discovery, outreach drafts, and exports. Usage resets every cycle, and you can top up whenever you outpace demand.
          </motion.p>
        </section>

        {/* What Counts as Usage */}
        <motion.section variants={itemVariants} className="max-w-4xl mx-auto">
          <div className="bg-slate-50 rounded-3xl p-8 md:p-10 border border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <Info size={20} className="text-blue-600" />
              What counts as usage?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-indigo-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">AI discovery & scoring</div>
                  <p className="text-sm text-slate-500">Each credit unlocks a business summary, pain points, compatibility score, and outreach hooks.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Search size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">Lead generation request</div>
                  <p className="text-sm text-slate-500">Pull a verified business with firmographics before asking the AI to enrich it.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-rose-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">AI outreach draft</div>
                  <p className="text-sm text-slate-500">Generate a ready-to-edit email draft for the lead you just enriched.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Pricing Cards */}
        <motion.section variants={itemVariants} className="space-y-8 max-w-6xl mx-auto">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Starter Plan */}
            <div className="relative bg-white rounded-[2rem] p-10 border border-slate-200 shadow-xl hover:shadow-2xl transition-all group">
              <div className="flex h-full flex-col gap-8">
                <div className="space-y-8">
                  <div>
                    <div className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Starter</div>
                    <div className="text-5xl font-black text-slate-900">
                      $29<span className="text-xl text-slate-400 font-medium">/mo</span>
                    </div>
                    <p className="text-slate-500 mt-3">For solo founders and small teams testing outbound or running light campaigns.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 font-bold text-slate-900">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Sparkles size={12} className="text-blue-600" />
                      </div>
                      1,000 AI discovery credits / month
                    </div>
                    <div className="flex items-center gap-3 font-bold text-slate-900">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <Search size={12} className="text-slate-600" />
                      </div>
                      100 max leads per search
                    </div>
                    <div className="flex items-center gap-3 font-bold text-slate-900">
                      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                        <Mail size={12} className="text-rose-600" />
                      </div>
                      AI email drafts & hooks included
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-3">
                    {[
                      'Unlimited sourcing sessions',
                      'Business profile summaries & firmographics',
                      'Pain-point reasoning & compatibility scoring',
                      'AI outreach hooks plus ready-to-edit drafts',
                      'Manual lead selection workflow',
                      'CSV export of selected leads',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                        <Check size={16} className="text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/login?plan=starter"
                  className="mt-auto block w-full py-4 rounded-2xl bg-slate-100 text-slate-900 font-bold text-center hover:bg-slate-200 transition-colors group-hover:bg-blue-600 group-hover:text-white"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-slate-900 rounded-[2rem] p-10 border-2 border-blue-600 shadow-2xl shadow-blue-200 overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                Popular
              </div>

              <div className="flex h-full flex-col gap-8 text-white">
                <div className="space-y-8">
                  <div>
                    <div className="text-sm font-black text-blue-400 uppercase tracking-widest mb-2">Pro</div>
                    <div className="text-5xl font-black">
                      $79<span className="text-xl text-slate-400 font-medium">/mo</span>
                    </div>
                    <p className="text-slate-400 mt-3">For agencies and teams running consistent outbound campaigns at scale.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 font-bold">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Sparkles size={12} className="text-white" />
                      </div>
                      5,000 AI discovery credits / month
                    </div>
                    <div className="flex items-center gap-3 font-bold">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                        <Search size={12} className="text-slate-300" />
                      </div>
                      100 max leads per search
                    </div>
                    <div className="flex items-center gap-3 font-bold">
                      <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                        <Mail size={12} className="text-white" />
                      </div>
                      AI email drafts & hooks included
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-6 space-y-3">
                    {[
                      'Everything in Starter',
                      'Bulk AI discovery (up to 100 leads per batch)',
                      'Automated outreach drafts for every lead',
                      'Priority data sourcing queue',
                      'Faster AI processing & scoring',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                        <Check size={16} className="text-blue-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/login?plan=pro"
                  className="mt-auto block w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-center hover:bg-blue-500 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>

          {/* Comment this until implementing the 50 free credites on signup */}
          {/* Free Trial */}
          {/* <div className="relative bg-slate-50 rounded-[2rem] p-6 border border-dashed border-slate-300 shadow-sm">
            <div className="grid gap-6 md:grid-cols-[1.5fr_1.2fr_auto] items-center">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Free</div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-black text-slate-900">50 credits</span>
                  <span className="text-xs md:text-sm font-semibold text-slate-500">Complimentary trial — no card required</span>
                </div>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <Sparkles size={12} className="text-blue-600" />
                  </div>
                  50 AI discoveries
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <Search size={12} className="text-slate-600" />
                  </div>
                  100 lead searches
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                    <Mail size={12} className="text-rose-600" />
                  </div>
                  AI email drafts
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check size={12} className="text-emerald-600" />
                  </div>
                  CSV export ready
                </div>
              </div>

              <div className="flex flex-col gap-2 text-xs text-slate-500">
                <div className="font-black uppercase tracking-[0.3em] text-slate-400">Also included</div>
                <div className="grid gap-1 text-[11px] font-semibold text-slate-600">
                  {[
                    'Unlimited sourcing sessions',
                    'Business summaries & firmographics',
                    'Pain-point reasoning & scoring',
                    'AI outreach hooks',
                    'Manual selection workflow',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check size={12} className="text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-auto">
                <Link
                  href="/login"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-900 hover:border-blue-200 hover:text-blue-600 transition-colors"
                >
                  Start free trial
                </Link>
              </div>
            </div>
          </div> */}
        </motion.section>

        {/* Add-ons Section */}
        <motion.section variants={itemVariants} className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Need more?</h2>
            <p className="text-slate-500 mt-2">Purchase add-ons when you exceed your monthly allowance.</p>
          </div>

          <div className="grid gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-black text-slate-900">+500 Lead intelligence credits</div>
                  <div className="text-sm text-slate-500">One-time · $10 · Expires in 3 months</div>
                </div>
              </div>
              <p className="text-sm text-slate-600">Use add-on credits for additional sourcing, AI discoveries, outreach drafts, and CSV exports after your base allowance is exhausted.</p>
            </div>
          </div>
        </motion.section>

        {/* Important Notes */}
        <motion.section variants={itemVariants} className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-3xl p-10 text-white">
            <h2 className="text-xl font-black mb-6">Important Notes</h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
              {[
                'Monthly usage resets automatically on renewal',
                'Unused monthly usage does not roll over',
                'Re-enhancing the same lead is free',
                'AI email drafts are generated using a separate credit',
                'Add-ons are used after monthly allowance',
                'CSV exports reflect whatever you select in the workspace',
              ].map((note, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                  {note}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Enterprise CTA */}
        {/* <motion.section variants={itemVariants} className="text-center max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-black mb-4">Need a custom plan?</h2>
            <p className="text-blue-100 mb-8">If your use case exceeds Pro limits, contact us for custom usage plans with dedicated support.</p>
            <a href="mailto:sales@leadintelpro.com" className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors">
              Contact Sales
              <ArrowRight size={18} />
            </a>
          </div>
        </motion.section> */}
      </motion.div>
    </main>
  );
}
