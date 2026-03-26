"use server";

import {
  createPendingBooking,
  getAppSettings,
  DatabaseWriteUnavailableError,
  SlotUnavailableError,
  UnsupportedBoatTripTypeError
} from "@boat/db";
import { revalidatePath } from "next/cache";
import {
  createPublicBookingSubmissionInputSchema,
  type PublicBookingSubmissionInput
} from "@boat/validation";
import type { BookingSubmissionState } from "./booking-form-state";

function getFormValue(formData: FormData, key: keyof PublicBookingSubmissionInput): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function submitPublicBooking(
  _previousState: BookingSubmissionState,
  formData: FormData
): Promise<BookingSubmissionState> {
  const appSettings = await getAppSettings();
  const parsedSubmission = createPublicBookingSubmissionInputSchema(
    appSettings.bookingSeason
  ).safeParse({
    boatId: getFormValue(formData, "boatId"),
    tripType: getFormValue(formData, "tripType"),
    date: getFormValue(formData, "date"),
    fullName: getFormValue(formData, "fullName"),
    email: getFormValue(formData, "email"),
    phoneCountryCode: getFormValue(formData, "phoneCountryCode"),
    phoneNumber: getFormValue(formData, "phoneNumber")
  });

  if (!parsedSubmission.success) {
    return {
      status: "validation_error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsedSubmission.error.flatten().fieldErrors,
      bookingId: null
    };
  }

  try {
    const booking = await createPendingBooking({
      boatId: parsedSubmission.data.boatId,
      date: parsedSubmission.data.date,
      tripType: parsedSubmission.data.tripType,
      customerName: parsedSubmission.data.fullName,
      email: parsedSubmission.data.email,
      phone: parsedSubmission.data.phone,
      source: "booking_app"
    });

    revalidatePath("/");

    return {
      status: "success",
      message:
        "Your booking request was received and is now pending confirmation from the team.",
      fieldErrors: {},
      bookingId: booking.id
    };
  } catch (error) {
    if (error instanceof UnsupportedBoatTripTypeError) {
      return {
        status: "validation_error",
        message: "Select a valid boat and trip type combination.",
        fieldErrors: {
          boatId: ["Select a valid boat."],
          tripType: ["Select a trip type supported by that boat."]
        },
        bookingId: null
      };
    }

    if (error instanceof SlotUnavailableError) {
      return {
        status: "conflict",
        message:
          error.blockedBy === "admin"
            ? "That slot is no longer available because it has been blocked by the team."
            : "That slot is no longer available. Please choose another boat, date, or trip type.",
        fieldErrors: {},
        bookingId: null
      };
    }

    if (error instanceof DatabaseWriteUnavailableError) {
      return {
        status: "error",
        message:
          "Booking submission is temporarily unavailable because the database is not configured.",
        fieldErrors: {},
        bookingId: null
      };
    }

    console.error("Unexpected public booking submission failure", error);

    return {
      status: "error",
      message: "We could not submit your booking request. Please try again.",
      fieldErrors: {},
      bookingId: null
    };
  }
}
