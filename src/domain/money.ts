import Decimal from "decimal.js";

const DUST = new Decimal("0.00000001");

export function dec(value: Decimal.Value): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function zero(): Decimal {
  return new Decimal(0);
}

export function isDust(value: Decimal): boolean {
  return value.abs().lt(DUST);
}

/**
 * Parse a CSV numeric cell.
 * Empty is null. Dot decimals and a single French comma decimal are accepted.
 * Mixed separators are rejected so a thousands-formatted value cannot be misread.
 */
export function parseDecimalField(raw: string): Decimal | null | "invalid" {
  const compact = raw.trim().replace(/\s/g, "");
  if (!compact) return null;
  if (/^-?\d+(\.\d+)?$/.test(compact)) return new Decimal(compact);
  if (/^-?\d+,\d+$/.test(compact)) return new Decimal(compact.replace(",", "."));
  return "invalid";
}

export function sumDec(values: Iterable<Decimal>): Decimal {
  let total = zero();
  for (const value of values) total = total.plus(value);
  return total;
}

export function decimalToString(value: Decimal): string {
  return value.toString();
}

export { Decimal };
