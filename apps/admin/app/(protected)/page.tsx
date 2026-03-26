import {
  adminNavItems,
  bookingSourceLabels,
  bookingStatusLabels,
  getBoatById,
  getMonthLabel,
  notificationSummaryMock,
  tripTypeLabels
} from "@boat/domain";
import {
  countPendingBookings,
  getAppSettings,
  listAvailabilityBlocks,
  listBoats,
  listRecentBookings
} from "@boat/db";
import { EmptyState, Pill, ShellCard, StatCard } from "@boat/ui";
import Link from "next/link";

export default async function AdminPage() {
  const [
    boats,
    pendingBookingsCount,
    recentBookings,
    availabilityBlocks,
    appSettings
  ] = await Promise.all([
    listBoats(),
    countPendingBookings(),
    listRecentBookings(3),
    listAvailabilityBlocks(3),
    getAppSettings()
  ]);
  const actionableNavItems = adminNavItems.filter((item) =>
    item.href.startsWith("/")
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Admin App"
        title="Admin control panel"
        description="Monitor incoming demand, open the core management routes quickly, and keep bookings, availability, pricing, and settings aligned from one protected workspace."
      >
        <div className="flex flex-wrap gap-3">
          <Pill tone="warning">{pendingBookingsCount} pending bookings</Pill>
          <Pill tone="accent">{notificationSummaryMock.total} attention items</Pill>
          <Pill>{notificationSummaryMock.blockedSlots} blocked slots</Pill>
          <Pill tone="success">Season: {appSettings.bookingSeason.label}</Pill>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            href="/bookings"
          >
            Review bookings
          </Link>
          <Link
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            href="/availability"
          >
            Manage availability
          </Link>
          <Link
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            href="/pricing"
          >
            Update pricing
          </Link>
          <Link
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            href="/settings"
          >
            Open settings
          </Link>
        </div>
      </ShellCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="Items waiting for review from the public booking flow."
          label="Pending"
          tone="warning"
          value={String(pendingBookingsCount)}
        />
        <StatCard
          detail="Fleet records currently visible in the admin workspace."
          label="Fleet"
          tone="accent"
          value={String(boats.length)}
        />
        <StatCard
          detail="Blocked slots and pending-booking alerts are still grouped here for demo clarity."
          label="Attention"
          tone="neutral"
          value={String(notificationSummaryMock.total)}
        />
        <StatCard
          detail={`Primary contact: ${appSettings.contactEmail}`}
          label="Season"
          tone="success"
          value={appSettings.bookingSeason.label}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actionableNavItems.map((item) => (
          <ShellCard
            key={item.id}
            eyebrow={item.href}
            title={item.label}
            description={item.description}
          >
            <div className="flex items-start justify-between gap-4">
              <Pill tone={item.id === "settings" ? "neutral" : "accent"}>
                {item.label}
              </Pill>
              <Link
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                href={item.href}
              >
                Open
              </Link>
            </div>
          </ShellCard>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ShellCard
          eyebrow="Recent Bookings"
          title="Latest booking activity"
          description="Recent requests and reservations from the shared repository layer, ready to open directly into the detail workflow."
        >
          {recentBookings.length === 0 ? (
            <EmptyState
              description="As soon as the first public or admin booking is created, it will appear here for quick review."
              title="No bookings yet"
            />
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => {
                const boat = getBoatById(booking.boatId, boats);

                return (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {booking.customerName}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {boat?.name ?? booking.boatId} -{" "}
                          {tripTypeLabels[booking.tripType]} - {booking.date}
                        </p>
                      </div>
                      <Pill
                        tone={
                          booking.status === "pending"
                            ? "warning"
                            : booking.status === "confirmed"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {bookingStatusLabels[booking.status]}
                      </Pill>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Pill tone="neutral">
                        Source: {bookingSourceLabels[booking.source]}
                      </Pill>
                      <Pill tone="neutral">Party size {booking.partySize}</Pill>
                    </div>
                    <div className="mt-4">
                      <Link
                        className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                        href={`/bookings/${booking.id}`}
                      >
                        Open booking
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ShellCard>

        <ShellCard
          eyebrow="Availability"
          title="Blocked slot preview"
          description="Admin blocks share the same slot identity as bookings, so this area helps explain why a public slot is unavailable during the demo."
        >
          {availabilityBlocks.length === 0 ? (
            <EmptyState
              description="Create a blocked slot from availability management to surface it here."
              title="No blocked slots in the preview"
            />
          ) : (
            <div className="space-y-4">
              {availabilityBlocks.map((block) => {
                const boat = getBoatById(block.boatId, boats);

                return (
                  <div
                    key={block.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {boat?.name ?? block.boatId}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {tripTypeLabels[block.tripType]} - {block.date}
                        </p>
                      </div>
                      <Pill tone="warning">Blocked</Pill>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {block.reason}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Created by {block.createdByLabel}
                    </p>
                    <div className="mt-4">
                      <Link
                        className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                        href="/availability"
                      >
                        Manage availability
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ShellCard>
      </section>

      <ShellCard
        eyebrow="Notifications"
        title="Badge-ready notification summary"
        description="Notifications remain intentionally lightweight in phase 1, but the copy and groupings are already aligned with the rest of the product."
      >
        <div className="grid gap-4 sm:grid-cols-3" id="notifications">
          <StatCard
            detail="Still awaiting manual confirmation."
            label="Pending"
            tone="warning"
            value={String(notificationSummaryMock.pendingBookings)}
          />
          <StatCard
            detail="Reserved for future notification delivery and inbox surfacing."
            label="Unread"
            tone="accent"
            value={String(notificationSummaryMock.unread)}
          />
          <StatCard
            detail="Admin blocks currently affecting public availability."
            label="Blocked"
            tone="neutral"
            value={String(notificationSummaryMock.blockedSlots)}
          />
        </div>
        <ul className="mt-6 space-y-3 text-sm text-slate-600">
          {notificationSummaryMock.items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="mt-1">{item.detail}</p>
            </li>
          ))}
        </ul>
      </ShellCard>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ShellCard
          eyebrow="Pricing"
          title="Phase-1 pricing"
          description="Boat and trip-type pricing is now managed from the admin app and read live by the public booking page."
        >
          <p className="text-sm leading-6 text-slate-600">
            Public booking prices reflect the saved boat and trip type rules in
            the database. Use the pricing route for direct updates.
          </p>
          <div className="mt-4">
            <Link
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              href="/pricing"
            >
              Manage pricing
            </Link>
          </div>
        </ShellCard>

        <ShellCard
          eyebrow="Settings"
          title="Operational settings"
          description="Booking season bounds and the main contact email now have a DB-backed admin home."
        >
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Season months: {getMonthLabel(appSettings.bookingSeason.startMonth)} to{" "}
              {getMonthLabel(appSettings.bookingSeason.endMonth)}
            </p>
            <p>Contact email: {appSettings.contactEmail}</p>
          </div>
          <div className="mt-4">
            <Link
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              href="/settings"
            >
              Manage settings
            </Link>
          </div>
        </ShellCard>
      </section>
    </main>
  );
}
