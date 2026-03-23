import {
  bookingQueryKeys,
  bookingStatusValues,
  tripTypes
} from "@boat/domain";
import type { SearchParamsInput, SearchParamValue } from "@boat/types";
import { z } from "zod";

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

export const tripTypeSchema = z.enum(tripTypes);

export const bookingStatusSchema = z.enum(bookingStatusValues);

export const phoneInputDraftSchema = z
  .string()
  .trim()
  .max(24)
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
