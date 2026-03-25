import {
  bookingSourceLabels,
  bookingStatusLabels,
  tripTypeLabels
} from "@boat/domain";
import { getBookingDetailForAdmin } from "@boat/db";
import { Pill, ShellCard } from "@boat/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingFeedback } from "@/lib/booking-feedback";
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
  const booking = await getBookingDetailForAdmin(bookingId);
  const feedback = getBookingFeedback(resolvedSearchParams.feedback);

  if (!booking) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Booking Detail"
        title={booking.customerName}
        description="Inspect the booking record, current slot state, and available admin actions."
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
          eyebrow="Details"
          title="Booking information"
          description="Core booking record fields from the shared database."
        >
          <dl className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-900">Booking ID</dt>
              <dd className="mt-1 break-all">{booking.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Status</dt>
              <dd className="mt-1">{bookingStatusLabels[booking.status]}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Customer</dt>
              <dd className="mt-1">{booking.customerName}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Boat</dt>
              <dd className="mt-1">{booking.boatName}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Email</dt>
              <dd className="mt-1">{booking.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Phone</dt>
              <dd className="mt-1">{booking.phone}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Date</dt>
              <dd className="mt-1">{booking.date}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Trip type</dt>
              <dd className="mt-1">{tripTypeLabels[booking.tripType]}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Source</dt>
              <dd className="mt-1">{bookingSourceLabels[booking.source]}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Created at</dt>
              <dd className="mt-1">{formatTimestamp(booking.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Updated at</dt>
              <dd className="mt-1">{formatTimestamp(booking.updatedAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Party size</dt>
              <dd className="mt-1">{booking.partySize}</dd>
            </div>
            {booking.notes ? (
              <div className="md:col-span-2">
                <dt className="font-medium text-slate-900">Notes</dt>
                <dd className="mt-1">{booking.notes}</dd>
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
                <dt className="font-medium text-slate-900">Currently occupied</dt>
                <dd className="mt-1">{booking.slotOccupied ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900">Current slot source</dt>
                <dd className="mt-1">
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
                <dt className="font-medium text-slate-900">Current occupancy ID</dt>
                <dd className="mt-1 break-all">
                  {booking.currentSlotOccupancyId ?? "None"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900">Current occupancy booking ID</dt>
                <dd className="mt-1 break-all">
                  {booking.currentSlotBookingId ?? "None"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900">Current admin block ID</dt>
                <dd className="mt-1 break-all">
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
                  <button
                    className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    type="submit"
                  >
                    Confirm booking
                  </button>
                </form>
              ) : null}

              {booking.status !== "cancelled" ? (
                <form action={cancelBookingAction}>
                  <input name="bookingId" type="hidden" value={booking.id} />
                  <button
                    className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                    type="submit"
                  >
                    Cancel booking
                  </button>
                </form>
              ) : (
                <p className="text-sm text-slate-500">
                  This booking is already cancelled.
                </p>
              )}
            </div>
          </ShellCard>
        </div>
      </section>
    </main>
  );
}
