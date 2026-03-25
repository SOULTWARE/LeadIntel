"use client";

import { Mail, Search, Sparkles } from "lucide-react";

type FilterStatus = string;

export function LeadsListToolbar(props: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterStatus: FilterStatus;
  onSelectFilterStatus: (status: FilterStatus) => void;
  selectedCount: number;
  isFindingBatch: boolean;
  onFindEmailsBatch: () => void;
  onExport: () => void;
  leadPurpose: string;
  onLeadPurposeChange: (value: string) => void;
  onEnhanceSelected: () => void;
  isEnhancing: boolean;
}) {
  const {
    searchQuery,
    onSearchQueryChange,
    filterStatus,
    onSelectFilterStatus,
    selectedCount,
    isFindingBatch,
    onFindEmailsBatch,
    onExport,
    leadPurpose,
    onLeadPurposeChange,
    onEnhanceSelected,
    isEnhancing,
  } = props;

  return (
    <div className="surface space-y-5 p-5 lg:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_220px] xl:flex-1">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, type, or address"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="field-input pl-10"
            />
          </div>

          <label className="space-y-2">
            <span className="section-label">Recommendation</span>
            <select
              value={filterStatus}
              onChange={(event) => onSelectFilterStatus(event.target.value)}
              className="field-select"
            >
              <option value="all">All recommendations</option>
              <option value="Highly Recommended">Highly Recommended</option>
              <option value="Recommended">Recommended</option>
              <option value="Potential">Potential</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <span className="chip-muted">{selectedCount} selected</span>
          <button
            type="button"
            onClick={onFindEmailsBatch}
            disabled={selectedCount === 0 || isFindingBatch}
            className="btn-secondary"
          >
            <Mail className="h-4 w-4" />
            {isFindingBatch
              ? "Searching..."
              : `Find Email${selectedCount > 1 ? "s" : ""}`}
          </button>
          <button
            onClick={onExport}
            disabled={selectedCount === 0}
            className="btn-primary"
          >
            Export {selectedCount > 0 ? `(${selectedCount})` : "Selected"}
          </button>
        </div>
      </div>

      <div className="surface-muted space-y-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-2">
            <div className="section-label">Contact purpose</div>
            <textarea
              value={leadPurpose}
              onChange={(e) => onLeadPurposeChange(e.target.value)}
              placeholder="Describe the problem you want the AI to evaluate against this lead set."
              rows={3}
              className="field-textarea min-h-24"
            />
            <p className="field-hint">
              AI Enhance scores fit, identifies pain points, and drafts hooks
              using this prompt as the qualification brief.
            </p>
          </div>

          <div className="grid gap-3 lg:w-56">
            <button
              type="button"
              onClick={onEnhanceSelected}
              disabled={selectedCount === 0 || isEnhancing}
              className="btn-accent justify-center"
            >
              <Sparkles
                className={`h-4 w-4 ${isEnhancing ? "animate-spin" : ""}`}
              />
              {isEnhancing ? "Enhancing..." : `AI Enhance (${selectedCount})`}
            </button>
            <div className="surface border-slate-200 bg-white p-4">
              <div className="section-label">Workflow</div>
              <p className="mt-2 text-sm text-slate-600">
                Search to selection to enrichment to contact discovery to
                export.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
