'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ExternalLink,
  Phone,
  Globe,
  X,
  Sparkles,
  AlertCircle,
  BarChart3,
  Search,
  Filter,
  Mail,
  Copy,
  Check,
  Send,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeadsList({ initialLeads }: { initialLeads: any[] }) {
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [isFindingBatch, setIsFindingBatch] = useState(false);

  const handleFindEmailsBatch = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select leads to find emails for");
      return;
    }

    setIsFindingBatch(true);
    const leadIds = Array.from(selectedIds);

    try {
      const response = await fetch('/api/leads/find-emails-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds }),
      });

      const data = await response.json();

      if (data.success) {
        const foundCount = data.results.filter((r: any) => r.success).length;
        toast.success(`Discovery finished: Found ${foundCount} emails.`);
        toast.info("Refresh to see updated contacts.");
      } else {
        toast.error(data.error || "Batch discovery failed.");
      }
    } catch (error) {
      toast.error("Error during batch discovery.");
    } finally {
      setIsFindingBatch(false);
    }
  };

  const generateEmail = async (lead: any) => {
    setIsGeneratingEmail(true);
    setEmailDraft(null);
    try {
      const response = await fetch('/api/generate/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, leadPurpose: lead.searchQuery || '' }),
      });
      const data = await response.json();
      if (data.subject && data.body) {
        setEmailDraft(data);
        toast.success("Personalized draft ready!");
      } else {
        toast.error("Failed to generate draft.");
      }
    } catch (error) {
      toast.error("Error generating email.");
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const copyToClipboard = () => {
    if (!emailDraft) return;
    const text = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredLeads = initialLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || lead.recommendation === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelectLead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = () => {
    const leadsToExport = initialLeads.filter(l => selectedIds.has(l.id));
    if (leadsToExport.length === 0) {
      toast.error("Please select leads to export");
      return;
    }

    const headers = ["Name", "Type", "Address", "Phone", "Website", "Recommendation", "Compatibility Score", "Reasoning", "Email"];
    const csvContent = [
      headers.join(","),
      ...leadsToExport.map(l => [
        `"${l.name}"`,
        `"${l.type || ''}"`,
        `"${l.address || ''}"`,
        `"${l.phone || ''}"`,
        `"${l.website || ''}"`,
        `"${l.recommendation || ''}"`,
        `${l.compatibilityScore || 0}%`,
        `"${l.reasoning?.replace(/"/g, '""') || ''}"`,
        `"${l.email || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `lead-intel-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${leadsToExport.length} leads`);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Search leads by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
             <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold transition-all shadow-sm ${filterStatus !== 'all' ? 'text-blue-600 border-blue-200 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               <Filter className="w-4 h-4" />
               {filterStatus === 'all' ? 'Filters' : filterStatus}
             </button>

             {isFilterMenuOpen && (
               <>
                 <div className="fixed inset-0 z-10" onClick={() => setIsFilterMenuOpen(false)} />
                 <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden py-2 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 mb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Recommendation</span>
                    </div>
                    {['all', 'Highly Recommended', 'Recommended', 'Potential'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status);
                          setIsFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center justify-between ${filterStatus === status ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {filterStatus === status && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                 </div>
               </>
             )}
           </div>

           <button
             onClick={handleFindEmailsBatch}
             disabled={selectedIds.size === 0 || isFindingBatch}
             className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all shadow-sm ${
               selectedIds.size > 0
                 ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
                 : 'bg-white border border-slate-200 text-slate-400 opacity-50'
             }`}
            >
              <Mail className="w-4 h-4" />
              {isFindingBatch ? 'Searching...' : `Find Email${selectedIds.size > 1 ? 's' : ''}`}
            </button>

           <button
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none"
           >
             Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'Selected'}
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="pl-8 py-6 w-12">
                  <div
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                      selectedIds.size === filteredLeads.length && filteredLeads.length > 0
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {selectedIds.size === filteredLeads.length && filteredLeads.length > 0 && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
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
                  onClick={() => setSelectedLead(lead)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={lead.id}
                  className={`group hover:bg-blue-50/40 cursor-pointer transition-all duration-300 ${selectedIds.has(lead.id) ? 'bg-blue-50/60' : ''}`}
                >
                  <td className="pl-8 py-8 w-12" onClick={(e) => e.stopPropagation()}>
                    <div
                      onClick={(e) => toggleSelectLead(e, lead.id)}
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
                    <div className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors uppercase tracking-tight">{lead.name}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                       <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-full">{lead.type || 'Business'}</span>
                       <span className="text-xs text-slate-400 truncate max-w-[200px]">{lead.address}</span>
                    </div>
                  </td>
                  <td className="px-8 py-8 max-w-md">
                    {lead.isEnhanced ? (
                       <div className="flex items-center gap-4">
                         <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                            lead.recommendation === 'Highly Recommended' ? 'bg-green-50 text-green-700 border-green-100' :
                            lead.recommendation === 'Recommended' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {lead.recommendation}
                         </div>
                         <p className="text-xs text-slate-500 italic line-clamp-1 border-l border-slate-200 pl-4">
                           "{lead.reasoning}"
                         </p>
                       </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">No AI verification</span>
                    )}
                  </td>
                  <td className="px-8 py-8">
                     {lead.isEnhanced ? (
                       <div className="flex items-center gap-2">
                         <div className={`text-xl font-black ${
                            (lead.compatibilityScore || 0) >= 80 ? 'text-green-600' :
                            (lead.compatibilityScore || 0) >= 50 ? 'text-blue-600' :
                            'text-slate-300'
                          }`}>
                            {lead.compatibilityScore}%
                         </div>
                         <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${ (lead.compatibilityScore || 0) >= 80 ? 'bg-green-500' : 'bg-blue-600' }`}
                              style={{ width: `${lead.compatibilityScore}%` }}
                            />
                         </div>
                       </div>
                     ) : '-'}
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
               <p className="text-slate-500 text-sm max-w-xs mx-auto">Try adjusting your filters or head back to the scraper for a new search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full md:w-[600px] h-full bg-white shadow-2xl z-[101] overflow-y-auto"
            >
              <div className="p-10 space-y-12">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Lead Intelligence Report</div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedLead.name}</h2>
                    <div className="flex flex-wrap gap-3">
                       <span className="bg-blue-50 text-blue-600 text-xs font-black px-3 py-1.5 rounded-full uppercase border border-blue-100">{selectedLead.type}</span>
                       <span className="bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-100">ID: {selectedLead.placeId?.slice(-8)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Rating</div>
                        <div className="text-xl font-black text-slate-800 flex items-center gap-2">
                          {selectedLead.rating} <span className="text-amber-400 text-base">★</span>
                          <span className="text-xs text-slate-400">({selectedLead.reviews} reviews)</span>
                        </div>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comp. Score</div>
                        <div className={`text-2xl font-black ${selectedLead.compatibilityScore >= 80 ? 'text-green-600' : 'text-blue-600'}`}>
                          {selectedLead.compatibilityScore}%
                        </div>
                     </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      AI Analysis Summary
                    </h3>
                    <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Sparkles size={120} />
                       </div>
                       <p className="text-slate-700 leading-relaxed font-medium italic relative z-10">
                         "{selectedLead.reasoning}"
                       </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          Pain Points
                        </h3>
                        <div className="flex flex-col gap-2">
                           {(selectedLead.identifiedProblems as string[] || []).map((p, i) => (
                             <div key={i} className="flex items-start gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-50 text-red-800 text-xs font-bold uppercase transition-transform hover:translate-x-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />
                                {p}
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          Sales Hooks
                        </h3>
                        <div className="flex flex-col gap-2">
                            {(selectedLead.compatibilityHooks as string[] || []).map((h, i) => (
                             <div key={i} className="flex items-start gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-50 text-green-800 text-xs font-bold uppercase transition-transform hover:translate-x-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1" />
                                {h}
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </div>

                {/* Email Generator Section */}
                <div className="space-y-6 pt-10 border-t border-slate-100">
                   <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <Mail className="w-4 h-4 text-indigo-600" />
                        Personalized Outreach
                     </h3>
                     {!emailDraft && (
                       <button
                        onClick={() => generateEmail(selectedLead)}
                        disabled={isGeneratingEmail}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors disabled:opacity-50"
                       >
                         {isGeneratingEmail ? 'Crafting...' : 'Generate AI Draft'}
                       </button>
                     )}
                   </div>

                   {emailDraft ? (
                     <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50 rounded-[1.5rem] border border-slate-200 overflow-hidden"
                     >
                        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Subject Line</span>
                             <span className="text-sm font-bold text-slate-900">{emailDraft.subject}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <button
                                onClick={copyToClipboard}
                                className="p-2.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                {isCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                              </button>
                              <a
                                href={`mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`}
                                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Send size={16} />
                              </a>
                           </div>
                        </div>
                        <textarea
                          value={emailDraft.body}
                          readOnly
                          className="w-full h-48 p-6 bg-transparent text-sm text-slate-600 font-medium leading-relaxed resize-none outline-none"
                        />
                        <div className="px-6 py-3 bg-indigo-50/50 flex items-center gap-2 border-t border-indigo-100">
                           <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                           <span className="text-[10px] font-black text-indigo-600 uppercase">Drafted by GPT-5-NANO</span>
                        </div>
                     </motion.div>
                   ) : (
                     <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] p-10 text-center space-y-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100 text-slate-300">
                          <Mail size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-600">No draft generated yet</p>
                          <p className="text-[10px] font-medium text-slate-400 max-w-[200px] mx-auto uppercase">Click the button above to create a custom outreach message.</p>
                        </div>
                     </div>
                   )}

                   {/* Contact details below outreach */}
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3">Contact Information</h4>
                       <div className="flex flex-col gap-5">
                          {selectedLead.email && (
                            <div className="flex items-center gap-4 group/item">
                               <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover/item:scale-110 transition-transform">
                                  <Mail size={18} />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Email Address</span>
                                  <span className="text-sm font-bold text-slate-700">{selectedLead.email}</span>
                               </div>
                            </div>
                          )}
                          {selectedLead.phone && (
                            <div className="flex items-center gap-4 group/item">
                               <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover/item:scale-110 transition-transform">
                                  <Phone size={18} />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Direct Line</span>
                                  <span className="text-sm font-bold text-slate-700">{selectedLead.phone}</span>
                               </div>
                            </div>
                          )}
                          <div className="flex items-center gap-4 group/item">
                             <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover/item:scale-110 transition-transform">
                                <MapPin size={18} />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Primary Location</span>
                                <span className="text-sm font-bold text-slate-700">{selectedLead.address}</span>
                             </div>
                          </div>
                          {selectedLead.website && (
                             <div className="flex items-center gap-4 group/item">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover/item:scale-110 transition-transform">
                                   <Globe size={18} />
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Official Website</span>
                                   <a href={selectedLead.website} target="_blank" className="text-sm font-bold text-blue-600 hover:underline">{selectedLead.website}</a>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                </div>

                <div className="space-y-6 pt-10 border-t border-slate-100">
                  <div className="flex gap-4 pt-4">
                     <button className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                       Start Outreach
                     </button>
                     <a
                      href={selectedLead.website}
                      target="_blank"
                      className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                     >
                       <ExternalLink size={24} />
                     </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
