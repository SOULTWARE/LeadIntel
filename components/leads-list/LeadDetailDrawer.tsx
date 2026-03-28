"use client";

import type { Lead } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
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
} from "lucide-react";

export function LeadDetailDrawer(props: {
  lead: Lead | null;
  onClose: () => void;
  emailDraft: { subject: string; body: string } | null;
  isGeneratingEmail: boolean;
  onGenerateEmail: (lead: Lead) => void;
  onCopyToClipboard: () => void;
  isCopied: boolean;
}) {
  const {
    lead,
    onClose,
    emailDraft,
    isGeneratingEmail,
    onGenerateEmail,
    onCopyToClipboard,
    isCopied,
  } = props;

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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[101] h-full w-full overflow-y-auto border-l border-white/70 bg-white/85 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.55)] backdrop-blur-2xl md:w-[600px]"
          >
            <div className="space-y-10 p-8 md:p-10">
              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                  Lead Intelligence Report
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tight text-slate-900">
                    {lead.name}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-600">
                      {lead.type}
                    </span>
                    <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                      ID: {lead.placeId?.slice(-8)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 rounded-3xl border border-slate-100 bg-slate-50 p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Public Rating
                    </div>
                    <div className="flex items-center gap-2 text-xl font-black text-slate-800">
                      {lead.rating}{" "}
                      <span className="text-amber-400 text-base">★</span>
                      <span className="text-xs text-slate-400">
                        ({lead.reviews} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 rounded-3xl border border-slate-100 bg-slate-50 p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Comp. Score
                    </div>
                    <div
                      className={`text-2xl font-black ${(lead.compatibilityScore ?? 0) >= 80 ? "text-green-600" : "text-blue-600"}`}
                    >
                      {lead.compatibilityScore ?? 0}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    AI Analysis Summary
                  </h3>
                  <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-blue-50/50 p-8">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles size={120} />
                    </div>
                    <p className="relative z-10 font-medium italic leading-relaxed text-slate-700">
                      &quot;{lead.reasoning}&quot;
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Pain Points
                    </h3>
                    <div className="flex flex-col gap-2">
                      {((lead.identifiedProblems as string[]) || []).map(
                        (p, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-50 text-red-800 text-xs font-bold uppercase transition-transform hover:translate-x-1"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />
                            {p}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      <BarChart3 className="w-4 h-4 text-green-500" />
                      Sales Hooks
                    </h3>
                    <div className="flex flex-col gap-2">
                      {((lead.compatibilityHooks as string[]) || []).map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-50 text-green-800 text-xs font-bold uppercase transition-transform hover:translate-x-1"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1" />
                            {h}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Personalized Outreach
                  </h3>
                  {!emailDraft && (
                    <button
                      type="button"
                      onClick={() => onGenerateEmail(lead)}
                      disabled={isGeneratingEmail}
                      className="cursor-pointer rounded-xl bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                    >
                      {isGeneratingEmail ? "Crafting..." : "Generate AI Draft"}
                    </button>
                  )}
                </div>

                {emailDraft ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                          Subject Line
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {emailDraft.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={onCopyToClipboard}
                          className="rounded-lg bg-slate-50 p-2.5 text-slate-500 transition-colors hover:bg-slate-100"
                        >
                          {isCopied ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <a
                          href={`mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`}
                          className="rounded-lg bg-blue-600 p-2.5 text-white transition-colors hover:bg-blue-700"
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
                    <div className="flex items-center gap-2 border-t border-indigo-100 bg-indigo-50/50 px-6 py-3">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase">
                        Drafted by AI.{" "}
                        <small className="text-gray-600 font-medium">
                          Please proofread before sending.
                        </small>
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-300 shadow-sm">
                      <Mail size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-600">
                        No draft generated yet
                      </p>
                      <p className="mx-auto max-w-[200px] text-[10px] font-medium uppercase text-slate-400">
                        Click the button above to create a custom outreach
                        message.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-6 rounded-3xl border border-slate-100 bg-slate-50 p-8">
                  <h4 className="border-b border-slate-200 pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Contact Information
                  </h4>
                  <div className="flex flex-col gap-5">
                    {lead.email && (
                      <div className="flex items-center gap-4 group/item">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover/item:scale-110">
                          <Mail size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                            Email Address
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            {lead.email}
                          </span>
                        </div>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-4 group/item">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover/item:scale-110">
                          <Phone size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                            Direct Line
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            {lead.phone}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 group/item">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-transform group-hover/item:scale-110">
                        <MapPin size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                          Primary Location
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {lead.address}
                        </span>
                      </div>
                    </div>
                    {lead.website && (
                      <div className="flex items-center gap-4 group/item">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover/item:scale-110">
                          <Globe size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                            Official Website
                          </span>
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
                {/*<div className="flex gap-4 pt-4">
                  <div className="flex-1" title="Coming soon: Outreach workflows arrive in the next release.">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 py-5 text-sm font-black uppercase tracking-widest text-slate-400"
                    >
                      Start Outreach
                    </button>
                  </div>
                  {lead.website && (
                    <a
                      href={lead.website}
                      target="_blank"
                      className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-blue-100 hover:text-blue-600"
                    >
                      <ExternalLink size={24} />
                    </a>
                  )}
                </div>*/}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
