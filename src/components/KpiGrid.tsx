import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiModel } from "@/view/types";

export function KpiGrid({ kpis }: { kpis: KpiModel }) {
  return (
    <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Kpi
        label="Net deposits"
        value={kpis.netDeposits}
        note="External money in, minus withdrawals and plus RRSP transfers from outside Wealthsimple. Grants are separate."
      />
      <Kpi
        label="Estimated book value"
        value={kpis.bookValue}
        note={`${kpis.bookNote} Realized on sells in this view: ${kpis.realized}. ${kpis.openPositions} open estimated holdings.`}
        estimate
      />
      <Kpi
        label="Dividends"
        value={kpis.dividends}
        note="Cash dividends in the selected dates. Reinvested amounts show up again as buys."
      />
      <Kpi
        label="Fees paid"
        value={kpis.feesPaid}
        note={`Refunds ${kpis.feeRefunds}. Net cost ${kpis.netFees}. Management fees only; trade commissions sit on the trade row.`}
      />
      <Kpi
        label="Trades"
        value={kpis.trades}
        note={kpis.tradeNote || "No executions in this view."}
      />
      <Kpi
        label="Cash"
        value={kpis.cash}
        note="Uninvested CAD left in the selected accounts, through the end of the date range."
      />
    </section>
  );
}

function Kpi({
  label,
  value,
  note,
  estimate = false,
}: {
  label: string;
  value: string;
  note: string;
  estimate?: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex h-full flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
            {label}
          </p>
          {estimate ? <Badge variant="outline">Estimate</Badge> : null}
        </div>
        <p className="font-heading num text-3xl tracking-tight">{value}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">{note}</p>
      </CardContent>
    </Card>
  );
}

export function ExtraFigures({ extras }: { extras: KpiModel["extras"] }) {
  if (extras.length === 0) return null;
  return (
    <ul className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {extras.map((item) => (
        <li key={item.label}>
          {item.label} <span className="text-foreground num font-medium">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
