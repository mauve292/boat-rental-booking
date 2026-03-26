import type { ReactNode } from "react";

type FeedbackTone = "success" | "warning" | "error" | "info";

type FeedbackBannerProps = {
  tone?: FeedbackTone;
  title?: string;
  children: ReactNode;
};

const toneClasses: Record<FeedbackTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-sky-200 bg-sky-50 text-sky-900"
};

export function FeedbackBanner({
  tone = "info",
  title,
  children
}: FeedbackBannerProps) {
  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm ${toneClasses[tone]}`}>
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      <div className={title ? "mt-1 text-sm leading-6" : "text-sm leading-6"}>
        {children}
      </div>
    </div>
  );
}
