import type { ReactNode } from "react";
import { adminNavItems } from "@boat/domain";
import { Pill } from "@boat/ui";
import { requireAdminSession } from "@/lib/session";
import { AdminNav } from "@/components/admin-nav";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireAdminSession();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_45%,#f8fafc_100%)]">
      <header className="border-b border-slate-800 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#0b1120_100%)] text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.75)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              Protected Admin
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Boat Rental Admin
              </h1>
              <Pill tone="accent">{session.user.email}</Pill>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Manage bookings, availability, pricing, and operational settings from one protected control panel.
            </p>
            <AdminNav items={adminNavItems.filter((item) => item.id !== "notifications")} />
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="pb-12">{children}</div>
    </div>
  );
}
