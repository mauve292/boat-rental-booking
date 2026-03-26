import {
  bookingSourceLabels,
  bookingStatusLabels,
  tripTypeLabels
} from "@boat/domain";
import { getBookingDetailForAdmin } from "@boat/db";
import { FeedbackBanner, Pill, ShellCard, StatCard } from "@boat/ui";
import { entityIdSchema } from "@boat/validation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingFeedback } from "@/lib/booking-feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { cancelBookingAction, confirmBookingAction } from "./actions";

export const dynamic = "force-dynamic";

type BookingDetailPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
};

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}

function getStatusTone(status: "pending" | "confirmed" | "cancelled") {
  if (status === "pending") {
    return "warning";
  }

  if (status === "confirmed") {
    return "success";
  }

  return "neutral";
}

export default async function BookingDetailPage({
  params,
  searchParams
}: BookingDetailPageProps) {
  const [{ bookingId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams
  ]);
  const parsedBookingId = entityIdSchema.safeParse(bookingId);

  if (!parsedBookingId.success) {
    notFound();
  }

  const booking = await getBookingDetailForAdmin(parsedBookingId.data);
  const feedback = getBookingFeedback(resolvedSearchParams.feedback);

  if (!booking) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Booking Detail"
        title={booking.customerName}
        description="Inspect the booking record, current slot state, and available admin actions without leaving the protected workflow."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone={getStatusTone(booking.status)}>
            {bookingStatusLabels[booking.status]}
          </Pill>
          <Pill tone={booking.slotOccupied ? "accent" : "neutral"}>
            Slot {booking.slotOccupied ? "occupied" : "released"}
          </Pill>
          <Link
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            href="/bookings"
          >
            Back to bookings
          </Link>
        </div>
      </ShellCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="Current lifecycle state for this booking."
          label="Status"
          tone={getStatusTone(booking.status)}
          value={bookingStatusLabels[booking.status]}
        />
        <StatCard
          detail="Whether the slot is still being held right now."
          label="Slot"
          tone={booking.slotOccupied ? "accent" : "neutral"}
          value={booking.slotOccupied ? "Occupied" : "Released"}
        />
        <StatCard
          detail="How this booking entered the system."
          label="Source"
          tone="neutral"
          value={bookingSourceLabels[booking.source]}
        />
        <StatCard
          detail={`Boat: ${booking.boatName}`}
          label="Trip"
          tone="success"
          value={tripTypeLabels[booking.tripType]}
        />
      </section>

      {feedback ? (
        <FeedbackBanner
          title={
            feedback.tone === "success"
              ? "Booking action completed"
              : "Booking action could not be completed"
          }
          tone={feedback.tone === "success" ? "success" : "error"}
        >
          {feedback.message}
        </FeedbackBanner>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <ShellCard
          eyebrow="Details"
          title="Booking information"
          description="Core booking record fields from the shared database."
        >
          <dl className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Booking ID
              </dt>
              <dd className="mt-2 break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {booking.id}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Status
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {bookingStatusLabels[booking.status]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Customer
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {booking.customerName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Boat
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {booking.boatName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Email
              </dt>
              <dd className="mt-2 break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {booking.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Phone
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {booking.phone}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Date
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {booking.date}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Trip type
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {tripTypeLabels[booking.tripType]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Source
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {bookingSourceLabels[booking.source]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Created at
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {formatTimestamp(booking.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Updated at
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {formatTimestamp(booking.updatedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Party size
              </dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                {booking.partySize}
              </dd>
            </div>
            {booking.notes ? (
              <div className="md:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Notes
                </dt>
                <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                  {booking.notes}
                </dd>
              </div>
            ) : null}
          </dl>
        </ShellCard>

        <div className="space-y-6">
          <ShellCard
            eyebrow="Slot State"
            title="Occupancy"
            description="Whether the slot identity for this booking is currently occupied, and by what."
          >
            <dl className="space-y-4 text-sm text-slate-600">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Currently occupied
                </dt>
                <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                  {booking.slotOccupied ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Current slot source
                </dt>
                <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                  {booking.currentSlotBlockedBy === null
                    ? "No occupancy"
                    : booking.currentSlotBlockedBy === "admin"
                      ? "Admin block"
                      : booking.currentSlotBookingId === booking.id
                        ? "This booking"
                        : "Another booking"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Current occupancy ID
                </dt>
                <dd className="mt-2 break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                  {booking.currentSlotOccupancyId ?? "None"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Current occupancy booking ID
                </dt>
                <dd className="mt-2 break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                  {booking.currentSlotBookingId ?? "None"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Current admin block ID
                </dt>
                <dd className="mt-2 break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
                  {booking.currentSlotAvailabilityBlockId ?? "None"}
                </dd>
              </div>
            </dl>
          </ShellCard>

          <ShellCard
            eyebrow="Actions"
            title="Manage booking"
            description="Confirm pending bookings or cancel pending/confirmed bookings with server-side actions."
          >
            <div className="flex flex-wrap gap-3">
              {booking.status === "pending" ? (
                <form action={confirmBookingAction}>
                  <input name="bookingId" type="hidden" value={booking.id} />
                  <PendingSubmitButton
                    className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    idleLabel="Confirm booking"
                    pendingLabel="Confirming..."
                  />
                </form>
              ) : null}

              {booking.status !== "cancelled" ? (
                <form action={cancelBookingAction}>
                  <input name="bookingId" type="hidden" value={booking.id} />
                  <PendingSubmitButton
                    className="inline-flex items-center rounded-full bg-rose-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                    idleLabel="Cancel booking"
                    pendingLabel="Cancelling..."
                  />
                </form>
              ) : (
                <p className="text-sm text-slate-500">
                  This booking is already cancelled.
                </p>
              )}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Confirmation keeps the existing slot occupancy. Cancellation releases it atomically so the slot can be booked again.
            </p>
          </ShellCard>
        </div>
      </section>
    </main>
  );
}
