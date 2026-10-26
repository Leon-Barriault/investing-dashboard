function readLabel(state: unknown): string | null {
  if (!state || typeof state !== "object" || !("activeLabel" in state)) return null;
  const label = state.activeLabel;
  if (typeof label === "string" && label) return label;
  if (typeof label === "number") return String(label);
  return null;
}

function readIndex(state: unknown): number | null {
  if (!state || typeof state !== "object" || !("activeIndex" in state)) return null;
  const index = state.activeIndex;
  if (typeof index === "number" && Number.isInteger(index) && index >= 0) return index;
  if (typeof index === "string" && /^\d+$/.test(index)) return Number(index);
  return null;
}

export function tooltipActive(state: unknown): boolean {
  if (!state || typeof state !== "object" || !("isTooltipActive" in state)) return false;
  return Boolean(state.isTooltipActive);
}

export function payloadString(data: unknown, field: string): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { payload?: unknown };
  const source =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : (data as Record<string, unknown>);
  const value = source[field];
  return typeof value === "string" ? value : null;
}

/**
 * Recharts 3 chart clicks expose activeLabel and activeIndex, not the bar payload.
 * activeLabel may be the data key or the formatted tick. A formatted tick wins over
 * the index because a click can reset activeIndex to 0.
 */
export function categoryFromChartClick(
  state: unknown,
  categories: readonly string[],
  labels?: readonly string[],
): string | null {
  const label = readLabel(state);
  if (label) {
    if (categories.includes(label)) return label;
    const fromLabel = labels?.indexOf(label) ?? -1;
    const labelled = fromLabel >= 0 ? categories[fromLabel] : undefined;
    if (labelled) return labelled;
  }
  const index = readIndex(state);
  if (index !== null && categories[index]) return categories[index];
  return null;
}

/** Last tooltip category, used when the click state itself has no index. */
export function resolveChartCategory(
  state: unknown,
  categories: readonly string[],
  labels: readonly string[] | undefined,
  hovered: string | null,
): string | null {
  const direct = categoryFromChartClick(state, categories, labels);
  if (direct) return direct;
  if (tooltipActive(state) && hovered && categories.includes(hovered)) return hovered;
  return null;
}

export function selectFromItem(
  data: unknown,
  field: string,
  event: { stopPropagation: () => void } | undefined,
  onSelect: (value: string) => void,
): void {
  const value = payloadString(data, field);
  if (!value) return;
  event?.stopPropagation();
  onSelect(value);
}
