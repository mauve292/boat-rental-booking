import { getAppSettings } from "@boat/db";
import { getMonthLabel } from "@boat/domain";
import { Pill, ShellCard } from "@boat/ui";
import Link from "next/link";
import { getSettingsFeedback } from "@/lib/settings-feedback";
import { updateAppSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
};

const monthNumbers = Array.from({ length: 12 }, (_, index) => index + 1);

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const appSettings = await getAppSettings();
  const feedback = getSettingsFeedback(resolvedSearchParams.feedback);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Admin Settings"
        title="Settings"
        description="Phase-1 operational settings stay intentionally small: booking season bounds and the primary contact email."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone="success">Season: {appSettings.bookingSeason.label}</Pill>
          <Pill tone="accent">{appSettings.contactEmail}</Pill>
          <Link
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            href="/"
          >
            Back to dashboard
          </Link>
        </div>
      </ShellCard>

      {feedback ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <ShellCard
        eyebrow="Booking Season"
        title="Operational defaults"
        description="Public booking reads these values when rendering the date range and when validating submissions server-side."
      >
        <form action={updateAppSettingsAction} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Season start month
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              defaultValue={String(appSettings.bookingSeason.startMonth)}
              name="bookingSeasonStartMonth"
            >
              {monthNumbers.map((month) => (
                <option key={month} value={month}>
                  {getMonthLabel(month)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-600">
            Season end month
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              defaultValue={String(appSettings.bookingSeason.endMonth)}
              name="bookingSeasonEndMonth"
            >
              {monthNumbers.map((month) => (
                <option key={month} value={month}>
                  {getMonthLabel(month)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-600 sm:col-span-2">
            Contact / notification email
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              defaultValue={appSettings.contactEmail}
              name="contactEmail"
              placeholder="bookings@example.com"
              type="email"
            />
          </label>

          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>Saved season label: {appSettings.bookingSeason.label}</p>
            <p className="mt-2">Last updated at: {appSettings.updatedAt}</p>
            <p className="mt-2">
              Payment remains mock-only. These settings only affect season validation and operational contact details in this phase.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 sm:col-span-2 sm:w-fit"
            type="submit"
          >
            Save settings
          </button>
        </form>
      </ShellCard>
    </main>
  );
}
