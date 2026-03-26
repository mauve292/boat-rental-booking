import {
  availabilityBlocks as mockAvailabilityBlocks,
  boats as mockBoats,
  bookingSeason as defaultBookingSeason,
  createBookingSeasonSettings,
  getBoatById as getMockBoatById,
  getBoatBySlug as getMockBoatBySlug,
  getPriceForBoatAndTripType as getMockPriceForBoatAndTripType,
  getSlotBlockReason,
  getSupportedTripTypesForBoat,
  priceRules as mockPriceRules,
  sampleBookings as mockBookings,
  summarizePendingBookingsCount,
  type AppSettings,
  type AvailabilityBlock,
  type Boat,
  type Booking,
  type PriceRule,
  tripTypeLabels,
  tripTypes
} from "@boat/domain";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./client";
import {
  boatQuery,
  mapAppSettingsRecordToDomain,
  mapAvailabilityBlockRecordToDomain,
  mapBoatRecordToDomain,
  mapBookingRecordToDomain,
  mapPriceRuleRecordToDomain,
  toDateOnlyString,
  toUtcDateOnly
} from "./mappers";
import type {
  AvailabilityBlockMutationResult,
  AvailabilityStateRow,
  AdminBookingDetail,
  AdminBookingListItem,
  AvailabilitySnapshotRow,
  AppSettingsRecord,
  BookingMutationResult,
  CreateAvailabilityBlockInput,
  CreatePendingBookingInput,
  ListAvailabilityStateFilters,
  ListBookingsFilters,
  PricingMatrixRow,
  SlotAvailabilityState,
  SlotBlockSource,
  UpdateAppSettingsInput,
  UpdatePriceRuleInput
} from "./types";

const defaultPublicPartySize = 1;
const defaultContactEmail = "bookings@boatrental.local";

type BookingWriteExecutor = Prisma.TransactionClient | PrismaClient;
type BookingTransitionAction = "confirm" | "cancel";
type SlotState = AvailabilityStateRow["state"];

function getDefaultAppSettings(): AppSettingsRecord {
  const contactEmail = (
    process.env.BUSINESS_CONTACT_EMAIL ??
    process.env.ADMIN_EMAIL ??
    defaultContactEmail
  )
    .trim()
    .toLowerCase();

  return {
    bookingSeason: defaultBookingSeason,
    contactEmail,
    updatedAt: new Date(0).toISOString()
  };
}

function isValidMonth(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

function isValidPriceAmount(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 999999.99 &&
    Math.round(value * 100) === value * 100
  );
}

function normalizeAppSettingsRecord(record: {
  bookingSeasonStartMonth: number;
  bookingSeasonEndMonth: number;
  contactEmail: string;
  updatedAt: Date;
}): AppSettingsRecord {
  const contactEmail = record.contactEmail.trim().toLowerCase();

  if (
    !isValidMonth(record.bookingSeasonStartMonth) ||
    !isValidMonth(record.bookingSeasonEndMonth) ||
    record.bookingSeasonStartMonth > record.bookingSeasonEndMonth ||
    contactEmail.length === 0
  ) {
    throw new AppSettingsConfigurationError();
  }

  return {
    bookingSeason: createBookingSeasonSettings(
      record.bookingSeasonStartMonth,
      record.bookingSeasonEndMonth
    ),
    contactEmail,
    updatedAt: record.updatedAt.toISOString()
  };
}

function buildPriceRuleLabel(
  boatName: string,
  tripType: PriceRule["tripType"]
): string {
  return `${boatName} ${tripTypeLabels[tripType]}`;
}

function buildPricingMatrix(
  boats: Boat[],
  rules: PriceRule[]
): PricingMatrixRow[] {
  return boats.map((boat) => ({
    boatId: boat.id,
    boatName: boat.name,
    boatSlug: boat.slug,
    prices: tripTypes.map((tripType) => {
      const matchingRule =
        rules.find(
          (priceRule) =>
            priceRule.boatId === boat.id && priceRule.tripType === tripType
        ) ?? null;

      return {
        tripType,
        priceRuleId: matchingRule?.id ?? null,
        amount: matchingRule?.amount ?? null,
        currency: matchingRule?.currency ?? "EUR",
        label: matchingRule?.label ?? null,
        isSupported: boat.supportedTripTypes.includes(tripType)
      };
    })
  }));
}

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

function enumerateDateRange(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  const currentDate = toUtcDateOnly(dateFrom);
  const lastDate = toUtcDateOnly(dateTo);

  while (currentDate <= lastDate) {
    dates.push(toDateOnlyString(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
}

function getSlotStateFromBlockedBy(blockedBy: SlotBlockSource): SlotState {
  if (blockedBy === "booking") {
    return "booking";
  }

  if (blockedBy === "admin") {
    return "admin";
  }

  return "free";
}

function mapMockAvailabilityStateRow(
  boat: Boat,
  bookingOrBlockDate: string,
  tripType: Booking["tripType"],
  filters: {
    booking?: Booking;
    block?: AvailabilityBlock;
  }
): AvailabilityStateRow {
  const blockedBy = filters.booking
    ? "booking"
    : filters.block
      ? "admin"
      : null;

  return {
    boatId: boat.id,
    boatName: boat.name,
    boatSlug: boat.slug,
    date: bookingOrBlockDate,
    tripType,
    state: getSlotStateFromBlockedBy(blockedBy),
    bookingId: filters.booking?.id ?? null,
    bookingStatus: filters.booking?.status ?? null,
    bookingCustomerName: filters.booking?.customerName ?? null,
    availabilityBlockId: filters.block?.id ?? null,
    availabilityBlockReason: filters.block?.reason ?? null,
    availabilityBlockCreatedByLabel: filters.block?.createdByLabel ?? null,
    occupancyId:
      filters.booking?.status && filters.booking.status !== "cancelled"
        ? `mock-slot-${filters.booking.id}`
        : filters.block
          ? `mock-block-slot-${filters.block.id}`
          : null
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

export class AvailabilityBlockNotFoundError extends Error {
  constructor() {
    super("The requested availability block could not be found.");
    this.name = "AvailabilityBlockNotFoundError";
  }
}

export class AvailabilityBlockConflictError extends Error {
  readonly occupiedBy: Exclude<SlotBlockSource, null>;

  constructor(occupiedBy: Exclude<SlotBlockSource, null>) {
    super(`The slot is already occupied by ${occupiedBy}.`);
    this.name = "AvailabilityBlockConflictError";
    this.occupiedBy = occupiedBy;
  }
}

export class InvalidPriceRuleAmountError extends Error {
  constructor() {
    super("The provided price amount is invalid.");
    this.name = "InvalidPriceRuleAmountError";
  }
}

export class AppSettingsConfigurationError extends Error {
  constructor() {
    super("The application settings are missing or invalid.");
    this.name = "AppSettingsConfigurationError";
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

async function getAvailabilityBlockRecordForMutationOrThrow(
  executor: BookingWriteExecutor,
  availabilityBlockId: string
) {
  const availabilityBlockRecord = await executor.availabilityBlock.findUnique({
    where: {
      id: availabilityBlockId
    },
    select: {
      id: true,
      boatId: true,
      date: true,
      tripType: true,
      reason: true,
      createdAt: true,
      createdByLabel: true
    }
  });

  if (!availabilityBlockRecord) {
    throw new AvailabilityBlockNotFoundError();
  }

  return availabilityBlockRecord;
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

export async function listPricingMatrix(): Promise<PricingMatrixRow[]> {
  if (!prisma) {
    return buildPricingMatrix(mockBoats, mockPriceRules);
  }

  const records = await prisma.boat.findMany({
    ...boatQuery,
    include: {
      ...boatQuery.include,
      priceRules: {
        orderBy: {
          tripType: "asc"
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  return buildPricingMatrix(
    records.map(mapBoatRecordToDomain),
    records.flatMap((boatRecord) =>
      boatRecord.priceRules.map(mapPriceRuleRecordToDomain)
    )
  );
}

export async function updatePriceRule(
  input: UpdatePriceRuleInput
): Promise<PriceRule> {
  if (!prisma) {
    throw new DatabaseWriteUnavailableError();
  }

  if (!isValidPriceAmount(input.amount)) {
    throw new InvalidPriceRuleAmountError();
  }

  return prisma.$transaction(async (transaction) => {
    await assertBoatSupportsTripType(transaction, {
      boatId: input.boatId,
      tripType: input.tripType
    });

    const boat = await transaction.boat.findUnique({
      where: {
        id: input.boatId
      },
      select: {
        name: true
      }
    });

    if (!boat) {
      throw new UnsupportedBoatTripTypeError();
    }

    const record = await transaction.priceRule.upsert({
      where: {
        boatId_tripType: {
          boatId: input.boatId,
          tripType: input.tripType
        }
      },
      update: {
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency ?? "EUR",
        label:
          input.label?.trim() ||
          buildPriceRuleLabel(boat.name, input.tripType)
      },
      create: {
        boatId: input.boatId,
        tripType: input.tripType,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency ?? "EUR",
        label:
          input.label?.trim() ||
          buildPriceRuleLabel(boat.name, input.tripType)
      }
    });

    return mapPriceRuleRecordToDomain(record);
  });
}

export async function getAppSettings(): Promise<AppSettingsRecord> {
  if (!prisma) {
    return getDefaultAppSettings();
  }

  const record = await prisma.appSettings.findUnique({
    where: {
      id: 1
    }
  });

  if (!record) {
    return getDefaultAppSettings();
  }

  try {
    return normalizeAppSettingsRecord(record);
  } catch (error) {
    if (error instanceof AppSettingsConfigurationError) {
      return getDefaultAppSettings();
    }

    throw error;
  }
}

export async function updateAppSettings(
  input: UpdateAppSettingsInput
): Promise<AppSettings> {
  if (!prisma) {
    throw new DatabaseWriteUnavailableError();
  }

  const contactEmail = input.contactEmail.trim().toLowerCase();

  if (
    !isValidMonth(input.bookingSeasonStartMonth) ||
    !isValidMonth(input.bookingSeasonEndMonth) ||
    input.bookingSeasonStartMonth > input.bookingSeasonEndMonth ||
    contactEmail.length === 0
  ) {
    throw new AppSettingsConfigurationError();
  }

  const record = await prisma.appSettings.upsert({
    where: {
      id: 1
    },
    update: {
      bookingSeasonStartMonth: input.bookingSeasonStartMonth,
      bookingSeasonEndMonth: input.bookingSeasonEndMonth,
      contactEmail
    },
    create: {
      id: 1,
      bookingSeasonStartMonth: input.bookingSeasonStartMonth,
      bookingSeasonEndMonth: input.bookingSeasonEndMonth,
      contactEmail
    }
  });

  return mapAppSettingsRecordToDomain(record);
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

export async function listAvailabilityState(
  filters: ListAvailabilityStateFilters
): Promise<AvailabilityStateRow[]> {
  const dateRange = enumerateDateRange(filters.dateFrom, filters.dateTo);

  if (!prisma) {
    const availableBoats = filters.boatId
      ? mockBoats.filter((boat) => boat.id === filters.boatId)
      : [...mockBoats];
    const activeBookings = mockBookings.filter((booking) => booking.status !== "cancelled");

    return availableBoats.flatMap((boat) =>
      dateRange.flatMap((date) =>
        getSupportedTripTypesForBoat(boat)
          .filter((tripType) => !filters.tripType || tripType === filters.tripType)
          .map((tripType) => {
            const booking = activeBookings.find(
              (item) =>
                item.boatId === boat.id &&
                item.date === date &&
                item.tripType === tripType
            );
            const block = mockAvailabilityBlocks.find(
              (item) =>
                item.boatId === boat.id &&
                item.date === date &&
                item.tripType === tripType
            );

            return mapMockAvailabilityStateRow(boat, date, tripType, {
              booking,
              block
            });
          })
      )
    );
  }

  const availableBoats = await prisma.boat.findMany({
    where: filters.boatId
      ? {
          id: filters.boatId
        }
      : undefined,
    select: {
      id: true,
      name: true,
      slug: true,
      supportedTripTypes: {
        select: {
          tripType: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  const [activeBookings, availabilityBlocks, slotOccupancies] = await Promise.all([
    prisma.booking.findMany({
      where: {
        boatId: filters.boatId,
        tripType: filters.tripType,
        date: {
          gte: toUtcDateOnly(filters.dateFrom),
          lte: toUtcDateOnly(filters.dateTo)
        },
        status: {
          in: ["pending", "confirmed"]
        }
      },
      select: {
        id: true,
        boatId: true,
        date: true,
        tripType: true,
        status: true,
        customerName: true
      }
    }),
    prisma.availabilityBlock.findMany({
      where: {
        boatId: filters.boatId,
        tripType: filters.tripType,
        date: {
          gte: toUtcDateOnly(filters.dateFrom),
          lte: toUtcDateOnly(filters.dateTo)
        }
      },
      select: {
        id: true,
        boatId: true,
        date: true,
        tripType: true,
        reason: true,
        createdByLabel: true
      }
    }),
    prisma.slotOccupancy.findMany({
      where: {
        boatId: filters.boatId,
        tripType: filters.tripType,
        date: {
          gte: toUtcDateOnly(filters.dateFrom),
          lte: toUtcDateOnly(filters.dateTo)
        }
      },
      select: {
        id: true,
        boatId: true,
        date: true,
        tripType: true,
        bookingId: true,
        availabilityBlockId: true
      }
    })
  ]);

  const bookingMap = new Map(
    activeBookings.map((booking) => [booking.id, booking] as const)
  );
  const availabilityBlockMap = new Map(
    availabilityBlocks.map((block) => [block.id, block] as const)
  );
  const slotOccupancyMap = new Map(
    slotOccupancies.map((occupancy) => {
      const key = `${occupancy.boatId}:${toDateOnlyString(occupancy.date)}:${occupancy.tripType}`;

      return [key, occupancy] as const;
    })
  );

  return availableBoats.flatMap((boat) =>
    dateRange.flatMap((date) =>
      boat.supportedTripTypes
        .map((support) => support.tripType as Booking["tripType"])
        .filter((tripType) => !filters.tripType || tripType === filters.tripType)
        .map((tripType) => {
          const key = `${boat.id}:${date}:${tripType}`;
          const occupancy = slotOccupancyMap.get(key);
          const booking =
            occupancy?.bookingId ? bookingMap.get(occupancy.bookingId) ?? null : null;
          const block =
            occupancy?.availabilityBlockId
              ? availabilityBlockMap.get(occupancy.availabilityBlockId) ?? null
              : null;
          const blockedBy = occupancy ? getSlotBlockSourceFromOccupancy(occupancy) : null;

          return {
            boatId: boat.id,
            boatName: boat.name,
            boatSlug: boat.slug,
            date,
            tripType,
            state: getSlotStateFromBlockedBy(blockedBy),
            bookingId: booking?.id ?? null,
            bookingStatus: booking?.status ?? null,
            bookingCustomerName: booking?.customerName ?? null,
            availabilityBlockId: block?.id ?? null,
            availabilityBlockReason: block?.reason ?? null,
            availabilityBlockCreatedByLabel: block?.createdByLabel ?? null,
            occupancyId: occupancy?.id ?? null
          };
        })
    )
  );
}

export async function getAvailabilityBlockById(
  availabilityBlockId: string
): Promise<AvailabilityBlock | null> {
  if (!prisma) {
    return (
      mockAvailabilityBlocks.find((block) => block.id === availabilityBlockId) ?? null
    );
  }

  const record = await prisma.availabilityBlock.findUnique({
    where: {
      id: availabilityBlockId
    }
  });

  return record ? mapAvailabilityBlockRecordToDomain(record) : null;
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

export async function createAvailabilityBlock(
  input: CreateAvailabilityBlockInput
): Promise<AvailabilityBlockMutationResult> {
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

    if (!slotAvailability.isBookable && slotAvailability.blockedBy) {
      throw new AvailabilityBlockConflictError(slotAvailability.blockedBy);
    }

    const blockRecord = await transaction.availabilityBlock.create({
      data: {
        boatId: input.boatId,
        date: toUtcDateOnly(input.date),
        tripType: input.tripType,
        reason: input.reason,
        createdByLabel: input.createdByLabel
      }
    });

    try {
      await transaction.slotOccupancy.create({
        data: {
          boatId: input.boatId,
          date: toUtcDateOnly(input.date),
          tripType: input.tripType,
          availabilityBlockId: blockRecord.id
        }
      });
    } catch (error) {
      if (isSlotOccupancyUniqueConflict(error)) {
        const refreshedAvailability = await getSlotAvailabilityStateFromExecutor(
          transaction,
          slot
        );

        throw new AvailabilityBlockConflictError(
          refreshedAvailability.blockedBy ?? "admin"
        );
      }

      throw error;
    }

    return {
      block: mapAvailabilityBlockRecordToDomain(blockRecord),
      changed: true
    };
  });
}

export async function removeAvailabilityBlock(
  availabilityBlockId: string
): Promise<AvailabilityBlockMutationResult> {
  if (!prisma) {
    throw new DatabaseWriteUnavailableError();
  }

  return prisma.$transaction(async (transaction) => {
    const blockRecord = await getAvailabilityBlockRecordForMutationOrThrow(
      transaction,
      availabilityBlockId
    );

    await transaction.slotOccupancy.deleteMany({
      where: {
        availabilityBlockId: blockRecord.id
      }
    });

    await transaction.availabilityBlock.delete({
      where: {
        id: blockRecord.id
      }
    });

    return {
      block: mapAvailabilityBlockRecordToDomain(blockRecord),
      changed: true
    };
  });
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
