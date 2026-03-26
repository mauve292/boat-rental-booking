"use server";

import {
  AvailabilityBlockConflictError,
  AvailabilityBlockNotFoundError,
  createAvailabilityBlock,
  DatabaseWriteUnavailableError,
  RateLimitExceededError,
  removeAvailabilityBlock,
  UnsupportedBoatTripTypeError
} from "@boat/db";
import {
  adminAvailabilityBlockActionInputSchema,
  adminAvailabilityBlockRemovalInputSchema
} from "@boat/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminMutationAccess } from "@/lib/mutation-security";

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

export async function createAvailabilityBlockAction(formData: FormData) {
  const redirectTarget = getSafeRedirectTarget(formData.get("redirectTo"));
  const parsedInput = adminAvailabilityBlockActionInputSchema.safeParse({
    boatId: formData.get("boatId"),
    date: formData.get("date"),
    tripType: formData.get("tripType"),
    reason: formData.get("reason")
  });

  if (!parsedInput.success) {
    redirectWithFeedback(redirectTarget, "invalid_slot");
  }

  try {
    const { session } = await requireAdminMutationAccess(
      "admin_availability_mutation"
    );
    await createAvailabilityBlock({
      boatId: parsedInput.data.boatId,
      date: parsedInput.data.date,
      tripType: parsedInput.data.tripType,
      reason: parsedInput.data.reason,
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

    if (error instanceof RateLimitExceededError) {
      redirectWithFeedback(redirectTarget, "rate_limited");
    }

    console.error("Unexpected admin availability block creation failure", error);
    redirectWithFeedback(redirectTarget, "action_failed");
  }
}

export async function removeAvailabilityBlockAction(formData: FormData) {
  const redirectTarget = getSafeRedirectTarget(formData.get("redirectTo"));
  const parsedInput = adminAvailabilityBlockRemovalInputSchema.safeParse({
    availabilityBlockId: formData.get("availabilityBlockId")
  });

  if (!parsedInput.success) {
    redirectWithFeedback(redirectTarget, "block_missing");
  }

  try {
    await requireAdminMutationAccess("admin_availability_mutation");
    await removeAvailabilityBlock(parsedInput.data.availabilityBlockId);
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

    if (error instanceof RateLimitExceededError) {
      redirectWithFeedback(redirectTarget, "rate_limited");
    }

    console.error("Unexpected admin availability block removal failure", error);
    redirectWithFeedback(redirectTarget, "action_failed");
  }
}
