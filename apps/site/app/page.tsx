import {
  boatAmenityLabels,
  formatCurrencyAmount,
  getBoatBookingHref,
  getPriceForBoatAndTripType,
  tripTypeLabels
} from "@boat/domain";
import { listBoats, listPriceRules } from "@boat/db";
import { Pill, ShellCard, StatCard } from "@boat/ui";

const bookingAppBaseUrl =
  process.env.NEXT_PUBLIC_BOOKING_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "");

const boatThemeClasses = [
  "from-sky-500 via-cyan-500 to-emerald-400",
  "from-slate-900 via-sky-800 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-400"
] as const;

export default async function SitePage() {
  const [boats, priceRules] = await Promise.all([listBoats(), listPriceRules()]);
  const fromPrice = priceRules
    .map((rule) => rule.amount)
    .sort((leftAmount, rightAmount) => leftAmount - rightAmount)[0];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f8fafc_42%,#fff7ed_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:py-16">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ShellCard
            eyebrow="Ithaca Fleet"
            title="Premium day boats, simple booking flow"
            description="Show the fleet, hand visitors into the booking app with a preselected boat, and demonstrate a real pending-booking workflow without slowing the page down."
          >
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Pill tone="accent">Curated fleet</Pill>
                <Pill tone="success">Human confirmation before departure</Pill>
                <Pill tone="warning">Seasonal booking window</Pill>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Designed for quick demos and clear conversion: visitors can compare boats,
                see indicative pricing, and move straight into the booking app with one click.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                  href={`${bookingAppBaseUrl}${getBoatBookingHref()}`}
                >
                  Book any available boat
                </a>
                <a
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                  href="#fleet"
                >
                  Explore the fleet
                </a>
              </div>
            </div>
          </ShellCard>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard
              detail="Ready to hand off into the booking app with or without preselection."
              label="Fleet"
              tone="accent"
              value={`${boats.length} boats`}
            />
            <StatCard
              detail="Visible reference pricing keeps the demo grounded in real commercial data."
              label="From"
              tone="success"
              value={fromPrice ? formatCurrencyAmount(fromPrice) : "Pricing live"}
            />
            <StatCard
              detail="Requests are received as pending so the operator stays in control."
              label="Workflow"
              tone="warning"
              value="Pending first"
            />
          </div>
        </section>

        <section
          className="flex flex-wrap items-center justify-between gap-4"
          id="fleet"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Fleet Overview
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Choose the right boat for the trip
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              Each card keeps the booking CTA obvious while still giving enough detail for a believable customer-facing demo.
            </p>
          </div>
          <Pill tone="accent">Book now flow stays one tap away</Pill>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {boats.map((boat) => {
            const basePriceRule = getPriceForBoatAndTripType(
              boat.id,
              "half_day",
              priceRules
            );
            const themeClass =
              boatThemeClasses[
                boats.findIndex((item) => item.id === boat.id) %
                  boatThemeClasses.length
              ];

            return (
              <ShellCard
                key={boat.id}
                eyebrow="Private charter"
                title={boat.name}
                description={boat.shortDescription}
              >
                <div className="space-y-5">
                  <div
                    className={`rounded-2xl bg-gradient-to-br ${themeClass} p-5 text-white shadow-sm`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                          Featured boat
                        </p>
                        <p className="mt-3 text-2xl font-semibold tracking-tight">
                          {boat.name}
                        </p>
                      </div>
                      <Pill tone="neutral">Capacity {boat.capacity}</Pill>
                    </div>
                    <p className="mt-5 text-sm text-white/85">
                      {basePriceRule
                        ? `From ${formatCurrencyAmount(basePriceRule.amount)} for a half-day escape.`
                        : "Pricing available inside the booking flow."}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Amenities
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {boat.amenities.map((amenity) => (
                          <Pill key={amenity}>{boatAmenityLabels[amenity]}</Pill>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Trip types
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {boat.supportedTripTypes.map((tripType) => (
                          <Pill key={tripType} tone="accent">
                            {tripTypeLabels[tripType]}
                          </Pill>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Destinations
                    </h3>
                    <ul className="mt-3 space-y-3 text-sm text-slate-600">
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

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Ready to continue?
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Open the booking flow with {boat.name} already selected.
                      </p>
                    </div>
                    <a
                      className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                      href={`${bookingAppBaseUrl}${getBoatBookingHref(boat.slug)}`}
                    >
                      Book now
                    </a>
                  </div>
                </div>
              </ShellCard>
            );
          })}
        </section>
      </div>
    </main>
  );
}
