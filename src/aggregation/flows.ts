import type { Activity, ActivityKind } from "../domain/activity.ts";
import { EXTERNAL_CONTRIBUTION_KINDS } from "../domain/activity.ts";
import {
  eachMonth,
  eachQuarter,
  eachYear,
  formatMonthLabel,
  formatQuarterLabel,
  monthKey,
  quarterKey,
  yearKey,
} from "../domain/dates.ts";
import type { Filters } from "../domain/filters.ts";
import { Decimal, sumDec, zero } from "../domain/money.ts";

export function matchesAccount(activity: Activity, accountId: string | null): boolean {
  return !accountId || activity.accountId === accountId;
}

export function inFlow(activity: Activity, filters: Filters): boolean {
  if (!matchesAccount(activity, filters.accountId)) return false;
  if (filters.from && activity.date < filters.from) return false;
  if (filters.to && activity.date > filters.to) return false;
  return true;
}

export function isTradeRow(activity: Activity): boolean {
  return activity.kind === "trade" || activity.kind === "crypto-swap";
}

export interface ContributionPoint {
  month: string;
  label: string;
  flow: Record<string, number>;
  cumulative: Record<string, number>;
  flowTotal: number;
  cumulativeTotal: number;
}

export function contributionSeries(activities: Activity[], filters: Filters): ContributionPoint[] {
  const rows = activities.filter(
    (activity) => EXTERNAL_CONTRIBUTION_KINDS.has(activity.kind) && inFlow(activity, filters),
  );
  if (rows.length === 0) return [];

  const dated = activities.filter((activity) => matchesAccount(activity, filters.accountId));
  const start = filters.from ?? dated[0]?.date ?? rows[0]?.date;
  const end = filters.to ?? dated.at(-1)?.date ?? rows.at(-1)?.date;
  if (!start || !end) return [];

  const byMonth = new Map<string, Map<string, Decimal>>();
  for (const activity of rows) {
    const key = monthKey(activity.date);
    const bucket = byMonth.get(key) ?? new Map<string, Decimal>();
    const amount = activity.currency === "CAD" ? (activity.netAmount ?? zero()) : zero();
    bucket.set(activity.accountId, (bucket.get(activity.accountId) ?? zero()).plus(amount));
    byMonth.set(key, bucket);
  }

  const running = new Map<string, Decimal>();
  return eachMonth(start, end).map((month) => {
    const bucket = byMonth.get(month) ?? new Map<string, Decimal>();
    for (const [accountId, amount] of bucket) {
      running.set(accountId, (running.get(accountId) ?? zero()).plus(amount));
    }
    const flow: Record<string, number> = {};
    const cumulative: Record<string, number> = {};
    for (const [accountId, amount] of bucket) flow[accountId] = amount.toNumber();
    for (const [accountId, amount] of running) cumulative[accountId] = amount.toNumber();
    const flowTotal = sumDec(bucket.values()).toNumber();
    const cumulativeTotal = sumDec(running.values()).toNumber();
    return { month, label: formatMonthLabel(month), flow, cumulative, flowTotal, cumulativeTotal };
  });
}

export interface PeriodCount {
  key: string;
  label: string;
  buys: number;
  sells: number;
  swaps: number;
}

function countPeriods(
  activities: Activity[],
  filters: Filters,
  keyOf: (date: string) => string,
  labelOf: (key: string) => string,
  keys: (from: string, to: string) => string[],
): PeriodCount[] {
  const trades = activities.filter(
    (activity) =>
      isTradeRow(activity) &&
      inFlow(activity, filters) &&
      (!filters.symbol || activity.symbol === filters.symbol),
  );
  if (trades.length === 0) return [];
  const start = filters.from ?? trades[0]?.date;
  const end = filters.to ?? trades.at(-1)?.date;
  if (!start || !end) return [];

  const buckets = new Map<string, PeriodCount>();
  for (const key of keys(start, end)) {
    buckets.set(key, { key, label: labelOf(key), buys: 0, sells: 0, swaps: 0 });
  }
  for (const trade of trades) {
    const bucket = buckets.get(keyOf(trade.date));
    if (!bucket) continue;
    if (trade.side === "BUY") bucket.buys += 1;
    else if (trade.side === "SELL") bucket.sells += 1;
    else bucket.swaps += 1;
  }
  return [...buckets.values()];
}

export function tradesByMonth(activities: Activity[], filters: Filters): PeriodCount[] {
  return countPeriods(activities, filters, monthKey, formatMonthLabel, eachMonth);
}

export function tradesByQuarter(activities: Activity[], filters: Filters): PeriodCount[] {
  return countPeriods(activities, filters, quarterKey, formatQuarterLabel, eachQuarter);
}

export interface StackedYear {
  year: string;
  byAccount: Record<string, number>;
  total: number;
}

function sumKindByYear(
  activities: Activity[],
  filters: Filters,
  kind: ActivityKind,
  respectSymbol: boolean,
): StackedYear[] {
  const rows = activities.filter((activity) => {
    if (activity.kind !== kind || !inFlow(activity, filters)) return false;
    if (respectSymbol && filters.symbol && activity.symbol !== filters.symbol) return false;
    return activity.currency === "CAD" && activity.netAmount !== null;
  });
  if (rows.length === 0) return [];
  const start = filters.from ?? rows[0]?.date;
  const end = filters.to ?? rows.at(-1)?.date;
  if (!start || !end) return [];

  const buckets = new Map<string, Map<string, Decimal>>();
  for (const year of eachYear(start, end)) buckets.set(year, new Map());
  for (const row of rows) {
    const year = yearKey(row.date);
    const bucket = buckets.get(year) ?? new Map<string, Decimal>();
    const amount = row.netAmount ?? zero();
    bucket.set(row.accountId, (bucket.get(row.accountId) ?? zero()).plus(amount));
    buckets.set(year, bucket);
  }
  return [...buckets.entries()].map(([year, bucket]) => {
    const byAccount: Record<string, number> = {};
    for (const [accountId, amount] of bucket) byAccount[accountId] = amount.toNumber();
    return { year, byAccount, total: sumDec(bucket.values()).toNumber() };
  });
}

export function dividendsByYear(activities: Activity[], filters: Filters): StackedYear[] {
  return sumKindByYear(activities, filters, "dividend", true);
}

export interface FeeYear {
  year: string;
  fees: number;
  refunds: number;
}

export function feesByYear(activities: Activity[], filters: Filters): FeeYear[] {
  const rows = activities.filter(
    (activity) =>
      (activity.kind === "fee" || activity.kind === "fee-refund") && inFlow(activity, filters),
  );
  if (rows.length === 0) return [];
  const start = filters.from ?? rows[0]?.date;
  const end = filters.to ?? rows.at(-1)?.date;
  if (!start || !end) return [];
  const buckets = new Map<string, { fees: Decimal; refunds: Decimal }>();
  for (const year of eachYear(start, end)) buckets.set(year, { fees: zero(), refunds: zero() });
  for (const row of rows) {
    const bucket = buckets.get(yearKey(row.date));
    if (!bucket || row.currency !== "CAD" || !row.netAmount) continue;
    if (row.kind === "fee") bucket.fees = bucket.fees.plus(row.netAmount.abs());
    else bucket.refunds = bucket.refunds.plus(row.netAmount.abs());
  }
  return [...buckets.entries()].map(([year, bucket]) => ({
    year,
    fees: bucket.fees.toNumber(),
    refunds: bucket.refunds.toNumber(),
  }));
}

export interface SymbolStat {
  symbol: string;
  name: string;
  count: number;
  buys: number;
  sells: number;
  swaps: number;
}

export function mostTradedSymbols(
  activities: Activity[],
  filters: Filters,
  limit = 12,
): SymbolStat[] {
  const stats = new Map<string, SymbolStat>();
  for (const activity of activities) {
    if (!isTradeRow(activity) || !inFlow(activity, filters) || !activity.symbol) continue;
    if (filters.symbol && activity.symbol !== filters.symbol) continue;
    const current = stats.get(activity.symbol) ?? {
      symbol: activity.symbol,
      name: activity.name ?? activity.symbol,
      count: 0,
      buys: 0,
      sells: 0,
      swaps: 0,
    };
    current.count += 1;
    if (activity.name) current.name = activity.name;
    if (activity.side === "BUY") current.buys += 1;
    else if (activity.side === "SELL") current.sells += 1;
    else current.swaps += 1;
    stats.set(activity.symbol, current);
  }
  return [...stats.values()]
    .sort((a, b) => b.count - a.count || a.symbol.localeCompare(b.symbol))
    .slice(0, limit);
}

export function listSymbols(activities: Activity[], accountId: string | null): string[] {
  const symbols = new Set<string>();
  for (const activity of activities) {
    if (!matchesAccount(activity, accountId) || !activity.symbol) continue;
    symbols.add(activity.symbol);
  }
  return [...symbols].sort((a, b) => a.localeCompare(b));
}

export function sumKind(
  activities: Activity[],
  filters: Filters,
  kind: ActivityKind,
  respectSymbol: boolean,
): Decimal {
  const amounts: Decimal[] = [];
  for (const activity of activities) {
    if (activity.kind !== kind || !inFlow(activity, filters)) continue;
    if (respectSymbol && filters.symbol && activity.symbol !== filters.symbol) continue;
    if (activity.currency === "CAD" && activity.netAmount) amounts.push(activity.netAmount);
  }
  return sumDec(amounts);
}
