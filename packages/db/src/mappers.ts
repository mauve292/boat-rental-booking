import type { Boat, Booking, AvailabilityBlock, PriceRule } from "@boat/domain";
import { Prisma } from "@prisma/client";

export const boatQuery = Prisma.validator<Prisma.BoatDefaultArgs>()({
  include: {
    image: true,
    amenities: {
      orderBy: {
        label: "asc"
      }
    },
    destinations: {
      orderBy: {
        name: "asc"
      }
    },
    supportedTripTypes: {
      orderBy: {
        tripType: "asc"
      }
    }
  }
});

export type BoatRecord = Prisma.BoatGetPayload<typeof boatQuery>;

export function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toUtcDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function mapBoatRecordToDomain(record: BoatRecord): Boat {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    shortDescription: record.shortDescription,
    capacity: record.capacity,
    amenities: record.amenities.map((amenity) => amenity.slug as Boat["amenities"][number]),
    destinations: record.destinations.map((destination) => ({
      id: destination.id,
      slug: destination.slug,
      name: destination.name,
      summary: destination.summary
    })),
    image: {
      src: record.image?.src ?? `/placeholders/${record.slug}.jpg`,
      alt: record.image?.alt ?? `${record.name} placeholder image`,
      width: record.image?.width ?? 1200,
      height: record.image?.height ?? 800
    },
    supportedTripTypes: record.supportedTripTypes.map(
      (support) => support.tripType as Boat["supportedTripTypes"][number]
    )
  };
}

export function mapBookingRecordToDomain(
  record: Pick<
    Prisma.BookingGetPayload<Record<string, never>>,
    | "id"
    | "boatId"
    | "date"
    | "tripType"
    | "status"
    | "source"
    | "customerName"
    | "email"
    | "phone"
    | "partySize"
    | "notes"
    | "createdAt"
  >
): Booking {
  return {
    id: record.id,
    boatId: record.boatId,
    date: toDateOnlyString(record.date),
    tripType: record.tripType as Booking["tripType"],
    status: record.status as Booking["status"],
    source: record.source as Booking["source"],
    customerName: record.customerName,
    email: record.email,
    phone: record.phone,
    partySize: record.partySize,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString()
  };
}

export function mapAvailabilityBlockRecordToDomain(
  record: Pick<
    Prisma.AvailabilityBlockGetPayload<Record<string, never>>,
    "id" | "boatId" | "date" | "tripType" | "reason" | "createdAt" | "createdByLabel"
  >
): AvailabilityBlock {
  return {
    id: record.id,
    boatId: record.boatId,
    date: toDateOnlyString(record.date),
    tripType: record.tripType as AvailabilityBlock["tripType"],
    reason: record.reason,
    createdAt: record.createdAt.toISOString(),
    createdByLabel: record.createdByLabel
  };
}

export function mapPriceRuleRecordToDomain(
  record: Pick<
    Prisma.PriceRuleGetPayload<Record<string, never>>,
    "id" | "boatId" | "tripType" | "amount" | "currency" | "label"
  >
): PriceRule {
  return {
    id: record.id,
    boatId: record.boatId,
    tripType: record.tripType as PriceRule["tripType"],
    amount: Number(record.amount),
    currency: record.currency as PriceRule["currency"],
    label: record.label
  };
}

