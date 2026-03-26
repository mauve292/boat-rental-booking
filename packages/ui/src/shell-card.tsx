import type { ReactNode } from "react";

type ShellCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

export function ShellCard({
  eyebrow,
  title,
  description,
  children
}: ShellCardProps) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur sm:p-7">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6 sm:mt-7">{children}</div> : null}
    </section>
  );
}
