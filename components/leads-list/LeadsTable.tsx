"use client";

import { motion } from "framer-motion";
import { AlertCircle, Check, ChevronRight } from "lucide-react";
import { isLeadReadyForOutreach } from "@/lib/leads/portfolio";
import type { LeadWithRelations } from "@/lib/leads/types";

export function LeadsTable(props: {
  filteredLeads: LeadWithRelations[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelectLead: (e: React.MouseEvent, id: string) => void;
  onOpenLead: (lead: LeadWithRelations) => void;
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
                Campaign
              </th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Analysis
              </th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Quality
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
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">
                      {lead.company?.industry || lead.type || "Business"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {lead.company?.companySize || "Unknown size"}
                    </span>
                  </div>
                </td>

                <td className="px-8 py-8">
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-slate-700">
                      {lead.campaign?.name || "No campaign"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lead.segmentName && (
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-600">
                          {lead.segmentName}
                        </span>
                      )}
                      {lead.batch?.code && (
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                          {lead.batch.code}
                        </span>
                      )}
                      {lead.batch?.status && (
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${
                            lead.batch.status === "ACTIVE"
                              ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                              : lead.batch.status === "EXPORTED"
                                ? "border-blue-100 bg-blue-50 text-blue-600"
                                : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          {lead.batch.status}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="max-w-md px-8 py-8">
                  {lead.isEnhanced ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
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
                        {lead.primaryDecisionMakerRole && (
                          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-600">
                            {lead.primaryDecisionMakerRole}
                          </div>
                        )}
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
                  <div className="space-y-2">
                    <ScoreRow
                      label="Fit"
                      value={lead.compatibilityScore || 0}
                    />
                    <ScoreRow
                      label="Quality"
                      value={lead.qualityScore || 0}
                      accent="bg-indigo-500"
                    />
                    <div className="pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {isLeadReadyForOutreach(lead)
                        ? "Ready for batch export"
                        : lead.emailVerificationStatus === "VALID"
                          ? "Needs stronger role fit"
                          : "Needs verified contact"}
                    </div>
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

function ScoreRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  const toneClass =
    value >= 80
      ? "text-green-600"
      : value >= 50
        ? "text-blue-600"
        : "text-slate-300";
  const barClass = accent || (value >= 80 ? "bg-green-500" : "bg-blue-600");

  return (
    <div className="flex items-center gap-2">
      <div className="w-14 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className={`text-xl font-black ${toneClass}`}>{value}%</div>
      <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${barClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
