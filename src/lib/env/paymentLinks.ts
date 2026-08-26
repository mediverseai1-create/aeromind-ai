import "server-only";

// Pricing moved from Growth/Scale to Professional/Business when credit-based
// billing shipped, but the actual Selar payment link values may still be
// saved under the old env var names — fall back to those so nothing breaks
// just because of a rename.
export function getProfessionalPaymentLink(): string | undefined {
  return process.env.PROFESSIONAL_PAYMENT_LINK || process.env.GROWTH_PAYMENT_LINK;
}

export function getBusinessPaymentLink(): string | undefined {
  return process.env.BUSINESS_PAYMENT_LINK || process.env.SCALE_PAYMENT_LINK;
}
