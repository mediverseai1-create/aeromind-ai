import type { TargetField } from "./mapping";

export type NormalizedRow = {
  row_date: string | null;
  product: string | null;
  customer: string | null;
  region: string | null;
  rep: string | null;
  quantity: number | null;
  unit_price: number | null;
  revenue: number | null;
  raw: Record<string, string>;
};

export type ValidationResult = {
  rows: NormalizedRow[];
  errors: { index: number; message: string }[];
  validCount: number;
};

function toNumber(v: string | undefined): number | null {
  if (v === undefined || v === null || v.trim() === "") return null;
  const cleaned = v.replace(/[$,€£\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toDate(v: string | undefined): string | null {
  if (!v || !v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function validateRows(
  rows: Record<string, string>[],
  map: Record<TargetField, string | null>
): ValidationResult {
  const errors: ValidationResult["errors"] = [];
  const normalized: NormalizedRow[] = [];

  rows.forEach((row, index) => {
    const revenueRaw = map.revenue ? row[map.revenue] : undefined;
    const revenue = toNumber(revenueRaw);
    const quantity = toNumber(map.quantity ? row[map.quantity] : undefined);
    const unitPrice = toNumber(map.unit_price ? row[map.unit_price] : undefined);
    const rowDate = toDate(map.row_date ? row[map.row_date] : undefined);

    if (map.revenue && revenueRaw && revenue === null) {
      errors.push({ index, message: `Row ${index + 1}: revenue "${revenueRaw}" isn't a number` });
    }

    normalized.push({
      row_date: rowDate,
      product: map.product ? row[map.product] || null : null,
      customer: map.customer ? row[map.customer] || null : null,
      region: map.region ? row[map.region] || null : null,
      rep: map.rep ? row[map.rep] || null : null,
      quantity,
      unit_price: unitPrice,
      revenue: revenue ?? (quantity !== null && unitPrice !== null ? quantity * unitPrice : null),
      raw: row,
    });
  });

  return { rows: normalized, errors, validCount: normalized.length - errors.length };
}
