import type { ReactNode } from "react";
import { Pill } from "@boat/ui";
import { requireAdminSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireAdminSession();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Protected Admin
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-semibold text-slate-950">
                Boat Rental Admin
              </h1>
              <Pill tone="accent">{session.user.email}</Pill>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
