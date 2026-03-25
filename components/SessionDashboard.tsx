"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  MapPin,
  Hash,
  Calendar,
  FileText,
  ChevronLeft,
  Filter,
  Download,
  BarChart3,
  Package,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import LeadsList from "./LeadsList";
import { createLeadsCsv } from "./leads-list/createLeadsCsv";
import { toast } from "sonner";
import {
  collectExportableBatchIds,
  markBatchesExported,
} from "@/lib/leads/exportTracking";
import { calculateRate } from "@/lib/leads/insights";
import {
  summarizeBatchPerformance,
  summarizeCampaignPerformance,
  summarizeLeadPortfolio,
} from "@/lib/leads/portfolio";
import type { SessionWithLeadRelations } from "@/lib/leads/types";

const DASHBOARD_SESSION_STORAGE_KEY = "dashboard.selectedSessionId";

type LeadEntry = {
  lead: SessionWithLeadRelations["leads"][number];
  sessionId: string;
  sessionName: string;
  industry: string;
  companySize: string;
  revenueRange: string;
  campaignName: string;
  recommendation: string;
  verificationStatus: string;
};

function summarizeAnalytics(leads: Array<LeadEntry["lead"]>) {
  const totals = leads.reduce(
    (acc, lead) => {
      acc.sent += lead.sentCount;
      acc.opens += lead.openCount;
      acc.clicks += lead.clickCount;
      acc.responses += lead.responseCount;
      acc.bounces += lead.bounceCount;
      return acc;
    },
    { sent: 0, opens: 0, clicks: 0, responses: 0, bounces: 0 },
  );

  return {
    ...totals,
    openRate: calculateRate(totals.opens, totals.sent),
    clickRate: calculateRate(totals.clicks, totals.sent),
    responseRate: calculateRate(totals.responses, totals.sent),
    bounceRate: calculateRate(totals.bounces, totals.sent),
  };
}

export default function SessionDashboard({
  sessions,
}: {
  sessions: SessionWithLeadRelations[];
}) {
  const [storedSelectedSessionId, setStoredSelectedSessionId] = useState<
    string | null
  >(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(DASHBOARD_SESSION_STORAGE_KEY);
  });
  const [industryFilter, setIndustryFilter] = useState("all");
  const [recommendationFilter, setRecommendationFilter] = useState("all");
  const [companySizeFilter, setCompanySizeFilter] = useState("all");
  const [revenueFilter, setRevenueFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const selectedSessionId = useMemo(() => {
    if (!storedSelectedSessionId) return null;
    return sessions.some((session) => session.id === storedSelectedSessionId)
      ? storedSelectedSessionId
      : null;
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
        sessionName: session.name,
        industry: lead.company?.industry || lead.type?.trim() || "Unknown",
        companySize: lead.company?.companySize || "Unknown",
        revenueRange: lead.company?.revenueRange || "Unknown",
        campaignName: lead.campaign?.name || "Unassigned",
        recommendation: lead.recommendation || "No Recommendation",
        verificationStatus: lead.emailVerificationStatus || "UNVERIFIED",
      })),
    );
  }, [sessions]);

  const filtersActive =
    industryFilter !== "all" ||
    recommendationFilter !== "all" ||
    companySizeFilter !== "all" ||
    revenueFilter !== "all" ||
    campaignFilter !== "all" ||
    verificationFilter !== "all";

  const filteredLeadEntries = useMemo(() => {
    return leadEntries.filter((entry) => {
      if (industryFilter !== "all" && entry.industry !== industryFilter)
        return false;
      if (
        recommendationFilter !== "all" &&
        entry.recommendation !== recommendationFilter
      )
        return false;
      if (
        companySizeFilter !== "all" &&
        entry.companySize !== companySizeFilter
      )
        return false;
      if (revenueFilter !== "all" && entry.revenueRange !== revenueFilter)
        return false;
      if (campaignFilter !== "all" && entry.campaignName !== campaignFilter)
        return false;
      if (
        verificationFilter !== "all" &&
        entry.verificationStatus !== verificationFilter
      )
        return false;
      return true;
    });
  }, [
    campaignFilter,
    companySizeFilter,
    industryFilter,
    leadEntries,
    recommendationFilter,
    revenueFilter,
    verificationFilter,
  ]);

  const visibleSessionIds = useMemo(() => {
    if (!filtersActive) return new Set<string>(sessions.map((s) => s.id));
    return new Set(filteredLeadEntries.map((entry) => entry.sessionId));
  }, [filteredLeadEntries, filtersActive, sessions]);

  const visibleSessions = useMemo(
    () => sessions.filter((session) => visibleSessionIds.has(session.id)),
    [sessions, visibleSessionIds],
  );

  const industryOptions = useMemo(
    () =>
      Array.from(new Set(leadEntries.map((entry) => entry.industry))).filter(
        Boolean,
      ),
    [leadEntries],
  );
  const recommendationOptions = useMemo(
    () =>
      Array.from(
        new Set(leadEntries.map((entry) => entry.recommendation)),
      ).filter(Boolean),
    [leadEntries],
  );
  const companySizeOptions = useMemo(
    () =>
      Array.from(new Set(leadEntries.map((entry) => entry.companySize))).filter(
        Boolean,
      ),
    [leadEntries],
  );
  const revenueOptions = useMemo(
    () =>
      Array.from(
        new Set(leadEntries.map((entry) => entry.revenueRange)),
      ).filter(Boolean),
    [leadEntries],
  );
  const campaignOptions = useMemo(
    () =>
      Array.from(
        new Set(leadEntries.map((entry) => entry.campaignName)),
      ).filter(Boolean),
    [leadEntries],
  );
  const verificationOptions = useMemo(
    () =>
      Array.from(
        new Set(leadEntries.map((entry) => entry.verificationStatus)),
      ).filter(Boolean),
    [leadEntries],
  );

  const analyticsSummary = useMemo(
    () =>
      summarizeAnalytics(
        (filtersActive ? filteredLeadEntries : leadEntries).map(
          (entry) => entry.lead,
        ),
      ),
    [filteredLeadEntries, filtersActive, leadEntries],
  );
  const scopedLeads = useMemo(
    () =>
      (filtersActive ? filteredLeadEntries : leadEntries).map(
        (entry) => entry.lead,
      ),
    [filteredLeadEntries, filtersActive, leadEntries],
  );
  const portfolioSummary = useMemo(
    () => summarizeLeadPortfolio(scopedLeads),
    [scopedLeads],
  );
  const campaignPerformance = useMemo(
    () => summarizeCampaignPerformance(scopedLeads).slice(0, 6),
    [scopedLeads],
  );
  const batchPerformance = useMemo(
    () => summarizeBatchPerformance(scopedLeads).slice(0, 6),
    [scopedLeads],
  );

  const handleExportFiltered = async () => {
    const leadsToExport = filteredLeadEntries.map((entry) => entry.lead);
    if (leadsToExport.length === 0) {
      toast.error("No leads match the selected filters.");
      return;
    }
    const csvContent = createLeadsCsv(leadsToExport);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lead-intel-filtered-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      await markBatchesExported(collectExportableBatchIds(leadsToExport));
    } catch {}

    toast.success(
      `Exported ${leadsToExport.length} lead${leadsToExport.length === 1 ? "" : "s"}.`,
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedSessionId) {
      localStorage.setItem(DASHBOARD_SESSION_STORAGE_KEY, selectedSessionId);
    } else {
      localStorage.removeItem(DASHBOARD_SESSION_STORAGE_KEY);
    }
  }, [selectedSessionId]);

  if (selectedSession) {
    const selectedAnalytics = summarizeAnalytics(selectedSession.leads);
    const selectedPortfolio = summarizeLeadPortfolio(selectedSession.leads);
    const selectedCampaigns = summarizeCampaignPerformance(
      selectedSession.leads,
    ).slice(0, 6);
    const selectedBatches = summarizeBatchPerformance(
      selectedSession.leads,
    ).slice(0, 6);

    return (
      <div className="space-y-8">
        <button
          onClick={() => setStoredSelectedSessionId(null)}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 transition-colors hover:text-blue-600 group cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Sessions
        </button>

        <div className="space-y-6 rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-xl md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">
                Active Intelligence Session
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                {selectedSession.name}
              </h2>
            </div>
            <div className="flex rounded-[1.5rem] border border-slate-200 bg-slate-950 p-1.5 text-white shadow-lg shadow-slate-900/10">
              <div className="px-5 py-3 text-center border-r border-white/10">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Leads
                </div>
                <div className="text-lg font-black text-white">
                  {selectedSession.leads.length}
                </div>
              </div>
              <div className="px-5 py-3 text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Date
                </div>
                <div className="text-lg font-black text-white">
                  {new Date(selectedSession.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-500">
              <MapPin size={16} className="text-slate-300" />
              {selectedSession.location || "Global"}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-500">
              <Hash size={16} className="text-slate-300" />
              {selectedSession.target || "Custom Search"}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <AnalyticsCard
              label="Sent"
              value={selectedAnalytics.sent}
              accent="text-slate-900"
            />
            <AnalyticsCard
              label="Open Rate"
              value={`${selectedAnalytics.openRate}%`}
              accent="text-blue-600"
            />
            <AnalyticsCard
              label="Reply Rate"
              value={`${selectedAnalytics.responseRate}%`}
              accent="text-emerald-600"
            />
            <AnalyticsCard
              label="Bounce Rate"
              value={`${selectedAnalytics.bounceRate}%`}
              accent="text-rose-600"
            />
          </div>
        </div>

        <PortfolioOverview summary={selectedPortfolio} />
        <div className="grid gap-6 xl:grid-cols-2">
          <CampaignPerformancePanel campaigns={selectedCampaigns} />
          <BatchPerformancePanel batches={selectedBatches} />
        </div>

        <LeadsList initialLeads={selectedSession.leads} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
            Global Filters
          </span>
          {filtersActive && (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-600">
              {filteredLeadEntries.length} lead
              {filteredLeadEntries.length === 1 ? "" : "s"} match
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <DashboardSelect
            label="Company Size"
            value={companySizeFilter}
            onChange={setCompanySizeFilter}
            options={companySizeOptions}
            placeholder="All Sizes"
          />
          <DashboardSelect
            label="Revenue"
            value={revenueFilter}
            onChange={setRevenueFilter}
            options={revenueOptions}
            placeholder="All Revenue Bands"
          />
          <DashboardSelect
            label="Campaign"
            value={campaignFilter}
            onChange={setCampaignFilter}
            options={campaignOptions}
            placeholder="All Campaigns"
          />
          <DashboardSelect
            label="Verification"
            value={verificationFilter}
            onChange={setVerificationFilter}
            options={verificationOptions}
            placeholder="All Statuses"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <AnalyticsCard
            label="Sent"
            value={analyticsSummary.sent}
            accent="text-slate-900"
          />
          <AnalyticsCard
            label="Open Rate"
            value={`${analyticsSummary.openRate}%`}
            accent="text-blue-600"
          />
          <AnalyticsCard
            label="Reply Rate"
            value={`${analyticsSummary.responseRate}%`}
            accent="text-emerald-600"
          />
          <AnalyticsCard
            label="Bounce Rate"
            value={`${analyticsSummary.bounceRate}%`}
            accent="text-rose-600"
          />
        </div>

        <PortfolioOverview summary={portfolioSummary} />
        <div className="grid gap-6 xl:grid-cols-2">
          <CampaignPerformancePanel campaigns={campaignPerformance} />
          <BatchPerformancePanel batches={batchPerformance} />
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end">
          <button
            onClick={() => {
              setIndustryFilter("all");
              setRecommendationFilter("all");
              setCompanySizeFilter("all");
              setRevenueFilter("all");
              setCampaignFilter("all");
              setVerificationFilter("all");
            }}
            className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 transition-colors hover:text-blue-600"
          >
            Reset filters
          </button>
          <button
            type="button"
            onClick={handleExportFiltered}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            Export filtered
          </button>
        </div>
      </div>

      {filtersActive ? (
        filteredLeadEntries.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">
                  Filtered Leads
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Showing matches across all sessions
                </p>
              </div>
              <div className="text-sm font-black text-slate-700">
                {filteredLeadEntries.length} result
                {filteredLeadEntries.length === 1 ? "" : "s"}
              </div>
            </div>
            <LeadsList
              initialLeads={filteredLeadEntries.map((entry) => entry.lead)}
            />
          </div>
        ) : (
          <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 py-32 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-200 shadow-xl">
              <Hash size={40} />
            </div>
            <h4 className="mb-2 text-xl font-black tracking-tight text-slate-900">
              No leads match these filters
            </h4>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">
              Try adjusting your filters or reset them to explore all sessions
              again.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleSessions.map((session, i) => {
            const sessionAnalytics = summarizeAnalytics(session.leads);
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setStoredSelectedSessionId(session.id)}
                className="group relative cursor-pointer overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.3)] transition-all hover:-translate-y-2 hover:shadow-[0_24px_80px_-40px_rgba(15,23,42,0.38)] backdrop-blur-xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText size={120} />
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                      <Calendar size={24} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 line-clamp-1">
                      {session.name}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                      <MapPin size={14} />
                      {session.location || "Anywhere"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                        Reply Rate
                      </div>
                      <div className="mt-2 text-lg font-black text-emerald-600">
                        {sessionAnalytics.responseRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                        Bounce Rate
                      </div>
                      <div className="mt-2 text-lg font-black text-rose-600">
                        {sessionAnalytics.bounceRate}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-black text-slate-900">
                        {session.leads.length}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Qualified Leads
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {visibleSessions.length === 0 && (
            <div className="col-span-full rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 py-32 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-200 shadow-xl">
                <Hash size={40} />
              </div>
              <h4 className="mb-2 text-xl font-black tracking-tight text-slate-900">
                No sessions match these filters
              </h4>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">
                Adjust your filters or reset them to view all sourcing sessions.
              </p>
            </div>
          )}

          {sessions.length === 0 && (
            <div className="col-span-full rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 py-32 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-200 shadow-xl">
                <Hash size={40} />
              </div>
              <h4 className="mb-2 text-xl font-black tracking-tight text-slate-900">
                No Intelligence Sessions
              </h4>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">
                Launch your first scrape to start building your qualified lead
                pipeline.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnalyticsCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
        <BarChart3 className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`mt-3 text-3xl font-black tracking-tight ${accent}`}>
        {value}
      </div>
    </div>
  );
}

function PortfolioOverview({
  summary,
}: {
  summary: ReturnType<typeof summarizeLeadPortfolio>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OverviewCard
        icon={<Target className="h-4 w-4" />}
        label="Avg Quality"
        value={`${summary.avgQualityScore}%`}
        tone="text-indigo-600"
      />
      <OverviewCard
        icon={<ShieldCheck className="h-4 w-4" />}
        label="Verified Coverage"
        value={`${calculateRate(summary.verifiedCount, summary.totalLeads)}%`}
        tone="text-blue-600"
      />
      <OverviewCard
        icon={<Users className="h-4 w-4" />}
        label="Decision-Maker Coverage"
        value={`${calculateRate(summary.decisionMakerCount, summary.totalLeads)}%`}
        tone="text-emerald-600"
      />
      <OverviewCard
        icon={<Package className="h-4 w-4" />}
        label="Export Ready"
        value={summary.readyCount}
        tone="text-slate-900"
      />
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
        {icon}
        {label}
      </div>
      <div className={`mt-3 text-3xl font-black tracking-tight ${tone}`}>
        {value}
      </div>
    </div>
  );
}

function CampaignPerformancePanel({
  campaigns,
}: {
  campaigns: ReturnType<typeof summarizeCampaignPerformance>;
}) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">
            Campaign Performance
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Compare reply rate, bounce risk, and average quality by segment.
          </p>
        </div>
        <div className="text-sm font-black text-slate-700">
          {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <div
              key={campaign.name}
              className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {campaign.name}
                  </div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    {campaign.leadCount} leads · {campaign.readyCount} ready
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Avg Quality
                  </div>
                  <div className="mt-1 text-xl font-black text-indigo-600">
                    {campaign.avgQualityScore}%
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <MiniMetric
                  label="Reply"
                  value={`${campaign.responseRate}%`}
                  accent="text-emerald-600"
                />
                <MiniMetric
                  label="Bounce"
                  value={`${campaign.bounceRate}%`}
                  accent="text-rose-600"
                />
                <MiniMetric
                  label="Verified"
                  value={campaign.verifiedCount}
                  accent="text-blue-600"
                />
              </div>
            </div>
          ))
        ) : (
          <EmptyPanelMessage message="No campaign-level data yet." />
        )}
      </div>
    </div>
  );
}

function BatchPerformancePanel({
  batches,
}: {
  batches: ReturnType<typeof summarizeBatchPerformance>;
}) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600">
            Batch Control
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Watch which batches are ready, exported, or already in-flight.
          </p>
        </div>
        <div className="text-sm font-black text-slate-700">
          {batches.length} batch{batches.length === 1 ? "" : "es"}
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {batches.length > 0 ? (
          batches.map((batch) => (
            <div
              key={batch.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {batch.code}
                  </div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    {batch.leadCount} leads · {batch.readyCount} ready
                  </div>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                    batch.status === "ACTIVE"
                      ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                      : batch.status === "EXPORTED"
                        ? "border-blue-100 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {batch.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <MiniMetric
                  label="Avg Quality"
                  value={`${batch.avgQualityScore}%`}
                  accent="text-indigo-600"
                />
                <MiniMetric
                  label="Sent"
                  value={batch.sent}
                  accent="text-slate-900"
                />
                <MiniMetric
                  label="Reply"
                  value={`${batch.responseRate}%`}
                  accent="text-emerald-600"
                />
              </div>
              <div className="mt-3 text-xs font-semibold text-slate-500">
                {batch.lastActivityAt
                  ? `Last activity ${new Date(batch.lastActivityAt).toLocaleString()}`
                  : "No outreach activity logged yet."}
              </div>
            </div>
          ))
        ) : (
          <EmptyPanelMessage message="No batch-level data yet." />
        )}
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
        {label}
      </div>
      <div className={`mt-2 text-lg font-black ${accent}`}>{value}</div>
    </div>
  );
}

function EmptyPanelMessage({ message }: { message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm font-medium text-slate-500">
      {message}
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
      <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
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
