import type {
  AvailabilityBlock,
  Boat,
  Booking,
  NotificationSummary,
  PriceRule
} from "./types";
import { tripTypes } from "./constants";

export const boats: Boat[] = [
  {
    id: "boat_aurora",
    slug: "aurora",
    name: "Aurora",
    shortDescription:
      "Comfortable day cruiser for couples, small families, and relaxed island hopping.",
    capacity: 6,
    amenities: ["bimini_shade", "cooler", "bluetooth_audio", "swim_ladder"],
    destinations: [
      {
        id: "dest_hidden_coves",
        slug: "hidden-coves",
        name: "Hidden Coves",
        summary: "Short swims and easy anchoring close to shore."
      },
      {
        id: "dest_lighthouse_loop",
        slug: "lighthouse-loop",
        name: "Lighthouse Loop",
        summary: "Scenic shoreline cruise with calm afternoon water."
      }
    ],
    image: {
      src: "/placeholders/aurora.jpg",
      alt: "Aurora anchored near a quiet cove.",
      width: 1200,
      height: 800
    },
    supportedTripTypes: [...tripTypes]
  },
  {
    id: "boat_calypso",
    slug: "calypso",
    name: "Calypso",
    shortDescription:
      "Balanced fleet option with extra deck space for groups and all-day outings.",
    capacity: 8,
    amenities: [
      "bimini_shade",
      "cooler",
      "swim_ladder",
      "snorkel_gear",
      "deck_shower"
    ],
    destinations: [
      {
        id: "dest_blue_lagoon",
        slug: "blue-lagoon",
        name: "Blue Lagoon",
        summary: "Clear-water swimming stop with space for longer stays."
      },
      {
        id: "dest_outer_bays",
        slug: "outer-bays",
        name: "Outer Bays",
        summary: "Longer run suited to fuller itinerary days."
      }
    ],
    image: {
      src: "/placeholders/calypso.jpg",
      alt: "Calypso cruising along the coast.",
      width: 1200,
      height: 800
    },
    supportedTripTypes: [...tripTypes]
  },
  {
    id: "boat_nereid",
    slug: "nereid",
    name: "Nereid",
    shortDescription:
      "Smaller agile boat focused on sunset runs, photo stops, and lighter groups.",
    capacity: 5,
    amenities: ["bimini_shade", "bluetooth_audio", "cooler", "snorkel_gear"],
    destinations: [
      {
        id: "dest_sunset_point",
        slug: "sunset-point",
        name: "Sunset Point",
        summary: "Golden-hour route with open western views."
      },
      {
        id: "dest_harbor_arc",
        slug: "harbor-arc",
        name: "Harbor Arc",
        summary: "Quick scenic loop with easy return timing."
      }
    ],
    image: {
      src: "/placeholders/nereid.jpg",
      alt: "Nereid passing a cliff line at sunset.",
      width: 1200,
      height: 800
    },
    supportedTripTypes: [...tripTypes]
  }
];

export const priceRules: PriceRule[] = [
  {
    id: "price_aurora_half_day",
    boatId: "boat_aurora",
    tripType: "half_day",
    amount: 420,
    currency: "EUR",
    label: "From EUR 420"
  },
  {
    id: "price_aurora_full_day",
    boatId: "boat_aurora",
    tripType: "full_day",
    amount: 720,
    currency: "EUR",
    label: "From EUR 720"
  },
  {
    id: "price_aurora_sunset",
    boatId: "boat_aurora",
    tripType: "sunset_cruise",
    amount: 360,
    currency: "EUR",
    label: "From EUR 360"
  },
  {
    id: "price_calypso_half_day",
    boatId: "boat_calypso",
    tripType: "half_day",
    amount: 520,
    currency: "EUR",
    label: "From EUR 520"
  },
  {
    id: "price_calypso_full_day",
    boatId: "boat_calypso",
    tripType: "full_day",
    amount: 880,
    currency: "EUR",
    label: "From EUR 880"
  },
  {
    id: "price_calypso_sunset",
    boatId: "boat_calypso",
    tripType: "sunset_cruise",
    amount: 430,
    currency: "EUR",
    label: "From EUR 430"
  },
  {
    id: "price_nereid_half_day",
    boatId: "boat_nereid",
    tripType: "half_day",
    amount: 380,
    currency: "EUR",
    label: "From EUR 380"
  },
  {
    id: "price_nereid_full_day",
    boatId: "boat_nereid",
    tripType: "full_day",
    amount: 640,
    currency: "EUR",
    label: "From EUR 640"
  },
  {
    id: "price_nereid_sunset",
    boatId: "boat_nereid",
    tripType: "sunset_cruise",
    amount: 340,
    currency: "EUR",
    label: "From EUR 340"
  }
];

export const sampleBookings: Booking[] = [
  {
    id: "booking_1001",
    boatId: "boat_aurora",
    date: "2026-06-15",
    tripType: "half_day",
    status: "pending",
    source: "site_fleet",
    customerName: "Maya Reed",
    email: "maya@example.com",
    phone: "+30 690 111 2233",
    partySize: 4,
    notes: "Interested in a calm swim stop.",
    createdAt: "2026-03-20T08:15:00.000Z"
  },
  {
    id: "booking_1002",
    boatId: "boat_calypso",
    date: "2026-06-15",
    tripType: "full_day",
    status: "confirmed",
    source: "booking_app",
    customerName: "Theo Grant",
    email: "theo@example.com",
    phone: "+30 690 222 3344",
    partySize: 6,
    createdAt: "2026-03-19T12:45:00.000Z"
  },
  {
    id: "booking_1003",
    boatId: "boat_nereid",
    date: "2026-07-03",
    tripType: "sunset_cruise",
    status: "pending",
    source: "booking_app",
    customerName: "Iris Nolan",
    email: "iris@example.com",
    phone: "+30 690 333 4455",
    partySize: 2,
    notes: "Anniversary cruise.",
    createdAt: "2026-03-21T17:20:00.000Z"
  },
  {
    id: "booking_1004",
    boatId: "boat_aurora",
    date: "2026-08-10",
    tripType: "full_day",
    status: "cancelled",
    source: "admin_manual",
    customerName: "Luca Stone",
    email: "luca@example.com",
    phone: "+30 690 444 5566",
    partySize: 5,
    createdAt: "2026-03-18T09:10:00.000Z"
  }
];

export const availabilityBlocks: AvailabilityBlock[] = [
  {
    id: "block_2001",
    boatId: "boat_aurora",
    date: "2026-06-15",
    tripType: "sunset_cruise",
    reason: "Skipper training run",
    createdAt: "2026-03-17T10:00:00.000Z",
    createdByLabel: "Operations"
  },
  {
    id: "block_2002",
    boatId: "boat_calypso",
    date: "2026-07-12",
    tripType: "half_day",
    reason: "Routine maintenance window",
    createdAt: "2026-03-16T14:30:00.000Z",
    createdByLabel: "Fleet manager"
  },
  {
    id: "block_2003",
    boatId: "boat_nereid",
    date: "2026-06-15",
    tripType: "half_day",
    reason: "Private photo shoot hold",
    createdAt: "2026-03-18T11:20:00.000Z",
    createdByLabel: "Admin"
  }
];

export const notificationSummaryMock: NotificationSummary = {
  total: 4,
  unread: 3,
  pendingBookings: 2,
  blockedSlots: 2,
  items: [
    {
      id: "notif_pending_aurora",
      kind: "pending_booking",
      title: "2 pending bookings",
      detail: "Aurora and Nereid each have one pending request.",
      href: "#bookings"
    },
    {
      id: "notif_block_aurora",
      kind: "availability_block",
      title: "Blocked slot today sample",
      detail: "Aurora sunset cruise is manually blocked on 2026-06-15.",
      href: "#availability"
    },
    {
      id: "notif_pricing_review",
      kind: "pricing_review",
      title: "Pricing review placeholder",
      detail: "Price rules are mocked and ready for future admin editing.",
      href: "#pricing"
    },
    {
      id: "notif_block_nereid",
      kind: "availability_block",
      title: "Nereid availability hold",
      detail: "Half-day slot is blocked for a photo shoot hold.",
      href: "#availability"
    }
  ]
};
