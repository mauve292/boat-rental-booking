"use server";

import {
  BookingNotFoundError,
  BookingOccupancyStateError,
  BookingTransitionError,
  cancelBooking,
  confirmBooking,
  DatabaseWriteUnavailableError,
  RateLimitExceededError
} from "@boat/db";
import { adminBookingMutationInputSchema } from "@boat/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminMutationAccess } from "@/lib/mutation-security";

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
  const parsedInput = adminBookingMutationInputSchema.safeParse({
    bookingId: formData.get("bookingId")
  });
  const bookingId = parsedInput.success ? parsedInput.data.bookingId : "";

  if (!bookingId) {
    redirectToBookings("booking_missing");
  }

  try {
    await requireAdminMutationAccess("admin_booking_mutation");
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

    if (error instanceof RateLimitExceededError) {
      redirectToBookingDetail(bookingId, "rate_limited");
    }

    console.error("Unexpected admin confirm booking failure", error);
    redirectToBookingDetail(bookingId, "action_failed");
  }
}

export async function cancelBookingAction(formData: FormData) {
  const parsedInput = adminBookingMutationInputSchema.safeParse({
    bookingId: formData.get("bookingId")
  });
  const bookingId = parsedInput.success ? parsedInput.data.bookingId : "";

  if (!bookingId) {
    redirectToBookings("booking_missing");
  }

  try {
    await requireAdminMutationAccess("admin_booking_mutation");
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

    if (error instanceof RateLimitExceededError) {
      redirectToBookingDetail(bookingId, "rate_limited");
    }

    console.error("Unexpected admin cancel booking failure", error);
    redirectToBookingDetail(bookingId, "action_failed");
  }
}
