import { describe, expect, it } from "vitest";
import { buildDatePresets } from "./filters.ts";
import { eachMonth, isIsoDate, monthEnd, periodBounds } from "./dates.ts";

describe("dates", () => {
  it("rejects impossible calendar days", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2023-02-29")).toBe(false);
    expect(monthEnd("2026-02-01")).toBe("2026-02-28");
  });

  it("turns chart keys into inclusive ranges", () => {
    expect(periodBounds("2025-08")).toEqual({ from: "2025-08-01", to: "2025-08-31" });
    expect(periodBounds("2025-Q3")).toEqual({ from: "2025-07-01", to: "2025-09-30" });
    expect(periodBounds("2026")).toEqual({ from: "2026-01-01", to: "2026-12-31" });
    expect(eachMonth("2025-11-20", "2026-01-02")).toEqual(["2025-11", "2025-12", "2026-01"]);
  });

  it("builds presets from the latest activity date", () => {
    const presets = buildDatePresets("2026-10-23");
    expect(presets.find((preset) => preset.id === "ytd")).toEqual({
      id: "ytd",
      label: "YTD",
      from: "2026-01-01",
      to: "2026-10-23",
    });
    expect(presets.find((preset) => preset.id === "12m")?.from).toBe("2025-11-01");
  });
});
