"use server";

import {
  AppSettingsConfigurationError,
  DatabaseWriteUnavailableError,
  RateLimitExceededError,
  updateAppSettings
} from "@boat/db";
import { adminAppSettingsInputSchema } from "@boat/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminMutationAccess } from "@/lib/mutation-security";

function redirectWithFeedback(feedback: string): never {
  redirect(`/settings?feedback=${feedback}`);
}

export async function updateAppSettingsAction(formData: FormData) {
  const parsedInput = adminAppSettingsInputSchema.safeParse({
    bookingSeasonStartMonth: formData.get("bookingSeasonStartMonth"),
    bookingSeasonEndMonth: formData.get("bookingSeasonEndMonth"),
    contactEmail: formData.get("contactEmail")
  });

  if (!parsedInput.success) {
    redirectWithFeedback("invalid_settings");
  }

  try {
    await requireAdminMutationAccess("admin_settings_mutation");
    await updateAppSettings({
      bookingSeasonStartMonth: parsedInput.data.bookingSeasonStartMonth,
      bookingSeasonEndMonth: parsedInput.data.bookingSeasonEndMonth,
      contactEmail: parsedInput.data.contactEmail
    });

    revalidatePath("/");
    revalidatePath("/settings");
    redirectWithFeedback("settings_updated");
  } catch (error) {
    if (error instanceof AppSettingsConfigurationError) {
      redirectWithFeedback("invalid_settings");
    }

    if (error instanceof DatabaseWriteUnavailableError) {
      redirectWithFeedback("write_unavailable");
    }

    if (error instanceof RateLimitExceededError) {
      redirectWithFeedback("rate_limited");
    }

    console.error("Unexpected admin settings update failure", error);
    redirectWithFeedback("action_failed");
  }
}
