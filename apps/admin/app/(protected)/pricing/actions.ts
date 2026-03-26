"use server";

import {
  DatabaseWriteUnavailableError,
  InvalidPriceRuleAmountError,
  RateLimitExceededError,
  UnsupportedBoatTripTypeError,
  updatePriceRule
} from "@boat/db";
import { adminPriceRuleMutationInputSchema } from "@boat/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminMutationAccess } from "@/lib/mutation-security";

function redirectWithFeedback(feedback: string): never {
  redirect(`/pricing?feedback=${feedback}`);
}

export async function updatePriceRuleAction(formData: FormData) {
  const parsedInput = adminPriceRuleMutationInputSchema.safeParse({
    boatId: formData.get("boatId"),
    tripType: formData.get("tripType"),
    amount: formData.get("amount")
  });

  if (!parsedInput.success) {
    redirectWithFeedback("invalid_price");
  }

  try {
    await requireAdminMutationAccess("admin_pricing_mutation");
    await updatePriceRule({
      boatId: parsedInput.data.boatId,
      tripType: parsedInput.data.tripType,
      amount: parsedInput.data.amount
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

    if (error instanceof RateLimitExceededError) {
      redirectWithFeedback("rate_limited");
    }

    console.error("Unexpected admin pricing update failure", error);
    redirectWithFeedback("action_failed");
  }
}
