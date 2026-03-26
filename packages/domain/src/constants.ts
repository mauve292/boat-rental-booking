import type {
  AdminNavItem,
  BoatAmenity,
  BookingSeasonSettings,
  BookingSource,
  BookingStatus,
  TripType
} from "./types";

export const tripTypes = [
  "half_day",
  "full_day",
  "sunset_cruise"
] as const satisfies readonly TripType[];

export const bookingStatusValues = [
  "pending",
  "confirmed",
  "cancelled"
] as const satisfies readonly BookingStatus[];

export const bookingSourceValues = [
  "site_fleet",
  "booking_app",
  "admin_manual"
] as const satisfies readonly BookingSource[];

export const boatAmenityValues = [
  "bimini_shade",
  "cooler",
  "bluetooth_audio",
  "swim_ladder",
  "snorkel_gear",
  "deck_shower"
] as const satisfies readonly BoatAmenity[];

export const bookingSeason = {
  startMonth: 5,
  endMonth: 9,
  label: "May through September"
} satisfies BookingSeasonSettings;

export const bookingQueryKeys = {
  boat: "boat"
} as const;

export const bookingRoutes = {
  root: "/"
} as const;

export const tripTypeLabels: Record<TripType, string> = {
  half_day: "Half day",
  full_day: "Full day",
  sunset_cruise: "Sunset cruise"
};

export const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled"
};

export const bookingSourceLabels: Record<BookingSource, string> = {
  site_fleet: "Site fleet page",
  booking_app: "Booking app",
  admin_manual: "Admin entry"
};

export const boatAmenityLabels: Record<BoatAmenity, string> = {
  bimini_shade: "Bimini shade",
  cooler: "Cooler",
  bluetooth_audio: "Bluetooth audio",
  swim_ladder: "Swim ladder",
  snorkel_gear: "Snorkel gear",
  deck_shower: "Deck shower"
};

export const adminNavItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    description: "Operational overview for the current booking season."
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/bookings",
    description: "Review incoming requests and reservation status."
  },
  {
    id: "availability",
    label: "Availability",
    href: "/availability",
    description: "Inspect booked and manually blocked slots."
  },
  {
    id: "pricing",
    label: "Pricing",
    href: "#pricing",
    description: "Future home for seasonal and boat-specific pricing rules."
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "#notifications",
    description: "Badge-ready alerts for pending work."
  },
  {
    id: "settings",
    label: "Settings",
    href: "#settings",
    description: "Operational settings, season controls, and integrations later."
  }
] as const satisfies readonly AdminNavItem[];
