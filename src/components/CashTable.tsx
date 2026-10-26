import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatDay } from "@/domain/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paginate, searchCash } from "@/view/tradeQuery";
import type { CashRow } from "@/view/types";

export function CashTable({ rows, resultKey }: { rows: CashRow[]; resultKey: string }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [resultKey, query]);
  const visible = useMemo(() => searchCash(rows, query), [rows, query]);
  const paged = paginate(visible, page, 25);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-medium">Cash, income, and fees</h2>
          <p className="text-muted-foreground text-sm">
            {paged.total === 0 ? "No rows" : `${paged.from}–${paged.to} of ${paged.total}`}.
            Internal transfers are listed here and kept out of net deposits.
          </p>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            aria-label="Search cash activity"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Dividend, fee, account…"
            className="w-full pl-8 sm:w-64"
          />
        </div>
      </div>
      {paged.total === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No cash activity matches these filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-muted-foreground border-b text-xs tracking-wide uppercase">
              <tr>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Account</th>
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Symbol</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((row) => (
                <tr key={row.id} className="border-b border-dashed align-top last:border-0">
                  <td className="py-2.5 pr-3 whitespace-nowrap">{formatDay(row.date)}</td>
                  <td className="py-2.5 pr-3">{row.accountLabel}</td>
                  <td className="py-2.5 pr-3">{row.category}</td>
                  <td className="py-2.5 pr-3">
                    {row.symbol || "—"}
                    <span className="text-muted-foreground block max-w-72 truncate text-xs">
                      {row.description}
                    </span>
                  </td>
                  <td
                    className={`num py-2.5 text-right ${row.amountValue < 0 ? "text-destructive" : ""}`}
                  >
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex items-center justify-end gap-2">
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
  );
}
