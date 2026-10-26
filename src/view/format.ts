import { Decimal } from "../domain/money.ts";

const cad = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCad(value: Decimal | number): string {
  const amount =
    value instanceof Decimal ? value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber() : value;
  return cad.format(amount);
}

export function formatQty(value: Decimal): string {
  const text = value.toDecimalPlaces(10, Decimal.ROUND_HALF_UP).toFixed(10);
  if (!text.includes(".")) return text;
  return text.replace(/0+$/, "").replace(/\.$/, "");
}

export function formatPrice(value: Decimal | null): string {
  if (!value) return "—";
  const places = value.abs().gte(100) ? 2 : 4;
  return value.toDecimalPlaces(places, Decimal.ROUND_HALF_UP).toFixed(places);
}

export function formatAxisCad(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const digits = abs >= 10000 ? 0 : 1;
    return `${sign}$${(abs / 1000).toFixed(digits)}k`;
  }
  return `${sign}$${Math.round(abs)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-CA").format(value);
}
