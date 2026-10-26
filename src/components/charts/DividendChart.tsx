import { useRef } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StackedYear } from "@/aggregation/flows";
import type { AccountProfile } from "@/domain/accounts";
import { AccountLegend } from "@/components/AccountLegend";
import { resolveChartCategory, selectFromItem } from "@/components/charts/chartClick";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { TooltipBox } from "@/components/charts/TooltipBox";
import { usePrefersReducedMotion } from "@/components/useReducedMotion";
import { formatAxisCad, formatCad } from "@/view/format";
import { accountColor } from "@/view/palette";

export function DividendChart({
  years,
  accounts,
  onYear,
  onAccount,
}: {
  years: StackedYear[];
  accounts: AccountProfile[];
  onYear: (year: string) => void;
  onAccount: (accountId: string) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const hovered = useRef<string | null>(null);
  const yearKeys = years.map((item) => item.year);
  const data = years.map((year) => {
    const row: Record<string, string | number | StackedYear> = { year: year.year, point: year };
    for (const account of accounts) row[account.id] = year.byAccount[account.id] ?? 0;
    return row;
  });

  return (
    <ChartCard
      title="Dividends by year"
      description="Cash dividends stacked by account. Select a year to filter income and the trade log."
    >
      {years.every((year) => year.total === 0) ? (
        <EmptyChart>No dividends in this view.</EmptyChart>
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
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
                  content={
                    <DividendTip
                      accounts={accounts}
                      onActive={(year) => (hovered.current = year)}
                    />
                  }
                  wrapperStyle={{ pointerEvents: "none" }}
                  cursor={{ fill: "var(--muted)", fillOpacity: 0.35, pointerEvents: "none" }}
                />
                {accounts.map((account, index) => (
                  <Bar
                    key={account.id}
                    dataKey={account.id}
                    name={account.shortLabel}
                    stackId="div"
                    fill={accountColor(account.id)}
                    background={index === 0 ? { fill: "transparent" } : undefined}
                    isAnimationActive={!reduced}
                    onClick={(bar, _index, event) => selectFromItem(bar, "year", event, onYear)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <AccountLegend
            items={accounts.map((account) => ({ id: account.id, label: account.shortLabel }))}
            onSelect={onAccount}
          />
        </>
      )}
    </ChartCard>
  );
}

function DividendTip({
  active,
  payload,
  accounts,
  onActive,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { point?: StackedYear; year?: string } }>;
  accounts: AccountProfile[];
  onActive: (year: string) => void;
}) {
  const row = payload?.[0]?.payload;
  const point = row?.point;
  if (active && row?.year) onActive(row.year);
  if (!active || !point) return null;
  const rows: Array<{ label: string; value: string; color?: string }> = accounts
    .filter((account) => point.byAccount[account.id])
    .map((account) => ({
      label: account.shortLabel,
      value: formatCad(point.byAccount[account.id] ?? 0),
      color: accountColor(account.id),
    }));
  rows.push({ label: "Total", value: formatCad(point.total) });
  return <TooltipBox title={point.year} rows={rows} />;
}
