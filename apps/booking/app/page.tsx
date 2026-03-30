import {
  bookingQueryKeys,
  formatCurrencyAmount,
  getBoatBookingHref,
  getPriceForBoatAndTripType,
  getSupportedTripTypesForBoat,
  parseSelectedBoatFromSearchParams,
  type BookingSeasonSettings,
  tripTypeLabels
} from "@boat/domain";
import {
  getAppSettings,
  getAvailabilitySnapshot,
  isDatabaseConfigured,
  listBoats,
  listPriceRules
} from "@boat/db";
import type { SearchParamsRecord } from "@boat/types";
import {
  EmptyState,
  Pill,
  SectionHeader,
  ShellCard,
  StatCard
} from "@boat/ui";
import { parseBoatQueryParam } from "@boat/validation";
import Link from "next/link";
import { BookingForm } from "./booking-form";

export const dynamic = "force-dynamic";

type BookingPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

function getSeasonDateBounds(
  referenceDate: Date,
  season: BookingSeasonSettings
): {
  minDate: string;
  maxDate: string;
  initialDate: string;
} {
  const referenceMonth = referenceDate.getUTCMonth() + 1;
  const seasonYear =
    referenceMonth > season.endMonth
      ? referenceDate.getUTCFullYear() + 1
      : referenceDate.getUTCFullYear();
  const minDate = `${seasonYear}-${String(season.startMonth).padStart(2, "0")}-01`;
  const maxDate = new Date(Date.UTC(seasonYear, season.endMonth, 0))
    .toISOString()
    .slice(0, 10);
  const today = referenceDate.toISOString().slice(0, 10);
  const initialDate =
    today < minDate || today > maxDate ? minDate : today;

  return {
    minDate,
    maxDate,
    initialDate
  };
}

export default async function BookingPage({
  searchParams
}: BookingPageProps) {
  const resolvedSearchParams = await searchParams;
  const [boats, priceRules, appSettings] = await Promise.all([
    listBoats(),
    listPriceRules(),
    getAppSettings()
  ]);
  const rawBoatSlug = parseBoatQueryParam(resolvedSearchParams);
  const selectedBoatState = parseSelectedBoatFromSearchParams(
    resolvedSearchParams,
    boats
  );
  const selectedBoat = selectedBoatState.boat;
  const visibleTripTypes = getSupportedTripTypesForBoat(selectedBoat);
  const bookingPersistenceAvailable = isDatabaseConfigured();
  const { initialDate, minDate, maxDate } = getSeasonDateBounds(
    new Date(),
    appSettings.bookingSeason
  );
  const availabilitySnapshot = bookingPersistenceAvailable
    ? await getAvailabilitySnapshot({
        date: initialDate,
        boatId: selectedBoat?.id
      })
    : [];
  const visiblePricingBoats = selectedBoat ? [selectedBoat] : boats;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#e0f2fe_0%,#f8fafc_24%,#fff7ed_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-8 sm:gap-14 sm:py-10 lg:px-8">
        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#082f49_0%,#0f172a_48%,#155e75_100%)] px-6 py-8 text-white shadow-[0_30px_90px_-40px_rgba(8,47,73,0.85)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {selectedBoat ? (
                  <Pill tone="neutral">Preselected: {selectedBoat.name}</Pill>
                ) : (
                  <Pill tone="neutral">Manual boat selection enabled</Pill>
                )}
                <Pill tone="neutral">Season: {appSettings.bookingSeason.label}</Pill>
                <Pill tone="neutral">Requests start as pending</Pill>
                {rawBoatSlug && !selectedBoatState.isValid ? (
                  <Pill tone="neutral">Unknown boat slug: {rawBoatSlug}</Pill>
                ) : null}
              </div>
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
                  Booking App
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Reserve the right boat without losing clarity on price or availability.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-sky-50/80 sm:text-base">
                  This public booking flow uses the real write path, shows live slot state, and keeps the guest informed that every request is received first as pending confirmation.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-medium text-slate-950 transition hover:bg-sky-50"
                  href={getBoatBookingHref()}
                >
                  Browse boats again
                </Link>
                <a
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/20"
                  href="#booking-form"
                >
                  Jump to the form
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Submission
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {bookingPersistenceAvailable ? "Live" : "Disabled"}
                </p>
                <p className="mt-3 text-sm leading-6 text-sky-50/80">
                  {bookingPersistenceAvailable
                    ? "Slot checks and pending-booking creation are active."
                    : "The page still renders, but real booking writes stay disabled."}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Boat focus
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {selectedBoat ? selectedBoat.name : "Any boat"}
                </p>
                <p className="mt-3 text-sm leading-6 text-sky-50/80">
                  {selectedBoat
                    ? "The form opens with this boat already selected, but stays editable."
                    : "Guests can arrive here with or without a preselected boat."}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Season
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {appSettings.bookingSeason.label}
                </p>
                <p className="mt-3 text-sm leading-6 text-sky-50/80">
                  Selectable dates currently run from {minDate} through {maxDate}.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            detail="The same season window used for public validation and admin settings."
            label="Season window"
            tone="success"
            value={appSettings.bookingSeason.label}
          />
          <StatCard
            detail="Boat, date, and trip type combine into one slot identity."
            label="Slot model"
            tone="accent"
            value="Boat + date + trip"
          />
          <StatCard
            detail="Blocked and already-booked slots are surfaced before the guest submits."
            label="Availability"
            tone="warning"
            value="Live slot checks"
          />
          <StatCard
            detail="Pricing shown here is pulled from the real shared pricing matrix."
            label="Pricing"
            tone="neutral"
            value="DB-backed display"
          />
        </section>

        <section className="space-y-6">
          <SectionHeader
            eyebrow="Plan The Day"
            title="Choose a boat, understand the trip options, then move straight into booking."
            description={
              selectedBoat
                ? "The current query parameter resolved to a valid boat, but the guest can still change it inside the form."
                : `No valid ${bookingQueryKeys.boat} query parameter is set, so the booking flow stays fully open for manual selection.`
            }
            aside={
              <Pill tone="accent">
                {selectedBoat ? "Specific boat selected" : "Open fleet selection"}
              </Pill>
            }
          />

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <ShellCard
              eyebrow="Boat Selector"
              title="Choose a starting point"
              description="Use the fleet shortcuts below to switch context quickly before filling out the booking form."
            >
              <div className="flex flex-wrap gap-3">
                <Link
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selectedBoat
                      ? "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                      : "border-slate-950 bg-slate-950 text-white"
                  }`}
                  href={getBoatBookingHref()}
                >
                  Any boat
                </Link>
                {boats.map((boat) => (
                  <Link
                    key={boat.id}
                    className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selectedBoat?.id === boat.id
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                    href={getBoatBookingHref(boat.slug)}
                  >
                    {boat.name}
                  </Link>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(selectedBoat ? [selectedBoat] : boats).map((boat) => (
                  <div
                    key={boat.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-base font-semibold text-slate-900">
                      {boat.name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {boat.shortDescription}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Pill tone="neutral">Capacity {boat.capacity}</Pill>
                      {boat.supportedTripTypes.map((tripType) => (
                        <Pill key={`${boat.id}-${tripType}`} tone="accent">
                          {tripTypeLabels[tripType]}
                        </Pill>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ShellCard>

            <ShellCard
              eyebrow="Trip Modes"
              title="Available trip styles"
              description={
                selectedBoat
                  ? "Trip choices shown here match the currently selected boat."
                  : "Choose a boat in the form to see the supported trip types for that vessel."
              }
            >
              <div className="flex flex-wrap gap-2">
                {visibleTripTypes.map((tripType) => (
                  <Pill key={tripType} tone="accent">
                    {tripTypeLabels[tripType]}
                  </Pill>
                ))}
                {!selectedBoat ? (
                  <Pill tone="warning">Pick a boat to continue</Pill>
                ) : null}
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Booking notes
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>1. Dates are currently open from {minDate} to {maxDate}.</li>
                  <li>2. Live availability highlights blocked and already-booked slots.</li>
                  <li>3. Payment stays mock-only, but submission writes a real pending booking.</li>
                </ul>
              </div>
            </ShellCard>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]" id="booking-form">
          <div className="space-y-6">
            <ShellCard
              eyebrow="Live Availability"
              title="Current slot snapshot"
              description={
                bookingPersistenceAvailable
                  ? `Database-backed slot state for ${initialDate}. A slot is unavailable when a non-cancelled booking or an admin block already occupies it.`
                  : "Live slot state requires a configured database, so this view stays disabled until booking persistence is available."
              }
            >
              {bookingPersistenceAvailable ? (
                availabilitySnapshot.length > 0 ? (
                  <div className="space-y-4">
                    {availabilitySnapshot.map((availabilityRow) => (
                      <div
                        key={availabilityRow.boat.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <p className="text-base font-semibold text-slate-900">
                          {availabilityRow.boat.name}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {availabilityRow.slots.map((slot) => (
                            <Pill
                              key={`${availabilityRow.boat.id}-${slot.tripType}`}
                              tone={
                                slot.blockedBy === null
                                  ? "success"
                                  : slot.blockedBy === "admin"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {tripTypeLabels[slot.tripType]}:{" "}
                              {slot.blockedBy === null
                                ? "Available"
                                : slot.blockedBy === "admin"
                                  ? "Admin blocked"
                                  : "Booked"}
                            </Pill>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    description="No boats matched the current preselection, so there is no initial slot snapshot to render."
                    title="No snapshot rows"
                  />
                )
              ) : (
                <EmptyState
                  description="Configure `DATABASE_URL` to enable live slot snapshots and real booking submission."
                  title="Live booking state unavailable"
                />
              )}
            </ShellCard>

            <ShellCard
              eyebrow="Pricing"
              title="Fleet pricing reference"
              description="Saved boat and trip-type pricing stays visible here while the selected amount is highlighted inside the form."
            >
              <div className="space-y-4">
                {visiblePricingBoats.map((boat) => (
                  <div
                    key={boat.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-base font-semibold text-slate-900">
                      {boat.name}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {getSupportedTripTypesForBoat(boat).map((tripType) => {
                        const priceRule = getPriceForBoatAndTripType(
                          boat.id,
                          tripType,
                          priceRules
                        );

                        return (
                          <li key={`${boat.id}-${tripType}`}>
                            <span className="font-medium text-slate-800">
                              {tripTypeLabels[tripType]}
                            </span>
                            {" - "}
                            <span>
                              {priceRule
                                ? formatCurrencyAmount(
                                    priceRule.amount,
                                    priceRule.currency
                                  )
                                : "Pricing unavailable"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </ShellCard>
          </div>

          <ShellCard
            eyebrow="Booking Form"
            title="Send a booking request"
            description="Required fields are full name, email, mobile or phone, boat, date, and trip type. Payment remains informational only in this phase."
          >
            <BookingForm
              boats={boats}
              initialBoatId={selectedBoat?.id ?? null}
              initialDate={initialDate}
              maxDate={maxDate}
              minDate={minDate}
              bookingPersistenceAvailable={bookingPersistenceAvailable}
              priceRules={priceRules}
              seasonSettings={appSettings.bookingSeason}
            />
          </ShellCard>
        </section>
      </div>
    </main>
  );
}
