'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Map, Zap, CheckCircle2, ChevronRight, Search } from 'lucide-react';

export default function Home() {
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
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
      </div>

      <header className="relative z-10 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Zap size={24} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tighter text-slate-900">
              LeadIntel<span className="text-blue-600">Pro</span>
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/scraper" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Scraper</Link>
            <Link href="/results" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Dashboard</Link>
            <Link
              href="/scraper"
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32"
        >
          <div className="space-y-10">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100">
              <Sparkles size={14} />
              AI-Powered Intelligence
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
              Turn Google Maps into your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Growth Engine.</span>
            </motion.h2>

            <motion.p variants={itemVariants} className="text-xl text-slate-500 leading-relaxed max-w-lg">
              Scrape high-precision business leads and use advanced AI to verify compatibility automatically. Stop cold calling, start closing.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/scraper"
                className="group inline-flex items-center justify-center px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 hover:-translate-y-1"
              >
                Launch Intelligence Scraper
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/results"
                className="inline-flex items-center justify-center px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all hover:-translate-y-1 shadow-sm"
              >
                View Results Dashboard
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-[3rem] blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden group">
               <div className="space-y-6">
                  {[
                    { color: 'bg-blue-600', icon: <Map size={20} />, title: 'Smart Targeting', desc: 'Precise geo-fencing and category filtering.' },
                    { color: 'bg-indigo-600', icon: <Sparkles size={20} />, title: 'AI Verification', desc: 'GPT-4o checks if they need your help.' },
                    { color: 'bg-slate-900', icon: <Zap size={20} />, title: 'Batch Processing', desc: 'Process 500+ prospects in seconds.' },
                  ].map((feat, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 10 }}
                      className="flex items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-lg group"
                    >
                       <div className={`w-14 h-14 ${feat.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                         {feat.icon}
                       </div>
                       <div>
                         <div className="font-black text-slate-800 text-lg">{feat.title}</div>
                         <div className="text-slate-500 text-sm font-medium">{feat.desc}</div>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Workflow Section */}
        <section className="pt-24 border-t border-slate-100">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em]">The Workflow</h3>
            <h4 className="text-4xl font-extrabold text-slate-900 tracking-tight">Four steps to high-intent leads.</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Target', desc: 'Define your ideal business categories and target locations.', icon: <Target className="text-blue-600" /> },
              { num: '02', title: 'Scrape', desc: 'Extract live data from Google Maps with deep precision.', color: 'bg-blue-50', icon: <Search className="text-blue-600" /> },
              { num: '03', title: 'Enhance', desc: 'AI analyzes compatibility against your specific goals.', active: true, icon: <Sparkles className="text-indigo-600" /> },
              { num: '04', title: 'Connect', desc: 'Reach out with personalized hooks generated by AI.', icon: <Zap className="text-slate-900" /> },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-10 rounded-[2rem] border transition-all hover:shadow-xl ${
                  step.active ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xl shadow-indigo-100 scale-105' : 'bg-slate-50 border-slate-100 text-slate-900 hover:bg-white'
                }`}
              >
                <div className={`text-4xl font-black mb-6 opacity-20 ${step.active ? 'text-white' : 'text-slate-900'}`}>{step.num}</div>
                <div className="font-black text-xl mb-4 tracking-tight">{step.title}</div>
                <p className={`text-sm font-medium leading-relaxed ${step.active ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-10">
          <div className="flex items-center gap-2 grayscale brightness-50 opacity-50">
            <Zap size={20} fill="currentColor" />
            <span className="font-black tracking-tighter text-xl">LeadIntelPro</span>
          </div>
          <div className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">
            © 2025 Lead Intel Pro • Performance Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple placeholder components for icons not imported
function Target({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
