"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavItem } from "@boat/domain";

type AdminNavProps = {
  items: readonly AdminNavItem[];
};

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ items }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-2">
      {items.map((item) => {
        const active = isItemActive(pathname, item.href);

        return (
          <Link
            key={item.id}
            className={`inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              active
                ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                : "border-white/20 bg-white/10 text-slate-200 hover:border-white/30 hover:bg-white/15 hover:text-white"
            }`}
            href={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
