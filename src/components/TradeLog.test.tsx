import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TradeRow } from "@/view/types";
import { TradeLog } from "./TradeLog";

function row(index: number, symbol = "AAA"): TradeRow {
  return {
    id: String(index),
    date: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
    time: "09:30:00",
    settlement: "",
    accountId: "A",
    accountLabel: "RRSP",
    side: "Buy",
    symbol,
    name: symbol === "PINE" ? "Pine Sample Inc." : "Example",
    quantity: "1",
    quantityValue: 1,
    price: "10.00",
    priceRaw: "10",
    priceValue: 10,
    currency: "CAD",
    fees: "—",
    feesRaw: "",
    feesValue: 0,
    net: "-10.00",
    netRaw: "-10",
    netValue: -10,
    fx: "",
    description: `${symbol} buy`,
  };
}

describe("TradeLog", () => {
  it("searches, pages, and exports the matches", async () => {
    const onExport = vi.fn();
    const user = userEvent.setup();
    const rows = [row(1, "PINE"), ...Array.from({ length: 29 }, (_, index) => row(index + 2))];
    render(<TradeLog rows={rows} resultKey="test" onExport={onExport} />);

    expect(screen.getByText(/1–25 of 30/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/26–30 of 30/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search the trade log"), "pine");
    expect(screen.getByText("PINE")).toBeInTheDocument();
    expect(screen.getByText(/1–1 of 1/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Export CSV" }));
    const csv = String(onExport.mock.calls[0]?.[0]);
    expect(csv).toContain("PINE");
    expect(csv).not.toContain("AAA");
  });
});
