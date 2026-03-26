type PricingFeedbackTone = "success" | "error";
type SearchParamValue = string | string[] | undefined;

export type PricingFeedback = {
  tone: PricingFeedbackTone;
  message: string;
};

const pricingFeedbackMessages = {
  price_updated: {
    tone: "success",
    message: "Pricing updated. New public booking price displays now use the saved amount."
  },
  invalid_price: {
    tone: "error",
    message: "Enter a valid non-negative price with up to two decimal places."
  },
  invalid_rule: {
    tone: "error",
    message: "The requested boat and trip type pricing rule is not valid."
  },
  rate_limited: {
    tone: "error",
    message: "Too many pricing updates were submitted. Please wait a minute and try again."
  },
  write_unavailable: {
    tone: "error",
    message: "Pricing management is temporarily unavailable."
  },
  action_failed: {
    tone: "error",
    message: "The pricing action could not be completed."
  }
} as const satisfies Record<string, PricingFeedback>;

export type PricingFeedbackCode = keyof typeof pricingFeedbackMessages;

function normalizeSearchParamValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return normalizeSearchParamValue(value[0]);
  }

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function getPricingFeedback(value: SearchParamValue): PricingFeedback | null {
  const normalizedValue = normalizeSearchParamValue(value);

  if (!normalizedValue || !(normalizedValue in pricingFeedbackMessages)) {
    return null;
  }

  return pricingFeedbackMessages[normalizedValue as PricingFeedbackCode];
}
