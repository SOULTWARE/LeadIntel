"use client";

import type { Lead } from "@prisma/client";
import { motion } from "framer-motion";
import { AlertCircle, Check, ChevronRight } from "lucide-react";

export function LeadsTable(props: {
  filteredLeads: Lead[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelectLead: (e: React.MouseEvent, id: string) => void;
  onOpenLead: (lead: Lead) => void;
}) {
  const {
    filteredLeads,
    selectedIds,
    onSelectAll,
    onToggleSelectLead,
    onOpenLead,
  } = props;

  return (
    <div className="table-frame">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="table-header">
              <th className="w-12 py-4 pl-5">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className={`flex h-5 w-5 items-center justify-center rounded-sm border transition-all ${
                    selectedIds.size === filteredLeads.length &&
                    filteredLeads.length > 0
                      ? "border-blue-700 bg-blue-700"
                      : "border-slate-300 bg-white hover:border-blue-400"
                  }`}
                >
                  {selectedIds.size === filteredLeads.length &&
                    filteredLeads.length > 0 && (
                      <Check className="h-3.5 w-3.5 stroke-[4] text-white" />
                    )}
                </button>
              </th>
              <th className="px-5 py-4 table-cell-label">Company</th>
              <th className="px-5 py-4 table-cell-label">Analysis</th>
              <th className="px-5 py-4 table-cell-label">Score</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredLeads.map((lead, i) => (
              <motion.tr
                key={lead.id}
                layoutId={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpenLead(lead)}
                className={`table-row group cursor-pointer ${selectedIds.has(lead.id) ? "bg-blue-50/60" : ""}`}
              >
                <td
                  className="w-12 py-5 pl-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => onToggleSelectLead(e, lead.id)}
                    className={`flex h-5 w-5 items-center justify-center rounded-sm border transition-all ${
                      selectedIds.has(lead.id)
                        ? "border-blue-700 bg-blue-700"
                        : "border-slate-300 bg-white group-hover:border-blue-400"
                    }`}
                  >
                    {selectedIds.has(lead.id) && (
                      <Check className="h-3.5 w-3.5 stroke-[4] text-white" />
                    )}
                  </button>
                </td>

                <td className="px-5 py-5">
                  <div className="text-base font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-blue-700">
                    {lead.name}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="chip-muted">
                      {lead.type || "Business"}
                    </span>
                    <span className="max-w-[240px] truncate text-xs text-slate-500">
                      {lead.address}
                    </span>
                  </div>
                </td>

                <td className="max-w-md px-5 py-5">
                  {lead.isEnhanced ? (
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase ${
                          lead.recommendation === "Highly Recommended"
                            ? "border-green-100 bg-green-50 text-green-700"
                            : lead.recommendation === "Recommended"
                              ? "border-blue-100 bg-blue-50 text-blue-700"
                              : "border-slate-100 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {lead.recommendation}
                      </div>
                      <p className="line-clamp-1 border-l border-slate-200 pl-4 text-xs italic text-slate-500">
                        &quot;{lead.reasoning}&quot;
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs italic font-medium text-slate-400">
                      No AI verification
                    </span>
                  )}
                </td>

                <td className="px-5 py-5">
                  {lead.isEnhanced ? (
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-xl font-semibold ${
                          (lead.compatibilityScore || 0) >= 80
                            ? "text-green-600"
                            : (lead.compatibilityScore || 0) >= 50
                              ? "text-blue-600"
                              : "text-slate-300"
                        }`}
                      >
                        {lead.compatibilityScore}%
                      </div>
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${(lead.compatibilityScore || 0) >= 80 ? "bg-green-500" : "bg-blue-600"}`}
                          style={{ width: `${lead.compatibilityScore}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="px-5 py-5 text-right">
                  <ChevronRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-700" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="bg-slate-50 py-20 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-300">
              <AlertCircle size={32} />
            </div>
            <h4 className="mb-2 text-lg font-semibold text-slate-900">
              No qualified leads found
            </h4>
            <p className="mx-auto max-w-xs text-sm text-slate-500">
              Try adjusting your filters or head back to the scraper for a new
              search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
