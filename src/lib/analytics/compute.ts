export type DatasetRow = {
  row_date: string | null;
  product: string | null;
  customer: string | null;
  region: string | null;
  rep: string | null;
  quantity: number | null;
  unit_price: number | null;
  revenue: number | null;
};

export type Summary = {
  totalRevenue: number;
  rowCount: number;
  firstDate: string | null;
  lastDate: string | null;
  customerCount: number;
  productCount: number;
};

export function computeSummary(rows: DatasetRow[]): Summary {
  let totalRevenue = 0;
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  const customers = new Set<string>();
  const products = new Set<string>();

  for (const r of rows) {
    totalRevenue += r.revenue ?? 0;
    if (r.row_date) {
      if (!firstDate || r.row_date < firstDate) firstDate = r.row_date;
      if (!lastDate || r.row_date > lastDate) lastDate = r.row_date;
    }
    if (r.customer) customers.add(r.customer);
    if (r.product) products.add(r.product);
  }

  return {
    totalRevenue,
    rowCount: rows.length,
    firstDate,
    lastDate,
    customerCount: customers.size,
    productCount: products.size,
  };
}

export type TrendPoint = { period: string; revenue: number };

export function computeMonthlyTrend(rows: DatasetRow[]): TrendPoint[] {
  const byMonth = new Map<string, number>();
  for (const r of rows) {
    if (!r.row_date) continue;
    const period = r.row_date.slice(0, 7); // YYYY-MM
    byMonth.set(period, (byMonth.get(period) ?? 0) + (r.revenue ?? 0));
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, revenue]) => ({ period, revenue: Math.round(revenue * 100) / 100 }));
}

export type Ranked = { name: string; revenue: number; share: number };

export function rankBy(rows: DatasetRow[], dimension: "product" | "customer" | "region" | "rep"): Ranked[] {
  const totals = new Map<string, number>();
  let grandTotal = 0;
  for (const r of rows) {
    const key = r[dimension];
    if (!key) continue;
    const rev = r.revenue ?? 0;
    totals.set(key, (totals.get(key) ?? 0) + rev);
    grandTotal += rev;
  }
  return Array.from(totals.entries())
    .map(([name, revenue]) => ({
      name,
      revenue: Math.round(revenue * 100) / 100,
      share: grandTotal > 0 ? revenue / grandTotal : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export type DecliningCustomer = {
  name: string;
  previousRevenue: number;
  recentRevenue: number;
  changePct: number;
};

/**
 * Splits the dated rows into two equal-length halves by date and flags
 * customers whose revenue fell from the first half to the second.
 */
export function decliningCustomers(rows: DatasetRow[]): DecliningCustomer[] {
  const dated = rows.filter((r) => r.row_date && r.customer);
  if (dated.length === 0) return [];

  const dates = dated.map((r) => r.row_date as string).sort();
  const midpoint = dates[Math.floor(dates.length / 2)];

  const before = new Map<string, number>();
  const after = new Map<string, number>();

  for (const r of dated) {
    const bucket = (r.row_date as string) < midpoint ? before : after;
    const key = r.customer as string;
    bucket.set(key, (bucket.get(key) ?? 0) + (r.revenue ?? 0));
  }

  const result: DecliningCustomer[] = [];
  for (const [name, previousRevenue] of before.entries()) {
    const recentRevenue = after.get(name) ?? 0;
    if (recentRevenue < previousRevenue) {
      const changePct = previousRevenue > 0 ? (recentRevenue - previousRevenue) / previousRevenue : -1;
      result.push({ name, previousRevenue, recentRevenue, changePct });
    }
  }

  return result.sort((a, b) => a.changePct - b.changePct);
}

export type ConcentrationRisk = {
  topCustomerShare: number;
  top3CustomerShare: number;
  topCustomerName: string | null;
};

export function computeConcentrationRisk(rows: DatasetRow[]): ConcentrationRisk {
  const ranked = rankBy(rows, "customer");
  if (ranked.length === 0) return { topCustomerShare: 0, top3CustomerShare: 0, topCustomerName: null };
  const top3Share = ranked.slice(0, 3).reduce((sum, r) => sum + r.share, 0);
  return {
    topCustomerShare: ranked[0].share,
    top3CustomerShare: top3Share,
    topCustomerName: ranked[0].name,
  };
}
