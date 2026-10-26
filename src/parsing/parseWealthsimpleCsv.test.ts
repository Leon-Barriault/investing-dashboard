import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { toLedger } from "../domain/ledger.ts";
import { parseDecimalField } from "../domain/money.ts";
import { WEALTHSIMPLE_HEADERS, parseWealthsimpleCsv } from "./parseWealthsimpleCsv.ts";

const HEADER = WEALTHSIMPLE_HEADERS.join(",");

function cell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function line(values: Partial<Record<(typeof WEALTHSIMPLE_HEADERS)[number], string>>): string {
  return WEALTHSIMPLE_HEADERS.map((header) => cell(values[header] ?? "")).join(",");
}

describe("parseDecimalField", () => {
  it("accepts dot decimals, French comma decimals, and blanks", () => {
    expect(parseDecimalField(" -89.28 ")?.toString()).toBe("-89.28");
    expect(parseDecimalField("3,0000")?.toString()).toBe("3");
    expect(parseDecimalField("")).toBeNull();
    expect(parseDecimalField("1.234,56")).toBe("invalid");
  });
});

describe("parseWealthsimpleCsv", () => {
  it("rejects a file that is not the French export", () => {
    const result = parseWealthsimpleCsv("date,symbol\n2021-01-01,X\n");
    expect(result.fatal).toMatch(/Missing columns/);
    expect(result.activities).toHaveLength(0);
  });

  it("parses quoted descriptions, sells, FX, and semicolon files", () => {
    const csv = [
      HEADER,
      line({
        date_effet: "2024-03-01",
        heure_effet: "12:48:37",
        date_reglement: "2024-03-05",
        compte_id: "SAMPLE-NREG-CAD",
        type_compte: "Non-enregistré",
        type_activite: "Trade",
        sous_type_activite: "BUY",
        description: "PINE - Pine Sample Inc. : Achat, Taux de change : 1,2966",
        symbole: "PINE",
        nom: "Pine Sample Inc.",
        devise: "CAD",
        quantite: "3",
        prix_unitaire: "8.54336752",
        commission: "0",
        montant_net_especes: "-25.63",
      }),
    ].join("\n");
    const result = parseWealthsimpleCsv(csv);
    expect(result.fatal).toBeNull();
    expect(result.activities[0]?.fxRate?.toString()).toBe("1.2966");
    expect(result.activities[0]?.kind).toBe("trade");
    expect(result.activities[0]?.side).toBe("BUY");

    const semi = [
      WEALTHSIMPLE_HEADERS.join(";"),
      "2024-03-02;09:00:00;2024-03-04;SAMPLE-NREG-CAD;Non-enregistré;Trade;BUY;Achat simple;LONG;PINE;Pine Sample;CAD;10;3,39;0;-33,9",
    ].join("\n");
    const semiResult = parseWealthsimpleCsv(semi);
    expect(semiResult.errors).toEqual([]);
    expect(semiResult.activities).toHaveLength(1);
    expect(semiResult.activities[0]?.symbol).toBe("PINE");
    expect(semiResult.activities[0]?.price?.toString()).toBe("3.39");
    expect(semiResult.activities[0]?.netAmount?.toString()).toBe("-33.9");
  });

  it("classifies deposits, withdrawals, RRSP transfers, and internal transfers", () => {
    const csv = [
      HEADER,
      line({
        date_effet: "2024-01-10",
        compte_id: "SAMPLE-NREG-CAD",
        type_compte: "Non-enregistré",
        type_activite: "MoneyMovement",
        sous_type_activite: "EFT",
        description: "Dépôt",
        devise: "CAD",
        montant_net_especes: "200",
      }),
      line({
        date_effet: "2024-02-10",
        compte_id: "SAMPLE-NREG-CAD",
        type_compte: "Non-enregistré",
        type_activite: "MoneyMovement",
        sous_type_activite: "EFT",
        description: "Retrait",
        devise: "CAD",
        montant_net_especes: "-40",
      }),
      line({
        date_effet: "2024-02-01",
        compte_id: "SAMPLE-RRSP-CAD",
        type_compte: "REER",
        type_activite: "MoneyMovement",
        sous_type_activite: "TRANSFER",
        description: "Transfert entrant d’argent",
        devise: "CAD",
        montant_net_especes: "800",
      }),
      line({
        date_effet: "2024-05-02",
        compte_id: "SAMPLE-CRYP-CAD",
        type_compte: "compte Crypto",
        type_activite: "MoneyMovement",
        sous_type_activite: "TRANSFER",
        description: "Transfert entrant d’argent",
        devise: "CAD",
        montant_net_especes: "20",
      }),
    ].join("\n");
    const kinds = parseWealthsimpleCsv(csv).activities.map((activity) => activity.kind);
    expect(kinds).toEqual(["deposit", "withdrawal", "external-transfer-in", "internal-transfer"]);
  });

  it("loads the synthetic sample without row errors", () => {
    const csv = readFileSync(path.resolve("public/data/sample-activity.csv"), "utf8");
    expect(csv).toMatch(/échantillon synthétique/);
    const accountIds = [...csv.matchAll(/SAMPLE-[A-Z]+-CAD/g)].map((match) => match[0]);
    expect(new Set(accountIds).size).toBe(6);
    expect(csv).not.toMatch(/\b[A-Z]{2}[A-Z0-9]*\d[A-Z0-9]*CAD\b/);
    const result = parseWealthsimpleCsv(csv);
    expect(result.fatal).toBeNull();
    expect(result.errors).toEqual([]);
    expect(result.activities).toHaveLength(25);
    const ledger = toLedger(result.activities, [], "sample");
    expect(ledger.minDate).toBe("2024-01-10");
    expect(ledger.maxDate).toBe("2025-01-20");
    expect(ledger.accounts).toHaveLength(6);
    const trades = result.activities.filter(
      (activity) => activity.kind === "trade" || activity.kind === "crypto-swap",
    );
    expect(trades).toHaveLength(10);
    const resp = result.activities.filter(
      (activity) => activity.kind === "trade" && activity.accountId === "SAMPLE-RESP-CAD",
    );
    expect(resp).toHaveLength(1);
  });
});
