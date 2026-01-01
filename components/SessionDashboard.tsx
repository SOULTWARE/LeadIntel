'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  MapPin,
  Hash,
  Calendar,
  FileText,
  ChevronLeft
} from 'lucide-react';
import LeadsList from './LeadsList';
import type { Prisma } from '@prisma/client';

type SessionWithLeads = Prisma.SessionGetPayload<{ include: { leads: true } }>;

export default function SessionDashboard({ sessions }: { sessions: SessionWithLeads[] }) {
  const [selectedSession, setSelectedSession] = useState<SessionWithLeads | null>(null);

  if (selectedSession) {
    return (
      <div className="space-y-8">
        <button
          onClick={() => setSelectedSession(null)}
          className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Sessions
        </button>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="space-y-2">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Active Intelligence Session</div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedSession.name}</h2>
             </div>
             <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <div className="px-5 py-2 text-center border-r border-slate-200/50">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads</div>
                   <div className="text-lg font-black text-slate-900">{selectedSession.leads.length}</div>
                </div>
                <div className="px-5 py-2 text-center">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</div>
                   <div className="text-lg font-black text-slate-900">{new Date(selectedSession.createdAt).toLocaleDateString()}</div>
                </div>
             </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
             <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                <MapPin size={16} className="text-slate-300" />
                {selectedSession.location || 'Global'}
             </div>
             <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                <Hash size={16} className="text-slate-300" />
                {selectedSession.target || 'Custom Search'}
             </div>
          </div>
        </div>

        <LeadsList initialLeads={selectedSession.leads} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {sessions.map((session, i) => (
        <motion.div
           key={session.id}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: i * 0.1 }}
           onClick={() => setSelectedSession(session)}
           className="group relative bg-white p-8 rounded-[2rem] border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText size={120} />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                <Calendar size={24} />
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{new Date(session.createdAt).toLocaleDateString()}</div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">{session.name}</h3>
              <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <MapPin size={14} />
                {session.location || 'Anywhere'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
               <div className="flex items-center gap-2">
                 <div className="text-2xl font-black text-slate-900">{session.leads.length}</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualified Leads</div>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                 <ChevronRight size={20} />
               </div>
            </div>
          </div>
        </motion.div>
      ))}

      {sessions.length === 0 && (
        <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 text-slate-200">
             <Hash size={40} />
           </div>
           <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Intelligence Sessions</h4>
           <p className="text-slate-500 font-medium max-w-xs mx-auto">Launch your first scrape to start building your qualified lead pipeline.</p>
        </div>
      )}
    </div>
  );
}
