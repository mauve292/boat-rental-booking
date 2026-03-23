import {
  boatAmenityLabels,
  boats,
  formatCurrencyAmount,
  getBoatBookingHref,
  getPriceForBoatAndTripType,
  tripTypeLabels
} from "@boat/domain";
import { Pill, ShellCard } from "@boat/ui";

const bookingAppBaseUrl =
  process.env.NEXT_PUBLIC_BOOKING_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "");

export default function SitePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Public Site"
        title="Boat Rental Fleet"
        description="Explore the current mock fleet and hand off into the booking app with a preselected boat. Data is shared from the domain package and remains mock-only for now."
      >
        <div className="flex flex-wrap gap-3">
          <Pill tone="accent">3 boats</Pill>
          <Pill tone="accent">May to September season</Pill>
          <a
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            href={`${bookingAppBaseUrl}${getBoatBookingHref()}`}
          >
            Start generic booking
          </a>
        </div>
      </ShellCard>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {boats.map((boat) => {
          const basePriceRule = getPriceForBoatAndTripType(boat.id, "half_day");

          return (
            <ShellCard
              key={boat.id}
              eyebrow={boat.image.alt}
              title={boat.name}
              description={boat.shortDescription}
            >
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Pill tone="accent">Capacity {boat.capacity}</Pill>
                  {basePriceRule ? (
                    <Pill>{formatCurrencyAmount(basePriceRule.amount)}</Pill>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Amenities
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {boat.amenities.map((amenity) => (
                      <Pill key={amenity}>{boatAmenityLabels[amenity]}</Pill>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Destinations
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {boat.destinations.map((destination) => (
                      <li key={destination.id}>
                        <span className="font-medium text-slate-800">
                          {destination.name}
                        </span>{" "}
                        <span>{destination.summary}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Supported trip types
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {boat.supportedTripTypes.map((tripType) => (
                      <Pill key={tripType} tone="accent">
                        {tripTypeLabels[tripType]}
                      </Pill>
                    ))}
                  </div>
                </div>

                <a
                  className="inline-flex items-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  href={`${bookingAppBaseUrl}${getBoatBookingHref(boat.slug)}`}
                >
                  Book now
                </a>
              </div>
            </ShellCard>
          );
        })}
      </section>
    </main>
  );
}
