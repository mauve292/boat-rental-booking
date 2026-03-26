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

const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

export function getMonthLabel(month: number): string {
  return monthLabels[month - 1] ?? `Month ${month}`;
}

export function createBookingSeasonSettings(
  startMonth: number,
  endMonth: number
): BookingSeasonSettings {
  const startMonthLabel = getMonthLabel(startMonth);
  const endMonthLabel = getMonthLabel(endMonth);

  return {
    startMonth,
    endMonth,
    label:
      startMonth === endMonth
        ? startMonthLabel
        : `${startMonthLabel} through ${endMonthLabel}`
  };
}

export const bookingSeason = createBookingSeasonSettings(5, 9);

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
    href: "/pricing",
    description: "Review and update boat pricing for each trip type."
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/#notifications",
    description: "Badge-ready alerts for pending work."
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    description: "Phase-1 operational settings for booking season and contact email."
  }
] as const satisfies readonly AdminNavItem[];
