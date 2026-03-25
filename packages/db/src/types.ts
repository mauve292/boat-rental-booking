import type { Boat, BookingSource, TripType } from "@boat/domain";

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
