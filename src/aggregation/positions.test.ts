import { describe, expect, it } from "vitest";
import type { Activity } from "../domain/activity.ts";
import { WEALTHSIMPLE_HEADERS, parseWealthsimpleCsv } from "../parsing/parseWealthsimpleCsv.ts";
import { snapshotPositions } from "./positions.ts";

const HEADER = WEALTHSIMPLE_HEADERS.join(",");

function activityCsv(rows: string[]): Activity[] {
  return parseWealthsimpleCsv([HEADER, ...rows].join("\n")).activities;
}

describe("snapshotPositions", () => {
  it("uses average cost and keeps a name change from wiping the book", () => {
    const activities = activityCsv([
      "2023-04-04,09:00:00,2023-04-06,SAMPLE-NREG-CAD,Non-enregistré,Trade,BUY,buy,LONG,CEDAR,Cedar Sample,CAD,10,5,0,-50",
      "2023-05-02,09:00:00,2023-05-04,SAMPLE-NREG-CAD,Non-enregistré,Trade,BUY,buy,LONG,CEDAR,Cedar Sample,CAD,10,10,0,-100",
      "2023-05-20,00:00:00,,SAMPLE-NREG-CAD,Non-enregistré,LegacyCorporateAction,NAME_CHANGE,plus,LONG,CEDAR,Cedar Sample Class A,CAD,19,,,,",
      "2023-05-20,00:00:00,,SAMPLE-NREG-CAD,Non-enregistré,LegacyCorporateAction,NAME_CHANGE,minus,LONG,CEDAR,Cedar Sample,CAD,-19,,,,",
      "2023-06-01,09:00:00,2023-06-05,SAMPLE-NREG-CAD,Non-enregistré,Trade,SELL,sell,LONG,CEDAR,Cedar Sample Class A,CAD,-5,16,0,80",
    ]);
    const snapshot = snapshotPositions(activities, {
      accountId: null,
      asOf: null,
      realizedFrom: null,
      symbol: null,
    });
    const position = snapshot.positions[0];
    expect(position?.quantity.toString()).toBe("15");
    expect(position?.cost.toFixed(2)).toBe("112.50");
    expect(snapshot.realized.toFixed(2)).toBe("42.50");
  });

  it("moves CAD cost across a crypto swap instead of using the USD notionals", () => {
    const activities = activityCsv([
      "2023-08-01,10:00:00,,SAMPLE-CRYP-CAD,compte Crypto,Trade,BUY,buy,LONG,ACORN,Acorn Sample Coin,CAD,2,20,0,-40",
      "2023-08-02,01:11:44,,SAMPLE-CRYP-CAD,compte Crypto,CryptoSwap,-,out,LONG,ACORN,Acorn Sample Coin,USD,-2,10,,-10",
      "2023-08-02,01:11:44,,SAMPLE-CRYP-CAD,compte Crypto,CryptoSwap,-,in,LONG,NUT,Nut Sample Coin,USD,0.1,,,10",
    ]);
    const snapshot = snapshotPositions(activities, {
      accountId: null,
      asOf: null,
      realizedFrom: null,
      symbol: null,
    });
    const nut = snapshot.positions.find((position) => position.symbol === "NUT");
    const acorn = snapshot.positions.find((position) => position.symbol === "ACORN");
    expect(acorn).toBeUndefined();
    expect(nut?.quantity.toString()).toBe("0.1");
    expect(nut?.cost.toFixed(2)).toBe("40.00");
    expect(snapshot.realized.toString()).toBe("0");
  });
});
