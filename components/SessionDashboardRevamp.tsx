'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Hash,
  MapPin,
} from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { toast } from 'sonner';

import LeadsList from './LeadsList';
import { createLeadsCsv } from './leads-list/createLeadsCsv';

type SessionWithLeads = Prisma.SessionGetPayload<{ include: { leads: true } }>;

const DASHBOARD_SESSION_STORAGE_KEY = 'dashboard.selectedSessionId';

type LeadEntry = {
  lead: SessionWithLeads['leads'][number];
  sessionId: string;
  industry: string | null;
  recommendation: string | null;
};

type DashboardSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
};

function DashboardSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: DashboardSelectProps) {
  return (
    <label className="space-y-2">
      <span className="section-label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field-select">
        <option value="all">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SessionDashboardRevamp({ sessions }: { sessions: SessionWithLeads[] }) {
  const [storedSelectedSessionId, setStoredSelectedSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(DASHBOARD_SESSION_STORAGE_KEY);
  });
  const [industryFilter, setIndustryFilter] = useState('all');
  const [recommendationFilter, setRecommendationFilter] = useState('all');

  const selectedSessionId = useMemo(() => {
    if (!storedSelectedSessionId) return null;
    return sessions.some((session) => session.id === storedSelectedSessionId) ? storedSelectedSessionId : null;
  }, [sessions, storedSelectedSessionId]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((session) => session.id === selectedSessionId) ?? null;
  }, [selectedSessionId, sessions]);

  const leadEntries = useMemo<LeadEntry[]>(() => {
    return sessions.flatMap((session) =>
      session.leads.map((lead) => ({
        lead,
        sessionId: session.id,
        industry: lead.type?.trim() || null,
        recommendation: lead.recommendation || null,
      })),
    );
  }, [sessions]);

  const filtersActive = industryFilter !== 'all' || recommendationFilter !== 'all';

  const filteredLeadEntries = useMemo(() => {
    return leadEntries.filter((entry) => {
      if (industryFilter !== 'all' && (entry.industry || 'Unknown') !== industryFilter) return false;
      if (recommendationFilter !== 'all' && (entry.recommendation || 'No Recommendation') !== recommendationFilter) {
        return false;
      }
      return true;
    });
  }, [leadEntries, industryFilter, recommendationFilter]);

  const visibleSessionIds = useMemo(() => {
    if (!filtersActive) return new Set<string>(sessions.map((session) => session.id));
    return new Set(filteredLeadEntries.map((entry) => entry.sessionId));
  }, [filteredLeadEntries, filtersActive, sessions]);

  const visibleSessions = useMemo(
    () => sessions.filter((session) => visibleSessionIds.has(session.id)),
    [sessions, visibleSessionIds],
  );

  const industryOptions = useMemo(
    () => Array.from(new Set(leadEntries.map((entry) => entry.industry || 'Unknown'))).filter(Boolean),
    [leadEntries],
  );
  const recommendationOptions = useMemo(
    () => Array.from(new Set(leadEntries.map((entry) => entry.recommendation || 'No Recommendation'))).filter(Boolean),
    [leadEntries],
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
    if (selectedSessionId) {
      localStorage.setItem(DASHBOARD_SESSION_STORAGE_KEY, selectedSessionId);
    } else {
      localStorage.removeItem(DASHBOARD_SESSION_STORAGE_KEY);
    }
  }, [selectedSessionId]);

  if (selectedSession) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setStoredSelectedSessionId(null)} className="btn-ghost justify-start px-0">
          <ChevronLeft className="h-4 w-4" />
          Back to sessions
        </button>

        <section className="surface space-y-6 p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="eyebrow">Active session</div>
              <div>
                <h2 className="section-title">{selectedSession.name}</h2>
                <p className="section-copy mt-2 max-w-3xl">
                  Use the table below to review saved leads, inspect details, trigger email discovery, run AI enhancement,
                  and export the subset you want to work next.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="surface-muted p-4">
                <div className="section-label">Leads</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{selectedSession.leads.length}</div>
              </div>
              <div className="surface-muted p-4">
                <div className="section-label">Created</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">
                  {new Date(selectedSession.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-200 pt-6 md:grid-cols-2">
            <div className="surface-muted p-4">
              <div className="section-label">Location</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin size={16} className="text-slate-400" />
                {selectedSession.location || 'Global'}
              </div>
            </div>
            <div className="surface-muted p-4">
              <div className="section-label">Target</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Hash size={16} className="text-slate-400" />
                {selectedSession.target || 'Custom Search'}
              </div>
            </div>
          </div>
        </section>

        <LeadsList initialLeads={selectedSession.leads} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-4 p-5 lg:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="eyebrow">
            <Filter className="h-4 w-4" />
            Global filters
          </div>
          {filtersActive && (
            <span className="chip-accent">
              {filteredLeadEntries.length} lead{filteredLeadEntries.length === 1 ? '' : 's'} match
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DashboardSelect
              label="Industry"
              value={industryFilter}
              onChange={setIndustryFilter}
              options={industryOptions}
              placeholder="All industries"
            />
            <DashboardSelect
              label="Recommendation"
              value={recommendationFilter}
              onChange={setRecommendationFilter}
              options={recommendationOptions}
              placeholder="All recommendations"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIndustryFilter('all');
                setRecommendationFilter('all');
              }}
              className="btn-ghost"
            >
              Reset filters
            </button>
            <button type="button" onClick={handleExportFiltered} className="btn-primary">
              <Download className="h-4 w-4" />
              Export filtered
            </button>
          </div>
        </div>
      </section>

      {filtersActive ? (
        filteredLeadEntries.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="section-label text-blue-700">Filtered leads</div>
                <p className="text-sm text-slate-600">Showing matches across all saved sessions.</p>
              </div>
              <div className="text-sm font-semibold text-slate-700">
                {filteredLeadEntries.length} result{filteredLeadEntries.length === 1 ? '' : 's'}
              </div>
            </div>
            <LeadsList initialLeads={filteredLeadEntries.map((entry) => entry.lead)} />
          </section>
        ) : (
          <div className="surface-inset py-20 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-300">
              <Hash size={32} />
            </div>
            <h4 className="mb-2 text-xl font-semibold tracking-tight text-slate-900">No leads match these filters</h4>
            <p className="mx-auto max-w-xs text-sm text-slate-500">
              Adjust the current filters or reset them to view all saved sessions again.
            </p>
          </div>
        )
      ) : visibleSessions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleSessions.map((session, index) => (
            <motion.button
              key={session.id}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => setStoredSelectedSessionId(session.id)}
              className="surface group cursor-pointer p-5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-blue-700">
                    <Calendar size={22} />
                  </div>
                  <div className="section-label">{new Date(session.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="space-y-3">
                  <div className="section-label text-blue-700">Session #{index + 1}</div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-blue-700">
                    {session.name}
                  </h3>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    {session.location || 'Global'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-slate-400" />
                    {session.target || 'Custom Search'}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-semibold tracking-tight text-slate-950">{session.leads.length}</div>
                    <div className="section-label">leads</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors group-hover:text-blue-700">
                    Open
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="surface-inset py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-300">
            <FileText size={32} />
          </div>
          <h4 className="mb-2 text-xl font-semibold tracking-tight text-slate-900">No saved sessions yet</h4>
          <p className="mx-auto max-w-xs text-sm text-slate-500">
            Start a new sourcing search to create the first session in this workspace.
          </p>
        </div>
      )}
    </div>
  );
}
