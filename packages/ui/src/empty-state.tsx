import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/90 px-6 py-7 text-center shadow-sm">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
