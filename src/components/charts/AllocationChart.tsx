import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AllocationSlice, CashLine } from "@/view/types";
import { ChartCard, EmptyChart } from "@/components/ChartCard";
import { TooltipBox } from "@/components/charts/TooltipBox";
import { usePrefersReducedMotion } from "@/components/useReducedMotion";
import { accountColor } from "@/view/palette";

export function AllocationChart({
  slices,
  cashLines,
  totalLabel,
  onAccount,
}: {
  slices: AllocationSlice[];
  cashLines: CashLine[];
  totalLabel: string;
  onAccount: (accountId: string) => void;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <ChartCard
      title="Estimated allocation"
      description="Cost basis of estimated holdings by account. This is not market value. Select a slice or a row to filter the trade log."
    >
      {slices.length === 0 ? (
        <EmptyChart>No estimated holdings in this view.</EmptyChart>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="cost"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={!reduced}
                  onClick={(slice) => {
                    const accountId = (slice as { accountId?: string }).accountId;
                    if (accountId) onAccount(accountId);
                  }}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.accountId} fill={accountColor(slice.accountId)} />
                  ))}
                </Pie>
                <Tooltip content={<AllocationTip />} wrapperStyle={{ pointerEvents: "none" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
                  Est. cost
                </p>
                <p className="font-heading num text-sm">{totalLabel}</p>
              </div>
            </div>
          </div>
          <ul className="space-y-1.5">
            {slices.map((slice) => (
              <li key={slice.accountId}>
                <button
                  type="button"
                  onClick={() => onAccount(slice.accountId)}
                  className="hover:bg-muted flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: accountColor(slice.accountId) }}
                    />
                    {slice.label}
                  </span>
                  <span className="num text-muted-foreground">
                    {slice.costLabel} · {slice.shareLabel}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {cashLines.length > 0 ? (
        <div className="mt-4 border-t pt-3">
          <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
            Cash in accounts
          </p>
          <ul className="space-y-1 text-sm">
            {cashLines.map((line) => (
              <li key={line.accountId} className="flex justify-between gap-3">
                <span>{line.label}</span>
                <span className="num">{line.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ChartCard>
  );
}

function AllocationTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: AllocationSlice }>;
}) {
  const slice = payload?.[0]?.payload;
  if (!active || !slice) return null;
  return (
    <TooltipBox
      title={slice.label}
      rows={[
        { label: "Cost basis", value: slice.costLabel, color: accountColor(slice.accountId) },
        { label: "Share", value: slice.shareLabel },
      ]}
    />
  );
}
