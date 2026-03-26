import {
  bookingSeason,
  bookingQueryKeys,
  bookingStatusValues,
  isDateWithinSeason,
  type BookingSeasonSettings,
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

export const entityIdSchema = z
  .string()
  .trim()
  .min(3, "Select a valid record.")
  .max(120, "Select a valid record.")
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "Select a valid record.");

export const emailAddressSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(160, "Email is too long.")
  .transform((value) => value.toLowerCase());

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

export const monthNumberSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? Number.parseInt(trimmedValue, 10) : value;
  },
  z
    .number({ error: "Select a valid month." })
    .int("Select a valid month.")
    .min(1, "Select a valid month.")
    .max(12, "Select a valid month.")
);

export const priceAmountSchema = z.preprocess(
  (value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? Number(trimmedValue) : value;
  },
  z
    .number({ error: "Enter a valid price." })
    .finite("Enter a valid price.")
    .min(0, "Enter a valid non-negative price.")
    .max(999999.99, "Enter a practical price value.")
    .refine(
      (value) => Math.round(value * 100) === value * 100,
      "Use at most two decimal places."
    )
);

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

export function createPublicBookingSubmissionInputSchema(
  season: BookingSeasonSettings = bookingSeason
) {
  return z
    .object({
      boatId: entityIdSchema,
      tripType: tripTypeSchema,
      date: isoDateSchema,
      fullName: z
        .string()
        .trim()
        .min(2, "Enter your full name.")
        .max(120, "Full name is too long."),
      email: emailAddressSchema,
      phoneCountryCode: phoneCountryCodeSchema,
      phoneNumber: phoneLocalNumberSchema
    })
    .superRefine((value, context) => {
      if (!isDateWithinSeason(value.date, season)) {
        context.addIssue({
          code: "custom",
          message: `Bookings are available only during ${season.label}.`,
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
        email: value.email,
        phoneCountryCode,
        phoneNumber,
        phone: `${phoneCountryCode} ${phoneNumber}`
      };
    });
}

export const publicBookingSubmissionInputSchema =
  createPublicBookingSubmissionInputSchema();

export const bookingSearchParamsSchema = z.object({
  [bookingQueryKeys.boat]: z.string().trim().min(1).optional()
});

export const slotAvailabilityRequestSchema = z.object({
  boatId: entityIdSchema,
  date: isoDateSchema,
  tripType: tripTypeSchema
});

export const adminBookingMutationInputSchema = z.object({
  bookingId: entityIdSchema
});

export const adminAvailabilityBlockActionInputSchema = z
  .object({
    boatId: entityIdSchema,
    date: isoDateSchema,
    tripType: tripTypeSchema,
    reason: z
      .string()
      .trim()
      .min(3, "Enter a short reason.")
      .max(160, "Reason is too long.")
  })
  .transform((value) => ({
    ...value,
    reason: normalizeWhitespace(value.reason)
  }));

export const adminAvailabilityBlockRemovalInputSchema = z.object({
  availabilityBlockId: entityIdSchema
});

export const adminPriceRuleMutationInputSchema = z.object({
  boatId: entityIdSchema,
  tripType: tripTypeSchema,
  amount: priceAmountSchema
});

export const adminAppSettingsInputSchema = z
  .object({
    bookingSeasonStartMonth: monthNumberSchema,
    bookingSeasonEndMonth: monthNumberSchema,
    contactEmail: emailAddressSchema
  })
  .superRefine((value, context) => {
    if (value.bookingSeasonStartMonth > value.bookingSeasonEndMonth) {
      context.addIssue({
        code: "custom",
        message: "End month must be the same as or after the start month.",
        path: ["bookingSeasonEndMonth"]
      });
    }
  });

export const adminSignInInputSchema = z.object({
  email: emailAddressSchema,
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(200, "Password is too long.")
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
export type SlotAvailabilityRequestInput = z.infer<
  typeof slotAvailabilityRequestSchema
>;
export type AdminBookingMutationInput = z.infer<
  typeof adminBookingMutationInputSchema
>;
export type AdminAvailabilityBlockActionInput = z.infer<
  typeof adminAvailabilityBlockActionInputSchema
>;
export type AdminAvailabilityBlockRemovalInput = z.infer<
  typeof adminAvailabilityBlockRemovalInputSchema
>;
export type AdminPriceRuleMutationInput = z.infer<
  typeof adminPriceRuleMutationInputSchema
>;
export type AdminAppSettingsInput = z.infer<
  typeof adminAppSettingsInputSchema
>;
export type AdminSignInInput = z.infer<typeof adminSignInInputSchema>;
