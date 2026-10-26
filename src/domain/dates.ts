const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= last;
}

export function monthEnd(isoDay: string): string {
  const year = Number(isoDay.slice(0, 4));
  const month = Number(isoDay.slice(5, 7));
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${isoDay.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

export function addMonths(iso: string, delta: number): string {
  let year = Number(iso.slice(0, 4));
  let month = Number(iso.slice(5, 7)) + delta;
  while (month <= 0) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  const end = monthEnd(`${year}-${String(month).padStart(2, "0")}-01`);
  const day = iso.slice(8, 10);
  const clamped = day > end.slice(8, 10) ? end.slice(8, 10) : day;
  return `${year}-${String(month).padStart(2, "0")}-${clamped}`;
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function quarterKey(date: string): string {
  const month = Number(date.slice(5, 7));
  const quarter = Math.floor((month - 1) / 3) + 1;
  return `${date.slice(0, 4)}-Q${quarter}`;
}

export function yearKey(date: string): string {
  return date.slice(0, 4);
}

export function eachMonth(from: string, to: string): string[] {
  const keys: string[] = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  const endYear = Number(to.slice(0, 4));
  const endMonth = Number(to.slice(5, 7));
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

export function eachQuarter(from: string, to: string): string[] {
  const keys: string[] = [];
  let year = Number(from.slice(0, 4));
  let quarter = Math.floor((Number(from.slice(5, 7)) - 1) / 3) + 1;
  const endYear = Number(to.slice(0, 4));
  const endQuarter = Math.floor((Number(to.slice(5, 7)) - 1) / 3) + 1;
  while (year < endYear || (year === endYear && quarter <= endQuarter)) {
    keys.push(`${year}-Q${quarter}`);
    quarter += 1;
    if (quarter === 5) {
      quarter = 1;
      year += 1;
    }
  }
  return keys;
}

export function eachYear(from: string, to: string): string[] {
  const keys: string[] = [];
  for (let year = Number(from.slice(0, 4)); year <= Number(to.slice(0, 4)); year += 1) {
    keys.push(String(year));
  }
  return keys;
}

export function periodBounds(key: string): { from: string; to: string } {
  const month = /^(\d{4})-(\d{2})$/.exec(key);
  if (month?.[1] && month[2]) {
    const from = `${month[1]}-${month[2]}-01`;
    return { from, to: monthEnd(from) };
  }
  const quarter = /^(\d{4})-Q([1-4])$/.exec(key);
  if (quarter?.[1] && quarter[2]) {
    const startMonth = (Number(quarter[2]) - 1) * 3 + 1;
    const from = `${quarter[1]}-${String(startMonth).padStart(2, "0")}-01`;
    const endMonth = startMonth + 2;
    return { from, to: monthEnd(`${quarter[1]}-${String(endMonth).padStart(2, "0")}-01`) };
  }
  const year = /^(\d{4})$/.exec(key);
  if (year?.[1]) return { from: `${year[1]}-01-01`, to: `${year[1]}-12-31` };
  throw new Error(`Unknown period: ${key}`);
}

export function formatDay(iso: string): string {
  const month = MONTHS[Number(iso.slice(5, 7)) - 1] ?? iso.slice(5, 7);
  return `${Number(iso.slice(8, 10))} ${month} ${iso.slice(0, 4)}`;
}

export function formatMonthLabel(key: string): string {
  const month = MONTHS[Number(key.slice(5, 7)) - 1] ?? key.slice(5, 7);
  return `${month} ${key.slice(0, 4)}`;
}

export function formatQuarterLabel(key: string): string {
  return key.replace("-", " ");
}

export function inDateRange(date: string, from: string | null, to: string | null): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}
