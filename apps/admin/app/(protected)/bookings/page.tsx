import {
  bookingStatusLabels,
  bookingStatusValues,
  tripTypeLabels
} from "@boat/domain";
import { listBoats, listBookings } from "@boat/db";
import { Pill, ShellCard } from "@boat/ui";
import { bookingStatusSchema, entityIdSchema } from "@boat/validation";
import Link from "next/link";
import { getBookingFeedback } from "@/lib/booking-feedback";

export const dynamic = "force-dynamic";

type BookingsPageProps = {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
};

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}

function getStatusTone(status: keyof typeof bookingStatusLabels) {
  if (status === "pending") {
    return "warning";
  }

  if (status === "confirmed") {
    return "success";
  }

  return "neutral";
}

function normalizeSearchParamValue(
  value: string | string[] | undefined
): string | null {
  if (Array.isArray(value)) {
    return normalizeSearchParamValue(value[0]);
  }

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function parseBookingsFilters(searchParams: Record<string, string | string[] | undefined>) {
  const status = normalizeSearchParamValue(searchParams.status);
  const boatId = normalizeSearchParamValue(searchParams.boatId);
  const parsedStatus = bookingStatusSchema.safeParse(status);
  const parsedBoatId = entityIdSchema.safeParse(boatId);

  return {
    status: parsedStatus.success ? parsedStatus.data : undefined,
    boatId: parsedBoatId.success ? parsedBoatId.data : undefined
  };
}

export default async function BookingsPage({
  searchParams
}: BookingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseBookingsFilters(resolvedSearchParams);
  const feedback = getBookingFeedback(resolvedSearchParams.feedback);
  const [boats, bookings] = await Promise.all([
    listBoats(),
    listBookings(filters)
  ]);

  const hasActiveFilters = Boolean(filters.status || filters.boatId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Admin Bookings"
        title="Bookings"
        description="Review pending, confirmed, and cancelled bookings from the database. Filters are server-side and keep the page shareable by URL."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone="warning">
            {bookings.filter((booking) => booking.status === "pending").length} pending in current view
          </Pill>
          <Pill tone="accent">{bookings.length} bookings shown</Pill>
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
        eyebrow="Filters"
        title="Filter bookings"
        description="Filter by booking status and boat without leaving the protected admin surface."
      >
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
          <label className="text-sm text-slate-600">
            Status
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              defaultValue={filters.status ?? ""}
              name="status"
            >
              <option value="">All statuses</option>
              {bookingStatusValues.map((status) => (
                <option key={status} value={status}>
                  {bookingStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-600">
            Boat
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              defaultValue={filters.boatId ?? ""}
              name="boatId"
            >
              <option value="">All boats</option>
              {boats.map((boat) => (
                <option key={boat.id} value={boat.id}>
                  {boat.name}
                </option>
              ))}
            </select>
          </label>

          <button
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 md:self-end"
            type="submit"
          >
            Apply filters
          </button>

          <Link
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950 md:self-end"
            href="/bookings"
          >
            Reset
          </Link>
        </form>
      </ShellCard>

      <ShellCard
        eyebrow="Results"
        title="Booking list"
        description="Each booking links into a detail page with inspection and management actions."
      >
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            {hasActiveFilters
              ? "No bookings match the current filters."
              : "No bookings have been created yet."}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {booking.customerName}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.boatName} - {tripTypeLabels[booking.tripType]} -{" "}
                      {booking.date}
                    </p>
                  </div>
                  <Pill tone={getStatusTone(booking.status)}>
                    {bookingStatusLabels[booking.status]}
                  </Pill>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                  <p>Email: {booking.email}</p>
                  <p>Phone: {booking.phone}</p>
                  <p>Created: {formatTimestamp(booking.createdAt)}</p>
                  <p>ID: {booking.id}</p>
                </div>

                <div className="mt-4">
                  <Link
                    className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                    href={`/bookings/${booking.id}`}
                  >
                    Open booking details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </ShellCard>
    </main>
  );
}
