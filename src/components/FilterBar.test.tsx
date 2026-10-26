import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_FILTERS } from "@/domain/filters";
import { FilterBar } from "./FilterBar";

describe("FilterBar", () => {
  it("applies the year-to-date preset", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FilterBar
        accounts={[]}
        symbols={[]}
        filters={EMPTY_FILTERS}
        presets={[
          { id: "all", label: "All", from: null, to: null },
          { id: "ytd", label: "YTD", from: "2025-01-01", to: "2025-01-20" },
        ]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "YTD" }));
    expect(onChange).toHaveBeenCalledWith({
      accountId: null,
      symbol: null,
      from: "2025-01-01",
      to: "2025-01-20",
    });
  });
});
