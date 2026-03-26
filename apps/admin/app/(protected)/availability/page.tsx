import {
  bookingSeason,
  tripTypeLabels,
  tripTypes
} from "@boat/domain";
import { listAvailabilityState, listBoats } from "@boat/db";
import { Pill, ShellCard } from "@boat/ui";
import Link from "next/link";
import { getAvailabilityFeedback } from "@/lib/availability-feedback";
import {
  createAvailabilityBlockAction,
  removeAvailabilityBlockAction
} from "./actions";

export const dynamic = "force-dynamic";

type AvailabilityPageProps = {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
};

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

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsedDate.valueOf()) && parsedDate.toISOString().slice(0, 10) === value;
}

function getDefaultAvailabilityRange(referenceDate: Date): {
  dateFrom: string;
  dateTo: string;
} {
  const referenceMonth = referenceDate.getUTCMonth() + 1;
  const seasonYear =
    referenceMonth > bookingSeason.endMonth
      ? referenceDate.getUTCFullYear() + 1
      : referenceDate.getUTCFullYear();
  const seasonStart = new Date(
    Date.UTC(seasonYear, bookingSeason.startMonth - 1, 1)
  );
  const seasonEnd = new Date(Date.UTC(seasonYear, bookingSeason.endMonth, 0));
  const today = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate()
    )
  );

  const dateFrom =
    today < seasonStart || today > seasonEnd ? seasonStart : today;
  const dateTo = new Date(dateFrom);
  dateTo.setUTCDate(dateTo.getUTCDate() + 6);

  return {
    dateFrom: toDateValue(dateFrom),
    dateTo: toDateValue(dateTo > seasonEnd ? seasonEnd : dateTo)
  };
}

function toDateValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseAvailabilityFilters(
  searchParams: Readonly<Record<string, string | string[] | undefined>>
) {
  const defaults = getDefaultAvailabilityRange(new Date());
  const dateFrom = normalizeSearchParamValue(searchParams.dateFrom);
  const dateTo = normalizeSearchParamValue(searchParams.dateTo);
  const tripType = normalizeSearchParamValue(searchParams.tripType);

  const parsedDateFrom = dateFrom && isValidIsoDate(dateFrom) ? dateFrom : defaults.dateFrom;
  const parsedDateTo = dateTo && isValidIsoDate(dateTo) ? dateTo : defaults.dateTo;

  return {
    boatId: normalizeSearchParamValue(searchParams.boatId) ?? undefined,
    tripType:
      tripType && tripTypes.includes(tripType as (typeof tripTypes)[number])
        ? (tripType as (typeof tripTypes)[number])
        : undefined,
    dateFrom: parsedDateFrom,
    dateTo: parsedDateTo >= parsedDateFrom ? parsedDateTo : parsedDateFrom
  };
}

function getCurrentAvailabilityHref(filters: {
  boatId?: string;
  tripType?: string;
  dateFrom: string;
  dateTo: string;
}): string {
  const searchParams = new URLSearchParams();

  if (filters.boatId) {
    searchParams.set("boatId", filters.boatId);
  }

  if (filters.tripType) {
    searchParams.set("tripType", filters.tripType);
  }

  searchParams.set("dateFrom", filters.dateFrom);
  searchParams.set("dateTo", filters.dateTo);

  const query = searchParams.toString();

  return query ? `/availability?${query}` : "/availability";
}

function formatStateLabel(state: "free" | "booking" | "admin"): string {
  if (state === "booking") {
    return "Booking occupied";
  }

  if (state === "admin") {
    return "Admin blocked";
  }

  return "Free";
}

function getStateTone(state: "free" | "booking" | "admin") {
  if (state === "free") {
    return "success";
  }

  if (state === "admin") {
    return "warning";
  }

  return "neutral";
}

export default async function AvailabilityPage({
  searchParams
}: AvailabilityPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseAvailabilityFilters(resolvedSearchParams);
  const feedback = getAvailabilityFeedback(resolvedSearchParams.feedback);
  const [boats, availabilityRows] = await Promise.all([
    listBoats(),
    listAvailabilityState(filters)
  ]);
  const currentHref = getCurrentAvailabilityHref(filters);
  const freeCount = availabilityRows.filter((row) => row.state === "free").length;
  const bookingCount = availabilityRows.filter((row) => row.state === "booking").length;
  const blockedCount = availabilityRows.filter((row) => row.state === "admin").length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Admin Availability"
        title="Availability"
        description="Inspect slot state by boat, date, and trip type, then create or remove admin blocks with transactional writes."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone="success">{freeCount} free</Pill>
          <Pill tone="neutral">{bookingCount} booking occupied</Pill>
          <Pill tone="warning">{blockedCount} admin blocked</Pill>
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

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <ShellCard
          eyebrow="Filters"
          title="Filter slot state"
          description="Inspect slot identity across a simple date range without switching to a calendar UI."
        >
          <form className="grid gap-4 md:grid-cols-2">
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

            <label className="text-sm text-slate-600">
              Trip type
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                defaultValue={filters.tripType ?? ""}
                name="tripType"
              >
                <option value="">All trip types</option>
                {tripTypes.map((tripType) => (
                  <option key={tripType} value={tripType}>
                    {tripTypeLabels[tripType]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-600">
              Date from
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                defaultValue={filters.dateFrom}
                name="dateFrom"
                type="date"
              />
            </label>

            <label className="text-sm text-slate-600">
              Date to
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                defaultValue={filters.dateTo}
                name="dateTo"
                type="date"
              />
            </label>

            <button
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              type="submit"
            >
              Apply filters
            </button>

            <Link
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              href="/availability"
            >
              Reset
            </Link>
          </form>
        </ShellCard>

        <ShellCard
          eyebrow="Create Block"
          title="Block a slot"
          description="Choose a free slot to block. Booking-occupied or already blocked slots are rejected safely."
        >
          <form action={createAvailabilityBlockAction} className="grid gap-4">
            <input name="redirectTo" type="hidden" value={currentHref} />

            <label className="text-sm text-slate-600">
              Boat
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                defaultValue={filters.boatId ?? ""}
                name="boatId"
                required
              >
                <option value="">Select a boat</option>
                {boats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-600">
              Date
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                defaultValue={filters.dateFrom}
                name="date"
                type="date"
                required
              />
            </label>

            <label className="text-sm text-slate-600">
              Trip type
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                defaultValue={filters.tripType ?? ""}
                name="tripType"
                required
              >
                <option value="">Select a trip type</option>
                {tripTypes.map((tripType) => (
                  <option key={tripType} value={tripType}>
                    {tripTypeLabels[tripType]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-600">
              Reason
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                defaultValue=""
                name="reason"
                placeholder="Maintenance, weather hold, private event..."
                required
              />
            </label>

            <button
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              type="submit"
            >
              Create blocked slot
            </button>
          </form>
        </ShellCard>
      </section>

      <ShellCard
        eyebrow="Results"
        title="Slot state"
        description="Free, booking-occupied, and admin-blocked slots for the current filtered window."
      >
        {availabilityRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            No slots match the current filters.
          </div>
        ) : (
          <div className="space-y-4">
            {availabilityRows.map((row) => (
              <div
                key={`${row.boatId}-${row.date}-${row.tripType}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {row.boatName} - {tripTypeLabels[row.tripType]}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{row.date}</p>
                  </div>
                  <Pill tone={getStateTone(row.state)}>
                    {formatStateLabel(row.state)}
                  </Pill>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                  <p>Occupancy ID: {row.occupancyId ?? "None"}</p>
                  <p>Booking ID: {row.bookingId ?? "None"}</p>
                  <p>Block ID: {row.availabilityBlockId ?? "None"}</p>
                  <p>
                    Detail:{" "}
                    {row.state === "booking"
                      ? `${row.bookingCustomerName ?? "Booking"} (${row.bookingStatus ?? "active"})`
                      : row.state === "admin"
                        ? `${row.availabilityBlockReason ?? "Blocked"}`
                        : "Free slot"}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {row.state === "booking" && row.bookingId ? (
                    <Link
                      className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                      href={`/bookings/${row.bookingId}`}
                    >
                      Open booking
                    </Link>
                  ) : null}

                  {row.state === "admin" && row.availabilityBlockId ? (
                    <form action={removeAvailabilityBlockAction}>
                      <input name="availabilityBlockId" type="hidden" value={row.availabilityBlockId} />
                      <input name="redirectTo" type="hidden" value={currentHref} />
                      <button
                        className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                        type="submit"
                      >
                        Remove block
                      </button>
                    </form>
                  ) : null}

                  {row.state === "admin" && row.availabilityBlockCreatedByLabel ? (
                    <p className="text-sm text-slate-500">
                      Blocked by {row.availabilityBlockCreatedByLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </ShellCard>
    </main>
  );
}
