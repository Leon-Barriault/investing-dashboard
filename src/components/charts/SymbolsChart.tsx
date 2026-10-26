import { useRef } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SymbolStat } from "@/aggregation/flows";
import { resolveChartCategory, selectFromItem } from "@/components/charts/chartClick";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { TooltipBox } from "@/components/charts/TooltipBox";
import { usePrefersReducedMotion } from "@/components/useReducedMotion";
import { BUY_COLOR, SELL_COLOR } from "@/view/palette";

export function SymbolsChart({
  symbols,
  onSymbol,
}: {
  symbols: SymbolStat[];
  onSymbol: (symbol: string) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const hovered = useRef<string | null>(null);
  const symbolsKeys = symbols.map((item) => item.symbol);
  return (
    <ChartCard
      title="Most-traded symbols"
      description="Execution count, not dollars. Select a bar to filter the trade log to that symbol."
    >
      {symbols.length === 0 ? (
        <EmptyChart>No symbols in this view.</EmptyChart>
      ) : (
        <div style={{ height: Math.max(240, symbols.length * 28) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={symbols}
              layout="vertical"
              margin={{ left: 8, right: 8 }}
              style={{ cursor: "pointer" }}
              onClick={(state) => {
                const symbol = resolveChartCategory(state, symbolsKeys, undefined, hovered.current);
                if (symbol) onSymbol(symbol);
              }}
            >
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                type="category"
                dataKey="symbol"
                width={68}
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                content={<SymbolTip onActive={(symbol) => (hovered.current = symbol)} />}
                wrapperStyle={{ pointerEvents: "none" }}
                cursor={{ fill: "var(--muted)", fillOpacity: 0.35, pointerEvents: "none" }}
              />
              <Bar
                dataKey="buys"
                stackId="sym"
                fill={BUY_COLOR}
                background={{ fill: "transparent" }}
                isAnimationActive={!reduced}
                onClick={(bar, _index, event) => selectFromItem(bar, "symbol", event, onSymbol)}
              />
              <Bar
                dataKey="sells"
                stackId="sym"
                fill={SELL_COLOR}
                isAnimationActive={!reduced}
                onClick={(bar, _index, event) => selectFromItem(bar, "symbol", event, onSymbol)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function SymbolTip({
  active,
  payload,
  onActive,
}: {
  active?: boolean;
  payload?: Array<{ payload?: SymbolStat }>;
  onActive: (symbol: string) => void;
}) {
  const point = payload?.[0]?.payload;
  if (active && point) onActive(point.symbol);
  if (!active || !point) return null;
  return (
    <TooltipBox
      title={`${point.symbol} · ${point.name}`}
      rows={[
        { label: "Buys", value: String(point.buys), color: BUY_COLOR },
        { label: "Sells", value: String(point.sells), color: SELL_COLOR },
        { label: "Total", value: String(point.count) },
      ]}
    />
  );
}
