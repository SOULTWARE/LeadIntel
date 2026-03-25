import Link from "next/link";
import { Zap } from "lucide-react";

type BrandMarkProps = {
  href?: string;
  subtitle?: string;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
};

export default function BrandMark({
  href = "/",
  subtitle = "Lead intelligence workspace",
  compact = false,
  inverted = false,
  className = "",
}: BrandMarkProps) {
  const textClass = inverted ? "text-white" : "text-slate-950";
  const subClass = inverted ? "text-slate-400" : "text-slate-500";
  const iconShell = inverted
    ? "border border-slate-700 bg-slate-900 text-white"
    : "border border-slate-300 bg-slate-950 text-white";

  return (
    <Link href={href} className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${iconShell}`}>
        <Zap className="h-5 w-5" fill="currentColor" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`text-lg font-semibold tracking-tight ${textClass}`}>
            LeadIntel<span className="text-blue-600">Pro</span>
          </span>
          <span className={`mt-1 text-[11px] uppercase tracking-[0.16em] ${subClass}`}>{subtitle}</span>
        </span>
      )}
    </Link>
  );
}
