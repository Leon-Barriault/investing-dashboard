import { useRef } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FeeYear } from "@/aggregation/flows";
import { resolveChartCategory, selectFromItem } from "@/components/charts/chartClick";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { TooltipBox } from "@/components/charts/TooltipBox";
import { usePrefersReducedMotion } from "@/components/useReducedMotion";
import { formatAxisCad, formatCad } from "@/view/format";
import { BUY_COLOR, REFUND_COLOR } from "@/view/palette";

export function FeesChart({ years, onYear }: { years: FeeYear[]; onYear: (year: string) => void }) {
  const reduced = usePrefersReducedMotion();
  const hovered = useRef<string | null>(null);
  const yearKeys = years.map((item) => item.year);
  const empty = years.every((year) => year.fees === 0 && year.refunds === 0);
  return (
    <ChartCard
      title="Fees"
      description="Management fees and refunds by year. Select a year to filter the cash activity."
    >
      {empty ? (
        <EmptyChart>No fees in this view.</EmptyChart>
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={years}
                style={{ cursor: "pointer" }}
                onClick={(state) => {
                  const year = resolveChartCategory(state, yearKeys, undefined, hovered.current);
                  if (year) onYear(year);
                }}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis
                  tickFormatter={formatAxisCad}
                  width={56}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  content={<FeeTip onActive={(year) => (hovered.current = year)} />}
                  wrapperStyle={{ pointerEvents: "none" }}
                  cursor={{ fill: "var(--muted)", fillOpacity: 0.35, pointerEvents: "none" }}
                />
                <Bar
                  dataKey="fees"
                  name="Fees"
                  fill={BUY_COLOR}
                  radius={[3, 3, 0, 0]}
                  background={{ fill: "transparent" }}
                  isAnimationActive={!reduced}
                  onClick={(bar, _index, event) => selectFromItem(bar, "year", event, onYear)}
                />
                <Bar
                  dataKey="refunds"
                  name="Refunds"
                  fill={REFUND_COLOR}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={!reduced}
                  onClick={(bar, _index, event) => selectFromItem(bar, "year", event, onYear)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="text-muted-foreground mt-3 flex gap-4 text-xs">
            <li className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: BUY_COLOR }} /> Fees paid
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: REFUND_COLOR }} /> Refunds
            </li>
          </ul>
        </>
      )}
    </ChartCard>
  );
}

function FeeTip({
  active,
  payload,
  onActive,
}: {
  active?: boolean;
  payload?: Array<{ payload?: FeeYear }>;
  onActive: (year: string) => void;
}) {
  const point = payload?.[0]?.payload;
  if (active && point) onActive(point.year);
  if (!active || !point) return null;
  return (
    <TooltipBox
      title={point.year}
      rows={[
        { label: "Fees paid", value: formatCad(point.fees), color: BUY_COLOR },
        { label: "Refunds", value: formatCad(point.refunds), color: REFUND_COLOR },
      ]}
    />
  );
}
