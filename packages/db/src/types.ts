import type {
  AvailabilityBlock,
  Boat,
  Booking,
  BookingSource,
  BookingStatus,
  TripType
} from "@boat/domain";

export type SlotBlockSource = "booking" | "admin" | null;

export interface AvailabilitySnapshotSlot {
  tripType: TripType;
  blockedBy: SlotBlockSource;
}

export interface AvailabilitySnapshotRow {
  boat: Boat;
  date: string;
  slots: AvailabilitySnapshotSlot[];
}

export interface SlotAvailabilityState {
  boatId: string;
  date: string;
  tripType: TripType;
  isBookable: boolean;
  blockedBy: SlotBlockSource;
}

export interface CreatePendingBookingInput {
  boatId: string;
  date: string;
  tripType: TripType;
  customerName: string;
  email: string;
  phone: string;
  source?: BookingSource;
  partySize?: number;
  notes?: string | null;
}

export interface ListBookingsFilters {
  status?: BookingStatus;
  boatId?: string;
}

export interface AdminBookingListItem {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  boatId: string;
  boatName: string;
  boatSlug: string;
  date: string;
  tripType: TripType;
  status: BookingStatus;
  source: BookingSource;
  createdAt: string;
}

export interface AdminBookingDetail extends AdminBookingListItem {
  updatedAt: string;
  partySize: number;
  notes?: string;
  slotOccupied: boolean;
  currentSlotBlockedBy: SlotBlockSource;
  currentSlotOccupancyId: string | null;
  currentSlotBookingId: string | null;
  currentSlotAvailabilityBlockId: string | null;
}

export interface BookingMutationResult {
  booking: Booking;
  changed: boolean;
}

export interface ListAvailabilityStateFilters {
  boatId?: string;
  tripType?: TripType;
  dateFrom: string;
  dateTo: string;
}

export interface AvailabilityStateRow {
  boatId: string;
  boatName: string;
  boatSlug: string;
  date: string;
  tripType: TripType;
  state: "free" | "booking" | "admin";
  bookingId: string | null;
  bookingStatus: BookingStatus | null;
  bookingCustomerName: string | null;
  availabilityBlockId: string | null;
  availabilityBlockReason: string | null;
  availabilityBlockCreatedByLabel: string | null;
  occupancyId: string | null;
}

export interface CreateAvailabilityBlockInput {
  boatId: string;
  date: string;
  tripType: TripType;
  reason: string;
  createdByLabel: string;
}

export interface AvailabilityBlockMutationResult {
  block: AvailabilityBlock;
  changed: boolean;
}
