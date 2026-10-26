import type { Activity } from "../domain/activity.ts";
import { classifyActivity } from "../domain/classify.ts";
import { isIsoDate } from "../domain/dates.ts";
import { Decimal, parseDecimalField } from "../domain/money.ts";
import Papa from "papaparse";

export const WEALTHSIMPLE_HEADERS = [
  "date_effet",
  "heure_effet",
  "date_reglement",
  "compte_id",
  "type_compte",
  "type_activite",
  "sous_type_activite",
  "description",
  "direction",
  "symbole",
  "nom",
  "devise",
  "quantite",
  "prix_unitaire",
  "commission",
  "montant_net_especes",
] as const;

export interface ParseIssue {
  rowNumber: number;
  message: string;
}

export interface ParseResult {
  activities: Activity[];
  errors: ParseIssue[];
  fatal: string | null;
}

const FX_PATTERN = /Taux de change\s*:\s*(\d+(?:[.,]\d+)?)/i;

function detectDelimiter(text: string): "," | ";" {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const commas = firstLine.match(/,/g)?.length ?? 0;
  const semicolons = firstLine.match(/;/g)?.length ?? 0;
  return semicolons > commas ? ";" : ",";
}

function blank(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function fxRate(description: string): Decimal | null {
  const match = FX_PATTERN.exec(description);
  const raw = match?.[1];
  if (!raw) return null;
  const parsed = parseDecimalField(raw);
  return parsed === "invalid" ? null : parsed;
}

export function parseWealthsimpleCsv(text: string): ParseResult {
  const source = text.replace(/^\uFEFF/, "");
  if (!source.trim()) {
    return { activities: [], errors: [], fatal: "The file is empty." };
  }

  const parsed = Papa.parse<Record<string, string>>(source, {
    header: true,
    skipEmptyLines: "greedy",
    delimiter: detectDelimiter(source),
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const missing = WEALTHSIMPLE_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    return {
      activities: [],
      errors: [],
      fatal: `This is not a Wealthsimple activity export. Missing columns: ${missing.join(", ")}.`,
    };
  }

  const activities: Activity[] = [];
  const errors: ParseIssue[] = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const date = (row.date_effet ?? "").trim();
    const accountId = (row.compte_id ?? "").trim();
    const rawType = (row.type_activite ?? "").trim();
    if (!date && !accountId && !rawType) return;

    if (!isIsoDate(date)) {
      errors.push({ rowNumber, message: `Invalid date "${date}". Use YYYY-MM-DD.` });
      return;
    }
    if (!accountId) {
      errors.push({ rowNumber, message: "Missing compte_id." });
      return;
    }
    if (!rawType) {
      errors.push({ rowNumber, message: "Missing type_activite." });
      return;
    }

    const quantity = readNumber(row.quantite, "quantite", rowNumber, errors);
    const price = readNumber(row.prix_unitaire, "prix_unitaire", rowNumber, errors);
    const commission = readNumber(row.commission, "commission", rowNumber, errors);
    const netAmount = readNumber(row.montant_net_especes, "montant_net_especes", rowNumber, errors);
    if (quantity === "bad" || price === "bad" || commission === "bad" || netAmount === "bad")
      return;

    const settlement = (row.date_reglement ?? "").trim();
    if (settlement && !isIsoDate(settlement)) {
      errors.push({ rowNumber, message: `Invalid settlement date "${settlement}".` });
      return;
    }

    const description = row.description?.trim() ?? "";
    const frenchAccountType = (row.type_compte ?? "").trim();
    const classified = classifyActivity({
      rawType,
      rawSubtype: row.sous_type_activite ?? "",
      frenchAccountType,
      netAmount,
      quantity,
    });

    activities.push({
      id: `${rowNumber}`,
      rowNumber,
      date,
      time: (row.heure_effet ?? "").trim(),
      settlementDate: settlement || null,
      accountId,
      frenchAccountType,
      symbol: blank(row.symbole),
      name: blank(row.nom),
      currency: blank(row.devise),
      quantity,
      price,
      commission,
      netAmount,
      fxRate: fxRate(description),
      description,
      kind: classified.kind,
      side: classified.side,
      rawType,
      rawSubtype: (row.sous_type_activite ?? "").trim(),
    });
  });

  if (activities.length === 0) {
    return {
      activities: [],
      errors,
      fatal: errors[0]?.message ?? "No activity rows were found.",
    };
  }

  return { activities, errors, fatal: null };
}

function readNumber(
  raw: string | undefined,
  field: string,
  rowNumber: number,
  errors: ParseIssue[],
): Decimal | null | "bad" {
  const parsed = parseDecimalField(raw ?? "");
  if (parsed === "invalid") {
    errors.push({ rowNumber, message: `Invalid number in ${field}.` });
    return "bad";
  }
  return parsed;
}
