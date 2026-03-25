import {
  adminNavItems,
  bookingSourceLabels,
  bookingStatusLabels,
  getBoatById,
  notificationSummaryMock,
  tripTypeLabels
} from "@boat/domain";
import {
  countPendingBookings,
  listAvailabilityBlocks,
  listBoats,
  listRecentBookings
} from "@boat/db";
import { Pill, ShellCard } from "@boat/ui";

export default async function AdminPage() {
  const [boats, pendingBookingsCount, recentBookings, availabilityBlocks] =
    await Promise.all([
      listBoats(),
      countPendingBookings(),
      listRecentBookings(3),
      listAvailabilityBlocks(3)
    ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Admin App"
        title="Admin Dashboard"
        description="Operational shell backed by Prisma, shared repositories, and the phase-1 admin authentication layer."
      >
        <div className="flex flex-wrap gap-3">
          <Pill tone="warning">{pendingBookingsCount} pending bookings</Pill>
          <Pill tone="accent">
            {notificationSummaryMock.total} notification items
          </Pill>
          <Pill>{notificationSummaryMock.blockedSlots} blocked slots</Pill>
        </div>
      </ShellCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminNavItems.map((item) => (
          <ShellCard
            key={item.id}
            eyebrow={item.href}
            title={item.label}
            description={item.description}
          >
            <Pill tone={item.id === "notifications" ? "warning" : "accent"}>
              {item.label}
            </Pill>
          </ShellCard>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ShellCard
          eyebrow="Recent Bookings"
          title="Latest booking preview"
          description="Recent booking requests and reservations from the shared repository layer."
        >
          <div className="space-y-4">
            {recentBookings.map((booking) => {
              const boat = getBoatById(booking.boatId, boats);

              return (
                <div
                  key={booking.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {booking.customerName}
                    </p>
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
                  <p className="mt-2 text-sm text-slate-600">
                    {boat?.name ?? booking.boatId} -{" "}
                    {tripTypeLabels[booking.tripType]} - {booking.date}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Source: {bookingSourceLabels[booking.source]} - Party size{" "}
                    {booking.partySize}
                  </p>
                </div>
              );
            })}
          </div>
        </ShellCard>

        <ShellCard
          eyebrow="Availability"
          title="Blocked slot preview"
          description="Manual admin blocks share the same slot identity as bookings: boat, date, and trip type."
        >
          <div className="space-y-4">
            {availabilityBlocks.map((block) => {
              const boat = getBoatById(block.boatId, boats);

              return (
                <div
                  key={block.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {boat?.name ?? block.boatId}
                    </p>
                    <Pill tone="warning">Blocked</Pill>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {tripTypeLabels[block.tripType]} - {block.date}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {block.reason} - {block.createdByLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </ShellCard>
      </section>

      <ShellCard
        eyebrow="Notifications"
        title="Badge-ready notification summary"
        description="Notifications remain a dashboard concept only in this step. Counts are mocked but use the same language the future admin UI can keep."
      >
        <div className="flex flex-wrap gap-3">
          <Pill tone="warning">
            Pending bookings: {notificationSummaryMock.pendingBookings}
          </Pill>
          <Pill tone="accent">Unread: {notificationSummaryMock.unread}</Pill>
          <Pill>Blocked slots: {notificationSummaryMock.blockedSlots}</Pill>
        </div>
        <ul className="mt-5 space-y-3 text-sm text-slate-600">
          {notificationSummaryMock.items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="mt-1">{item.detail}</p>
            </li>
          ))}
        </ul>
      </ShellCard>
    </main>
  );
}
