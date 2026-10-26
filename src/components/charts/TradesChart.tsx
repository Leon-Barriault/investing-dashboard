import { useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PeriodCount } from "@/aggregation/flows";
import { formatMonthLabel, formatQuarterLabel } from "@/domain/dates";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { resolveChartCategory, selectFromItem } from "@/components/charts/chartClick";
import { TooltipBox } from "@/components/charts/TooltipBox";
import { usePrefersReducedMotion } from "@/components/useReducedMotion";
import { Button } from "@/components/ui/button";
import { BUY_COLOR, SELL_COLOR } from "@/view/palette";

export function TradesChart({
  byMonth,
  byQuarter,
  onPeriod,
}: {
  byMonth: PeriodCount[];
  byQuarter: PeriodCount[];
  onPeriod: (key: string) => void;
}) {
  const [grain, setGrain] = useState<"quarter" | "month">("quarter");
  const reduced = usePrefersReducedMotion();
  const points = grain === "quarter" ? byQuarter : byMonth;
  const hovered = useRef<string | null>(null);
  const keys = points.map((point) => point.key);
  const labels = points.map((point) => point.label);

  return (
    <ChartCard
      title="Trades per period"
      description="Buys beside sells. Swaps are counted in the tooltip. Select a bar to open that period in the trade log."
      action={
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={grain === "quarter" ? "default" : "outline"}
            onClick={() => setGrain("quarter")}
          >
            Quarter
          </Button>
          <Button
            type="button"
            size="sm"
            variant={grain === "month" ? "default" : "outline"}
            onClick={() => setGrain("month")}
          >
            Month
          </Button>
        </div>
      }
    >
      {points.length === 0 ? (
        <EmptyChart>No trades in this view.</EmptyChart>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={points}
              style={{ cursor: "pointer" }}
              onClick={(state) => {
                const key = resolveChartCategory(state, keys, labels, hovered.current);
                if (key) onPeriod(key);
              }}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="key"
                minTickGap={20}
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickFormatter={(value) =>
                  String(value).includes("Q")
                    ? formatQuarterLabel(String(value))
                    : formatMonthLabel(String(value))
                }
              />
              <YAxis
                allowDecimals={false}
                width={36}
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                content={<TradeTip onActive={(key) => (hovered.current = key)} />}
                wrapperStyle={{ pointerEvents: "none" }}
                cursor={{ fill: "var(--muted)", fillOpacity: 0.35, pointerEvents: "none" }}
              />
              <Bar
                dataKey="buys"
                name="Buys"
                fill={BUY_COLOR}
                radius={[3, 3, 0, 0]}
                background={{ fill: "transparent" }}
                isAnimationActive={!reduced}
                onClick={(bar, _index, event) => selectFromItem(bar, "key", event, onPeriod)}
              />
              <Bar
                dataKey="sells"
                name="Sells"
                fill={SELL_COLOR}
                radius={[3, 3, 0, 0]}
                isAnimationActive={!reduced}
                onClick={(bar, _index, event) => selectFromItem(bar, "key", event, onPeriod)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function TradeTip({
  active,
  payload,
  onActive,
}: {
  active?: boolean;
  payload?: Array<{ payload?: PeriodCount }>;
  onActive: (key: string) => void;
}) {
  const point = payload?.[0]?.payload;
  if (active && point) onActive(point.key);
  if (!active || !point) return null;
  return (
    <TooltipBox
      title={point.label}
      rows={[
        { label: "Buys", value: String(point.buys), color: BUY_COLOR },
        { label: "Sells", value: String(point.sells), color: SELL_COLOR },
        { label: "Swaps", value: String(point.swaps) },
      ]}
    />
  );
}
