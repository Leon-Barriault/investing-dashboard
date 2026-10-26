import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { downloadText, tradesToCsv } from "@/export/csv";
import { formatDay } from "@/domain/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  paginate,
  searchTrades,
  sortTrades,
  type SortDirection,
  type TradeSortKey,
} from "@/view/tradeQuery";
import type { TradeRow } from "@/view/types";

const PAGE_SIZES = [25, 50, 100];

export function TradeLog({
  rows,
  resultKey,
  onExport,
}: {
  rows: TradeRow[];
  resultKey: string;
  onExport?: (csv: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: TradeSortKey; direction: SortDirection }>({
    key: "date",
    direction: "desc",
  });

  useEffect(() => {
    setPage(1);
  }, [resultKey, query, sort, pageSize]);

  const visible = useMemo(
    () => sortTrades(searchTrades(rows, query), sort.key, sort.direction),
    [rows, query, sort],
  );
  const paged = paginate(visible, page, pageSize);

  function chooseSort(key: TradeSortKey) {
    setSort((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      const direction = key === "symbol" || key === "account" || key === "side" ? "asc" : "desc";
      return { key, direction };
    });
  }

  function exportCsv() {
    const csv = tradesToCsv(visible);
    if (onExport) onExport(csv);
    else downloadText("carnet-trades.csv", csv);
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-medium">Trade log</h2>
          <p className="text-muted-foreground text-sm">
            {paged.total === 0 ? "No rows" : `${paged.from}–${paged.to} of ${paged.total}`}
            {query ? " matching the search" : ""}. Export includes every match, not only this page.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              aria-label="Search the trade log"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Symbol, name, account…"
              className="w-full pl-8 sm:w-64"
            />
          </div>
          <Button type="button" variant="outline" onClick={exportCsv}>
            <Download />
            Export CSV
          </Button>
        </div>
      </div>
      {paged.total === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No trades match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground border-b text-xs tracking-wide uppercase">
              <tr>
                <SortHeader label="Date" sortKey="date" sort={sort} onSort={chooseSort} />
                <SortHeader label="Account" sortKey="account" sort={sort} onSort={chooseSort} />
                <SortHeader label="Side" sortKey="side" sort={sort} onSort={chooseSort} />
                <SortHeader label="Symbol" sortKey="symbol" sort={sort} onSort={chooseSort} />
                <SortHeader
                  label="Qty"
                  sortKey="quantity"
                  sort={sort}
                  onSort={chooseSort}
                  align="right"
                />
                <SortHeader
                  label="Price"
                  sortKey="price"
                  sort={sort}
                  onSort={chooseSort}
                  align="right"
                />
                <SortHeader
                  label="Fees"
                  sortKey="fees"
                  sort={sort}
                  onSort={chooseSort}
                  align="right"
                />
                <SortHeader
                  label="Net cash"
                  sortKey="net"
                  sort={sort}
                  onSort={chooseSort}
                  align="right"
                />
              </tr>
            </thead>
            <tbody>
              {paged.items.map((row) => (
                <tr key={row.id} className="border-b border-dashed align-top last:border-0">
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    {formatDay(row.date)}
                    <span className="text-muted-foreground block text-xs">{row.time || "—"}</span>
                  </td>
                  <td className="py-2.5 pr-3">{row.accountLabel}</td>
                  <td className={`py-2.5 pr-3 ${sideClass(row.side)}`}>{row.side}</td>
                  <td className="py-2.5 pr-3">
                    <span className="font-medium">{row.symbol}</span>
                    <span className="text-muted-foreground block max-w-56 truncate text-xs">
                      {row.name}
                    </span>
                  </td>
                  <td className="num py-2.5 pr-3 text-right">{row.quantity}</td>
                  <td className="num py-2.5 pr-3 text-right">
                    {row.price}
                    {row.currency ? (
                      <span className="text-muted-foreground block text-xs">{row.currency}</span>
                    ) : null}
                  </td>
                  <td className="num py-2.5 pr-3 text-right">{row.fees}</td>
                  <td
                    className={`num py-2.5 text-right ${row.netValue !== null && row.netValue < 0 ? "text-destructive" : ""}`}
                  >
                    {row.net}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          Rows
          <select
            aria-label="Rows per page"
            className="border-input bg-background rounded-md border px-2 py-1"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => current - 1)}
            disabled={paged.page <= 1}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {paged.page} of {paged.pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => current + 1)}
            disabled={paged.page >= paged.pages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: TradeSortKey;
  sort: { key: TradeSortKey; direction: SortDirection };
  onSort: (key: TradeSortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === sortKey;
  return (
    <th
      className={`py-2 pr-3 font-medium ${align === "right" ? "text-right" : ""}`}
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        className={`hover:text-foreground ${align === "right" ? "ml-auto" : ""}`}
        onClick={() => onSort(sortKey)}
      >
        {label}
        {active ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
}

function sideClass(side: string): string {
  if (side === "Buy" || side === "Swap in") return "text-primary";
  if (side === "Sell" || side === "Swap out") return "text-destructive";
  return "";
}
