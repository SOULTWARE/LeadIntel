"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Check,
  Clock3,
  Copy,
  Globe,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  X,
  UserRound,
  BriefcaseBusiness,
  Rocket,
  Plus,
  Minus,
  Star,
} from "lucide-react";
import { calculateRate } from "@/lib/leads/insights";
import {
  formatOutreachEventType,
  getOutreachEventTone,
} from "@/lib/leads/outreachEvents";
import type { LeadWithRelations } from "@/lib/leads/types";

type OutreachSignal = "linkedin" | "content" | "warm_intro";
type AnalyticsMetric =
  | "sentCount"
  | "openCount"
  | "clickCount"
  | "responseCount"
  | "bounceCount";

export function LeadDetailDrawer(props: {
  lead: LeadWithRelations | null;
  onClose: () => void;
  emailDraft: { subject: string; body: string } | null;
  isGeneratingEmail: boolean;
  onGenerateEmail: (lead: LeadWithRelations) => void;
  onCopyToClipboard: () => void;
  isCopied: boolean;
  activeActionKey: string | null;
  onToggleOutreachSignal: (
    lead: LeadWithRelations,
    signal: OutreachSignal,
    active: boolean,
  ) => void;
  onAdjustMetric: (
    lead: LeadWithRelations,
    metric: AnalyticsMetric,
    operation?: "increment" | "decrement",
  ) => void;
  onSelectPrimaryContact: (lead: LeadWithRelations, contactId: string) => void;
}) {
  const {
    lead,
    onClose,
    emailDraft,
    isGeneratingEmail,
    onGenerateEmail,
    onCopyToClipboard,
    isCopied,
    activeActionKey,
    onToggleOutreachSignal,
    onAdjustMetric,
    onSelectPrimaryContact,
  } = props;

  const decisionMakerRoles = (
    (lead?.decisionMakerRoles as string[] | null) || []
  ).filter(Boolean);
  const suggestedTouches =
    lead?.warmupSignals &&
    typeof lead.warmupSignals === "object" &&
    !Array.isArray(lead.warmupSignals) &&
    Array.isArray(
      (lead.warmupSignals as { suggestedTouches?: unknown }).suggestedTouches,
    )
      ? (
          (lead.warmupSignals as { suggestedTouches?: unknown[] })
            .suggestedTouches || []
        ).filter((item): item is string => typeof item === "string")
      : [];
  const contacts = [...(lead?.contacts || [])].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (b.confidenceScore || 0) - (a.confidenceScore || 0);
  });

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
            className="fixed right-0 top-0 z-[101] h-full w-full overflow-y-auto border-l border-white/70 bg-white/85 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.55)] backdrop-blur-2xl md:w-[680px]"
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
                      {lead.company?.industry || lead.type || "Business"}
                    </span>
                    {lead.company?.companySize && (
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-black uppercase text-indigo-600">
                        {lead.company.companySize}
                      </span>
                    )}
                    {lead.batch?.code && (
                      <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                        Batch: {lead.batch.code}
                        {lead.batch.status ? ` · ${lead.batch.status}` : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MetricCard
                    label="Fit"
                    value={`${lead.compatibilityScore ?? 0}%`}
                    tone={
                      (lead.compatibilityScore ?? 0) >= 80
                        ? "text-green-600"
                        : "text-blue-600"
                    }
                  />
                  <MetricCard
                    label="Quality"
                    value={`${lead.qualityScore ?? 0}%`}
                    tone="text-indigo-600"
                  />
                  <MetricCard
                    label="Warmup"
                    value={`${lead.warmupScore ?? 0}%`}
                    tone="text-amber-600"
                  />
                  <MetricCard
                    label="Verify"
                    value={lead.emailVerificationStatus || "UNVERIFIED"}
                    tone="text-slate-700"
                  />
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

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Pain Points
                    </h3>
                    <div className="flex flex-col gap-2">
                      {((lead.identifiedProblems as string[] | null) || []).map(
                        (problem, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-50 text-red-800 text-xs font-bold uppercase"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />
                            {problem}
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
                      {((lead.compatibilityHooks as string[] | null) || []).map(
                        (hook, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-50 text-green-800 text-xs font-bold uppercase"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1" />
                            {hook}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-4 rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6">
                    <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      <UserRound className="w-4 h-4 text-indigo-500" />
                      Decision-Maker Roles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {decisionMakerRoles.length > 0 ? (
                        decisionMakerRoles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-black uppercase text-indigo-600"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          No role signal yet.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6">
                    <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      <Rocket className="w-4 h-4 text-amber-500" />
                      Suggested Warm-Up
                    </h3>
                    <div className="space-y-2">
                      {suggestedTouches.length > 0 ? (
                        suggestedTouches.map((touch) => (
                          <div
                            key={touch}
                            className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                          >
                            {touch}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          No warm-up suggestions yet.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6">
                  <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    Contact Candidates
                  </h3>
                  <div className="space-y-3">
                    {contacts.length > 0 ? (
                      contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={`rounded-[1.5rem] border px-4 py-4 ${
                            contact.isPrimary
                              ? "border-indigo-200 bg-white shadow-sm"
                              : "border-slate-200 bg-white/80"
                          }`}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-black text-slate-900">
                                  {contact.fullName || contact.email}
                                </span>
                                {contact.isPrimary && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-[10px] font-black uppercase text-amber-600">
                                    <Star className="h-3 w-3" />
                                    Primary
                                  </span>
                                )}
                                {contact.isDecisionMaker && (
                                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-600">
                                    Decision maker
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-semibold text-slate-500">
                                {contact.roleTitle || "Role unknown"} ·{" "}
                                {contact.email}
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                Confidence {contact.confidenceScore}% ·{" "}
                                {contact.emailVerificationStatus}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onSelectPrimaryContact(lead, contact.id)
                              }
                              disabled={
                                contact.isPrimary ||
                                activeActionKey ===
                                  `contact:${contact.id}:primary`
                              }
                              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {contact.isPrimary ? "Primary" : "Make Primary"}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        No contact candidates discovered yet.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6">
                <div className="flex items-center gap-3">
                  <BriefcaseBusiness className="h-4 w-4 text-slate-500" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Outreach Prep
                  </h3>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <SignalButton
                    label="LinkedIn touched"
                    active={Boolean(lead.linkedinTouchedAt)}
                    loading={activeActionKey === "signal:linkedin"}
                    onClick={() =>
                      onToggleOutreachSignal(
                        lead,
                        "linkedin",
                        !lead.linkedinTouchedAt,
                      )
                    }
                  />
                  <SignalButton
                    label="Content engaged"
                    active={Boolean(lead.contentEngagedAt)}
                    loading={activeActionKey === "signal:content"}
                    onClick={() =>
                      onToggleOutreachSignal(
                        lead,
                        "content",
                        !lead.contentEngagedAt,
                      )
                    }
                  />
                  <SignalButton
                    label="Warm intro requested"
                    active={Boolean(lead.warmIntroRequestedAt)}
                    loading={activeActionKey === "signal:warm_intro"}
                    onClick={() =>
                      onToggleOutreachSignal(
                        lead,
                        "warm_intro",
                        !lead.warmIntroRequestedAt,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-6 rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Campaign Analytics
                  </h3>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    {lead.events.length > 0
                      ? "Webhook + manual tracking"
                      : "Manual tracking"}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                  <AnalyticsMetricCard
                    lead={lead}
                    label="Sent"
                    metric="sentCount"
                    activeActionKey={activeActionKey}
                    onAdjustMetric={onAdjustMetric}
                  />
                  <AnalyticsMetricCard
                    lead={lead}
                    label="Opens"
                    metric="openCount"
                    rate={calculateRate(lead.openCount, lead.sentCount)}
                    activeActionKey={activeActionKey}
                    onAdjustMetric={onAdjustMetric}
                  />
                  <AnalyticsMetricCard
                    lead={lead}
                    label="Clicks"
                    metric="clickCount"
                    rate={calculateRate(lead.clickCount, lead.sentCount)}
                    activeActionKey={activeActionKey}
                    onAdjustMetric={onAdjustMetric}
                  />
                  <AnalyticsMetricCard
                    lead={lead}
                    label="Replies"
                    metric="responseCount"
                    rate={calculateRate(lead.responseCount, lead.sentCount)}
                    activeActionKey={activeActionKey}
                    onAdjustMetric={onAdjustMetric}
                  />
                  <AnalyticsMetricCard
                    lead={lead}
                    label="Bounces"
                    metric="bounceCount"
                    rate={calculateRate(lead.bounceCount, lead.sentCount)}
                    activeActionKey={activeActionKey}
                    onAdjustMetric={onAdjustMetric}
                  />
                </div>
              </div>

              <div className="space-y-6 rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    <Clock3 className="w-4 h-4 text-slate-500" />
                    Recent Activity
                  </h3>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    {lead.events.length} event
                    {lead.events.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="space-y-3">
                  {lead.events.length > 0 ? (
                    lead.events.map((event) => (
                      <div
                        key={event.id}
                        className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${getOutreachEventTone(event.type)}`}
                            >
                              {formatOutreachEventType(event.type)}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                              {event.provider}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-700">
                            {event.email ||
                              lead.primaryContact?.email ||
                              lead.email ||
                              "No email attached"}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          {new Date(event.occurredAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No webhook events recorded yet.
                    </span>
                  )}
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
                      <p className="mx-auto max-w-[220px] text-[10px] font-medium uppercase text-slate-400">
                        Generate a draft after reviewing role fit, warm-up
                        signals, and quality score.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-6 rounded-3xl border border-slate-100 bg-slate-50 p-8">
                  <h4 className="border-b border-slate-200 pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Contact and Company
                  </h4>
                  <div className="grid gap-5 md:grid-cols-2">
                    <InfoRow
                      icon={<Mail size={18} />}
                      label="Email"
                      value={
                        lead.primaryContact?.email ||
                        lead.email ||
                        "No verified email"
                      }
                      accent="bg-indigo-50 text-indigo-600"
                    />
                    <InfoRow
                      icon={<Phone size={18} />}
                      label="Phone"
                      value={lead.phone || "No phone"}
                      accent="bg-blue-50 text-blue-600"
                    />
                    <InfoRow
                      icon={<MapPin size={18} />}
                      label="Location"
                      value={lead.address || "No address"}
                      accent="bg-slate-100 text-slate-500"
                    />
                    <InfoRow
                      icon={<Globe size={18} />}
                      label="Website"
                      value={lead.website || "No website"}
                      accent="bg-emerald-50 text-emerald-600"
                      href={lead.website || undefined}
                    />
                    <InfoRow
                      icon={<BriefcaseBusiness size={18} />}
                      label="Campaign"
                      value={lead.campaign?.name || "Unassigned"}
                      accent="bg-violet-50 text-violet-600"
                    />
                    <InfoRow
                      icon={<UserRound size={18} />}
                      label="Primary Role"
                      value={
                        lead.primaryContact?.roleTitle ||
                        lead.primaryDecisionMakerRole ||
                        "Not identified"
                      }
                      accent="bg-amber-50 text-amber-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="space-y-1 rounded-3xl border border-slate-100 bg-slate-50 p-6">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div className={`text-2xl font-black ${tone}`}>{value}</div>
    </div>
  );
}

function SignalButton({
  label,
  active,
  loading,
  onClick,
}: {
  label: string;
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
      } ${loading ? "opacity-60" : ""}`}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.35em]">
        {label}
      </div>
      <div className="mt-2 text-sm font-bold">
        {active ? "Logged" : "Mark complete"}
      </div>
    </button>
  );
}

function AnalyticsMetricCard({
  lead,
  label,
  metric,
  rate,
  activeActionKey,
  onAdjustMetric,
}: {
  lead: LeadWithRelations;
  label: string;
  metric: AnalyticsMetric;
  rate?: number;
  activeActionKey: string | null;
  onAdjustMetric: (
    lead: LeadWithRelations,
    metric: AnalyticsMetric,
    operation?: "increment" | "decrement",
  ) => void;
}) {
  const value = lead[metric];
  const incrementKey = `metric:${metric}:increment`;
  const decrementKey = `metric:${metric}:decrement`;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      {typeof rate === "number" && (
        <div className="mt-1 text-xs font-bold text-slate-500">
          {rate}% rate
        </div>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAdjustMetric(lead, metric, "decrement")}
          disabled={activeActionKey === decrementKey}
          className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={() => onAdjustMetric(lead, metric, "increment")}
          disabled={activeActionKey === incrementKey}
          className="rounded-xl border border-blue-100 bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  accent,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-4 group/item">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover/item:scale-110 ${accent}`}
      >
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
          {label}
        </span>
        {href ? (
          <a
            href={href}
            target="_blank"
            className="truncate text-sm font-bold text-blue-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="truncate text-sm font-bold text-slate-700">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
