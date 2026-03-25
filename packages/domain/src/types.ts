import type { Nullable } from "@boat/types";

export type BoatAmenity =
  | "bimini_shade"
  | "cooler"
  | "bluetooth_audio"
  | "swim_ladder"
  | "snorkel_gear"
  | "deck_shower";

export type TripType = "half_day" | "full_day" | "sunset_cruise";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type BookingSource = "site_fleet" | "booking_app" | "admin_manual";

export type NotificationKind =
  | "pending_booking"
  | "availability_block"
  | "pricing_review";

export type CurrencyCode = "EUR";

export interface Destination {
  id: string;
  slug: string;
  name: string;
  summary: string;
}

export interface ImagePlaceholder {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Boat {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  capacity: number;
  amenities: BoatAmenity[];
  destinations: Destination[];
  image: ImagePlaceholder;
  supportedTripTypes: TripType[];
}

export interface Booking {
  id: string;
  boatId: string;
  date: string;
  tripType: TripType;
  status: BookingStatus;
  source: BookingSource;
  customerName: string;
  email: string;
  phone: string;
  partySize: number;
  notes?: string;
  createdAt: string;
}

export interface AvailabilityBlock {
  id: string;
  boatId: string;
  date: string;
  tripType: TripType;
  reason: string;
  createdAt: string;
  createdByLabel: string;
}

export interface PriceRule {
  id: string;
  boatId: string;
  tripType: TripType;
  amount: number;
  currency: CurrencyCode;
  label: string;
}

export interface BookingSlot {
  boatId: string;
  date: string;
  tripType: TripType;
}

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  pendingBookings: number;
  blockedSlots: number;
  items: NotificationItem[];
}

export interface BookingSeasonSettings {
  startMonth: number;
  endMonth: number;
  label: string;
}

export interface PhoneCountryOption {
  code: string;
  label: string;
}

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  description: string;
}

export interface BookingSearchState {
  rawBoatSlug: Nullable<string>;
  selectedBoatSlug: Nullable<string>;
  hasSelection: boolean;
  isValid: boolean;
}

export interface ParsedSelectedBoatState extends BookingSearchState {
  boat: Nullable<Boat>;
}
