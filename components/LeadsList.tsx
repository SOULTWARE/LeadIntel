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
  Send
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeadsList({ initialLeads }: { initialLeads: any[] }) {
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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

  const filteredLeads = initialLeads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
           <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
             <Filter className="w-4 h-4" />
             Filters
           </button>
           <button className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
             Export Selected
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
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
                  className="group hover:bg-blue-50/40 cursor-pointer transition-all duration-300"
                >
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
                </div>

                <div className="space-y-6 pt-10 border-t border-slate-100">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 text-slate-500">
                      <MapPin size={20} className="text-slate-400" />
                      <span className="text-sm font-medium">{selectedLead.address}</span>
                    </div>
                    {selectedLead.phone && (
                      <div className="flex items-center gap-4 text-slate-500">
                        <Phone size={20} className="text-slate-400" />
                        <span className="text-sm font-medium">{selectedLead.phone}</span>
                      </div>
                    )}
                    {selectedLead.website && (
                      <div className="flex items-center gap-4 text-slate-500">
                        <Globe size={20} className="text-slate-400" />
                        <a href={selectedLead.website} target="_blank" className="text-sm font-bold text-blue-600 hover:underline">{selectedLead.website}</a>
                      </div>
                    )}
                  </div>

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

function MapPin({ className, size }: { className?: string; size?: number }) { return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>; }
