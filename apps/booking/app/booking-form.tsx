"use client";

import {
  bookingSeason,
  formatCurrencyAmount,
  getPriceForBoatAndTripType,
  phoneCountryOptions,
  tripTypeLabels
} from "@boat/domain";
import type { Boat, PriceRule } from "@boat/domain";
import { Pill } from "@boat/ui";
import {
  publicBookingSubmissionInputSchema,
  type PublicBookingSubmissionInput
} from "@boat/validation";
import { useActionState, useEffect, useState } from "react";
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
  "mt-1 w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:border-slate-950";

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
      className="inline-flex items-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Submitting request..." : "Submit booking request"}
    </button>
  );
}

export function BookingForm({
  boats,
  priceRules,
  initialBoatId,
  initialDate,
  minDate,
  maxDate
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
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailabilityStatus>({
    state: "idle",
    blockedBy: null,
    message: null
  });

  const selectedBoat = boats.find((boat) => boat.id === boatId) ?? null;
  const selectedPriceRule =
    selectedBoat && tripType
      ? getPriceForBoatAndTripType(selectedBoat.id, tripType, priceRules)
      : null;
  const isLocked = submissionState.status === "success";
  const visibleTripTypes = selectedBoat?.supportedTripTypes ?? [];
  const isSubmitDisabled =
    isLocked ||
    slotAvailability.state === "loading" ||
    (slotAvailability.state === "ready" && slotAvailability.blockedBy !== null);

  useEffect(() => {
    if (!boatId || !tripType || !date) {
      setSlotAvailability({
        state: "idle",
        blockedBy: null,
        message: null
      });
      return;
    }

    const abortController = new AbortController();
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
  }, [boatId, tripType, date]);

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
      slotAvailability.state === "loading" ||
      (slotAvailability.state === "ready" && slotAvailability.blockedBy !== null)
    ) {
      event.preventDefault();
      return;
    }

    const parsedSubmission = publicBookingSubmissionInputSchema.safeParse({
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

  return (
    <div className="space-y-5">
      {submissionState.message ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            submissionState.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : submissionState.status === "conflict"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <p className="font-medium">{submissionState.message}</p>
          {submissionState.status === "success" ? (
            <p className="mt-2">
              Booking reference: <span className="font-semibold">{submissionState.bookingId}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <form action={formAction} className="grid gap-4 sm:grid-cols-2" onSubmit={handleClientValidation}>
        {initialBoatId ? (
          <div className="sm:col-span-2">
            <label className="text-sm text-slate-600">
              Boat
              <input
                className={getInputClasses(Boolean(boatError), true)}
                disabled
                readOnly
                value={selectedBoat?.name ?? ""}
              />
            </label>
            <input name="boatId" type="hidden" value={boatId} />
            {boatError ? <p className="mt-1 text-sm text-rose-700">{boatError}</p> : null}
          </div>
        ) : (
          <label className="text-sm text-slate-600">
            Boat
            <select
              className={getInputClasses(Boolean(boatError), isLocked)}
              disabled={isLocked}
              name="boatId"
              onChange={(event) => {
                const nextBoatId = event.target.value;
                const nextBoat = boats.find((boat) => boat.id === nextBoatId) ?? null;
                const nextTripTypes = nextBoat?.supportedTripTypes ?? [];

                setBoatId(nextBoatId);

                if (tripType && !nextTripTypes.includes(tripType)) {
                  setTripType("");
                }

                clearFieldError("boatId");
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
            {boatError ? <p className="mt-1 text-sm text-rose-700">{boatError}</p> : null}
          </label>
        )}

        <label className="text-sm text-slate-600">
          Trip type
          <select
            className={getInputClasses(Boolean(tripTypeError), isLocked || !selectedBoat)}
            disabled={isLocked || !selectedBoat}
            name="tripType"
            onChange={(event) => {
              setTripType(event.target.value as PublicBookingSubmissionInput["tripType"] | "");
              clearFieldError("tripType");
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
            className={getInputClasses(Boolean(dateError), isLocked)}
            disabled={isLocked}
            max={maxDate}
            min={minDate}
            name="date"
            onChange={(event) => {
              setDate(event.target.value);
              clearFieldError("date");
            }}
            required
            type="date"
            value={date}
          />
          <p className="mt-1 text-xs text-slate-500">
            Season dates run from {minDate} to {maxDate} ({bookingSeason.label}).
          </p>
          {dateError ? <p className="mt-1 text-sm text-rose-700">{dateError}</p> : null}
        </label>

        <label className="text-sm text-slate-600">
          Full name
          <input
            className={getInputClasses(Boolean(fullNameError), isLocked)}
            disabled={isLocked}
            name="fullName"
            onChange={(event) => {
              setFullName(event.target.value);
              clearFieldError("fullName");
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
            className={getInputClasses(Boolean(emailError), isLocked)}
            disabled={isLocked}
            name="email"
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError("email");
            }}
            placeholder="guest@example.com"
            required
            type="email"
            value={email}
          />
          {emailError ? <p className="mt-1 text-sm text-rose-700">{emailError}</p> : null}
        </label>

        <label className="text-sm text-slate-600">
          Phone country code
          <select
            className={getInputClasses(Boolean(phoneCountryCodeError), isLocked)}
            disabled={isLocked}
            name="phoneCountryCode"
            onChange={(event) => {
              setPhoneCountryCode(event.target.value);
              clearFieldError("phoneCountryCode");
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
            <p className="mt-1 text-sm text-rose-700">{phoneCountryCodeError}</p>
          ) : null}
        </label>

        <label className="text-sm text-slate-600">
          Mobile / phone
          <input
            className={getInputClasses(Boolean(phoneNumberError), isLocked)}
            disabled={isLocked}
            inputMode="tel"
            name="phoneNumber"
            onChange={(event) => {
              setPhoneNumber(event.target.value);
              clearFieldError("phoneNumber");
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

        <div className="sm:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              <Pill tone={selectedPriceRule ? "accent" : "neutral"}>
                {selectedPriceRule
                  ? `Selected price: ${formatCurrencyAmount(
                      selectedPriceRule.amount,
                      selectedPriceRule.currency
                    )}`
                  : "Select a boat and trip type to view pricing"}
              </Pill>
              {date ? <Pill tone="accent">{date}</Pill> : null}
              {tripType ? <Pill>{tripTypeLabels[tripType]}</Pill> : null}
              {slotAvailability.state === "ready" ? (
                <Pill
                  tone={
                    slotAvailability.blockedBy === null
                      ? "success"
                      : slotAvailability.blockedBy === "admin"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {slotAvailability.blockedBy === null
                    ? "Live slot: Available"
                    : slotAvailability.blockedBy === "admin"
                      ? "Live slot: Admin blocked"
                      : "Live slot: Booked"}
                </Pill>
              ) : null}
            </div>
            {slotAvailability.message ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {slotAvailability.message}
              </p>
            ) : null}
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Payment remains mock-only in this step. Submitting this form creates a real
              pending booking request and reserves the slot until the team reviews it.
            </p>
          </div>
        </div>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <SubmitButton disabled={isSubmitDisabled} />
          <p className="text-sm text-slate-500">
            The team will review pending requests before confirming the booking.
          </p>
        </div>
      </form>
    </div>
  );
}
