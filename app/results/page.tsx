import { prisma } from "@/db";
import Link from "next/link";
import LeadsList from "@/components/LeadsList";
import { Search, Database, BarChart, ChevronLeft } from 'lucide-react';

async function getSavedLeads() {
  return prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export default async function ResultsPage() {
  const leads = await getSavedLeads();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Premium Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-extrabold text-2xl tracking-tighter text-blue-600 hover:opacity-80 transition-opacity">
              LeadIntel<span className="text-slate-900">Pro</span>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <h2 className="text-slate-500 font-medium text-sm tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4" />
              Qualified Leads Intelligence
            </h2>
          </div>
          <Link href="/scraper" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
            <Search className="w-4 h-4" />
            New Scrape
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
           <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors mb-6 group">
             <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             Return home
           </Link>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Intelligence <span className="text-blue-600">Dashboard</span></h3>
                <p className="text-slate-500 font-medium text-lg">You have {leads.length} high-precision prospects in your pipeline.</p>
              </div>
              <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                 <div className="px-6 py-3 text-center border-r border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Leads</div>
                    <div className="text-2xl font-black text-slate-900">{leads.length}</div>
                 </div>
                 <div className="px-6 py-3 text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Compatibility</div>
                    <div className="text-2xl font-black text-blue-600">
                      {leads.length > 0
                        ? (leads.reduce((acc, curr) => acc + (curr.compatibilityScore || 0), 0) / leads.length).toFixed(0)
                        : 0}%
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <LeadsList initialLeads={leads} />
      </main>

      <footer className="mt-20 border-t border-slate-200 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="bg-slate-50 px-4 py-2 rounded-full text-slate-400 text-xs font-bold tracking-widest uppercase">
             Generated Intelligence Engine 2025
           </div>
           <div className="flex gap-10 text-slate-400 text-xs font-black uppercase tracking-widest">
              <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
