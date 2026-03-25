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
  toDateOnlyString,
  toUtcDateOnly
} from "./mappers";
import type {
  AdminBookingDetail,
  AdminBookingListItem,
  AvailabilitySnapshotRow,
  BookingMutationResult,
  CreatePendingBookingInput,
  ListBookingsFilters,
  SlotAvailabilityState,
  SlotBlockSource
} from "./types";

const defaultPublicPartySize = 1;

type BookingWriteExecutor = Prisma.TransactionClient | PrismaClient;
type BookingTransitionAction = "confirm" | "cancel";

function mapAdminBookingListItem(record: {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  boatId: string;
  date: Date;
  tripType: Booking["tripType"];
  status: Booking["status"];
  source: Booking["source"];
  createdAt: Date;
  boat: {
    name: string;
    slug: string;
  };
}): AdminBookingListItem {
  return {
    id: record.id,
    customerName: record.customerName,
    email: record.email,
    phone: record.phone,
    boatId: record.boatId,
    boatName: record.boat.name,
    boatSlug: record.boat.slug,
    date: toDateOnlyString(record.date),
    tripType: record.tripType,
    status: record.status,
    source: record.source,
    createdAt: record.createdAt.toISOString()
  };
}

function mapAdminBookingDetail(record: {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  boatId: string;
  date: Date;
  tripType: Booking["tripType"];
  status: Booking["status"];
  source: Booking["source"];
  partySize: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  boat: {
    name: string;
    slug: string;
  };
  currentSlotOccupancy: {
    id: string;
    bookingId: string | null;
    availabilityBlockId: string | null;
  } | null;
}): AdminBookingDetail {
  const currentSlotBlockedBy = record.currentSlotOccupancy
    ? getSlotBlockSourceFromOccupancy(record.currentSlotOccupancy)
    : null;

  return {
    id: record.id,
    customerName: record.customerName,
    email: record.email,
    phone: record.phone,
    boatId: record.boatId,
    boatName: record.boat.name,
    boatSlug: record.boat.slug,
    date: toDateOnlyString(record.date),
    tripType: record.tripType,
    status: record.status,
    source: record.source,
    partySize: record.partySize,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    slotOccupied: currentSlotBlockedBy !== null,
    currentSlotBlockedBy,
    currentSlotOccupancyId: record.currentSlotOccupancy?.id ?? null,
    currentSlotBookingId: record.currentSlotOccupancy?.bookingId ?? null,
    currentSlotAvailabilityBlockId:
      record.currentSlotOccupancy?.availabilityBlockId ?? null
  };
}

function mapMockBookingToAdminListItem(booking: Booking): AdminBookingListItem {
  const boat = getMockBoatById(booking.boatId);

  return {
    id: booking.id,
    customerName: booking.customerName,
    email: booking.email,
    phone: booking.phone,
    boatId: booking.boatId,
    boatName: boat?.name ?? booking.boatId,
    boatSlug: boat?.slug ?? booking.boatId,
    date: booking.date,
    tripType: booking.tripType,
    status: booking.status,
    source: booking.source,
    createdAt: booking.createdAt
  };
}

function mapMockBookingToAdminDetail(booking: Booking): AdminBookingDetail {
  const boat = getMockBoatById(booking.boatId);
  const currentSlotBlockedBy = getSlotBlockReason(
    {
      boatId: booking.boatId,
      date: booking.date,
      tripType: booking.tripType
    },
    mockBookings,
    mockAvailabilityBlocks
  );

  return {
    ...mapMockBookingToAdminListItem(booking),
    updatedAt: booking.createdAt,
    partySize: booking.partySize,
    notes: booking.notes,
    slotOccupied: currentSlotBlockedBy !== null,
    currentSlotBlockedBy,
    currentSlotOccupancyId:
      booking.status === "cancelled" ? null : `mock-slot-${booking.id}`,
    currentSlotBookingId: booking.status === "cancelled" ? null : booking.id,
    currentSlotAvailabilityBlockId: null
  };
}

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

export class BookingNotFoundError extends Error {
  constructor() {
    super("The requested booking could not be found.");
    this.name = "BookingNotFoundError";
  }
}

export class BookingTransitionError extends Error {
  readonly action: BookingTransitionAction;
  readonly currentStatus: Booking["status"];

  constructor(action: BookingTransitionAction, currentStatus: Booking["status"]) {
    super(`Cannot ${action} a booking from status ${currentStatus}.`);
    this.name = "BookingTransitionError";
    this.action = action;
    this.currentStatus = currentStatus;
  }
}

export class BookingOccupancyStateError extends Error {
  constructor() {
    super("The booking does not currently hold the slot it is expected to occupy.");
    this.name = "BookingOccupancyStateError";
  }
}

function sortByCreatedAtDescending<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((leftItem, rightItem) =>
    rightItem.createdAt.localeCompare(leftItem.createdAt)
  );
}

async function getBookingRecordForMutationOrThrow(
  executor: BookingWriteExecutor,
  bookingId: string
) {
  const bookingRecord = await executor.booking.findUnique({
    where: {
      id: bookingId
    },
    select: {
      id: true,
      boatId: true,
      date: true,
      tripType: true,
      status: true,
      source: true,
      customerName: true,
      email: true,
      phone: true,
      partySize: true,
      notes: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!bookingRecord) {
    throw new BookingNotFoundError();
  }

  return bookingRecord;
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

export async function listBookings(
  filters: ListBookingsFilters = {}
): Promise<AdminBookingListItem[]> {
  if (!prisma) {
    return sortByCreatedAtDescending(mockBookings)
      .filter((booking) => {
        if (filters.status && booking.status !== filters.status) {
          return false;
        }

        if (filters.boatId && booking.boatId !== filters.boatId) {
          return false;
        }

        return true;
      })
      .map(mapMockBookingToAdminListItem);
  }

  const records = await prisma.booking.findMany({
    where: {
      status: filters.status,
      boatId: filters.boatId
    },
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      customerName: true,
      email: true,
      phone: true,
      boatId: true,
      date: true,
      tripType: true,
      status: true,
      source: true,
      createdAt: true,
      boat: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });

  return records.map(mapAdminBookingListItem);
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  if (!prisma) {
    return mockBookings.find((booking) => booking.id === bookingId) ?? null;
  }

  const record = await prisma.booking.findUnique({
    where: {
      id: bookingId
    }
  });

  return record ? mapBookingRecordToDomain(record) : null;
}

export async function getBookingDetailForAdmin(
  bookingId: string
): Promise<AdminBookingDetail | null> {
  if (!prisma) {
    const booking = mockBookings.find((item) => item.id === bookingId);

    return booking ? mapMockBookingToAdminDetail(booking) : null;
  }

  const bookingRecord = await prisma.booking.findUnique({
    where: {
      id: bookingId
    },
    select: {
      id: true,
      customerName: true,
      email: true,
      phone: true,
      boatId: true,
      date: true,
      tripType: true,
      status: true,
      source: true,
      partySize: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      boat: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });

  if (!bookingRecord) {
    return null;
  }

  const currentSlotOccupancy = await prisma.slotOccupancy.findUnique({
    where: {
      boatId_date_tripType: {
        boatId: bookingRecord.boatId,
        date: bookingRecord.date,
        tripType: bookingRecord.tripType
      }
    },
    select: {
      id: true,
      bookingId: true,
      availabilityBlockId: true
    }
  });

  return mapAdminBookingDetail({
    ...bookingRecord,
    currentSlotOccupancy
  });
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

export async function confirmBooking(
  bookingId: string
): Promise<BookingMutationResult> {
  if (!prisma) {
    throw new DatabaseWriteUnavailableError();
  }

  return prisma.$transaction(async (transaction) => {
    const bookingRecord = await getBookingRecordForMutationOrThrow(
      transaction,
      bookingId
    );

    if (bookingRecord.status !== "pending") {
      throw new BookingTransitionError("confirm", bookingRecord.status);
    }

    const currentSlotOccupancy = await transaction.slotOccupancy.findUnique({
      where: {
        boatId_date_tripType: {
          boatId: bookingRecord.boatId,
          date: bookingRecord.date,
          tripType: bookingRecord.tripType
        }
      },
      select: {
        bookingId: true,
        availabilityBlockId: true
      }
    });

    if (
      !currentSlotOccupancy ||
      currentSlotOccupancy.bookingId !== bookingRecord.id ||
      currentSlotOccupancy.availabilityBlockId !== null
    ) {
      throw new BookingOccupancyStateError();
    }

    const updatedBooking = await transaction.booking.update({
      where: {
        id: bookingRecord.id
      },
      data: {
        status: "confirmed"
      }
    });

    return {
      booking: mapBookingRecordToDomain(updatedBooking),
      changed: true
    };
  });
}

export async function cancelBooking(
  bookingId: string
): Promise<BookingMutationResult> {
  if (!prisma) {
    throw new DatabaseWriteUnavailableError();
  }

  return prisma.$transaction(async (transaction) => {
    const bookingRecord = await getBookingRecordForMutationOrThrow(
      transaction,
      bookingId
    );

    if (bookingRecord.status === "cancelled") {
      await transaction.slotOccupancy.deleteMany({
        where: {
          bookingId: bookingRecord.id
        }
      });

      return {
        booking: mapBookingRecordToDomain(bookingRecord),
        changed: false
      };
    }

    const updatedBooking = await transaction.booking.update({
      where: {
        id: bookingRecord.id
      },
      data: {
        status: "cancelled"
      }
    });

    await transaction.slotOccupancy.deleteMany({
      where: {
        bookingId: bookingRecord.id
      }
    });

    return {
      booking: mapBookingRecordToDomain(updatedBooking),
      changed: true
    };
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
