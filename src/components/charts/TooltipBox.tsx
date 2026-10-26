export function TooltipBox({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}) {
  return (
    <div className="bg-popover text-popover-foreground min-w-44 rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{title}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground flex items-center gap-1.5">
              {row.color ? (
                <span className="size-2 shrink-0 rounded-full" style={{ background: row.color }} />
              ) : null}
              {row.label}
            </span>
            <span className="num font-medium">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
