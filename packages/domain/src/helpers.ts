import type { SearchParamsInput, SearchParamValue } from "@boat/types";
import {
  bookingQueryKeys,
  bookingRoutes,
  bookingSeason,
  createBookingSeasonSettings,
  tripTypes
} from "./constants";
import {
  availabilityBlocks,
  boats,
  priceRules,
  sampleBookings
} from "./mock-data";
import type {
  AvailabilityBlock,
  Boat,
  Booking,
  BookingSeasonSettings,
  BookingSlot,
  ParsedSelectedBoatState,
  PriceRule,
  TripType
} from "./types";

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

function getMonthNumber(dateInput: Date | string): number | null {
  if (dateInput instanceof Date) {
    return dateInput.getUTCMonth() + 1;
  }

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);

  if (isoDateMatch) {
    return Number(isoDateMatch[2]);
  }

  const parsedDate = new Date(dateInput);

  if (Number.isNaN(parsedDate.valueOf())) {
    return null;
  }

  return parsedDate.getUTCMonth() + 1;
}

export function getBoatBySlug(
  boatSlug: string,
  collection: Boat[] = boats
): Boat | null {
  return collection.find((boat) => boat.slug === boatSlug) ?? null;
}

export function getBoatById(
  boatId: string,
  collection: Boat[] = boats
): Boat | null {
  return collection.find((boat) => boat.id === boatId) ?? null;
}

export function getBoatBookingHref(boatSlug?: string | null): string {
  if (!boatSlug) {
    return bookingRoutes.root;
  }

  const query = new URLSearchParams({
    [bookingQueryKeys.boat]: boatSlug
  });

  return `${bookingRoutes.root}?${query.toString()}`;
}

export function parseSelectedBoatFromSearchParams(
  searchParams: SearchParamsInput,
  collection: Boat[] = boats
): ParsedSelectedBoatState {
  const rawBoatSlug = getSearchParamValue(searchParams, bookingQueryKeys.boat);

  if (!rawBoatSlug) {
    return {
      rawBoatSlug: null,
      selectedBoatSlug: null,
      hasSelection: false,
      isValid: false,
      boat: null
    };
  }

  const boat = getBoatBySlug(rawBoatSlug, collection);

  return {
    rawBoatSlug,
    selectedBoatSlug: boat?.slug ?? null,
    hasSelection: true,
    isValid: boat !== null,
    boat
  };
}

export function getSupportedTripTypesForBoat(
  boat?: Boat | null
): readonly TripType[] {
  return boat?.supportedTripTypes ?? tripTypes;
}

export function getPriceForBoatAndTripType(
  boatId: string,
  tripType: TripType,
  rules: PriceRule[] = priceRules
): PriceRule | null {
  return (
    rules.find((priceRule) => {
      return priceRule.boatId === boatId && priceRule.tripType === tripType;
    }) ?? null
  );
}

export function isDateWithinSeason(
  dateInput: Date | string,
  season: BookingSeasonSettings = bookingSeason
): boolean {
  const month = getMonthNumber(dateInput);

  if (!month) {
    return false;
  }

  return month >= season.startMonth && month <= season.endMonth;
}

export function getSlotKey(slot: BookingSlot): string {
  return `${slot.boatId}:${slot.date}:${slot.tripType}`;
}

export function getSlotBlockReason(
  slot: BookingSlot,
  bookings: Booking[] = sampleBookings,
  blocks: AvailabilityBlock[] = availabilityBlocks
): "booking" | "admin" | null {
  const hasBooking = bookings.some((booking) => {
    return (
      booking.status !== "cancelled" && getSlotKey(booking) === getSlotKey(slot)
    );
  });

  if (hasBooking) {
    return "booking";
  }

  const hasBlock = blocks.some((block) => getSlotKey(block) === getSlotKey(slot));

  return hasBlock ? "admin" : null;
}

export function isSlotBlockedByBookingOrAdminBlock(
  slot: BookingSlot,
  bookings: Booking[] = sampleBookings,
  blocks: AvailabilityBlock[] = availabilityBlocks
): boolean {
  return getSlotBlockReason(slot, bookings, blocks) !== null;
}

export function summarizePendingBookingsCount(
  bookings: Booking[] = sampleBookings
): number {
  return bookings.filter((booking) => booking.status === "pending").length;
}

export function formatCurrencyAmount(
  amount: number,
  currency: PriceRule["currency"] = "EUR"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function getBookingSeasonFromMonthRange(
  startMonth: number,
  endMonth: number
): BookingSeasonSettings {
  return createBookingSeasonSettings(startMonth, endMonth);
}
