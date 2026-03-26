"use server";

import {
  AppSettingsConfigurationError,
  DatabaseWriteUnavailableError,
  updateAppSettings
} from "@boat/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";

function redirectWithFeedback(feedback: string): never {
  redirect(`/settings?feedback=${feedback}`);
}

function parseMonth(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsedValue = Number.parseInt(value.trim(), 10);

  return Number.isInteger(parsedValue) ? parsedValue : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function updateAppSettingsAction(formData: FormData) {
  await requireAdminSession();
  const bookingSeasonStartMonth = parseMonth(formData.get("bookingSeasonStartMonth"));
  const bookingSeasonEndMonth = parseMonth(formData.get("bookingSeasonEndMonth"));
  const contactEmail =
    typeof formData.get("contactEmail") === "string"
      ? String(formData.get("contactEmail")).trim()
      : "";

  if (
    bookingSeasonStartMonth === null ||
    bookingSeasonEndMonth === null ||
    !isValidEmail(contactEmail)
  ) {
    redirectWithFeedback("invalid_settings");
  }

  try {
    await updateAppSettings({
      bookingSeasonStartMonth,
      bookingSeasonEndMonth,
      contactEmail
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

    console.error("Unexpected admin settings update failure", error);
    redirectWithFeedback("action_failed");
  }
}
