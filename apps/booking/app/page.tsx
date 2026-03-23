import {
  availabilityBlocks,
  boats,
  bookingQueryKeys,
  bookingSeason,
  getBoatBookingHref,
  getPriceForBoatAndTripType,
  getSlotBlockReason,
  getSupportedTripTypesForBoat,
  isDateWithinSeason,
  parseSelectedBoatFromSearchParams,
  sampleBookings,
  tripTypeLabels
} from "@boat/domain";
import type { SearchParamsRecord } from "@boat/types";
import { Pill, ShellCard } from "@boat/ui";
import { parseBoatQueryParam } from "@boat/validation";
import Link from "next/link";

const sampleAvailabilityDate = "2026-06-15";

type BookingPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function BookingPage({
  searchParams
}: BookingPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawBoatSlug = parseBoatQueryParam(resolvedSearchParams);
  const selectedBoatState = parseSelectedBoatFromSearchParams(
    resolvedSearchParams
  );
  const selectedBoat = selectedBoatState.boat;
  const visibleTripTypes = getSupportedTripTypesForBoat(selectedBoat);
  const boatsForAvailability = selectedBoat ? [selectedBoat] : boats;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Booking App"
        title="Boat Booking"
        description="Slot-based booking shell with boat preselection, seasonal context, and mock availability. Submission and persistence are intentionally not implemented yet."
      >
        <div className="flex flex-wrap gap-3">
          {selectedBoat ? (
            <Pill tone="accent">Preselected: {selectedBoat.name}</Pill>
          ) : (
            <Pill>Generic booking entry</Pill>
          )}
          <Pill
            tone={
              isDateWithinSeason(sampleAvailabilityDate) ? "success" : "warning"
            }
          >
            Season: {bookingSeason.label}
          </Pill>
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
              ? "The current query param resolved to a valid boat and is reflected below."
              : `No valid ${bookingQueryKeys.boat} query param is set, so the page is showing the generic booking entry state.`
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
          description="Trip choices are filtered by the selected boat. With no preselected boat, all supported trip types stay visible."
        >
          <div className="flex flex-wrap gap-2">
            {visibleTripTypes.map((tripType) => (
              <Pill key={tripType} tone="accent">
                {tripTypeLabels[tripType]}
              </Pill>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            The season currently runs from {bookingSeason.label}. Outside that
            range, future availability logic can reject dates before any
            database lookup is needed.
          </p>
        </ShellCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ShellCard
          eyebrow="Availability"
          title="Sample slot availability"
          description={`Mock slot state for ${sampleAvailabilityDate}. A slot is blocked when an active booking or manual admin block already occupies it.`}
        >
          <div className="space-y-4">
            {boatsForAvailability.map((boat) => (
              <div
                key={boat.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {boat.name}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getSupportedTripTypesForBoat(boat).map((tripType) => {
                    const blockedBy = getSlotBlockReason(
                      {
                        boatId: boat.id,
                        date: sampleAvailabilityDate,
                        tripType
                      },
                      sampleBookings,
                      availabilityBlocks
                    );

                    return (
                      <Pill
                        key={`${boat.id}-${tripType}`}
                        tone={
                          blockedBy === null
                            ? "success"
                            : blockedBy === "admin"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {tripTypeLabels[tripType]}:{" "}
                        {blockedBy === null
                          ? "Available"
                          : blockedBy === "admin"
                            ? "Admin blocked"
                            : "Booked"}
                      </Pill>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ShellCard>

        <ShellCard
          eyebrow="Form Draft"
          title="Placeholder booking form"
          description="Field layout only. Submission, payment, auth, and server persistence will be added in later steps."
        >
          <form className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Boat
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                disabled
                readOnly
                value={selectedBoat?.name ?? "Select during booking flow"}
              />
            </label>
            <label className="text-sm text-slate-600">
              Trip type
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                disabled
                readOnly
                value={visibleTripTypes
                  .map((tripType) => tripTypeLabels[tripType])
                  .join(", ")}
              />
            </label>
            <label className="text-sm text-slate-600">
              Date
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                disabled
                readOnly
                value="YYYY-MM-DD"
              />
            </label>
            <label className="text-sm text-slate-600">
              Party size
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                disabled
                readOnly
                value={selectedBoat ? `1-${selectedBoat.capacity}` : "Choose a boat first"}
              />
            </label>
            <label className="text-sm text-slate-600">
              Full name
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                disabled
                readOnly
                value="Guest full name"
              />
            </label>
            <label className="text-sm text-slate-600">
              Email
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                disabled
                readOnly
                value="guest@example.com"
              />
            </label>
            <label className="text-sm text-slate-600">
              Phone
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                disabled
                readOnly
                value="+30 690 ..."
              />
            </label>
            <label className="text-sm text-slate-600 sm:col-span-2">
              Notes
              <textarea
                className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                disabled
                readOnly
                value="Share timing preferences, destination ideas, or passenger notes here."
              />
            </label>
            <div className="sm:col-span-2">
              <button
                className="inline-flex items-center rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                disabled
                type="button"
              >
                Submission not enabled yet
              </button>
            </div>
          </form>
        </ShellCard>
      </section>

      <ShellCard
        eyebrow="Pricing Sample"
        title="Mock pricing view"
        description="Each boat and trip type pair already has a shared price rule in the domain package."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {boatsForAvailability.map((boat) => (
            <div
              key={boat.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-semibold text-slate-900">{boat.name}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {getSupportedTripTypesForBoat(boat).map((tripType) => {
                  const priceRule = getPriceForBoatAndTripType(boat.id, tripType);

                  return (
                    <li key={`${boat.id}-${tripType}`}>
                      <span className="font-medium text-slate-800">
                        {tripTypeLabels[tripType]}
                      </span>
                      {" - "}
                      <span>
                        {priceRule ? priceRule.label : "Pricing unavailable"}
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
