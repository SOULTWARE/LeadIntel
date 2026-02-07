import { prisma } from "@/db";
import Link from "next/link";
import SessionDashboard from "@/components/SessionDashboard";
import { Search, Database, ChevronLeft } from 'lucide-react';
import InternalLayoutSetter from "@/components/InternalLayoutSetter";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getSessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return prisma.session.findMany({
    where: {
      userId: user.id
    },
    orderBy: { createdAt: 'desc' },
    include: {
      leads: true
    }
  });
}

export default async function ResultsPage() {
  const sessions = await getSessions();
  const totalLeads = sessions.reduce((acc, s) => acc + s.leads.length, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <InternalLayoutSetter
        title="Qualified Leads Intelligence"
        icon={<Database className="w-4 h-4" />}
        rightSlot={(
          <Link href="/sourcer" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
            <Search className="w-4 h-4" />
            New Search
          </Link>
        )}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
           <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors mb-6 group">
             <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             Return home
           </Link>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Intelligence <span className="text-blue-600">Dashboard</span></h3>
                <p className="text-slate-500 font-medium text-lg">Manage your {sessions.length} sourcing sessions and {totalLeads} prospects.</p>
              </div>
              <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                 <div className="px-6 py-3 text-center border-r border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sessions</div>
                    <div className="text-2xl font-black text-slate-900">{sessions.length}</div>
                 </div>
                 <div className="px-6 py-3 text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Prospects</div>
                    <div className="text-2xl font-black text-blue-600">{totalLeads}</div>
                 </div>
              </div>
           </div>
        </div>

        <SessionDashboard sessions={sessions} />
      </main>

      <footer className="mt-20 border-t border-slate-200 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="bg-slate-50 px-4 py-2 rounded-full text-slate-400 text-xs font-bold tracking-widest uppercase">
             Generated Intelligence Engine 2025
           </div>
           <div className="flex gap-10 text-slate-400 text-xs font-black uppercase tracking-widest">
              <Link href="/contact" className="hover:text-blue-600 transition-colors">Support</Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}
