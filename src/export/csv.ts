import type { TradeRow } from "../view/types.ts";

function cell(value: string, numeric: boolean): string {
  let text = value;
  if (!numeric && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function tradesToCsv(rows: TradeRow[]): string {
  const header = [
    "date",
    "time",
    "settlement_date",
    "account",
    "account_id",
    "side",
    "symbol",
    "name",
    "quantity",
    "price",
    "currency",
    "fees",
    "net_amount",
    "fx_rate",
    "description",
  ];
  const lines = rows.map((row) =>
    [
      cell(row.date, false),
      cell(row.time, false),
      cell(row.settlement, false),
      cell(row.accountLabel, false),
      cell(row.accountId, false),
      cell(row.side, false),
      cell(row.symbol, false),
      cell(row.name, false),
      cell(row.quantity, true),
      cell(row.priceRaw, true),
      cell(row.currency, false),
      cell(row.feesRaw, true),
      cell(row.netRaw, true),
      cell(row.fx, true),
      cell(row.description, false),
    ].join(","),
  );
  return `\uFEFF${[header.join(","), ...lines].join("\n")}\n`;
}

export function downloadText(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
