import {
  availabilityBlocks,
  boatAmenityLabels,
  boats,
  priceRules,
  sampleBookings
} from "@boat/domain";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const defaultAdminEmail = "admin@boatrental.local";
const defaultAdminPassword = "AdminDemo123!";
const defaultAdminName = "Boat Rental Admin";

function toUtcDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

async function seedAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? defaultAdminEmail).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? defaultAdminPassword;
  const adminName = process.env.ADMIN_NAME ?? defaultAdminName;
  const passwordHash = await hashPassword(adminPassword);

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: adminEmail
    },
    select: {
      id: true
    }
  });

  if (existingAdmin) {
    await prisma.session.deleteMany({
      where: {
        userId: existingAdmin.id
      }
    });

    await prisma.account.deleteMany({
      where: {
        userId: existingAdmin.id
      }
    });
  }

  await prisma.user.upsert({
    where: {
      email: adminEmail
    },
    update: {
      emailVerified: true,
      name: adminName,
      image: null,
      role: "admin",
      accounts: {
        deleteMany: {}
      }
    },
    create: {
      email: adminEmail,
      emailVerified: true,
      name: adminName,
      image: null,
      role: "admin"
    }
  });

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: {
      email: adminEmail
    },
    select: {
      id: true
    }
  });

  await prisma.account.create({
    data: {
      userId: adminUser.id,
      providerId: "credential",
      accountId: adminUser.id,
      password: passwordHash
    }
  });
}

async function main() {
  await seedAdminUser();

  const uniqueAmenities = Array.from(
    new Set(boats.flatMap((boat) => boat.amenities))
  );

  for (const amenitySlug of uniqueAmenities) {
    await prisma.amenity.upsert({
      where: { slug: amenitySlug },
      update: { label: boatAmenityLabels[amenitySlug] },
      create: {
        id: amenitySlug,
        slug: amenitySlug,
        label: boatAmenityLabels[amenitySlug]
      }
    });
  }

  const destinationRecords = Array.from(
    new Map(
      boats.flatMap((boat) =>
        boat.destinations.map((destination) => [destination.slug, destination])
      )
    ).values()
  );

  for (const destination of destinationRecords) {
    await prisma.destination.upsert({
      where: { slug: destination.slug },
      update: {
        name: destination.name,
        summary: destination.summary
      },
      create: {
        id: destination.id,
        slug: destination.slug,
        name: destination.name,
        summary: destination.summary
      }
    });
  }

  for (const boat of boats) {
    await prisma.boat.upsert({
      where: { slug: boat.slug },
      update: {
        id: boat.id,
        name: boat.name,
        shortDescription: boat.shortDescription,
        capacity: boat.capacity,
        amenities: {
          set: boat.amenities.map((amenitySlug) => ({ id: amenitySlug }))
        },
        destinations: {
          set: boat.destinations.map((destination) => ({ id: destination.id }))
        }
      },
      create: {
        id: boat.id,
        slug: boat.slug,
        name: boat.name,
        shortDescription: boat.shortDescription,
        capacity: boat.capacity,
        amenities: {
          connect: boat.amenities.map((amenitySlug) => ({ id: amenitySlug }))
        },
        destinations: {
          connect: boat.destinations.map((destination) => ({
            id: destination.id
          }))
        }
      }
    });

    await prisma.boatImage.upsert({
      where: { boatId: boat.id },
      update: {
        src: boat.image.src,
        alt: boat.image.alt,
        width: boat.image.width,
        height: boat.image.height
      },
      create: {
        boatId: boat.id,
        src: boat.image.src,
        alt: boat.image.alt,
        width: boat.image.width,
        height: boat.image.height
      }
    });
  }

  for (const boat of boats) {
    for (const tripType of boat.supportedTripTypes) {
      await prisma.boatTripTypeSupport.upsert({
        where: {
          boatId_tripType: {
            boatId: boat.id,
            tripType
          }
        },
        update: {},
        create: {
          boatId: boat.id,
          tripType
        }
      });
    }
  }

  for (const priceRule of priceRules) {
    await prisma.priceRule.upsert({
      where: {
        boatId_tripType: {
          boatId: priceRule.boatId,
          tripType: priceRule.tripType
        }
      },
      update: {
        amount: priceRule.amount,
        currency: priceRule.currency,
        label: priceRule.label
      },
      create: {
        id: priceRule.id,
        boatId: priceRule.boatId,
        tripType: priceRule.tripType,
        amount: priceRule.amount,
        currency: priceRule.currency,
        label: priceRule.label
      }
    });
  }

  for (const booking of sampleBookings) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: {
        boatId: booking.boatId,
        date: toUtcDateOnly(booking.date),
        tripType: booking.tripType,
        status: booking.status,
        source: booking.source,
        customerName: booking.customerName,
        email: booking.email,
        phone: booking.phone,
        partySize: booking.partySize,
        notes: booking.notes ?? null,
        createdAt: new Date(booking.createdAt)
      },
      create: {
        id: booking.id,
        boatId: booking.boatId,
        date: toUtcDateOnly(booking.date),
        tripType: booking.tripType,
        status: booking.status,
        source: booking.source,
        customerName: booking.customerName,
        email: booking.email,
        phone: booking.phone,
        partySize: booking.partySize,
        notes: booking.notes ?? null,
        createdAt: new Date(booking.createdAt)
      }
    });
  }

  for (const block of availabilityBlocks) {
    await prisma.availabilityBlock.upsert({
      where: { id: block.id },
      update: {
        boatId: block.boatId,
        date: toUtcDateOnly(block.date),
        tripType: block.tripType,
        reason: block.reason,
        createdByLabel: block.createdByLabel,
        createdAt: new Date(block.createdAt)
      },
      create: {
        id: block.id,
        boatId: block.boatId,
        date: toUtcDateOnly(block.date),
        tripType: block.tripType,
        reason: block.reason,
        createdByLabel: block.createdByLabel,
        createdAt: new Date(block.createdAt)
      }
    });
  }

  await prisma.slotOccupancy.deleteMany({
    where: {
      OR: [
        { bookingId: { in: sampleBookings.map((booking) => booking.id) } },
        {
          availabilityBlockId: {
            in: availabilityBlocks.map((block) => block.id)
          }
        }
      ]
    }
  });

  const activeBookingOccupancies = sampleBookings
    .filter((booking) => booking.status !== "cancelled")
    .map((booking) => ({
      boatId: booking.boatId,
      date: toUtcDateOnly(booking.date),
      tripType: booking.tripType,
      bookingId: booking.id,
      availabilityBlockId: null
    }));

  const blockOccupancies = availabilityBlocks.map((block) => ({
    boatId: block.boatId,
    date: toUtcDateOnly(block.date),
    tripType: block.tripType,
    bookingId: null,
    availabilityBlockId: block.id
  }));

  await prisma.slotOccupancy.createMany({
    data: [...activeBookingOccupancies, ...blockOccupancies]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
