export const OUTREACH_EVENT_TYPES = [
  "SENT",
  "DELIVERED",
  "OPEN",
  "CLICK",
  "REPLY",
  "BOUNCE",
] as const;

export type OutreachEventTypeValue = (typeof OUTREACH_EVENT_TYPES)[number];

export type OutreachMetricField =
  | "sentCount"
  | "openCount"
  | "clickCount"
  | "responseCount"
  | "bounceCount";

export function mapOutreachEventTypeToMetric(
  type: OutreachEventTypeValue,
): OutreachMetricField | null {
  if (type === "SENT") return "sentCount";
  if (type === "OPEN") return "openCount";
  if (type === "CLICK") return "clickCount";
  if (type === "REPLY") return "responseCount";
  if (type === "BOUNCE") return "bounceCount";
  return null;
}

export function formatOutreachEventType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getOutreachEventTone(type: string): string {
  if (type === "REPLY") return "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (type === "BOUNCE") return "text-rose-600 bg-rose-50 border-rose-100";
  if (type === "CLICK") return "text-blue-600 bg-blue-50 border-blue-100";
  if (type === "OPEN") return "text-indigo-600 bg-indigo-50 border-indigo-100";
  if (type === "SENT") return "text-slate-700 bg-slate-50 border-slate-200";
  return "text-amber-700 bg-amber-50 border-amber-100";
}
