import type { ReactNode } from "react";

type PillTone = "neutral" | "accent" | "success" | "warning";

type PillProps = {
  children: ReactNode;
  tone?: PillTone;
};

const toneClasses: Record<PillTone, string> = {
  neutral: "border-slate-200 bg-white/90 text-slate-700",
  accent: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800"
};

export function Pill({ children, tone = "neutral" }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
