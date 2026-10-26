import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS } from "../domain/filters.ts";
import { toLedger } from "../domain/ledger.ts";
import { parseWealthsimpleCsv } from "../parsing/parseWealthsimpleCsv.ts";
import { snapshotPositions } from "../aggregation/positions.ts";
import { zero } from "../domain/money.ts";
import { buildDashboard } from "./buildDashboard.ts";
import { paginate, searchTrades, sortTrades } from "./tradeQuery.ts";
import { tradesToCsv } from "../export/csv.ts";

const csv = readFileSync(path.resolve("public/data/sample-activity.csv"), "utf8");
const parsed = parseWealthsimpleCsv(csv);
const ledger = toLedger(parsed.activities, [], "sample");

describe("synthetic sample ledger", () => {
  const model = buildDashboard(ledger, EMPTY_FILTERS);

  it("matches the cash-flow totals computed from the sample", () => {
    expect(model.kpis.netDeposits).toContain("3,970.00");
    expect(model.kpis.dividends).toContain("20.00");
    expect(model.kpis.feesPaid).toContain("8.00");
    expect(model.kpis.feeRefunds).toContain("3.00");
    expect(model.kpis.netFees).toContain("5.00");
    expect(model.kpis.trades).toBe("10");
    expect(model.kpis.cash).toContain("3,592.25");
    expect(model.kpis.bookValue).toContain("4,222.25");
    expect(model.kpis.extras.map((item) => item.value).join(" ")).toContain("50.00");
  });

  it("rebuilds estimated positions without inventing market prices", () => {
    const snapshot = snapshotPositions(ledger.activities, {
      accountId: null,
      asOf: null,
      realizedFrom: null,
      symbol: null,
    });
    const pine = snapshot.positions.find((position) => position.symbol === "PINE");
    expect(pine?.quantity.toString()).toBe("12");
    expect(pine?.cost.toFixed(2)).toBe("300.00");

    const nut = snapshot.positions.find((position) => position.symbol === "NUT");
    expect(nut?.quantity.toString()).toBe("0.5");
    expect(nut?.cost.toFixed(2)).toBe("30.00");

    const rrspCost = snapshot.positions
      .filter((position) => position.accountId === "SAMPLE-RRSP-CAD")
      .reduce((total, position) => total.plus(position.cost), zero());
    expect(rrspCost.toFixed(2)).toBe("200.00");

    const nonRegistered = snapshot.positions.filter(
      (position) => position.accountId === "SAMPLE-NREG-CAD",
    );
    expect(nonRegistered).toEqual([]);

    expect(model.kpis.bookNote).toMatch(/Not a market value/);
    expect(model.positions.some((position) => position.warning)).toBe(true);
  });

  it("keeps symbol filters off deposits and on the trade log", () => {
    const filtered = buildDashboard(ledger, { ...EMPTY_FILTERS, symbol: "PINE" });
    expect(filtered.kpis.netDeposits).toBe(model.kpis.netDeposits);
    expect(filtered.trades).toHaveLength(3);
    expect(filtered.trades.every((trade) => trade.symbol === "PINE")).toBe(true);
    expect(filtered.symbolBanner).toMatch(/PINE/);
  });

  it("drills a month down to the trades inside it", () => {
    const january = buildDashboard(ledger, {
      ...EMPTY_FILTERS,
      from: "2025-01-01",
      to: "2025-01-31",
    });
    expect(january.trades).toHaveLength(1);
    expect(january.trades.every((trade) => trade.date.startsWith("2025-01"))).toBe(true);
    expect(january.contributions.every((point) => point.month === "2025-01")).toBe(true);
  });
});

describe("trade query and csv", () => {
  const model = buildDashboard(ledger, EMPTY_FILTERS);

  it("searches, sorts, and paginates", () => {
    const found = searchTrades(model.trades, "pine");
    expect(found).toHaveLength(3);
    const sorted = sortTrades(model.trades, "symbol", "asc");
    expect(sorted[0]?.symbol.localeCompare(sorted[1]?.symbol ?? "") ?? 0).toBeLessThanOrEqual(0);
    const page = paginate(model.trades, 2, 4);
    expect(page.items).toHaveLength(4);
    expect(page.from).toBe(5);
    expect(page.total).toBe(10);
  });

  it("exports filtered trades as csv without formula injection", () => {
    const csvText = tradesToCsv([
      {
        ...model.trades[0]!,
        description: '=HYPERLINK("http://evil")',
        netRaw: "-89.28",
      },
    ]);
    expect(csvText.startsWith("\uFEFF")).toBe(true);
    expect(csvText).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvText).toContain("-89.28");
  });
});
