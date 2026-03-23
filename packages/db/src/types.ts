import type { Boat, TripType } from "@boat/domain";

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

