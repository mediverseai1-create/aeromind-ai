export const TARGET_FIELDS = [
  "row_date",
  "product",
  "customer",
  "region",
  "rep",
  "quantity",
  "unit_price",
  "revenue",
] as const;
export type TargetField = (typeof TARGET_FIELDS)[number];

export const TARGET_LABELS: Record<TargetField, string> = {
  row_date: "Date",
  product: "Product",
  customer: "Customer",
  region: "Region",
  rep: "Sales rep",
  quantity: "Quantity",
  unit_price: "Unit price",
  revenue: "Revenue / amount",
};

const HINTS: Record<TargetField, string[]> = {
  row_date: ["date", "order date", "period", "invoice date", "created"],
  product: ["product", "item", "sku", "service"],
  customer: ["customer", "account", "client", "company"],
  region: ["region", "territory", "country", "state", "area"],
  rep: ["rep", "sales rep", "owner", "salesperson", "agent"],
  quantity: ["qty", "quantity", "units"],
  unit_price: ["unit price", "price", "rate"],
  revenue: ["revenue", "amount", "total", "sales", "value"],
};

export function guessColumnMap(headers: string[]): Record<TargetField, string | null> {
  const map = {} as Record<TargetField, string | null>;
  const normalized = headers.map((h) => ({ raw: h, lower: h.trim().toLowerCase() }));

  for (const field of TARGET_FIELDS) {
    const hints = HINTS[field];
    const match =
      normalized.find((h) => hints.includes(h.lower)) ??
      normalized.find((h) => hints.some((hint) => h.lower.includes(hint)));
    map[field] = match ? match.raw : null;
  }
  return map;
}
