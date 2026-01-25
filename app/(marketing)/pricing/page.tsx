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
            Subscribe to a plan with monthly allowances. Usage resets every month. Need more? Purchase add-ons anytime.
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
                  <div className="font-bold text-slate-900 mb-1">Enhanced Lead</div>
                  <p className="text-sm text-slate-500">AI analysis, scoring, and pain-point reasoning for one business.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">Email Discovery</div>
                  <p className="text-sm text-slate-500">One attempt to find contact emails. Counts whether successful or not.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Search size={18} className="text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">Search</div>
                  <p className="text-sm text-slate-500">Free. Browse leads anytime, even with zero remaining usage.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Pricing Cards */}
        <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="relative bg-white rounded-[2rem] p-10 border border-slate-200 shadow-xl hover:shadow-2xl transition-all group">
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
                  1,000 Enhanced Leads / month
                </div>
                <div className="flex items-center gap-3 font-bold text-slate-900">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail size={12} className="text-blue-600" />
                  </div>
                  1,000 Email Discoveries / month
                </div>
                <div className="flex items-center gap-3 font-bold text-slate-900">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <Search size={12} className="text-slate-600" />
                  </div>
                  50 max leads per search
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-3">
                {[
                  'Unlimited searches',
                  'Verified business data via licensed providers',
                  'AI lead analysis & scoring',
                  'Pain-point reasoning',
                  'Manual lead selection',
                  'CSV export',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <Check size={16} className="text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                href="/login?plan=starter"
                className="block w-full py-4 rounded-2xl bg-slate-100 text-slate-900 font-bold text-center hover:bg-slate-200 transition-colors group-hover:bg-blue-600 group-hover:text-white"
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

            <div className="space-y-8 text-white">
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
                  5,000 Enhanced Leads / month
                </div>
                <div className="flex items-center gap-3 font-bold">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <Mail size={12} className="text-white" />
                  </div>
                  5,000 Email Discoveries / month
                </div>
                <div className="flex items-center gap-3 font-bold">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                    <Search size={12} className="text-slate-300" />
                  </div>
                  200 max leads per search
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6 space-y-3">
                {[
                  'Everything in Starter',
                  'Bulk enhance leads',
                  'Batch email discovery (up to 200)',
                  'Priority data sourcing queue',
                  'Faster AI processing',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check size={16} className="text-blue-400" />
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                href="/login?plan=pro"
                className="block w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-center hover:bg-blue-500 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Add-ons Section */}
        <motion.section variants={itemVariants} className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Need more?</h2>
            <p className="text-slate-500 mt-2">Purchase add-ons when you exceed your monthly allowance.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-black text-slate-900">+500 Enhanced Leads</div>
                  <div className="text-sm text-slate-500">One-time purchase</div>
                </div>
              </div>
              <p className="text-sm text-slate-600">Boost your lead enhancement capacity. Used only after monthly usage is exhausted.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Mail size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-black text-slate-900">+500 Email Discoveries</div>
                  <div className="text-sm text-slate-500">One-time purchase</div>
                </div>
              </div>
              <p className="text-sm text-slate-600">Expand your email finding capacity. Add-ons expire after 6-12 months.</p>
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
                'Email discovery retries count as usage',
                'Add-ons are used after monthly allowance',
                'Usage limits ensure fair platform use',
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
