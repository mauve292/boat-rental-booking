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
  listBoats,
  listPriceRules
} from "@boat/db";
import type { SearchParamsRecord } from "@boat/types";
import { Pill, ShellCard } from "@boat/ui";
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
  const { initialDate, minDate, maxDate } = getSeasonDateBounds(
    new Date(),
    appSettings.bookingSeason
  );
  const availabilitySnapshot = await getAvailabilitySnapshot({
    date: initialDate,
    boatId: selectedBoat?.id
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Booking App"
        title="Boat Booking"
        description="Public booking requests now submit server-side, create real pending bookings, and reserve their slot immediately with SlotOccupancy."
      >
        <div className="flex flex-wrap gap-3">
          {selectedBoat ? (
            <Pill tone="accent">Preselected: {selectedBoat.name}</Pill>
          ) : (
            <Pill>Manual boat selection enabled</Pill>
          )}
          <Pill tone="success">Season: {appSettings.bookingSeason.label}</Pill>
          <Pill tone="accent">New requests start as pending</Pill>
          {rawBoatSlug && !selectedBoatState.isValid ? (
            <Pill tone="warning">Unknown boat slug: {rawBoatSlug}</Pill>
          ) : null}
        </div>
      </ShellCard>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ShellCard
          eyebrow="Selector"
          title="Choose a boat"
          description={
            selectedBoat
              ? "The current query param resolved to a valid boat. The form stays locked to that boat unless you switch it here."
              : `No valid ${bookingQueryKeys.boat} query param is set, so the form stays open for manual boat selection.`
          }
        >
          <div className="flex flex-wrap gap-3">
            <Link
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedBoat
                  ? "border-slate-300 text-slate-700 hover:border-slate-400"
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
                    : "border-slate-300 text-slate-700 hover:border-slate-400"
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
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {boat.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {boat.shortDescription}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Capacity {boat.capacity}
                </p>
              </div>
            ))}
          </div>
        </ShellCard>

        <ShellCard
          eyebrow="Trip Types"
          title="Available trip modes"
          description={
            selectedBoat
              ? "Trip choices are filtered to the currently selected boat."
              : "Choose a boat in the form to unlock the trip types supported for that vessel."
          }
        >
          <div className="flex flex-wrap gap-2">
            {visibleTripTypes.map((tripType) => (
              <Pill key={tripType} tone="accent">
                {tripTypeLabels[tripType]}
              </Pill>
            ))}
            {!selectedBoat ? <Pill tone="warning">Pick a boat to continue</Pill> : null}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Booking dates currently open for {minDate} through {maxDate}. Final
            availability is checked server-side when the booking is submitted.
          </p>
        </ShellCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ShellCard
          eyebrow="Availability"
          title="Initial slot snapshot"
          description={`Database-backed slot state for ${initialDate}. A slot is unavailable when a non-cancelled booking or an admin block already occupies it.`}
        >
          <div className="space-y-4">
            {availabilitySnapshot.map((availabilityRow) => (
              <div
                key={availabilityRow.boat.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {availabilityRow.boat.name}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
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
        </ShellCard>

        <ShellCard
          eyebrow="Booking Form"
          title="Request a booking"
          description="Required fields are full name, email, mobile / phone, boat, date, and trip type. Payment is still informational only in this step."
        >
          <BookingForm
            boats={boats}
            initialBoatId={selectedBoat?.id ?? null}
            initialDate={initialDate}
            maxDate={maxDate}
            minDate={minDate}
            priceRules={priceRules}
            seasonSettings={appSettings.bookingSeason}
          />
        </ShellCard>
      </section>

      <ShellCard
        eyebrow="Pricing"
        title="Fleet pricing reference"
        description="Boat and trip-type pricing remains shared and DB-backed. The form shows the live selected price while this table keeps the broader context."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(selectedBoat ? [selectedBoat] : boats).map((boat) => (
            <div
              key={boat.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-semibold text-slate-900">{boat.name}</p>
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
                          ? formatCurrencyAmount(priceRule.amount, priceRule.currency)
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
    </main>
  );
}
