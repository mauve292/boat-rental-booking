import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  aside?: ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  aside
}: SectionHeaderProps) {
  const isCentered = align === "center";

  return (
    <div
      className={`flex flex-col gap-4 ${aside ? "lg:flex-row lg:items-end lg:justify-between" : ""}`}
    >
      <div className={isCentered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.35rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {aside ? <div className={isCentered ? "mx-auto" : ""}>{aside}</div> : null}
    </div>
  );
}
