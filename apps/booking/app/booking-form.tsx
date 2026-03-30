"use client";

import {
  formatCurrencyAmount,
  getPriceForBoatAndTripType,
  phoneCountryOptions,
  type Boat,
  type BookingSeasonSettings,
  type PriceRule,
  tripTypeLabels
} from "@boat/domain";
import { FeedbackBanner, Pill } from "@boat/ui";
import {
  createPublicBookingSubmissionInputSchema,
  type PublicBookingSubmissionInput
} from "@boat/validation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitPublicBooking } from "./actions";
import {
  initialBookingSubmissionState,
  type BookingSubmissionFieldErrors
} from "./booking-form-state";

type BookingFormProps = {
  boats: Boat[];
  priceRules: PriceRule[];
  initialBoatId: string | null;
  initialDate: string;
  minDate: string;
  maxDate: string;
  bookingPersistenceAvailable: boolean;
  seasonSettings: BookingSeasonSettings;
};

type FieldName = keyof PublicBookingSubmissionInput;
type SlotAvailabilityStatus =
  | {
      state: "idle" | "loading" | "error";
      blockedBy: null;
      message: string | null;
    }
  | {
      state: "ready";
      blockedBy: "booking" | "admin" | null;
      message: string;
    };

const commonInputClasses =
  "mt-1 w-full rounded-xl border px-3.5 py-3 text-slate-900 outline-none transition focus:border-slate-950";
const sectionClasses =
  "rounded-2xl border border-slate-200 bg-slate-50/90 p-5 sm:p-6";

function getFieldError(
  field: FieldName,
  clientErrors: BookingSubmissionFieldErrors,
  serverErrors: BookingSubmissionFieldErrors
): string | null {
  return clientErrors[field]?.[0] ?? serverErrors[field]?.[0] ?? null;
}

function getInputClasses(hasError: boolean, disabled: boolean): string {
  return `${commonInputClasses} ${
    hasError
      ? "border-rose-300 bg-rose-50"
      : "border-slate-300 bg-white"
  } ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""}`;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700 sm:w-auto"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Submitting request..." : "Submit booking request"}
    </button>
  );
}

function getSubmissionTone(
  status: typeof initialBookingSubmissionState.status
): "success" | "warning" | "error" {
  if (status === "success") {
    return "success";
  }

  if (status === "conflict") {
    return "warning";
  }

  return "error";
}

function getAvailabilityTone(
  availability: SlotAvailabilityStatus
): "success" | "warning" | "info" {
  if (availability.state === "idle") {
    return "info";
  }

  if (availability.state === "loading") {
    return "info";
  }

  if (availability.state === "ready" && availability.blockedBy === null) {
    return "success";
  }

  return "warning";
}

function getAvailabilityTitle(availability: SlotAvailabilityStatus): string {
  if (availability.state === "idle") {
    return "Preparing live availability check";
  }

  if (availability.state === "loading") {
    return "Checking the selected slot";
  }

  if (availability.state === "ready" && availability.blockedBy === null) {
    return "Slot available right now";
  }

  if (availability.state === "ready" && availability.blockedBy === "admin") {
    return "Slot blocked by the team";
  }

  if (availability.state === "ready" && availability.blockedBy === "booking") {
    return "Slot already occupied";
  }

  return "Availability could not be verified right now";
}

export function BookingForm({
  boats,
  priceRules,
  initialBoatId,
  initialDate,
  minDate,
  maxDate,
  bookingPersistenceAvailable,
  seasonSettings
}: BookingFormProps) {
  const [submissionState, formAction] = useActionState(
    submitPublicBooking,
    initialBookingSubmissionState
  );
  const [clientErrors, setClientErrors] = useState<BookingSubmissionFieldErrors>(
    {}
  );
  const [boatId, setBoatId] = useState(initialBoatId ?? "");
  const [tripType, setTripType] = useState<PublicBookingSubmissionInput["tripType"] | "">("");
  const [date, setDate] = useState(initialDate);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+30");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formRevision, setFormRevision] = useState(0);
  const [feedbackRevision, setFeedbackRevision] = useState(0);
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailabilityStatus>({
    state: "idle",
    blockedBy: null,
    message: null
  });
  const formRevisionRef = useRef(formRevision);
  const slotAvailabilityRequestIdRef = useRef(0);
  const submissionSchema = createPublicBookingSubmissionInputSchema(
    seasonSettings
  );

  const selectedBoat = boats.find((boat) => boat.id === boatId) ?? null;
  const selectedPriceRule =
    selectedBoat && tripType
      ? getPriceForBoatAndTripType(selectedBoat.id, tripType, priceRules)
      : null;
  const visibleTripTypes = selectedBoat?.supportedTripTypes ?? [];
  const isSubmitDisabled =
    !bookingPersistenceAvailable ||
    (slotAvailability.state === "ready" && slotAvailability.blockedBy !== null);
  const shouldShowSubmissionFeedback =
    Boolean(submissionState.message) && feedbackRevision === formRevision;

  useEffect(() => {
    formRevisionRef.current = formRevision;
  }, [formRevision]);

  useEffect(() => {
    if (submissionState.message) {
      setFeedbackRevision(formRevisionRef.current);
    }
  }, [
    submissionState.bookingId,
    submissionState.message,
    submissionState.status
  ]);

  useEffect(() => {
    if (!boatId || !tripType || !date) {
      slotAvailabilityRequestIdRef.current += 1;
      setSlotAvailability({
        state: "idle",
        blockedBy: null,
        message: null
      });
      return;
    }

    if (!bookingPersistenceAvailable) {
      setSlotAvailability({
        state: "error",
        blockedBy: null,
        message:
          "Live slot availability is unavailable until booking persistence is configured."
      });
      return;
    }

    const abortController = new AbortController();
    const requestId = slotAvailabilityRequestIdRef.current + 1;
    slotAvailabilityRequestIdRef.current = requestId;
    setSlotAvailability({
      state: "loading",
      blockedBy: null,
      message: "Checking slot availability..."
    });

    async function loadSlotAvailability() {
      try {
        const searchParams = new URLSearchParams({
          boatId,
          date,
          tripType
        });
        const response = await fetch(`/api/slot-availability?${searchParams.toString()}`, {
          signal: abortController.signal,
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Availability lookup failed.");
        }

        const payload = (await response.json()) as {
          blockedBy: "booking" | "admin" | null;
          isBookable: boolean;
        };

        if (abortController.signal.aborted || slotAvailabilityRequestIdRef.current !== requestId) {
          return;
        }

        setSlotAvailability({
          state: "ready",
          blockedBy: payload.blockedBy,
          message:
            payload.blockedBy === "admin"
              ? "This slot is currently blocked by the team and cannot be booked."
              : payload.blockedBy === "booking"
                ? "This slot is already booked for that date and trip."
                : "This slot is currently available."
        });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error("Public slot availability lookup failed", error);

        if (slotAvailabilityRequestIdRef.current !== requestId) {
          return;
        }

        setSlotAvailability({
          state: "error",
          blockedBy: null,
          message: "Live slot availability could not be checked. You can still submit and the server will verify the slot."
        });
      }
    }

    void loadSlotAvailability();

    return () => {
      abortController.abort();
    };
  }, [boatId, bookingPersistenceAvailable, tripType, date]);

  function markFormChanged() {
    setFormRevision((currentRevision) => currentRevision + 1);
  }

  function resetSlotAvailabilityState() {
    slotAvailabilityRequestIdRef.current += 1;
    setSlotAvailability({
      state: "idle",
      blockedBy: null,
      message: null
    });
  }

  function clearFieldError(field: FieldName) {
    setClientErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function handleClientValidation(event: React.FormEvent<HTMLFormElement>) {
    if (
      !bookingPersistenceAvailable ||
      (slotAvailability.state === "ready" && slotAvailability.blockedBy !== null)
    ) {
      event.preventDefault();
      return;
    }

    const parsedSubmission = submissionSchema.safeParse({
      boatId,
      tripType,
      date,
      fullName,
      email,
      phoneCountryCode,
      phoneNumber
    });

    if (!parsedSubmission.success) {
      event.preventDefault();
      setClientErrors(parsedSubmission.error.flatten().fieldErrors);
      return;
    }

    setClientErrors({});
  }

  const boatError = getFieldError(
    "boatId",
    clientErrors,
    submissionState.fieldErrors
  );
  const tripTypeError = getFieldError(
    "tripType",
    clientErrors,
    submissionState.fieldErrors
  );
  const dateError = getFieldError("date", clientErrors, submissionState.fieldErrors);
  const fullNameError = getFieldError(
    "fullName",
    clientErrors,
    submissionState.fieldErrors
  );
  const emailError = getFieldError("email", clientErrors, submissionState.fieldErrors);
  const phoneCountryCodeError = getFieldError(
    "phoneCountryCode",
    clientErrors,
    submissionState.fieldErrors
  );
  const phoneNumberError = getFieldError(
    "phoneNumber",
    clientErrors,
    submissionState.fieldErrors
  );
  const slotSelectionReady = Boolean(boatId && tripType && date);

  return (
    <div className="space-y-5">
      {shouldShowSubmissionFeedback ? (
        <FeedbackBanner
          title={
            submissionState.status === "success"
              ? "Booking request received"
              : submissionState.status === "conflict"
                ? "That slot is no longer available"
                : "Check the form and try again"
          }
          tone={getSubmissionTone(submissionState.status)}
        >
          <p>{submissionState.message}</p>
          {submissionState.status === "success" ? (
            <p className="mt-2">
              Booking reference: <span className="font-semibold">{submissionState.bookingId}</span>
            </p>
          ) : null}
        </FeedbackBanner>
      ) : null}

      <form action={formAction} className="space-y-5" onSubmit={handleClientValidation}>
        <section className={sectionClasses}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                Trip details
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Start with the boat, trip type, and date so the form can show pricing and live slot state.
              </p>
            </div>
            <Pill tone={selectedBoat ? "accent" : "neutral"}>
              {selectedBoat ? selectedBoat.name : "Boat not selected yet"}
            </Pill>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Boat
              <select
                className={getInputClasses(Boolean(boatError), false)}
                name="boatId"
                onChange={(event) => {
                  const nextBoatId = event.target.value;
                  const nextBoat =
                    boats.find((boat) => boat.id === nextBoatId) ?? null;
                  const nextTripTypes = nextBoat?.supportedTripTypes ?? [];

                  setBoatId(nextBoatId);

                  if (tripType && !nextTripTypes.includes(tripType)) {
                    setTripType("");
                  }

                  clearFieldError("boatId");
                  clearFieldError("tripType");
                  resetSlotAvailabilityState();
                  markFormChanged();
                }}
                required
                value={boatId}
              >
                <option value="">Select a boat</option>
                {boats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name}
                  </option>
                ))}
              </select>
              {initialBoatId ? (
                <p className="mt-1 text-xs text-slate-500">
                  This boat was preselected from the fleet page, but you can still change it here.
                </p>
              ) : null}
              {boatError ? (
                <p className="mt-1 text-sm text-rose-700">{boatError}</p>
              ) : null}
            </label>

            <label className="text-sm text-slate-600">
              Trip type
              <select
                className={getInputClasses(
                  Boolean(tripTypeError),
                  !selectedBoat
                )}
                disabled={!selectedBoat}
                name="tripType"
                onChange={(event) => {
                  setTripType(
                    event.target.value as PublicBookingSubmissionInput["tripType"] | ""
                  );
                  clearFieldError("tripType");
                  resetSlotAvailabilityState();
                  markFormChanged();
                }}
                required
                value={tripType}
              >
                <option value="">
                  {selectedBoat ? "Select a trip type" : "Choose a boat first"}
                </option>
                {visibleTripTypes.map((supportedTripType) => (
                  <option key={supportedTripType} value={supportedTripType}>
                    {tripTypeLabels[supportedTripType]}
                  </option>
                ))}
              </select>
              {tripTypeError ? (
                <p className="mt-1 text-sm text-rose-700">{tripTypeError}</p>
              ) : null}
            </label>

            <label className="text-sm text-slate-600">
              Date
              <input
                className={getInputClasses(Boolean(dateError), false)}
                max={maxDate}
                min={minDate}
                name="date"
                onChange={(event) => {
                  setDate(event.target.value);
                  clearFieldError("date");
                  resetSlotAvailabilityState();
                  markFormChanged();
                }}
                required
                type="date"
                value={date}
              />
              <p className="mt-1 text-xs text-slate-500">
                Season dates run from {minDate} to {maxDate} ({seasonSettings.label}).
              </p>
              {dateError ? (
                <p className="mt-1 text-sm text-rose-700">{dateError}</p>
              ) : null}
            </label>
          </div>
        </section>

        <section className={sectionClasses}>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              Guest contact
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These details are required for the admin team to review and confirm the request.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Full name
              <input
                className={getInputClasses(Boolean(fullNameError), false)}
                name="fullName"
                onChange={(event) => {
                  setFullName(event.target.value);
                  clearFieldError("fullName");
                  markFormChanged();
                }}
                placeholder="Guest full name"
                required
                value={fullName}
              />
              {fullNameError ? (
                <p className="mt-1 text-sm text-rose-700">{fullNameError}</p>
              ) : null}
            </label>

            <label className="text-sm text-slate-600">
              Email
              <input
                className={getInputClasses(Boolean(emailError), false)}
                name="email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError("email");
                  markFormChanged();
                }}
                placeholder="guest@example.com"
                required
                type="email"
                value={email}
              />
              {emailError ? (
                <p className="mt-1 text-sm text-rose-700">{emailError}</p>
              ) : null}
            </label>

            <label className="text-sm text-slate-600">
              Phone country code
              <select
                className={getInputClasses(Boolean(phoneCountryCodeError), false)}
                name="phoneCountryCode"
                onChange={(event) => {
                  setPhoneCountryCode(event.target.value);
                  clearFieldError("phoneCountryCode");
                  markFormChanged();
                }}
                required
                value={phoneCountryCode}
              >
                {phoneCountryOptions.map((option) => (
                  <option key={`${option.code}-${option.label}`} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              {phoneCountryCodeError ? (
                <p className="mt-1 text-sm text-rose-700">
                  {phoneCountryCodeError}
                </p>
              ) : null}
            </label>

            <label className="text-sm text-slate-600">
              Mobile / phone
              <input
                className={getInputClasses(Boolean(phoneNumberError), false)}
                inputMode="tel"
                name="phoneNumber"
                onChange={(event) => {
                  setPhoneNumber(event.target.value);
                  clearFieldError("phoneNumber");
                  markFormChanged();
                }}
                pattern="[0-9()\\-\\s]{6,24}"
                placeholder="690 123 4567"
                required
                value={phoneNumber}
              />
              {phoneNumberError ? (
                <p className="mt-1 text-sm text-rose-700">{phoneNumberError}</p>
              ) : null}
            </label>
          </div>
        </section>

        <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.65)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Booking summary
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                {selectedPriceRule
                  ? formatCurrencyAmount(
                      selectedPriceRule.amount,
                      selectedPriceRule.currency
                    )
                  : "Select a boat and trip type"}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Price display is live from the saved pricing matrix. Final confirmation still happens manually after the team reviews the request.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedBoat ? <Pill tone="neutral">{selectedBoat.name}</Pill> : null}
              {tripType ? <Pill tone="accent">{tripTypeLabels[tripType]}</Pill> : null}
              {date ? <Pill tone="neutral">{date}</Pill> : null}
            </div>
          </div>
        </section>

        {!bookingPersistenceAvailable ? (
          <FeedbackBanner
            title="Real booking submission unavailable"
            tone="warning"
          >
            Real booking submission is disabled until `DATABASE_URL` is configured.
          </FeedbackBanner>
        ) : slotSelectionReady ? (
          <FeedbackBanner
            title={getAvailabilityTitle(slotAvailability)}
            tone={getAvailabilityTone(slotAvailability)}
          >
            {slotAvailability.message}
          </FeedbackBanner>
        ) : (
          <FeedbackBanner title="Select a slot to continue" tone="info">
            Choose a boat, trip type, and date to load the live availability state for that exact slot.
          </FeedbackBanner>
        )}

        <FeedbackBanner title="Pending confirmation" tone="info">
          Payment remains mock-only in this step. Submitting the form creates a real pending booking request and reserves the slot until the team reviews it.
        </FeedbackBanner>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Ready to submit?
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The team will review pending requests before confirming the booking.
              </p>
            </div>
            <SubmitButton disabled={isSubmitDisabled} />
          </div>
        </div>
      </form>
    </div>
  );
}
