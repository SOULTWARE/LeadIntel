"use client";

import type { Lead } from "@prisma/client";
import { motion } from "framer-motion";
import { AlertCircle, Check, ChevronRight, Mail } from "lucide-react";

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
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="w-12 py-6 pl-8">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                    selectedIds.size === filteredLeads.length &&
                    filteredLeads.length > 0
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 bg-white hover:border-blue-400"
                  }`}
                >
                  {selectedIds.size === filteredLeads.length &&
                    filteredLeads.length > 0 && (
                      <Check className="h-3.5 w-3.5 stroke-[4] text-white" />
                    )}
                </button>
              </th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Company
              </th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Analysis
              </th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Score
              </th>
              <th className="px-8 py-6" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredLeads.map((lead, i) => (
              <motion.tr
                key={lead.id}
                layoutId={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpenLead(lead)}
                className={`group cursor-pointer transition-all duration-300 hover:bg-blue-50/40 ${selectedIds.has(lead.id) ? "bg-blue-50/50" : ""}`}
              >
                <td
                  className="w-12 py-8 pl-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => onToggleSelectLead(e, lead.id)}
                    className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                      selectedIds.has(lead.id)
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300 bg-white group-hover:border-blue-400"
                    }`}
                  >
                    {selectedIds.has(lead.id) && (
                      <Check className="h-3.5 w-3.5 stroke-[4] text-white" />
                    )}
                  </button>
                </td>

                <td className="px-8 py-8">
                  <div className="text-base font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
                    {lead.name}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">
                      {lead.type || "Business"}
                    </span>
                    <span className="max-w-[200px] truncate text-xs text-slate-400">
                      {lead.address}
                    </span>
                  </div>
                </td>

                <td className="max-w-md px-8 py-8">
                  {lead.isEnhanced ? (
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase ${
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

                <td className="px-8 py-8">
                  <div className="flex items-center gap-3">
                    {lead.isEnhanced ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-xl font-black ${
                            (lead.compatibilityScore || 0) >= 80
                              ? "text-green-600"
                              : (lead.compatibilityScore || 0) >= 50
                                ? "text-blue-600"
                                : "text-slate-300"
                          }`}
                        >
                          {lead.compatibilityScore}%
                        </div>
                        <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full ${(lead.compatibilityScore || 0) >= 80 ? "bg-green-500" : "bg-blue-600"}`}
                            style={{ width: `${lead.compatibilityScore}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-slate-400">
                        -
                      </span>
                    )}

                    {lead.email ? (
                      <span
                        title={`Email found: ${lead.email}`}
                        aria-label={`Email available for ${lead.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </td>

                <td className="px-8 py-8 text-right">
                  <ChevronRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-600" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="bg-slate-50/50 py-32 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-300 shadow-inner">
              <AlertCircle size={32} />
            </div>
            <h4 className="mb-2 text-lg font-bold text-slate-900">
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
