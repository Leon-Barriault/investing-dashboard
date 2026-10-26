import { describe, expect, it, vi } from "vitest";
import {
  categoryFromChartClick,
  payloadString,
  resolveChartCategory,
  selectFromItem,
} from "./chartClick";

const quarters = ["2024-Q1", "2024-Q2", "2024-Q3"];
const quarterLabels = ["2024 Q1", "2024 Q2", "2024 Q3"];

describe("categoryFromChartClick", () => {
  it("reads the Recharts 3 active index when the label is only a display string", () => {
    expect(categoryFromChartClick({ activeIndex: 1, activeLabel: "2024 Q2" }, quarters)).toBe(
      "2024-Q2",
    );
    expect(categoryFromChartClick({ activeIndex: "2" }, quarters)).toBe("2024-Q3");
  });

  it("prefers a formatted tick over an index that a click reset to zero", () => {
    expect(
      categoryFromChartClick({ activeIndex: 0, activeLabel: "2024 Q2" }, quarters, quarterLabels),
    ).toBe("2024-Q2");
  });

  it("prefers a label that is already one of the categories", () => {
    expect(categoryFromChartClick({ activeIndex: 0, activeLabel: "2024-Q2" }, quarters)).toBe(
      "2024-Q2",
    );
  });

  it("falls back to a label that is already a category", () => {
    expect(categoryFromChartClick({ activeLabel: "2025" }, ["2024", "2025"])).toBe("2025");
  });

  it("ignores a click that missed the series", () => {
    expect(
      categoryFromChartClick({ activeLabel: undefined, activeIndex: null }, quarters),
    ).toBeNull();
    expect(categoryFromChartClick(null, quarters)).toBeNull();
  });
});

describe("resolveChartCategory", () => {
  it("uses the hovered tooltip category when the click state has no index", () => {
    expect(
      resolveChartCategory(
        { isTooltipActive: true, activeLabel: undefined, activeIndex: null },
        quarters,
        quarterLabels,
        "2024-Q3",
      ),
    ).toBe("2024-Q3");
  });

  it("does not reuse a stale hover after the pointer has left the chart", () => {
    expect(
      resolveChartCategory(
        { isTooltipActive: false, activeIndex: null },
        quarters,
        quarterLabels,
        "2024-Q3",
      ),
    ).toBeNull();
  });
});

describe("selectFromItem", () => {
  it("reads the bar payload and stops the chart click from overriding it", () => {
    const onSelect = vi.fn();
    const stopPropagation = vi.fn();
    selectFromItem({ payload: { key: "2025-Q4", buys: 12 } }, "key", { stopPropagation }, onSelect);
    expect(onSelect).toHaveBeenCalledWith("2025-Q4");
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(payloadString({ symbol: "PINE" }, "symbol")).toBe("PINE");
  });

  it("leaves the event alone when the bar has no category", () => {
    const stopPropagation = vi.fn();
    selectFromItem({ payload: { buys: 1 } }, "key", { stopPropagation }, vi.fn());
    expect(stopPropagation).not.toHaveBeenCalled();
  });
});
