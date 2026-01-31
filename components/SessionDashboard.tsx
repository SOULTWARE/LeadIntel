'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  MapPin,
  Hash,
  Calendar,
  FileText,
  ChevronLeft,
  Filter,
  Download
} from 'lucide-react';
import LeadsList from './LeadsList';
import type { Prisma } from '@prisma/client';
import { createLeadsCsv } from './leads-list/createLeadsCsv';
import { toast } from 'sonner';

type SessionWithLeads = Prisma.SessionGetPayload<{ include: { leads: true } }>;

const DASHBOARD_SESSION_STORAGE_KEY = 'dashboard.selectedSessionId';

type LeadEntry = {
  lead: SessionWithLeads['leads'][number];
  sessionId: string;
  sessionName: string;
  industry: string | null;
  recommendation: string | null;
};

export default function SessionDashboard({ sessions }: { sessions: SessionWithLeads[] }) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState('all');
  const [recommendationFilter, setRecommendationFilter] = useState('all');

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((session) => session.id === selectedSessionId) ?? null;
  }, [selectedSessionId, sessions]);

  const leadEntries = useMemo<LeadEntry[]>(() => {
    return sessions.flatMap((session) =>
      session.leads.map((lead) => {
        return {
          lead,
          sessionId: session.id,
          sessionName: session.name,
          industry: lead.type?.trim() || null,
          recommendation: lead.recommendation || null,
        } satisfies LeadEntry;
      })
    );
  }, [sessions]);

  const filtersActive =
    industryFilter !== 'all' ||
    recommendationFilter !== 'all';

  const matchesFilters = (entry: LeadEntry) => {
    if (industryFilter !== 'all' && (entry.industry || 'Unknown') !== industryFilter) return false;
    if (
      recommendationFilter !== 'all' &&
      (entry.recommendation || 'No Recommendation') !== recommendationFilter
    )
      return false;
    return true;
  };

  const filteredLeadEntries = useMemo(
    () => leadEntries.filter(matchesFilters),
    [leadEntries, industryFilter, recommendationFilter]
  );

  const visibleSessionIds = useMemo(() => {
    if (!filtersActive) return new Set<string>(sessions.map((s) => s.id));
    return new Set(filteredLeadEntries.map((entry) => entry.sessionId));
  }, [filteredLeadEntries, filtersActive, sessions]);

  const visibleSessions = useMemo(() => sessions.filter((session) => visibleSessionIds.has(session.id)), [sessions, visibleSessionIds]);

  const industryOptions = useMemo(() => Array.from(new Set(leadEntries.map((entry) => entry.industry || 'Unknown'))).filter(Boolean), [leadEntries]);
  const recommendationOptions = useMemo(
    () => Array.from(new Set(leadEntries.map((entry) => entry.recommendation || 'No Recommendation'))).filter(Boolean),
    [leadEntries]
  );

  const handleExportFiltered = () => {
    const leadsToExport = filteredLeadEntries.map((entry) => entry.lead);
    if (leadsToExport.length === 0) {
      toast.error('No leads match the selected filters.');
      return;
    }
    const csvContent = createLeadsCsv(leadsToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lead-intel-filtered-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${leadsToExport.length} lead${leadsToExport.length === 1 ? '' : 's'}.`);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedId = localStorage.getItem(DASHBOARD_SESSION_STORAGE_KEY);
    if (!storedId) return;
    const exists = sessions.some((session) => session.id === storedId);
    if (exists) {
      setSelectedSessionId(storedId);
    }
  }, [sessions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedSessionId) {
      localStorage.setItem(DASHBOARD_SESSION_STORAGE_KEY, selectedSessionId);
    } else {
      localStorage.removeItem(DASHBOARD_SESSION_STORAGE_KEY);
    }
  }, [selectedSessionId]);

  if (selectedSession) {
    return (
      <div className="space-y-8">
        <button
          onClick={() => setSelectedSessionId(null)}
          className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors group cursor-pointer"
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
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Global Filters</span>
          {filtersActive && (
            <span className="px-3 py-1 text-[10px] font-black bg-blue-50 text-blue-600 rounded-full">
              {filteredLeadEntries.length} lead{filteredLeadEntries.length === 1 ? '' : 's'} match
            </span>
          )}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardSelect
              label="Industry"
              value={industryFilter}
              onChange={setIndustryFilter}
              options={industryOptions}
              placeholder="All Industries"
            />
            <DashboardSelect
              label="Recommendation"
              value={recommendationFilter}
              onChange={setRecommendationFilter}
              options={recommendationOptions}
              placeholder="All Recommendations"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <button
              onClick={() => {
                setIndustryFilter('all');
                setRecommendationFilter('all');
              }}
              className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] hover:text-blue-600 transition-colors"
            >
              Reset filters
            </button>
            <button
              type="button"
              onClick={handleExportFiltered}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export filtered
            </button>
          </div>
        </div>
      </div>
      {filtersActive ? (
        filteredLeadEntries.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Filtered Leads</div>
                <p className="text-sm text-slate-500 font-medium">Showing matches across all sessions</p>
              </div>
              <div className="text-sm font-black text-slate-700">
                {filteredLeadEntries.length} result{filteredLeadEntries.length === 1 ? '' : 's'}
              </div>
            </div>
            <LeadsList initialLeads={filteredLeadEntries.map((entry) => entry.lead)} />
          </div>
        ) : (
          <div className="py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 text-slate-200">
              <Hash size={40} />
            </div>
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No leads match these filters</h4>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">Try adjusting your filters or reset them to explore all sessions again.</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleSessions.map((session, i) => (
            <motion.div
               key={session.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               onClick={() => setSelectedSessionId(session.id)}
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

          {visibleSessions.length === 0 && (
            <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 text-slate-200">
                <Hash size={40} />
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No sessions match these filters</h4>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">Adjust your filters or reset them to view all sourcing sessions.</p>
            </div>
          )}

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
      )}
    </div>
  );
}

function DashboardSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-bold text-slate-600">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-semibold focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer"
      >
        <option value="all">{placeholder || `All ${label}`}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
