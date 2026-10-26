import { Badge } from "@/components/ui/badge";
import type { PositionView } from "@/view/types";

export function PositionsTable({ positions }: { positions: PositionView[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-heading text-lg font-medium">Estimated positions</h2>
        <Badge variant="outline">Estimate</Badge>
      </div>
      <p className="text-muted-foreground mb-3 text-sm">
        Rebuilt with average cost from buys, sells, swaps, and corporate actions through the end
        date. Quantities on a closed account can remain when the export has no in-kind transfer out.
      </p>
      {positions.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No estimated holdings in this view.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-muted-foreground border-b text-xs tracking-wide uppercase">
              <tr>
                <th className="py-2 pr-3 font-medium">Account</th>
                <th className="py-2 pr-3 font-medium">Symbol</th>
                <th className="py-2 pr-3 text-right font-medium">Qty</th>
                <th className="py-2 pr-3 text-right font-medium">Avg cost</th>
                <th className="py-2 text-right font-medium">Cost basis</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id} className="border-b border-dashed align-top last:border-0">
                  <td className="py-2.5 pr-3">{position.accountLabel}</td>
                  <td className="py-2.5 pr-3">
                    <span className="font-medium">{position.symbol}</span>
                    <span className="text-muted-foreground block text-xs">{position.name}</span>
                    {position.warning ? (
                      <span className="text-destructive mt-1 block text-xs">
                        {position.warning}
                      </span>
                    ) : null}
                  </td>
                  <td className="num py-2.5 pr-3 text-right">{position.quantity}</td>
                  <td className="num py-2.5 pr-3 text-right">{position.averageCost}</td>
                  <td className="num py-2.5 text-right">{position.costBasis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
