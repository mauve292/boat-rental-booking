import { appNameSchema } from "@boat/validation";

const appName = appNameSchema.parse("booking");

export default function BookingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-20">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {appName} app
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          Boat Booking
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Booking UI will live here later. This shell only confirms the
          workspace and shared validation package are connected correctly.
        </p>
      </section>
    </main>
  );
}

