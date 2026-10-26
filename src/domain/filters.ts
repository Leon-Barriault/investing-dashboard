import { addMonths } from "./dates.ts";

export interface Filters {
  accountId: string | null;
  symbol: string | null;
  from: string | null;
  to: string | null;
}

export const EMPTY_FILTERS: Filters = {
  accountId: null,
  symbol: null,
  from: null,
  to: null,
};

export interface DatePreset {
  id: string;
  label: string;
  from: string | null;
  to: string | null;
}

export function buildDatePresets(maxDate: string): DatePreset[] {
  const year = maxDate.slice(0, 4);
  const twelveMonthsStart = `${addMonths(maxDate, -11).slice(0, 7)}-01`;
  return [
    { id: "all", label: "All", from: null, to: null },
    { id: "ytd", label: "YTD", from: `${year}-01-01`, to: maxDate },
    { id: "12m", label: "12 months", from: twelveMonthsStart, to: maxDate },
  ];
}

export function filtersActive(filters: Filters): boolean {
  return Boolean(filters.accountId || filters.symbol || filters.from || filters.to);
}
