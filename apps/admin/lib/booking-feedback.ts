type BookingFeedbackTone = "success" | "error";
type SearchParamValue = string | string[] | undefined;

export type BookingFeedback = {
  tone: BookingFeedbackTone;
  message: string;
};

const bookingFeedbackMessages = {
  confirmed: {
    tone: "success",
    message: "Booking confirmed. The slot remains reserved."
  },
  cancelled: {
    tone: "success",
    message: "Booking cancelled. The slot has been released."
  },
  already_cancelled: {
    tone: "success",
    message: "Booking was already cancelled and the slot is already released."
  },
  invalid_transition: {
    tone: "error",
    message: "That booking cannot be confirmed from its current status."
  },
  booking_missing: {
    tone: "error",
    message: "The requested booking could not be found."
  },
  occupancy_conflict: {
    tone: "error",
    message: "This booking cannot be confirmed because it no longer holds the slot."
  },
  rate_limited: {
    tone: "error",
    message: "Too many booking management actions were submitted. Please wait a minute and try again."
  },
  write_unavailable: {
    tone: "error",
    message: "Booking management is temporarily unavailable."
  },
  action_failed: {
    tone: "error",
    message: "The booking action could not be completed."
  }
} as const satisfies Record<string, BookingFeedback>;

export type BookingFeedbackCode = keyof typeof bookingFeedbackMessages;

function normalizeSearchParamValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return normalizeSearchParamValue(value[0]);
  }

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function getBookingFeedback(
  value: SearchParamValue
): BookingFeedback | null {
  const normalizedValue = normalizeSearchParamValue(value);

  if (
    !normalizedValue ||
    !(normalizedValue in bookingFeedbackMessages)
  ) {
    return null;
  }

  return bookingFeedbackMessages[normalizedValue as BookingFeedbackCode];
}
