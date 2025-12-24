'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Target, Sparkles, Users, TrendingUp, Heart, ArrowRight, Globe, Rocket } from 'lucide-react';

export default function AboutPage() {
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
      title: 'Precision',
      description: 'Every lead matters. We focus on delivering accurate, relevant data that drives real results.',
    },
    {
      icon: Sparkles,
      title: 'Intelligence',
      description: 'AI-powered insights that go beyond raw data to reveal genuine business opportunities.',
    },
    {
      icon: Rocket,
      title: 'Efficiency',
      description: 'Save hours of manual research. Get qualified leads in minutes, not days.',
    },
    {
      icon: Heart,
      title: 'User-First',
      description: 'Built by outbound professionals, for outbound professionals. Every feature serves a purpose.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Leads Enhanced' },
    { value: '500+', label: 'Active Users' },
    { value: '95%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Platform Uptime' },
  ];

  return (
    <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-24"
      >
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-widest border border-green-100"
          >
            <Zap size={14} />
            About Us
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight"
          >
            Making outbound{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-600">
              smarter.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl text-slate-500 leading-relaxed">
            Lead Intel Pro was born from a simple frustration: traditional lead generation is broken. Too much time
            wasted on unqualified prospects, too little insight into who's actually a fit.
          </motion.p>
        </section>

        {/* Story Section */}
        <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900">Our Story</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                We spent years in the trenches of outbound sales and marketing. Hours upon hours manually researching
                companies, trying to figure out which businesses might actually benefit from reaching out.
              </p>
              <p>
                The problem wasn't finding leads—it was finding the <strong>right</strong> leads. The ones who would
                actually respond. The ones with genuine business problems we could solve.
              </p>
              <p>
                So we built Lead Intel Pro: a platform that combines the power of data scraping with AI-driven analysis
                to surface leads that aren't just contact information, but genuine opportunities.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-3xl p-10 border border-green-100">
            <div className="space-y-8">
              <Globe size={48} className="text-green-600" />
              <blockquote className="text-2xl font-bold text-slate-900 leading-snug">
                "We believe every business deserves access to intelligent lead discovery—not just enterprises with
                massive research teams."
              </blockquote>
              <div className="text-slate-500 font-medium">— The Lead Intel Pro Team</div>
            </div>
          </div>
        </motion.section>

        {/* Values Section */}
        <motion.section variants={itemVariants} className="space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-4">What Drives Us</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Our values guide every decision we make, from product features to customer support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <value.icon size={22} className="text-green-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{value.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section variants={itemVariants} className="bg-slate-900 rounded-3xl p-10 md:p-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Mission Section */}
        <motion.section variants={itemVariants} className="text-center max-w-3xl mx-auto space-y-6">
          <TrendingUp size={40} className="text-green-600 mx-auto" />
          <h2 className="text-3xl font-black text-slate-900">Our Mission</h2>
          <p className="text-xl text-slate-500 leading-relaxed">
            To empower sales teams, marketers, and entrepreneurs with intelligent lead discovery tools that save time,
            increase conversion rates, and make outbound campaigns more effective than ever.
          </p>
        </motion.section>

        {/* CTA Section */}
        <motion.section variants={itemVariants} className="text-center">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-black mb-4">Ready to work smarter?</h2>
            <p className="text-green-100 mb-8 max-w-lg mx-auto">
              Join hundreds of teams already using Lead Intel Pro to find and connect with their ideal customers.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-green-600 font-bold px-8 py-4 rounded-2xl hover:bg-green-50 transition-colors"
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
