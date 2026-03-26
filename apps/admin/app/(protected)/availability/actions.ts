"use server";

import {
  AvailabilityBlockConflictError,
  AvailabilityBlockNotFoundError,
  createAvailabilityBlock,
  DatabaseWriteUnavailableError,
  removeAvailabilityBlock,
  UnsupportedBoatTripTypeError
} from "@boat/db";
import { tripTypes } from "@boat/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";

function getSafeRedirectTarget(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "/availability";
  }

  const trimmedValue = value.trim();

  return trimmedValue.startsWith("/availability") ? trimmedValue : "/availability";
}

function redirectWithFeedback(redirectTarget: string, feedback: string): never {
  const url = new URL(`http://local${redirectTarget}`);
  url.searchParams.set("feedback", feedback);

  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsedDate.valueOf()) && parsedDate.toISOString().slice(0, 10) === value;
}

export async function createAvailabilityBlockAction(formData: FormData) {
  const session = await requireAdminSession();
  const redirectTarget = getSafeRedirectTarget(formData.get("redirectTo"));
  const boatId = typeof formData.get("boatId") === "string" ? String(formData.get("boatId")).trim() : "";
  const date = typeof formData.get("date") === "string" ? String(formData.get("date")).trim() : "";
  const tripType =
    typeof formData.get("tripType") === "string" ? String(formData.get("tripType")).trim() : "";
  const reason = typeof formData.get("reason") === "string" ? String(formData.get("reason")).trim() : "";

  if (
    !boatId ||
    !reason ||
    !isValidIsoDate(date) ||
    !tripTypes.includes(tripType as (typeof tripTypes)[number])
  ) {
    redirectWithFeedback(redirectTarget, "invalid_slot");
  }

  try {
    await createAvailabilityBlock({
      boatId,
      date,
      tripType: tripType as (typeof tripTypes)[number],
      reason,
      createdByLabel: session.user.name || session.user.email
    });

    revalidatePath("/");
    revalidatePath("/availability");
    redirectWithFeedback(redirectTarget, "block_created");
  } catch (error) {
    if (error instanceof AvailabilityBlockConflictError) {
      redirectWithFeedback(
        redirectTarget,
        error.occupiedBy === "booking" ? "slot_booked" : "slot_already_blocked"
      );
    }

    if (
      error instanceof UnsupportedBoatTripTypeError ||
      error instanceof DatabaseWriteUnavailableError
    ) {
      redirectWithFeedback(
        redirectTarget,
        error instanceof UnsupportedBoatTripTypeError ? "invalid_slot" : "write_unavailable"
      );
    }

    console.error("Unexpected admin availability block creation failure", error);
    redirectWithFeedback(redirectTarget, "action_failed");
  }
}

export async function removeAvailabilityBlockAction(formData: FormData) {
  await requireAdminSession();
  const redirectTarget = getSafeRedirectTarget(formData.get("redirectTo"));
  const availabilityBlockId =
    typeof formData.get("availabilityBlockId") === "string"
      ? String(formData.get("availabilityBlockId")).trim()
      : "";

  if (!availabilityBlockId) {
    redirectWithFeedback(redirectTarget, "block_missing");
  }

  try {
    await removeAvailabilityBlock(availabilityBlockId);
    revalidatePath("/");
    revalidatePath("/availability");
    redirectWithFeedback(redirectTarget, "block_removed");
  } catch (error) {
    if (error instanceof AvailabilityBlockNotFoundError) {
      redirectWithFeedback(redirectTarget, "block_missing");
    }

    if (error instanceof DatabaseWriteUnavailableError) {
      redirectWithFeedback(redirectTarget, "write_unavailable");
    }

    console.error("Unexpected admin availability block removal failure", error);
    redirectWithFeedback(redirectTarget, "action_failed");
  }
}
