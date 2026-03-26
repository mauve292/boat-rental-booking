import { getSlotAvailabilityState, isDatabaseConfigured } from "@boat/db";
import { slotAvailabilityRequestSchema } from "@boat/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        message:
          "Live slot availability is unavailable because booking persistence is not configured."
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsedRequest = slotAvailabilityRequestSchema.safeParse({
    boatId: searchParams.get("boatId"),
    date: searchParams.get("date"),
    tripType: searchParams.get("tripType")
  });

  if (!parsedRequest.success) {
    return NextResponse.json(
      { message: "Invalid slot availability request." },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }

  const availability = await getSlotAvailabilityState({
    boatId: parsedRequest.data.boatId,
    date: parsedRequest.data.date,
    tripType: parsedRequest.data.tripType
  });

  return NextResponse.json(availability, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
