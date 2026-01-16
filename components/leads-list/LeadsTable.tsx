'use client';

import type { Lead } from '@prisma/client';
import { motion } from 'framer-motion';
import { AlertCircle, Check, ChevronRight } from 'lucide-react';

export function LeadsTable(props: {
  filteredLeads: Lead[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelectLead: (e: React.MouseEvent, id: string) => void;
  onOpenLead: (lead: Lead) => void;
}) {
  const { filteredLeads, selectedIds, onSelectAll, onToggleSelectLead, onOpenLead } = props;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="pl-8 py-6 w-12">
                <div
                  onClick={onSelectAll}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                    selectedIds.size === filteredLeads.length && filteredLeads.length > 0
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {selectedIds.size === filteredLeads.length && filteredLeads.length > 0 && (
                    <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
                  )}
                </div>
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Company</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Analysis</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</th>
              <th className="px-8 py-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.map((lead, i) => (
              <motion.tr
                layoutId={lead.id}
                onClick={() => onOpenLead(lead)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={lead.id}
                className={`group hover:bg-blue-50/40 cursor-pointer transition-all duration-300 ${selectedIds.has(lead.id) ? 'bg-blue-50/60' : ''}`}
              >
                <td className="pl-8 py-8 w-12" onClick={(e) => e.stopPropagation()}>
                  <div
                    onClick={(e) => onToggleSelectLead(e, lead.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedIds.has(lead.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-slate-300 group-hover:border-blue-400'
                    }`}
                  >
                    {selectedIds.has(lead.id) && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                  </div>
                </td>
                <td className="px-8 py-8">
                  <div className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                    {lead.name}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-full">
                      {lead.type || 'Business'}
                    </span>
                    <span className="text-xs text-slate-400 truncate max-w-[200px]">{lead.address}</span>
                  </div>
                </td>
                <td className="px-8 py-8 max-w-md">
                  {lead.isEnhanced ? (
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                          lead.recommendation === 'Highly Recommended'
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : lead.recommendation === 'Recommended'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}
                      >
                        {lead.recommendation}
                      </div>
                      <p className="text-xs text-slate-500 italic line-clamp-1 border-l border-slate-200 pl-4">
                        &quot;{lead.reasoning}&quot;
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic font-medium">No AI verification</span>
                  )}
                </td>
                <td className="px-8 py-8">
                  {lead.isEnhanced ? (
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-xl font-black ${
                          (lead.compatibilityScore || 0) >= 80
                            ? 'text-green-600'
                            : (lead.compatibilityScore || 0) >= 50
                              ? 'text-blue-600'
                              : 'text-slate-300'
                        }`}
                      >
                        {lead.compatibilityScore}%
                      </div>
                      <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${(lead.compatibilityScore || 0) >= 80 ? 'bg-green-500' : 'bg-blue-600'}`}
                          style={{ width: `${lead.compatibilityScore}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-8 py-8 text-right">
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
          <div className="py-32 text-center bg-slate-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100 text-slate-300">
              <AlertCircle size={32} />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">No qualified leads found</h4>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Try adjusting your filters or head back to the scraper for a new search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
