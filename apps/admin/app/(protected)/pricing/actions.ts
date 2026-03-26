"use server";

import {
  DatabaseWriteUnavailableError,
  InvalidPriceRuleAmountError,
  UnsupportedBoatTripTypeError,
  updatePriceRule
} from "@boat/db";
import { tripTypes } from "@boat/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";

function redirectWithFeedback(feedback: string): never {
  redirect(`/pricing?feedback=${feedback}`);
}

function parseAmount(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export async function updatePriceRuleAction(formData: FormData) {
  await requireAdminSession();
  const boatId =
    typeof formData.get("boatId") === "string"
      ? String(formData.get("boatId")).trim()
      : "";
  const tripType =
    typeof formData.get("tripType") === "string"
      ? String(formData.get("tripType")).trim()
      : "";
  const amount = parseAmount(formData.get("amount"));

  if (
    !boatId ||
    !tripTypes.includes(tripType as (typeof tripTypes)[number]) ||
    amount === null
  ) {
    redirectWithFeedback("invalid_price");
  }

  try {
    await updatePriceRule({
      boatId,
      tripType: tripType as (typeof tripTypes)[number],
      amount
    });

    revalidatePath("/");
    revalidatePath("/pricing");
    redirectWithFeedback("price_updated");
  } catch (error) {
    if (error instanceof InvalidPriceRuleAmountError) {
      redirectWithFeedback("invalid_price");
    }

    if (error instanceof UnsupportedBoatTripTypeError) {
      redirectWithFeedback("invalid_rule");
    }

    if (error instanceof DatabaseWriteUnavailableError) {
      redirectWithFeedback("write_unavailable");
    }

    console.error("Unexpected admin pricing update failure", error);
    redirectWithFeedback("action_failed");
  }
}
