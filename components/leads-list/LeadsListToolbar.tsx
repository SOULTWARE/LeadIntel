"use client";

import {
  Filter,
  Mail,
  Search,
  Check,
  Sparkles,
  PackagePlus,
} from "lucide-react";
import type { StrictnessProfile } from "@/lib/leads/portfolio";

type FilterStatus = string;

export function LeadsListToolbar(props: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterStatus: FilterStatus;
  isFilterMenuOpen: boolean;
  onToggleFilterMenu: () => void;
  onCloseFilterMenu: () => void;
  onSelectFilterStatus: (status: FilterStatus) => void;
  selectedCount: number;
  isFindingBatch: boolean;
  onFindEmailsBatch: () => void;
  onExport: () => void;
  isBuildingBatches: boolean;
  onBuildBatches: () => void;
  leadPurpose: string;
  onLeadPurposeChange: (value: string) => void;
  onEnhanceSelected: () => void;
  isEnhancing: boolean;
  qualityFloor: number;
  onQualityFloorChange: (value: number) => void;
  qualityStrictness: number;
  onQualityStrictnessChange: (value: number) => void;
  totalLeadCount: number;
  visibleLeadCount: number;
  readyLeadCount: number;
  verifiedLeadCount: number;
  decisionMakerCount: number;
  strictnessProfile: StrictnessProfile;
  guidance: string;
  batchSize: number;
  onBatchSizeChange: (value: number) => void;
  requireVerified: boolean;
  onRequireVerifiedChange: (value: boolean) => void;
  requireDecisionMaker: boolean;
  onRequireDecisionMakerChange: (value: boolean) => void;
  requireWarmup: boolean;
  onRequireWarmupChange: (value: boolean) => void;
  batchPreviewLeadCount: number;
  batchPreviewBatchCount: number;
  batchPreviewSkippedCount: number;
}) {
  const {
    searchQuery,
    onSearchQueryChange,
    filterStatus,
    isFilterMenuOpen,
    onToggleFilterMenu,
    onCloseFilterMenu,
    onSelectFilterStatus,
    selectedCount,
    isFindingBatch,
    onFindEmailsBatch,
    onExport,
    isBuildingBatches,
    onBuildBatches,
    leadPurpose,
    onLeadPurposeChange,
    onEnhanceSelected,
    isEnhancing,
    qualityFloor,
    onQualityFloorChange,
    qualityStrictness,
    onQualityStrictnessChange,
    totalLeadCount,
    visibleLeadCount,
    readyLeadCount,
    verifiedLeadCount,
    decisionMakerCount,
    strictnessProfile,
    guidance,
    batchSize,
    onBatchSizeChange,
    requireVerified,
    onRequireVerifiedChange,
    requireDecisionMaker,
    onRequireDecisionMakerChange,
    requireWarmup,
    onRequireWarmupChange,
    batchPreviewLeadCount,
    batchPreviewBatchCount,
    batchPreviewSkippedCount,
  } = props;

  return (
    <div className="mb-8 space-y-5 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur-xl md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Search leads by name or type..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white/90 py-4 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={onToggleFilterMenu}
              className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-5 py-4 text-sm font-black transition-all ${filterStatus !== "all" ? "border-blue-200 bg-blue-50 text-blue-600 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"}`}
            >
              <Filter className="w-4 h-4" />
              {filterStatus === "all" ? "Filters" : filterStatus}
            </button>

            {isFilterMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={onCloseFilterMenu}
                />
                <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 py-2 shadow-2xl shadow-slate-200/50 backdrop-blur-xl animate-in fade-in zoom-in duration-200">
                  <div className="mb-2 border-b border-slate-100 px-4 py-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Filter by Recommendation
                    </span>
                  </div>
                  {[
                    "all",
                    "Highly Recommended",
                    "Recommended",
                    "Neutral",
                    "Not Recommended",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => onSelectFilterStatus(status)}
                      className={`flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left text-sm font-bold transition-colors ${filterStatus === status ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                      {filterStatus === status && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={onFindEmailsBatch}
              disabled={selectedCount === 0 || isFindingBatch}
              className={`flex items-center gap-2 rounded-2xl border px-5 py-4 text-sm font-black transition-all ${
                selectedCount > 0 && !isFindingBatch
                  ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 cursor-pointer"
                  : "border-slate-200 bg-white text-slate-400 opacity-60 cursor-not-allowed"
              }`}
            >
              <Mail className="w-4 h-4" />
              {isFindingBatch
                ? "Searching..."
                : `Find Email${selectedCount > 1 ? "s" : ""}`}
            </button>
          </div>

          <button
            onClick={onExport}
            disabled={selectedCount === 0}
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export {selectedCount > 0 ? `(${selectedCount})` : "Selected"}
          </button>

          <button
            type="button"
            onClick={onBuildBatches}
            disabled={selectedCount === 0 || isBuildingBatches}
            className={`flex items-center gap-2 rounded-2xl border px-5 py-4 text-sm font-black transition-all ${
              selectedCount > 0 && !isBuildingBatches
                ? "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm hover:-translate-y-0.5 cursor-pointer"
                : "border-slate-200 bg-white text-slate-400 opacity-60 cursor-not-allowed"
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            {isBuildingBatches ? "Building..." : "Build Batches"}
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr_auto] lg:items-center">
          <div className="flex-1 w-full">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
              Contact Purpose
            </label>
            <textarea
              value={leadPurpose}
              onChange={(e) => onLeadPurposeChange(e.target.value)}
              placeholder="Describe why you're contacting these leads..."
              rows={2}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <label className="flex flex-col gap-2 text-sm font-bold text-slate-600">
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                Quality Floor
              </span>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={qualityFloor}
                  onChange={(e) => onQualityFloorChange(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="mt-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
                  {qualityFloor}% minimum
                </div>
              </div>
            </label>
            <label className="flex flex-col gap-2 text-sm font-bold text-slate-600">
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                Strictness
              </span>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={5}
                  value={qualityStrictness}
                  onChange={(e) =>
                    onQualityStrictnessChange(Number(e.target.value))
                  }
                  className="w-full accent-indigo-600"
                />
                <div className="mt-2 text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
                  {qualityStrictness}% AI rigor
                </div>
              </div>
            </label>
          </div>
          <button
            type="button"
            onClick={onEnhanceSelected}
            disabled={selectedCount === 0 || isEnhancing}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-200 transition-transform hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <Sparkles
              className={`w-4 h-4 ${isEnhancing ? "animate-spin" : ""}`}
            />
            {isEnhancing ? "Enhancing…" : `AI Enhance (${selectedCount})`}
          </button>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                Volume vs Quality
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${strictnessProfile.tone}`}
              >
                {strictnessProfile.label}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {strictnessProfile.description}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{guidance}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ToolbarStat
              label="Visible"
              value={`${visibleLeadCount}/${totalLeadCount}`}
              tone="text-slate-900"
            />
            <ToolbarStat
              label="Ready"
              value={readyLeadCount}
              tone="text-emerald-600"
            />
            <ToolbarStat
              label="Verified"
              value={verifiedLeadCount}
              tone="text-blue-600"
            />
            <ToolbarStat
              label="Decision-Makers"
              value={decisionMakerCount}
              tone="text-indigo-600"
            />
          </div>
        </div>
        <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                Controlled Batching
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Build small send-ready batches from the current selection.
              </p>
              <p className="text-xs leading-5 text-slate-500">
                {batchPreviewLeadCount} selected lead
                {batchPreviewLeadCount === 1 ? "" : "s"} qualify for{" "}
                {batchPreviewBatchCount} batch
                {batchPreviewBatchCount === 1 ? "" : "es"}.
                {batchPreviewSkippedCount > 0
                  ? ` ${batchPreviewSkippedCount} will be skipped by the current rules.`
                  : " No selected leads are blocked by the current rules."}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-[180px_1fr] xl:min-w-[520px]">
              <label className="flex flex-col gap-2 text-sm font-bold text-slate-600">
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                  Batch Size
                </span>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={batchSize}
                    onChange={(e) => onBatchSizeChange(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
                    {batchSize} leads max
                  </div>
                </div>
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <RuleToggle
                  label="Verified only"
                  active={requireVerified}
                  onClick={() => onRequireVerifiedChange(!requireVerified)}
                />
                <RuleToggle
                  label="Decision-makers"
                  active={requireDecisionMaker}
                  onClick={() =>
                    onRequireDecisionMakerChange(!requireDecisionMaker)
                  }
                />
                <RuleToggle
                  label="Warm leads"
                  active={requireWarmup}
                  onClick={() => onRequireWarmupChange(!requireWarmup)}
                />
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          AI Enhance estimates firmographics, likely decision-maker roles, and
          warm-up suggestions in addition to compatibility scoring.
        </p>
      </div>
    </div>
  );
}

function ToolbarStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-black tracking-tight ${tone}`}>
        {value}
      </div>
    </div>
  );
}

function RuleToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.5rem] border px-4 py-4 text-left transition-colors ${
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/50"
      }`}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.25em]">
        Rule
      </div>
      <div className="mt-2 text-sm font-black">{label}</div>
      <div className="mt-1 text-xs font-semibold">
        {active ? "Required" : "Optional"}
      </div>
    </button>
  );
}
