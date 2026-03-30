import {
  boatAmenityLabels,
  formatCurrencyAmount,
  getBoatBookingHref,
  getPriceForBoatAndTripType,
  tripTypeLabels
} from "@boat/domain";
import { listBoats, listPriceRules } from "@boat/db";
import { Pill, SectionHeader, ShellCard, StatCard } from "@boat/ui";

const bookingAppBaseUrl =
  process.env.NEXT_PUBLIC_BOOKING_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "");

const boatThemeClasses = [
  "from-sky-600 via-cyan-500 to-emerald-400",
  "from-slate-950 via-sky-900 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-400"
] as const;

const experienceHighlights = [
  {
    title: "Curated premium fleet",
    description:
      "Each boat is presented with clear capacity, amenities, and destinations so guests can choose confidently."
  },
  {
    title: "Fast request-to-confirm flow",
    description:
      "Guests submit one clean request, the team reviews it, and the slot stays protected while confirmation is pending."
  },
  {
    title: "Built for day escapes",
    description:
      "Half-day, full-day, and sunset trips keep the offer simple, believable, and easy to present in a demo."
  }
] as const;

const tripTypePanels = [
  {
    id: "half_day",
    title: "Half day",
    description:
      "A short, easy departure for swimming stops, nearby beaches, and a relaxed first taste of the island.",
    detail: "Best for quick escapes and flexible itineraries."
  },
  {
    id: "full_day",
    title: "Full day",
    description:
      "More time on the water for multiple destinations, slower cruising, and a fuller charter experience.",
    detail: "Best for island hopping and longer swim breaks."
  },
  {
    id: "sunset_cruise",
    title: "Sunset cruise",
    description:
      "A simple premium evening plan with warm light, calm pace, and a stronger emotional hook for the landing page.",
    detail: "Best for couples, special occasions, and golden-hour routes."
  }
] as const;

const bookingSteps = [
  {
    step: "01",
    title: "Explore the fleet",
    description:
      "Compare boats, trip styles, and destinations, then jump into booking with a boat already selected."
  },
  {
    step: "02",
    title: "Pick date and trip",
    description:
      "The booking page surfaces live slot state and saved pricing so guests know whether the combination is available."
  },
  {
    step: "03",
    title: "Send the request",
    description:
      "The system creates a real pending booking and holds the slot while the team confirms manually."
  }
] as const;

export default async function SitePage() {
  const [boats, priceRules] = await Promise.all([listBoats(), listPriceRules()]);
  const fromPrice = priceRules
    .map((rule) => rule.amount)
    .sort((leftAmount, rightAmount) => leftAmount - rightAmount)[0];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#e0f2fe_0%,#f8fafc_24%,#fff7ed_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-8 sm:gap-16 sm:py-10 lg:px-8">
        <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#082f49_0%,#0f172a_46%,#155e75_100%)] px-6 py-8 text-white shadow-[0_30px_90px_-40px_rgba(8,47,73,0.85)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Pill tone="neutral">Boat Rental Fleet</Pill>
                <Pill tone="neutral">Private day charters</Pill>
                <Pill tone="neutral">Human confirmation</Pill>
              </div>
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
                  Premium Ithaca Demo
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Premium boat days around Ithaca, with a booking flow guests can actually use.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-sky-50/85 sm:text-base">
                  Present a polished charter brand, surface the fleet clearly, and move visitors straight into a live booking request flow with real pricing and availability checks.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-medium text-slate-950 transition hover:bg-sky-50"
                  href={`${bookingAppBaseUrl}${getBoatBookingHref()}`}
                >
                  Start booking
                </a>
                <a
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/20"
                  href="#fleet"
                >
                  Explore the fleet
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Fleet
                </p>
                <p className="mt-3 text-3xl font-semibold">{boats.length} boats</p>
                <p className="mt-3 text-sm leading-6 text-sky-50/80">
                  Clear private-charter options with preselected booking links from every card.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Pricing
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {fromPrice ? formatCurrencyAmount(fromPrice) : "Live"}
                </p>
                <p className="mt-3 text-sm leading-6 text-sky-50/80">
                  Reference pricing is already wired into the booking app and admin pricing controls.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Workflow
                </p>
                <p className="mt-3 text-3xl font-semibold">Pending first</p>
                <p className="mt-3 text-sm leading-6 text-sky-50/80">
                  Every request creates a real pending booking, then the operator confirms manually.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            detail="A concise premium fleet demo with believable charter data."
            label="Experience"
            tone="accent"
            value="Premium day charters"
          />
          <StatCard
            detail="The booking flow is seasonal and keeps the operation in control."
            label="Season"
            tone="success"
            value="May through September"
          />
          <StatCard
            detail="Half day, full day, and sunset options are already built into the product."
            label="Trip types"
            tone="warning"
            value="3 curated modes"
          />
          <StatCard
            detail="Public booking stays simple while admin management remains fully protected."
            label="Operations"
            tone="neutral"
            value="Manual confirmation"
          />
        </section>

        <section className="space-y-6">
          <SectionHeader
            align="center"
            eyebrow="Why This Works"
            title="A cleaner premium pitch before the guest ever reaches the form."
            description="The landing page leads with trust, quality, and simplicity, then gives visitors a direct path into the live booking experience."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {experienceHighlights.map((highlight) => (
              <div
                key={highlight.title}
                className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]"
              >
                <p className="text-lg font-semibold tracking-tight text-slate-950">
                  {highlight.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6" id="fleet">
          <SectionHeader
            eyebrow="Fleet Showcase"
            title="Choose the boat that fits the day."
            description="Every fleet card keeps the charter pitch readable, the amenities obvious, and the booking path one tap away."
            aside={<Pill tone="accent">Book directly from any boat</Pill>}
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {boats.map((boat, index) => {
              const basePriceRule = getPriceForBoatAndTripType(
                boat.id,
                "half_day",
                priceRules
              );
              const themeClass = boatThemeClasses[index % boatThemeClasses.length];

              return (
                <article
                  key={boat.id}
                  className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]"
                >
                  <div className={`bg-gradient-to-br ${themeClass} px-6 py-6 text-white`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                          Private charter
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                          {boat.name}
                        </h3>
                      </div>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white">
                        Capacity {boat.capacity}
                      </span>
                    </div>
                    <p className="mt-5 text-sm leading-7 text-white/85">
                      {boat.shortDescription}
                    </p>
                    <p className="mt-5 text-sm font-medium text-white/90">
                      {basePriceRule
                        ? `From ${formatCurrencyAmount(basePriceRule.amount)} for a half-day trip.`
                        : "Pricing is available inside the booking flow."}
                    </p>
                  </div>

                  <div className="space-y-5 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Key amenities
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {boat.amenities.map((amenity) => (
                            <Pill key={amenity}>{boatAmenityLabels[amenity]}</Pill>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Trip types
                        </p>
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
                      <p className="text-sm font-semibold text-slate-900">
                        Destinations
                      </p>
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

                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Ready to continue?
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Open the booking flow with {boat.name} already selected.
                        </p>
                      </div>
                      <a
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                        href={`${bookingAppBaseUrl}${getBoatBookingHref(boat.slug)}`}
                      >
                        Book now
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeader
            align="center"
            eyebrow="Trip Types"
            title="Three simple trip modes, easy to understand at a glance."
            description="The offer stays intentionally clear so the landing page feels premium without becoming noisy."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {tripTypePanels.map((panel) => (
              <ShellCard
                key={panel.id}
                eyebrow={panel.title}
                title={panel.title}
                description={panel.description}
              >
                <p className="text-sm leading-7 text-slate-600">{panel.detail}</p>
              </ShellCard>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeader
            align="center"
            eyebrow="Booking Process"
            title="How booking works in this demo."
            description="The public experience stays straightforward while still using the real write path, slot occupancy, and admin review workflow."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {bookingSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                  {step.step}
                </p>
                <p className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                  {step.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0f172a_0%,#164e63_100%)] px-6 py-8 text-white shadow-[0_26px_80px_-40px_rgba(15,23,42,0.8)] sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
                Final CTA
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Move from browsing into a real booking request in one step.
              </h2>
              <p className="mt-4 text-sm leading-7 text-sky-50/80 sm:text-[15px]">
                Keep the premium pitch on the homepage, then hand the guest into the booking app with live availability checks, saved pricing, and pending confirmation messaging.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-medium text-slate-950 transition hover:bg-sky-50"
                href={`${bookingAppBaseUrl}${getBoatBookingHref()}`}
              >
                Open booking app
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/20"
                href="#fleet"
              >
                Review fleet again
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
