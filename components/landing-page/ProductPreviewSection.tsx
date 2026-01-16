'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Database,
  FileDown,
  FileText,
  Mail,
  MapPin,
  Search,
  Settings2,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

export function ProductPreviewSection() {
  return (
    <section className="pt-24 mt-24 border-t border-slate-100">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em]">Product Preview</h2>
        <p className="text-4xl font-extrabold text-slate-900 tracking-tight">A live-feeling UI, built for speed.</p>
        <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
          A full-width, static preview of the core screens—built in code to showcase the workflow without any setup.
        </p>
      </div>

      <div className="relative left-1/2 right-1/2 w-screen -mx-[50vw]">
        <div className="px-6">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-20 md:space-y-28">
              {[
                {
                  title: 'Set targets fast. Stay in control.',
                  eyebrow: 'Configure Scrape',
                  icon: <Settings2 size={14} />,
                  accent: 'bg-blue-50 text-blue-600 border-blue-100',
                  reverse: false,
                  bullets: ['3-step wizard UI', 'Targets + territories', 'AI settings included'],
                  screenGlow: 'from-blue-100 to-indigo-100',
                  screen: (
                    <div className="relative">
                      <div className="absolute -inset-6 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-[3rem] blur-2xl opacity-50" />
                      <div className="relative bg-[#f8fafc] border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
                          <div className="px-8 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="font-extrabold text-xl tracking-tighter text-blue-600">
                                LeadIntel<span className="text-slate-900">Pro</span>
                              </div>
                              <div className="h-6 w-px bg-slate-200" />
                              <h2 className="text-slate-500 font-medium text-sm tracking-tight flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Intelligence Scraper
                              </h2>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            </div>
                          </div>
                        </div>

                        <div className="p-8">
                          <div className="max-w-3xl mx-auto">
                            <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-2xl mb-10 w-fit mx-auto border border-slate-200 shadow-inner">
                              <div className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-white text-blue-600 shadow-md ring-1 ring-slate-100">
                                <Settings2 className="w-4 h-4" />
                                Configure Scrape
                              </div>
                              <div className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed opacity-60">
                                <Database className="w-4 h-4" />
                                Results
                              </div>
                            </div>

                            <div className="flex items-center justify-between px-4 mb-6">
                              {[1, 2, 3].map((step) => (
                                <div key={step} className="flex items-center flex-1 last:flex-none">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                                      step <= 2
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                        : 'bg-slate-200 text-slate-500'
                                    }`}
                                  >
                                    {step}
                                  </div>
                                  {step < 3 && (
                                    <div
                                      className={`h-1 flex-1 mx-4 rounded-full transition-all duration-700 ${
                                        step < 2 ? 'bg-blue-600' : 'bg-slate-200'
                                      }`}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-100/50 overflow-hidden">
                              <div className="p-10">
                                <div className="space-y-2 mb-8">
                                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    <Target className="text-blue-600 w-8 h-8" />
                                    Define Your Targets
                                  </h3>
                                  <p className="text-slate-500">What specific business categories are you looking for?</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Categories</label>
                                    <div className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600">
                                      Dental Clinics, Orthodontists
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Specific Queries</label>
                                      <span className="text-[10px] font-black text-slate-400 uppercase">Exact Match</span>
                                    </div>
                                    <div className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600">
                                      dentist near me\n24/7 emergency dentist
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-8 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-3">
                                  <MapPin className="text-emerald-600 w-5 h-5" />
                                  <div className="text-sm font-bold text-emerald-800">Next: Select Territories</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute -top-6 right-8 bg-white border border-slate-200 rounded-2xl shadow-xl px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-enhance</div>
                            <div className="text-sm font-black text-slate-900">Enabled</div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute -bottom-7 left-10 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Places / query</div>
                        <div className="text-lg font-black tracking-tight">500</div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Scan results. Enhance. Export.',
                  eyebrow: 'Scraper Results',
                  icon: <Database size={14} />,
                  accent: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                  reverse: true,
                  bullets: ['Export CSV + Save All', 'AI recommendation + score', 'Clean table view'],
                  screenGlow: 'from-indigo-100 to-blue-100',
                  screen: (
                    <div className="relative">
                      <div className="absolute -inset-6 bg-gradient-to-tr from-indigo-100 to-blue-100 rounded-[3rem] blur-2xl opacity-50" />
                      <div className="relative bg-[#f8fafc] border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
                          <div className="px-8 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="font-extrabold text-xl tracking-tighter text-blue-600">
                                LeadIntel<span className="text-slate-900">Pro</span>
                              </div>
                              <div className="h-6 w-px bg-slate-200" />
                              <h2 className="text-slate-500 font-medium text-sm tracking-tight flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Intelligence Scraper
                              </h2>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            </div>
                          </div>
                        </div>

                        <div className="pt-8 px-8">
                          <div className="relative left-1/2 -translate-x-1/2 origin-top scale-[0.72] w-[138.89%]">
                            <div className="w-full">
                              <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-2xl mb-8 w-fit mx-auto border border-slate-200 shadow-inner">
                                <div className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-slate-500">
                                  <Settings2 className="w-4 h-4" />
                                  Configure Scrape
                                </div>
                                <div className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 bg-white text-blue-600 shadow-md ring-1 ring-slate-100">
                                  <Database className="w-4 h-4" />
                                  Results (3)
                                </div>
                              </div>

                              <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-100/50 overflow-hidden">
                                <div className="p-8">
                                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
                                    <div className="space-y-2 text-center lg:text-left">
                                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">Extraction Results</h3>
                                      <p className="text-slate-500 font-medium flex items-center gap-2 justify-center lg:justify-start">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        Successfully found 3 businesses
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3">
                                      <div className="px-6 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-sm">
                                        <FileDown className="w-4 h-4" />
                                        Export CSV
                                      </div>
                                      <div className="px-8 py-3 text-sm font-black bg-indigo-600 text-white rounded-xl shadow-xl shadow-indigo-100 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        AI Enhance
                                      </div>
                                      <div className="px-8 py-3 text-sm font-black bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-900/10 flex items-center gap-2">
                                        <Database className="w-4 h-4" />
                                        Save All
                                      </div>
                                    </div>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50/80">
                                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Business Name</th>
                                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</th>
                                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AI Intelligence</th>
                                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Compatibility</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {[
                                          {
                                            name: 'Bright Dental Studio',
                                            type: 'Dentist',
                                            address: '12 Madison Ave, New York',
                                            website: 'Website',
                                            recommendation: 'Highly Recommended',
                                            reasoning: 'Strong local presence, outdated booking flow.',
                                            score: 92,
                                          },
                                          {
                                            name: 'Pearl Smile Clinic',
                                            type: 'Dental Clinic',
                                            address: '88 Broadway, New York',
                                            website: 'Website',
                                            recommendation: 'Recommended',
                                            reasoning: 'Good reviews, weak landing conversion signals.',
                                            score: 74,
                                          },
                                          {
                                            name: 'City Orthodontics',
                                            type: 'Orthodontist',
                                            address: '5 Park Row, New York',
                                            website: 'Website',
                                            recommendation: 'Potential',
                                            reasoning: 'Needs clearer offer and follow-up process.',
                                            score: 48,
                                          },
                                        ].map((r) => (
                                          <tr key={r.name} className="group hover:bg-blue-50/30 transition-all duration-300">
                                            <td className="px-8 py-6">
                                              <div className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                                                {r.name}
                                              </div>
                                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">
                                                {r.type}
                                              </div>
                                            </td>
                                            <td className="px-8 py-6">
                                              <div className="text-sm text-slate-500 font-medium truncate max-w-[220px] mb-1">{r.address}</div>
                                              <div className="flex gap-4 items-center">
                                                <span className="text-xs text-blue-500 font-bold">{r.website}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">(212) 555-0199</span>
                                              </div>
                                            </td>
                                            <td className="px-8 py-6 max-w-[300px]">
                                              <div className="space-y-2">
                                                <div
                                                  className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg w-fit shadow-sm border ${
                                                    r.recommendation === 'Highly Recommended'
                                                      ? 'bg-green-50 text-green-700 border-green-100'
                                                      : r.recommendation === 'Recommended'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                        : 'bg-slate-50 text-slate-600 border-slate-100'
                                                  }`}
                                                >
                                                  {r.recommendation}
                                                </div>
                                                <div className="text-xs text-slate-600 line-clamp-3 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                                                  &quot;{r.reasoning}&quot;
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-8 py-6">
                                              <div className="flex flex-col items-center gap-1">
                                                <div
                                                  className={`text-2xl font-black ${
                                                    r.score >= 80
                                                      ? 'text-green-600'
                                                      : r.score >= 50
                                                        ? 'text-blue-600'
                                                        : 'text-slate-300'
                                                  }`}
                                                >
                                                  {r.score}%
                                                </div>
                                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                  <div
                                                    className={`h-full ${r.score >= 80 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${r.score}%` }}
                                                  />
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Open a session. View the full report.',
                  eyebrow: 'Dashboard + Report',
                  icon: <FileText size={14} />,
                  accent: 'bg-slate-50 text-slate-900 border-slate-200',
                  reverse: false,
                  bullets: ['Sessions grid', 'Report drawer', 'Pain points + hooks'],
                  screenGlow: 'from-slate-100 to-blue-50',
                  screen: (
                    <div className="relative">
                      <div className="absolute -inset-6 bg-gradient-to-tr from-slate-100 to-blue-50 rounded-[3rem] blur-2xl opacity-50" />
                      <div className="relative bg-[#f8fafc] border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden h-[760px] md:h-[820px]">
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
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            </div>
                          </div>
                        </div>

                        <div className="px-8 relative h-full">
                          <div className="relative left-1/2 -translate-x-1/2 origin-top scale-[0.72] w-[149.89%] h-[148.89%]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                              {[
                                { name: 'Dental Clinics - New York', date: '12/30/2025', leads: 184 },
                                { name: 'Orthodontists - Brooklyn', date: '12/28/2025', leads: 96 },
                                { name: 'Clinics - Manhattan', date: '12/27/2025', leads: 211 },
                              ].map((s) => (
                                <div
                                  key={s.name}
                                  className="group relative bg-white p-7 rounded-[2rem] border border-slate-200 shadow-lg overflow-hidden"
                                >
                                  <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <FileText size={120} />
                                  </div>
                                  <div className="relative z-10 space-y-5">
                                    <div className="flex items-center justify-between">
                                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                                        <Calendar size={24} />
                                      </div>
                                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{s.date}</div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-lg font-black text-slate-900 uppercase tracking-tight line-clamp-1">{s.name}</div>
                                      <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                                        <MapPin size={14} />
                                        New York
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                                      <div className="flex items-center gap-2">
                                        <div className="text-2xl font-black text-slate-900">{s.leads}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualified Leads</div>
                                      </div>
                                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

                            <div className="absolute top-0 right-0 w-full md:w-[520px] h-full bg-white shadow-2xl z-10 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <X size={20} />
                                  </div>
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Lead Intelligence Report</div>
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <div className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Bright Dental Studio</div>
                                    <div className="flex flex-wrap gap-3">
                                      <span className="bg-blue-50 text-blue-600 text-xs font-black px-3 py-1.5 rounded-full uppercase border border-blue-100">Dentist</span>
                                      <span className="bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-100">ID: 9F3A1C2B</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Rating</div>
                                      <div className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        4.8 <span className="text-amber-400 text-base">★</span>
                                        <span className="text-xs text-slate-400">(238 reviews)</span>
                                      </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comp. Score</div>
                                      <div className="text-2xl font-black text-green-600">92%</div>
                                    </div>
                                  </div>

                                  <div className="bg-blue-50/50 p-7 rounded-[2rem] border border-blue-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                      <Sparkles size={100} />
                                    </div>
                                    <p className="text-slate-700 leading-relaxed font-medium italic relative z-10">&quot;Strong demand signals, but conversion path looks outdated.&quot;</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                      <AlertCircle className="w-4 h-4 text-red-500" />
                                      Pain Points
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                      {['Inconsistent bookings', 'Low local visibility', 'Slow lead follow-up'].map((p) => (
                                        <div
                                          key={p}
                                          className="flex items-start gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-50 text-red-800 text-xs font-bold uppercase transition-transform hover:translate-x-1"
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />
                                          {p}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                      <BarChart3 className="w-4 h-4 text-green-500" />
                                      Sales Hooks
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                      {['Modern booking flow', 'SEO + landing improvements', 'Review-driven trust signals'].map((h) => (
                                        <div
                                          key={h}
                                          className="flex items-start gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-50 text-green-800 text-xs font-bold uppercase transition-transform hover:translate-x-1"
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1" />
                                          {h}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  <div className="bg-slate-50 rounded-3xl p-7 border border-slate-100 space-y-4">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</div>
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                          <Mail size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Email Address</span>
                                          <span className="text-sm font-bold text-slate-700">contact@brightdental.com</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                          <MapPin size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Primary Location</span>
                                          <span className="text-sm font-bold text-slate-700">12 Madison Ave, New York</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                },
              ].map((row, i) => (
                <motion.div
                  key={row.eyebrow}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
                >
                  <div className={`${row.reverse ? 'lg:order-2 lg:col-span-4' : 'lg:order-1 lg:col-span-4'} space-y-6`}>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${row.accent}`}
                    >
                      {row.icon}
                      {row.eyebrow}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-[1.1]">{row.title}</h3>
                      <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-md">
                        A clean workflow from targeting to a ready-to-send report.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {row.bullets.map((b) => (
                        <div key={b} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Highlight</div>
                          <div className="mt-2 text-xs font-extrabold text-slate-800 leading-snug">{b}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`${row.reverse ? 'lg:order-1 lg:col-span-8' : 'lg:order-2 lg:col-span-8'} relative`}>
                    {row.screen}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
