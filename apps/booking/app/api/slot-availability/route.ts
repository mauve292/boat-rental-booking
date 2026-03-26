import { getSlotAvailabilityState } from "@boat/db";
import { tripTypeSchema, isoDateSchema } from "@boat/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boatId = (searchParams.get("boatId") ?? "").trim();
  const date = searchParams.get("date") ?? "";
  const tripType = searchParams.get("tripType") ?? "";
  const parsedDate = isoDateSchema.safeParse(date);
  const parsedTripType = tripTypeSchema.safeParse(tripType);

  if (!boatId || !parsedDate.success || !parsedTripType.success) {
    return NextResponse.json(
      { message: "Invalid slot availability request." },
      { status: 400 }
    );
  }

  const availability = await getSlotAvailabilityState({
    boatId,
    date: parsedDate.data,
    tripType: parsedTripType.data
  });

  return NextResponse.json(availability);
}
