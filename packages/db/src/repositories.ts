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
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./client";
import {
  boatQuery,
  mapAvailabilityBlockRecordToDomain,
  mapBoatRecordToDomain,
  mapBookingRecordToDomain,
  mapPriceRuleRecordToDomain,
  toUtcDateOnly
} from "./mappers";
import type {
  AvailabilitySnapshotRow,
  CreatePendingBookingInput,
  SlotAvailabilityState,
  SlotBlockSource
} from "./types";

const defaultPublicPartySize = 1;

type BookingWriteExecutor = Prisma.TransactionClient | PrismaClient;

function getSlotBlockSourceFromOccupancy(occupancy: {
  bookingId: string | null;
  availabilityBlockId: string | null;
}): SlotBlockSource {
  if (occupancy.bookingId) {
    return "booking";
  }

  if (occupancy.availabilityBlockId) {
    return "admin";
  }

  return null;
}

function isSlotOccupancyUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("boatId") &&
    error.meta.target.includes("date") &&
    error.meta.target.includes("tripType")
  );
}

async function getSlotAvailabilityStateFromExecutor(
  executor: BookingWriteExecutor,
  input: {
    boatId: string;
    date: string;
    tripType: PriceRule["tripType"];
  }
): Promise<SlotAvailabilityState> {
  const occupancy = await executor.slotOccupancy.findUnique({
    where: {
      boatId_date_tripType: {
        boatId: input.boatId,
        date: toUtcDateOnly(input.date),
        tripType: input.tripType
      }
    },
    select: {
      bookingId: true,
      availabilityBlockId: true
    }
  });

  const blockedBy = occupancy ? getSlotBlockSourceFromOccupancy(occupancy) : null;

  return {
    boatId: input.boatId,
    date: input.date,
    tripType: input.tripType,
    isBookable: blockedBy === null,
    blockedBy
  };
}

async function assertBoatSupportsTripType(
  executor: BookingWriteExecutor,
  input: {
    boatId: string;
    tripType: PriceRule["tripType"];
  }
): Promise<void> {
  const boat = await executor.boat.findUnique({
    where: {
      id: input.boatId
    },
    select: {
      id: true,
      supportedTripTypes: {
        where: {
          tripType: input.tripType
        },
        select: {
          id: true
        }
      }
    }
  });

  if (!boat || boat.supportedTripTypes.length === 0) {
    throw new UnsupportedBoatTripTypeError();
  }
}

export class DatabaseWriteUnavailableError extends Error {
  constructor() {
    super("Booking submission requires a configured database connection.");
    this.name = "DatabaseWriteUnavailableError";
  }
}

export class SlotUnavailableError extends Error {
  readonly blockedBy: SlotBlockSource;

  constructor(blockedBy: SlotBlockSource = null) {
    super("The selected slot is no longer available.");
    this.name = "SlotUnavailableError";
    this.blockedBy = blockedBy;
  }
}

export class UnsupportedBoatTripTypeError extends Error {
  constructor() {
    super("The selected boat and trip type combination is not valid.");
    this.name = "UnsupportedBoatTripTypeError";
  }
}

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

export async function getSlotAvailabilityState(input: {
  boatId: string;
  date: string;
  tripType: PriceRule["tripType"];
}): Promise<SlotAvailabilityState> {
  if (!prisma) {
    const blockedBy = getSlotBlockReason(input, mockBookings, mockAvailabilityBlocks);

    return {
      boatId: input.boatId,
      date: input.date,
      tripType: input.tripType,
      isBookable: blockedBy === null,
      blockedBy
    };
  }

  return getSlotAvailabilityStateFromExecutor(prisma, input);
}

export async function assertSlotBookable(input: {
  boatId: string;
  date: string;
  tripType: PriceRule["tripType"];
}): Promise<void> {
  const availability = await getSlotAvailabilityState(input);

  if (!availability.isBookable) {
    throw new SlotUnavailableError(availability.blockedBy);
  }
}

export async function createPendingBooking(
  input: CreatePendingBookingInput
): Promise<Booking> {
  if (!prisma) {
    throw new DatabaseWriteUnavailableError();
  }

  return prisma.$transaction(async (transaction) => {
    const slot = {
      boatId: input.boatId,
      date: input.date,
      tripType: input.tripType
    };

    await assertBoatSupportsTripType(transaction, slot);

    const slotAvailability = await getSlotAvailabilityStateFromExecutor(
      transaction,
      slot
    );

    if (!slotAvailability.isBookable) {
      throw new SlotUnavailableError(slotAvailability.blockedBy);
    }

    const bookingDate = toUtcDateOnly(input.date);

    const bookingRecord = await transaction.booking.create({
      data: {
        boatId: input.boatId,
        date: bookingDate,
        tripType: input.tripType,
        status: "pending",
        source: input.source ?? "booking_app",
        customerName: input.customerName,
        email: input.email,
        phone: input.phone,
        partySize: input.partySize ?? defaultPublicPartySize,
        notes: input.notes ?? null
      }
    });

    try {
      await transaction.slotOccupancy.create({
        data: {
          boatId: input.boatId,
          date: bookingDate,
          tripType: input.tripType,
          bookingId: bookingRecord.id
        }
      });
    } catch (error) {
      if (isSlotOccupancyUniqueConflict(error)) {
        throw new SlotUnavailableError();
      }

      throw error;
    }

    return mapBookingRecordToDomain(bookingRecord);
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
