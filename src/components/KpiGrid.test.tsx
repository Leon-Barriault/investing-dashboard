import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiGrid } from "./KpiGrid";
import type { KpiModel } from "@/view/types";

const kpis: KpiModel = {
  netDeposits: "$1,250.00",
  dividends: "$40.00",
  feesPaid: "$8.00",
  feeRefunds: "$3.00",
  netFees: "$5.00",
  trades: "12",
  tradeNote: "653 buys · 41 sells · 2 swaps",
  bookValue: "$59,000.00",
  bookNote: "Estimated average cost plus cash. Not a market value.",
  cash: "$80.00",
  openPositions: 21,
  realized: "$100.00",
  extras: [],
};

describe("KpiGrid", () => {
  it("shows net deposits and labels book value as an estimate", () => {
    render(<KpiGrid kpis={kpis} />);
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
    expect(screen.getByText("Estimate")).toBeInTheDocument();
    expect(screen.getByText(/Not a market value/)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
