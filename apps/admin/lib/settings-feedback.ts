type SettingsFeedbackTone = "success" | "error";
type SearchParamValue = string | string[] | undefined;

export type SettingsFeedback = {
  tone: SettingsFeedbackTone;
  message: string;
};

const settingsFeedbackMessages = {
  settings_updated: {
    tone: "success",
    message: "Settings updated. Public booking season checks now use the saved values."
  },
  invalid_settings: {
    tone: "error",
    message: "Select a valid season month range and contact email."
  },
  write_unavailable: {
    tone: "error",
    message: "Settings management is temporarily unavailable."
  },
  action_failed: {
    tone: "error",
    message: "The settings action could not be completed."
  }
} as const satisfies Record<string, SettingsFeedback>;

export type SettingsFeedbackCode = keyof typeof settingsFeedbackMessages;

function normalizeSearchParamValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return normalizeSearchParamValue(value[0]);
  }

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function getSettingsFeedback(
  value: SearchParamValue
): SettingsFeedback | null {
  const normalizedValue = normalizeSearchParamValue(value);

  if (!normalizedValue || !(normalizedValue in settingsFeedbackMessages)) {
    return null;
  }

  return settingsFeedbackMessages[normalizedValue as SettingsFeedbackCode];
}
