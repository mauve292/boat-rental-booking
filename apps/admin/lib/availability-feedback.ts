type AvailabilityFeedbackTone = "success" | "error";
type SearchParamValue = string | string[] | undefined;

export type AvailabilityFeedback = {
  tone: AvailabilityFeedbackTone;
  message: string;
};

const availabilityFeedbackMessages = {
  block_created: {
    tone: "success",
    message: "Blocked slot created. Public booking is now prevented for that slot."
  },
  block_removed: {
    tone: "success",
    message: "Blocked slot removed. That slot is bookable again."
  },
  slot_booked: {
    tone: "error",
    message: "That slot is already occupied by a booking and cannot be blocked."
  },
  slot_already_blocked: {
    tone: "error",
    message: "That slot is already blocked."
  },
  block_missing: {
    tone: "error",
    message: "The requested blocked slot could not be found."
  },
  invalid_slot: {
    tone: "error",
    message: "Select a valid boat, date, and trip type."
  },
  write_unavailable: {
    tone: "error",
    message: "Availability management is temporarily unavailable."
  },
  action_failed: {
    tone: "error",
    message: "The availability action could not be completed."
  }
} as const satisfies Record<string, AvailabilityFeedback>;

export type AvailabilityFeedbackCode = keyof typeof availabilityFeedbackMessages;

function normalizeSearchParamValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return normalizeSearchParamValue(value[0]);
  }

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function getAvailabilityFeedback(
  value: SearchParamValue
): AvailabilityFeedback | null {
  const normalizedValue = normalizeSearchParamValue(value);

  if (
    !normalizedValue ||
    !(normalizedValue in availabilityFeedbackMessages)
  ) {
    return null;
  }

  return availabilityFeedbackMessages[normalizedValue as AvailabilityFeedbackCode];
}
