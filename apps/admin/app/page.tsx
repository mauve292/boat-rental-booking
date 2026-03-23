import { appNames, type AppName } from "@boat/types";

const appName: AppName = "admin";

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-20">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {appName} app
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          Admin Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Admin tooling can be added later for fleet, pricing, and reservation
          operations. Shared app identifiers currently available:{" "}
          {appNames.join(", ")}.
        </p>
      </section>
    </main>
  );
}
