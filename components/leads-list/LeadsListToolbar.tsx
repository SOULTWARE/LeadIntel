'use client';

import { Filter, Mail, Search, Check, Sparkles } from 'lucide-react';

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
  leadPurpose: string;
  onLeadPurposeChange: (value: string) => void;
  onEnhanceSelected: () => void;
  isEnhancing: boolean;
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
    leadPurpose,
    onLeadPurposeChange,
    onEnhanceSelected,
    isEnhancing,
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
              className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-5 py-4 text-sm font-black transition-all ${filterStatus !== 'all' ? 'border-blue-200 bg-blue-50 text-blue-600 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50'}`}
            >
              <Filter className="w-4 h-4" />
              {filterStatus === 'all' ? 'Filters' : filterStatus}
            </button>

            {isFilterMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={onCloseFilterMenu} />
                <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 py-2 shadow-2xl shadow-slate-200/50 backdrop-blur-xl animate-in fade-in zoom-in duration-200">
                  <div className="mb-2 border-b border-slate-100 px-4 py-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter by Recommendation</span>
                  </div>
                  {['all', 'Highly Recommended', 'Recommended', 'Potential'].map((status) => (
                    <button
                      key={status}
                      onClick={() => onSelectFilterStatus(status)}
                      className={`flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left text-sm font-bold transition-colors ${filterStatus === status ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
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
                  ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 cursor-pointer'
                  : 'border-slate-200 bg-white text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <Mail className="w-4 h-4" />
              {isFindingBatch ? 'Searching...' : `Find Email${selectedCount > 1 ? 's' : ''}`}
            </button>
          </div>

          <button
            onClick={onExport}
            disabled={selectedCount === 0}
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export {selectedCount > 0 ? `(${selectedCount})` : 'Selected'}
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1 w-full">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Contact Purpose</label>
            <textarea
              value={leadPurpose}
              onChange={(e) => onLeadPurposeChange(e.target.value)}
              placeholder="Describe why you're contacting these leads..."
              rows={2}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <button
            type="button"
            onClick={onEnhanceSelected}
            disabled={selectedCount === 0 || isEnhancing}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-200 transition-transform hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <Sparkles className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
            {isEnhancing ? 'Enhancing…' : `AI Enhance (${selectedCount})`}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          AI Enhance enriches selected leads with compatibility scores, hooks, and messaging insights using the provided contact purpose.
        </p>
      </div>
    </div>
  );
}
