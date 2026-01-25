'use client';

import type { Lead } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

export function LeadDetailDrawer(props: {
  lead: Lead | null;
  onClose: () => void;
  emailDraft: { subject: string; body: string } | null;
  isGeneratingEmail: boolean;
  onGenerateEmail: (lead: Lead) => void;
  onCopyToClipboard: () => void;
  isCopied: boolean;
}) {
  const { lead, onClose, emailDraft, isGeneratingEmail, onGenerateEmail, onCopyToClipboard, isCopied } = props;

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Lead Intelligence Report</div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{lead.name}</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-blue-50 text-blue-600 text-xs font-black px-3 py-1.5 rounded-full uppercase border border-blue-100">
                      {lead.type}
                    </span>
                    <span className="bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-100">
                      ID: {lead.placeId?.slice(-8)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Rating</div>
                    <div className="text-xl font-black text-slate-800 flex items-center gap-2">
                      {lead.rating} <span className="text-amber-400 text-base">★</span>
                      <span className="text-xs text-slate-400">({lead.reviews} reviews)</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comp. Score</div>
                    <div className={`text-2xl font-black ${(lead.compatibilityScore ?? 0) >= 80 ? 'text-green-600' : 'text-blue-600'}`}>
                      {lead.compatibilityScore ?? 0}%
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
                    <p className="text-slate-700 leading-relaxed font-medium italic relative z-10">&quot;{lead.reasoning}&quot;</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Pain Points
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(lead.identifiedProblems as string[] || []).map((p, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-50 text-red-800 text-xs font-bold uppercase transition-transform hover:translate-x-1"
                        >
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
                      {(lead.compatibilityHooks as string[] || []).map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-50 text-green-800 text-xs font-bold uppercase transition-transform hover:translate-x-1"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1" />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Personalized Outreach
                  </h3>
                  {!emailDraft && (
                    <button
                      type="button"
                      onClick={() => onGenerateEmail(lead)}
                      disabled={isGeneratingEmail}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors disabled:opacity-50 cursor-pointer"
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
                          onClick={onCopyToClipboard}
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
                      <span className="text-[10px] font-black text-indigo-600 uppercase">Drafted by AI. <small className="text-gray-600 font-medium">Please proofread before sending.</small></span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] p-10 text-center space-y-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100 text-slate-300">
                      <Mail size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-600">No draft generated yet</p>
                      <p className="text-[10px] font-medium text-slate-400 max-w-[200px] mx-auto uppercase">
                        Click the button above to create a custom outreach message.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3">
                    Contact Information
                  </h4>
                  <div className="flex flex-col gap-5">
                    {lead.email && (
                      <div className="flex items-center gap-4 group/item">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover/item:scale-110 transition-transform">
                          <Mail size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Email Address</span>
                          <span className="text-sm font-bold text-slate-700">{lead.email}</span>
                        </div>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-4 group/item">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover/item:scale-110 transition-transform">
                          <Phone size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Direct Line</span>
                          <span className="text-sm font-bold text-slate-700">{lead.phone}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover/item:scale-110 transition-transform">
                        <MapPin size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Primary Location</span>
                        <span className="text-sm font-bold text-slate-700">{lead.address}</span>
                      </div>
                    </div>
                    {lead.website && (
                      <div className="flex items-center gap-4 group/item">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover/item:scale-110 transition-transform">
                          <Globe size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Official Website</span>
                          <a
                            href={lead.website}
                            target="_blank"
                            className="text-sm font-bold text-blue-600 hover:underline"
                          >
                            {lead.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-slate-100">
                <div className="flex gap-4 pt-4">
                  <div className="flex-1" title="Coming soon: Outreach workflows arrive in the next release.">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-sm tracking-widest cursor-not-allowed border border-slate-200"
                    >
                      Start Outreach
                    </button>
                  </div>
                  {lead.website && (
                    <a
                      href={lead.website}
                      target="_blank"
                      className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                    >
                      <ExternalLink size={24} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
