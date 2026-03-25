import {
  bookingSeason,
  bookingQueryKeys,
  bookingStatusValues,
  isDateWithinSeason,
  phoneCountryCodeValues,
  tripTypes
} from "@boat/domain";
import type { SearchParamsInput, SearchParamValue } from "@boat/types";
import { z } from "zod";

const phoneCountryCodeSet = new Set<string>(phoneCountryCodeValues);

function normalizeSearchParamValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return normalizeSearchParamValue(value[0]);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function getSearchParamValue(
  searchParams: SearchParamsInput,
  key: string
): string | null {
  if (searchParams instanceof URLSearchParams) {
    return normalizeSearchParamValue(searchParams.get(key) ?? undefined);
  }

  return normalizeSearchParamValue(searchParams[key]);
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function isValidIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export const tripTypeSchema = z.enum(tripTypes);

export const bookingStatusSchema = z.enum(bookingStatusValues);

export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date in YYYY-MM-DD format.")
  .refine(isValidIsoDateString, "Enter a valid calendar date.");

export const phoneCountryCodeSchema = z
  .string()
  .trim()
  .refine(
    (value) => phoneCountryCodeSet.has(value),
    "Select a valid phone country code."
  );

export const phoneLocalNumberSchema = z
  .string()
  .trim()
  .max(24)
  .regex(/^[0-9()\-\s]*$/, "Phone number contains unsupported characters.")
  .refine(
    (value) => value.replace(/\D/g, "").length >= 6,
    "Enter a valid phone number."
  );

export const phoneInputDraftSchema = z
  .string()
  .trim()
  .max(32)
  .regex(/^[+0-9()\-\s]*$/, "Phone number contains unsupported characters.");

export const bookingFormDraftSchema = z.object({
  boatId: z.string().trim().min(1).nullable().optional(),
  tripType: tripTypeSchema.optional(),
  date: z.string().trim().min(1).optional(),
  fullName: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  phone: phoneInputDraftSchema.optional(),
  partySize: z.number().int().min(1).max(12).optional(),
  notes: z.string().trim().max(500).optional()
});

export const publicBookingSubmissionInputSchema = z.object({
  boatId: z.string().trim().min(1, "Select a boat."),
  tripType: tripTypeSchema,
  date: isoDateSchema,
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Full name is too long."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(160, "Email is too long."),
  phoneCountryCode: phoneCountryCodeSchema,
  phoneNumber: phoneLocalNumberSchema
})
.superRefine((value, context) => {
  if (!isDateWithinSeason(value.date)) {
    context.addIssue({
      code: "custom",
      message: `Bookings are available only during ${bookingSeason.label}.`,
      path: ["date"]
    });
  }
})
.transform((value) => {
  const phoneCountryCode = value.phoneCountryCode.trim();
  const phoneNumber = normalizeWhitespace(value.phoneNumber);

  return {
    boatId: value.boatId.trim(),
    tripType: value.tripType,
    date: value.date,
    fullName: normalizeWhitespace(value.fullName),
    email: value.email.trim().toLowerCase(),
    phoneCountryCode,
    phoneNumber,
    phone: `${phoneCountryCode} ${phoneNumber}`
  };
});

export const bookingSearchParamsSchema = z.object({
  [bookingQueryKeys.boat]: z.string().trim().min(1).optional()
});

export function parseBoatQueryParam(
  searchParams: SearchParamsInput
): string | null {
  const rawBoatSlug = getSearchParamValue(searchParams, bookingQueryKeys.boat);
  const parsedResult = bookingSearchParamsSchema.safeParse({
    [bookingQueryKeys.boat]: rawBoatSlug ?? undefined
  });

  if (!parsedResult.success) {
    return null;
  }

  return parsedResult.data[bookingQueryKeys.boat] ?? null;
}

export type TripTypeInput = z.infer<typeof tripTypeSchema>;
export type BookingStatusInput = z.infer<typeof bookingStatusSchema>;
export type BookingFormDraftInput = z.infer<typeof bookingFormDraftSchema>;
export type PublicBookingSubmissionInput = z.input<
  typeof publicBookingSubmissionInputSchema
>;
export type PublicBookingSubmission = z.infer<
  typeof publicBookingSubmissionInputSchema
>;
