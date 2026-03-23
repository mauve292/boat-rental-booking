-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('half_day', 'full_day', 'sunset_cruise');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('site_fleet', 'booking_app', 'admin_manual');

-- CreateTable
CREATE TABLE "Boat" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoatImage" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoatImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoatTripTypeSupport" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "tripType" "TripType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoatTripTypeSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceRule" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "tripType" "TripType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tripType" "TripType" NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "source" "BookingSource" NOT NULL,
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tripType" "TripType" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotOccupancy" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tripType" "TripType" NOT NULL,
    "bookingId" TEXT,
    "availabilityBlockId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotOccupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BoatDestinations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BoatDestinations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BoatAmenities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BoatAmenities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Boat_slug_key" ON "Boat"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_slug_key" ON "Amenity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BoatImage_boatId_key" ON "BoatImage"("boatId");

-- CreateIndex
CREATE INDEX "BoatTripTypeSupport_boatId_idx" ON "BoatTripTypeSupport"("boatId");

-- CreateIndex
CREATE UNIQUE INDEX "BoatTripTypeSupport_boatId_tripType_key" ON "BoatTripTypeSupport"("boatId", "tripType");

-- CreateIndex
CREATE INDEX "PriceRule_boatId_idx" ON "PriceRule"("boatId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceRule_boatId_tripType_key" ON "PriceRule"("boatId", "tripType");

-- CreateIndex
CREATE INDEX "Booking_boatId_date_idx" ON "Booking"("boatId", "date");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_boatId_date_idx" ON "AvailabilityBlock"("boatId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SlotOccupancy_bookingId_key" ON "SlotOccupancy"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "SlotOccupancy_availabilityBlockId_key" ON "SlotOccupancy"("availabilityBlockId");

-- CreateIndex
CREATE INDEX "SlotOccupancy_boatId_date_idx" ON "SlotOccupancy"("boatId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SlotOccupancy_boatId_date_tripType_key" ON "SlotOccupancy"("boatId", "date", "tripType");

-- CreateIndex
CREATE INDEX "_BoatDestinations_B_index" ON "_BoatDestinations"("B");

-- CreateIndex
CREATE INDEX "_BoatAmenities_B_index" ON "_BoatAmenities"("B");

-- AddForeignKey
ALTER TABLE "BoatImage" ADD CONSTRAINT "BoatImage_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoatTripTypeSupport" ADD CONSTRAINT "BoatTripTypeSupport_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceRule" ADD CONSTRAINT "PriceRule_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotOccupancy" ADD CONSTRAINT "SlotOccupancy_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotOccupancy" ADD CONSTRAINT "SlotOccupancy_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotOccupancy" ADD CONSTRAINT "SlotOccupancy_availabilityBlockId_fkey" FOREIGN KEY ("availabilityBlockId") REFERENCES "AvailabilityBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoatDestinations" ADD CONSTRAINT "_BoatDestinations_A_fkey" FOREIGN KEY ("A") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoatDestinations" ADD CONSTRAINT "_BoatDestinations_B_fkey" FOREIGN KEY ("B") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoatAmenities" ADD CONSTRAINT "_BoatAmenities_A_fkey" FOREIGN KEY ("A") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoatAmenities" ADD CONSTRAINT "_BoatAmenities_B_fkey" FOREIGN KEY ("B") REFERENCES "Boat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

