'use client';

import { Filter, Mail, Search, Check } from 'lucide-react';

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
  } = props;

  return (
    <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
      <div className="relative w-full md:w-96 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
        <input
          type="text"
          placeholder="Search leads by name or type..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={onToggleFilterMenu}
            className={`flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold transition-all shadow-sm cursor-pointer ${filterStatus !== 'all' ? 'text-blue-600 border-blue-200 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="w-4 h-4" />
            {filterStatus === 'all' ? 'Filters' : filterStatus}
          </button>

          {isFilterMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={onCloseFilterMenu} />
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden py-2 animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Recommendation</span>
                </div>
                {['all', 'Highly Recommended', 'Recommended', 'Potential'].map((status) => (
                  <button
                    key={status}
                    onClick={() => onSelectFilterStatus(status)}
                    className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center justify-between cursor-pointer ${filterStatus === status ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {filterStatus === status && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative" title="Coming soon: Email discovery launches next release.">
          <button
            type="button"
            onClick={onFindEmailsBatch}
            disabled
            aria-disabled="true"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all shadow-sm bg-white border border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
            {isFindingBatch ? 'Searching...' : `Find Email${selectedCount > 1 ? 's' : ''}`}
          </button>
        </div>

        <button
          onClick={onExport}
          disabled={selectedCount === 0}
          className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none cursor-pointer"
        >
          Export {selectedCount > 0 ? `(${selectedCount})` : 'Selected'}
        </button>
      </div>
    </div>
  );
}
