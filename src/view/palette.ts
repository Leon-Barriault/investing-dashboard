const ACCOUNT_COLORS: Record<string, string> = {
  "SAMPLE-RRSP-CAD": "#0f6e56",
  "SAMPLE-RESP-CAD": "#1d4e89",
  "SAMPLE-TFSA-CAD": "#c4622d",
  "SAMPLE-NREG-CAD": "#a37b12",
  "SAMPLE-CRYP-CAD": "#0e7490",
  "SAMPLE-CASH-CAD": "#9f4a56",
};

const FALLBACK = ["#0f6e56", "#1d4e89", "#c4622d", "#6d4d9a", "#a37b12", "#0e7490"];

export const BUY_COLOR = "#0f6e56";
export const SELL_COLOR = "#c2412d";
export const REFUND_COLOR = "#1d4e89";

export function accountColor(accountId: string): string {
  const known = ACCOUNT_COLORS[accountId];
  if (known) return known;
  let hash = 0;
  for (const char of accountId) hash = (hash + char.charCodeAt(0)) % FALLBACK.length;
  return FALLBACK[hash] ?? BUY_COLOR;
}
