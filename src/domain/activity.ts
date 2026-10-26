import type { Decimal } from "decimal.js";

export type ActivityKind =
  | "trade"
  | "crypto-swap"
  | "dividend"
  | "deposit"
  | "withdrawal"
  | "external-transfer-in"
  | "internal-transfer"
  | "fee"
  | "fee-refund"
  | "grant"
  | "tax"
  | "interest"
  | "bonus"
  | "corporate-action"
  | "other";

export type TradeSide = "BUY" | "SELL" | "SWAP_IN" | "SWAP_OUT";

export interface Activity {
  id: string;
  rowNumber: number;
  date: string;
  time: string;
  settlementDate: string | null;
  accountId: string;
  frenchAccountType: string;
  symbol: string | null;
  name: string | null;
  currency: string | null;
  /** Signed quantity as exported. Buys are positive, sells are negative. */
  quantity: Decimal | null;
  price: Decimal | null;
  commission: Decimal | null;
  /** Signed cash in `currency`. Null when the row does not move cash. */
  netAmount: Decimal | null;
  fxRate: Decimal | null;
  description: string;
  kind: ActivityKind;
  side: TradeSide | null;
  rawType: string;
  rawSubtype: string;
}

export const KIND_LABEL: Record<ActivityKind, string> = {
  trade: "Trade",
  "crypto-swap": "Crypto swap",
  dividend: "Dividend",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  "external-transfer-in": "Transfer in",
  "internal-transfer": "Internal transfer",
  fee: "Management fee",
  "fee-refund": "Fee refund",
  grant: "Grant (CESG)",
  tax: "Non-resident tax",
  interest: "Interest",
  bonus: "Referral bonus",
  "corporate-action": "Corporate action",
  other: "Other",
};

export const EXTERNAL_CONTRIBUTION_KINDS: ReadonlySet<ActivityKind> = new Set([
  "deposit",
  "withdrawal",
  "external-transfer-in",
]);

export function compareActivities(a: Activity, b: Activity): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.time !== b.time) return a.time < b.time ? -1 : 1;
  return a.rowNumber - b.rowNumber;
}

export function sideLabel(side: TradeSide): string {
  if (side === "BUY") return "Buy";
  if (side === "SELL") return "Sell";
  if (side === "SWAP_IN") return "Swap in";
  return "Swap out";
}
