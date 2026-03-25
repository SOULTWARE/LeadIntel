'use client';

import type { Lead } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Check,
  Copy,
  Globe,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

export function LeadDetailDrawerRevamp(props: {
  lead: Lead | null;
  onClose: () => void;
  emailDraft: { subject: string; body: string } | null;
  isGeneratingEmail: boolean;
  onGenerateEmail: (lead: Lead) => void;
  onCopyToClipboard: () => void;
  isCopied: boolean;
}) {
  const { lead, onClose, emailDraft, isGeneratingEmail, onGenerateEmail, onCopyToClipboard, isCopied } = props;

  const problems = Array.isArray(lead?.identifiedProblems) ? (lead?.identifiedProblems as string[]) : [];
  const hooks = Array.isArray(lead?.compatibilityHooks) ? (lead?.compatibilityHooks as string[]) : [];

  return (
    <AnimatePresence>
      {lead ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed right-0 top-0 z-[101] h-full w-full overflow-y-auto border-l border-slate-200 bg-[rgba(243,245,247,0.98)] md:w-[620px]"
          >
            <div className="space-y-6 p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="section-label">Lead detail</div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{lead.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <section className="surface space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip-accent">{lead.type || 'Business'}</span>
                  {lead.placeId ? <span className="chip-muted">ID {lead.placeId.slice(-8)}</span> : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="surface-muted p-4">
                    <div className="section-label">Public rating</div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">
                      {lead.rating ? `${lead.rating} / 5` : 'Not available'}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {lead.reviews ? `${lead.reviews} review${lead.reviews === 1 ? '' : 's'}` : 'No review count'}
                    </p>
                  </div>
                  <div className="surface-muted p-4">
                    <div className="section-label">Compatibility</div>
                    <div className="mt-2 text-3xl font-semibold text-slate-950">{lead.compatibilityScore ?? 0}%</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full ${(lead.compatibilityScore ?? 0) >= 80 ? 'bg-green-600' : 'bg-blue-700'}`}
                        style={{ width: `${lead.compatibilityScore ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="surface space-y-4 p-5">
                <div className="flex items-center gap-2 text-slate-950">
                  <Sparkles className="h-4 w-4 text-blue-700" />
                  <h3 className="text-lg font-semibold">AI analysis</h3>
                </div>
                {lead.reasoning ? (
                  <div className="surface-muted p-4">
                    <p className="text-sm leading-6 text-slate-700">&quot;{lead.reasoning}&quot;</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Run AI enhancement to generate the compatibility summary for this lead.</p>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                      Pain points
                    </div>
                    {problems.length > 0 ? (
                      <div className="space-y-2">
                        {problems.map((problem, index) => (
                          <div key={`${problem}-${index}`} className="surface-muted border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                            {problem}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="surface-muted p-4 text-sm text-slate-500">No pain points recorded yet.</div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <BarChart3 className="h-4 w-4 text-emerald-600" />
                      Sales hooks
                    </div>
                    {hooks.length > 0 ? (
                      <div className="space-y-2">
                        {hooks.map((hook, index) => (
                          <div key={`${hook}-${index}`} className="surface-muted border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                            {hook}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="surface-muted p-4 text-sm text-slate-500">No outreach hooks recorded yet.</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="surface space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="section-label">Personalized outreach</div>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">Email draft</h3>
                  </div>
                  {!emailDraft && (
                    <button
                      type="button"
                      onClick={() => onGenerateEmail(lead)}
                      disabled={isGeneratingEmail}
                      className="btn-accent"
                    >
                      <Sparkles className={`h-4 w-4 ${isGeneratingEmail ? 'animate-spin' : ''}`} />
                      {isGeneratingEmail ? 'Generating...' : 'Generate Draft'}
                    </button>
                  )}
                </div>

                {emailDraft ? (
                  <div className="space-y-3">
                    <div className="surface-muted p-4">
                      <div className="section-label">Subject</div>
                      <div className="mt-2 text-sm font-semibold text-slate-950">{emailDraft.subject}</div>
                    </div>
                    <textarea value={emailDraft.body} readOnly className="field-textarea min-h-56 bg-white" />
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={onCopyToClipboard} className="btn-secondary">
                        {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        {isCopied ? 'Copied' : 'Copy Draft'}
                      </button>
                      <a
                        href={`mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`}
                        className="btn-primary"
                      >
                        <Send className="h-4 w-4" />
                        Open Mail App
                      </a>
                    </div>
                    <p className="field-hint">Review and edit the draft before sending.</p>
                  </div>
                ) : (
                  <div className="surface-inset p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-slate-600">Generate an outreach draft once you are ready to contact this lead.</p>
                  </div>
                )}
              </section>

              <section className="surface space-y-4 p-5">
                <div>
                  <div className="section-label">Contact data</div>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">Business profile</h3>
                </div>
                <div className="grid gap-3">
                  {lead.email ? (
                    <div className="surface-muted flex items-center gap-3 p-4">
                      <Mail className="h-4 w-4 text-blue-700" />
                      <div className="text-sm font-medium text-slate-700">{lead.email}</div>
                    </div>
                  ) : null}
                  {lead.phone ? (
                    <div className="surface-muted flex items-center gap-3 p-4">
                      <Phone className="h-4 w-4 text-blue-700" />
                      <div className="text-sm font-medium text-slate-700">{lead.phone}</div>
                    </div>
                  ) : null}
                  {lead.address ? (
                    <div className="surface-muted flex items-center gap-3 p-4">
                      <MapPin className="h-4 w-4 text-blue-700" />
                      <div className="text-sm font-medium text-slate-700">{lead.address}</div>
                    </div>
                  ) : null}
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="surface-muted flex items-center gap-3 p-4 text-sm font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
                    >
                      <Globe className="h-4 w-4" />
                      {lead.website}
                    </a>
                  ) : null}
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
