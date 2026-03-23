import {
  availabilityBlocks as mockAvailabilityBlocks,
  boats as mockBoats,
  getBoatById as getMockBoatById,
  getBoatBySlug as getMockBoatBySlug,
  getPriceForBoatAndTripType as getMockPriceForBoatAndTripType,
  getSlotBlockReason,
  getSupportedTripTypesForBoat,
  priceRules as mockPriceRules,
  sampleBookings as mockBookings,
  summarizePendingBookingsCount
} from "@boat/domain";
import type { Boat, Booking, AvailabilityBlock, PriceRule } from "@boat/domain";
import { prisma } from "./client";
import {
  boatQuery,
  mapAvailabilityBlockRecordToDomain,
  mapBoatRecordToDomain,
  mapBookingRecordToDomain,
  mapPriceRuleRecordToDomain,
  toUtcDateOnly
} from "./mappers";
import type { AvailabilitySnapshotRow, SlotBlockSource } from "./types";

function sortByCreatedAtDescending<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((leftItem, rightItem) =>
    rightItem.createdAt.localeCompare(leftItem.createdAt)
  );
}

export async function listBoats(): Promise<Boat[]> {
  if (!prisma) {
    return [...mockBoats];
  }

  const records = await prisma.boat.findMany({
    ...boatQuery,
    orderBy: {
      name: "asc"
    }
  });

  return records.map(mapBoatRecordToDomain);
}

export async function getBoatBySlug(boatSlug: string): Promise<Boat | null> {
  if (!prisma) {
    return getMockBoatBySlug(boatSlug);
  }

  const record = await prisma.boat.findUnique({
    ...boatQuery,
    where: {
      slug: boatSlug
    }
  });

  return record ? mapBoatRecordToDomain(record) : null;
}

export async function getBoatById(boatId: string): Promise<Boat | null> {
  if (!prisma) {
    return getMockBoatById(boatId);
  }

  const record = await prisma.boat.findUnique({
    ...boatQuery,
    where: {
      id: boatId
    }
  });

  return record ? mapBoatRecordToDomain(record) : null;
}

export async function listPriceRules(boatId?: string): Promise<PriceRule[]> {
  if (!prisma) {
    return boatId
      ? mockPriceRules.filter((priceRule) => priceRule.boatId === boatId)
      : [...mockPriceRules];
  }

  const records = await prisma.priceRule.findMany({
    where: boatId ? { boatId } : undefined,
    orderBy: [{ boatId: "asc" }, { tripType: "asc" }]
  });

  return records.map(mapPriceRuleRecordToDomain);
}

export async function getPriceForBoatAndTripType(
  boatId: string,
  tripType: PriceRule["tripType"]
): Promise<PriceRule | null> {
  if (!prisma) {
    return getMockPriceForBoatAndTripType(boatId, tripType);
  }

  const record = await prisma.priceRule.findUnique({
    where: {
      boatId_tripType: {
        boatId,
        tripType
      }
    }
  });

  return record ? mapPriceRuleRecordToDomain(record) : null;
}

export async function listRecentBookings(limit = 3): Promise<Booking[]> {
  if (!prisma) {
    return sortByCreatedAtDescending(mockBookings).slice(0, limit);
  }

  const records = await prisma.booking.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });

  return records.map(mapBookingRecordToDomain);
}

export async function listAvailabilityBlocks(
  limit?: number
): Promise<AvailabilityBlock[]> {
  if (!prisma) {
    const sortedBlocks = sortByCreatedAtDescending(mockAvailabilityBlocks);

    return typeof limit === "number" ? sortedBlocks.slice(0, limit) : sortedBlocks;
  }

  const records = await prisma.availabilityBlock.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });

  return records.map(mapAvailabilityBlockRecordToDomain);
}

export async function countPendingBookings(): Promise<number> {
  if (!prisma) {
    return summarizePendingBookingsCount(mockBookings);
  }

  return prisma.booking.count({
    where: {
      status: "pending"
    }
  });
}

export async function getAvailabilitySnapshot(input: {
  date: string;
  boatId?: string;
}): Promise<AvailabilitySnapshotRow[]> {
  const boats = await listBoats();
  const filteredBoats = input.boatId
    ? boats.filter((boat) => boat.id === input.boatId)
    : boats;

  if (!prisma) {
    return filteredBoats.map((boat) => ({
      boat,
      date: input.date,
      slots: getSupportedTripTypesForBoat(boat).map((tripType) => ({
        tripType,
        blockedBy: getSlotBlockReason(
          {
            boatId: boat.id,
            date: input.date,
            tripType
          },
          mockBookings,
          mockAvailabilityBlocks
        )
      }))
    }));
  }

  const slotOccupancies = await prisma.slotOccupancy.findMany({
    where: {
      date: toUtcDateOnly(input.date),
      boatId: input.boatId
    },
    select: {
      boatId: true,
      tripType: true,
      bookingId: true,
      availabilityBlockId: true
    }
  });

  const slotMap = new Map<string, SlotBlockSource>();

  for (const occupancy of slotOccupancies) {
    const key = `${occupancy.boatId}:${occupancy.tripType}`;

    slotMap.set(
      key,
      occupancy.bookingId ? "booking" : occupancy.availabilityBlockId ? "admin" : null
    );
  }

  return filteredBoats.map((boat) => ({
    boat,
    date: input.date,
    slots: getSupportedTripTypesForBoat(boat).map((tripType) => ({
      tripType,
      blockedBy: slotMap.get(`${boat.id}:${tripType}`) ?? null
    }))
  }));
}

