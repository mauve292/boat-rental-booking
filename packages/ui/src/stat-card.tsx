type StatCardTone = "neutral" | "accent" | "success" | "warning";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: StatCardTone;
};

const toneClasses: Record<StatCardTone, string> = {
  neutral: "border-slate-200 bg-white text-slate-950",
  accent: "border-sky-200 bg-sky-50 text-slate-950",
  success: "border-emerald-200 bg-emerald-50 text-slate-950",
  warning: "border-amber-200 bg-amber-50 text-slate-950"
};

export function StatCard({
  label,
  value,
  detail,
  tone = "neutral"
}: StatCardProps) {
  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p> : null}
    </div>
  );
}
