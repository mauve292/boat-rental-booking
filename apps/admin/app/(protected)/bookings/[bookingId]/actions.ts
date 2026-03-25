"use server";

import {
  BookingNotFoundError,
  BookingOccupancyStateError,
  BookingTransitionError,
  cancelBooking,
  confirmBooking,
  DatabaseWriteUnavailableError
} from "@boat/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";

function getBookingIdFromFormData(formData: FormData): string {
  const bookingId = formData.get("bookingId");

  return typeof bookingId === "string" ? bookingId.trim() : "";
}

function redirectToBookingDetail(bookingId: string, feedback: string) {
  redirect(`/bookings/${bookingId}?feedback=${feedback}`);
}

function redirectToBookings(feedback: string) {
  redirect(`/bookings?feedback=${feedback}`);
}

function revalidateAdminBookingPaths(bookingId: string) {
  revalidatePath("/");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
}

export async function confirmBookingAction(formData: FormData) {
  await requireAdminSession();

  const bookingId = getBookingIdFromFormData(formData);

  if (!bookingId) {
    redirectToBookings("booking_missing");
  }

  try {
    await confirmBooking(bookingId);
    revalidateAdminBookingPaths(bookingId);
    redirectToBookingDetail(bookingId, "confirmed");
  } catch (error) {
    if (error instanceof BookingNotFoundError) {
      redirectToBookings("booking_missing");
    }

    if (error instanceof BookingTransitionError) {
      redirectToBookingDetail(bookingId, "invalid_transition");
    }

    if (error instanceof BookingOccupancyStateError) {
      redirectToBookingDetail(bookingId, "occupancy_conflict");
    }

    if (error instanceof DatabaseWriteUnavailableError) {
      redirectToBookingDetail(bookingId, "write_unavailable");
    }

    console.error("Unexpected admin confirm booking failure", error);
    redirectToBookingDetail(bookingId, "action_failed");
  }
}

export async function cancelBookingAction(formData: FormData) {
  await requireAdminSession();

  const bookingId = getBookingIdFromFormData(formData);

  if (!bookingId) {
    redirectToBookings("booking_missing");
  }

  try {
    const result = await cancelBooking(bookingId);
    revalidateAdminBookingPaths(bookingId);
    redirectToBookingDetail(
      bookingId,
      result.changed ? "cancelled" : "already_cancelled"
    );
  } catch (error) {
    if (error instanceof BookingNotFoundError) {
      redirectToBookings("booking_missing");
    }

    if (error instanceof DatabaseWriteUnavailableError) {
      redirectToBookingDetail(bookingId, "write_unavailable");
    }

    console.error("Unexpected admin cancel booking failure", error);
    redirectToBookingDetail(bookingId, "action_failed");
  }
}
