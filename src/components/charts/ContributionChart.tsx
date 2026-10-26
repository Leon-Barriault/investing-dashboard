import { useRef } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AccountProfile } from "@/domain/accounts";
import { formatMonthLabel } from "@/domain/dates";
import type { ContributionPoint } from "@/aggregation/flows";
import { AccountLegend } from "@/components/AccountLegend";
import { resolveChartCategory } from "@/components/charts/chartClick";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { TooltipBox } from "@/components/charts/TooltipBox";
import { usePrefersReducedMotion } from "@/components/useReducedMotion";
import { formatAxisCad, formatCad } from "@/view/format";
import { accountColor } from "@/view/palette";

export function ContributionChart({
  points,
  accounts,
  onMonth,
  onAccount,
}: {
  points: ContributionPoint[];
  accounts: AccountProfile[];
  onMonth: (month: string) => void;
  onAccount: (accountId: string) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const hovered = useRef<string | null>(null);
  const months = points.map((point) => point.month);
  const labels = points.map((point) => point.label);
  const data = points.map((point) => {
    const row: Record<string, string | number | ContributionPoint> = { key: point.month, point };
    for (const account of accounts) row[account.id] = point.cumulative[account.id] ?? 0;
    return row;
  });

  return (
    <ChartCard
      className="lg:col-span-2"
      title="Contributions over time"
      description="Cumulative external deposits, withdrawals, and RRSP transfers in. Internal moves between Wealthsimple accounts are excluded. Select a month to filter the log."
    >
      {points.length === 0 ? (
        <EmptyChart>No external contributions in this view.</EmptyChart>
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                style={{ cursor: "pointer" }}
                onClick={(state) => {
                  const month = resolveChartCategory(state, months, labels, hovered.current);
                  if (month) onMonth(month);
                }}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="key"
                  tickFormatter={(value) => formatMonthLabel(String(value))}
                  minTickGap={28}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  tickFormatter={formatAxisCad}
                  width={56}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  content={
                    <ContributionTip
                      accounts={accounts}
                      onActive={(month) => (hovered.current = month)}
                    />
                  }
                  wrapperStyle={{ pointerEvents: "none" }}
                />
                {accounts.map((account) => (
                  <Area
                    key={account.id}
                    type="monotone"
                    dataKey={account.id}
                    name={account.shortLabel}
                    stackId="contrib"
                    stroke={accountColor(account.id)}
                    fill={accountColor(account.id)}
                    fillOpacity={0.75}
                    isAnimationActive={!reduced}
                  />
                ))}
              </AreaChart>
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

function ContributionTip({
  active,
  payload,
  accounts,
  onActive,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { point?: ContributionPoint } }>;
  accounts: AccountProfile[];
  onActive: (month: string) => void;
}) {
  const point = payload?.[0]?.payload?.point;
  if (active && point) onActive(point.month);
  if (!active || !point) return null;
  const rows: Array<{ label: string; value: string; color?: string }> = accounts
    .filter((account) => point.cumulative[account.id])
    .map((account) => ({
      label: account.shortLabel,
      value: formatCad(point.cumulative[account.id] ?? 0),
      color: accountColor(account.id),
    }));
  rows.push({ label: "This month", value: formatCad(point.flowTotal) });
  return <TooltipBox title={point.label} rows={rows} />;
}
