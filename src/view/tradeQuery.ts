import type { CashRow, TradeRow } from "./types.ts";

export type TradeSortKey =
  "date" | "account" | "side" | "symbol" | "quantity" | "price" | "fees" | "net";
export type SortDirection = "asc" | "desc";

export interface Page<T> {
  items: T[];
  page: number;
  pages: number;
  total: number;
  from: number;
  to: number;
}

export function searchTrades(rows: TradeRow[], query: string): TradeRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    [
      row.date,
      row.accountLabel,
      row.side,
      row.symbol,
      row.name,
      row.description,
      row.currency,
    ].some((value) => value.toLowerCase().includes(needle)),
  );
}

export function searchCash(rows: CashRow[], query: string): CashRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    [row.date, row.accountLabel, row.category, row.symbol, row.description].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  );
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "en-CA");
}

function compareNumber(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

export function sortTrades(
  rows: TradeRow[],
  key: TradeSortKey,
  direction: SortDirection,
): TradeRow[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const ranked = compareTradeField(a, b, key);
    const result =
      ranked === 0 ? compareText(`${b.date}T${b.time}`, `${a.date}T${a.time}`) : ranked;
    return result * factor;
  });
}

function compareTradeField(a: TradeRow, b: TradeRow, key: TradeSortKey): number {
  if (key === "date") return compareText(`${a.date}T${a.time}`, `${b.date}T${b.time}`);
  if (key === "account") return compareText(a.accountLabel, b.accountLabel);
  if (key === "side") return compareText(a.side, b.side);
  if (key === "symbol") return compareText(a.symbol, b.symbol);
  if (key === "quantity") return compareNumber(a.quantityValue, b.quantityValue);
  if (key === "price") return compareNumber(a.priceValue, b.priceValue);
  if (key === "fees") return compareNumber(a.feesValue, b.feesValue);
  return compareNumber(a.netValue, b.netValue);
}

export function paginate<T>(rows: T[], page: number, pageSize: number): Page<T> {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page, 1), pages);
  const start = (current - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  return {
    items,
    page: current,
    pages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + items.length,
  };
}
