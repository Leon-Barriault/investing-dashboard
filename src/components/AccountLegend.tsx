import { accountColor } from "@/view/palette";

export function AccountLegend({
  items,
  onSelect,
}: {
  items: Array<{ id: string; label: string }>;
  onSelect?: (accountId: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.id}>
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="bg-muted/60 hover:bg-muted inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
            >
              <span className="size-2 rounded-full" style={{ background: accountColor(item.id) }} />
              {item.label}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-1 text-xs">
              <span className="size-2 rounded-full" style={{ background: accountColor(item.id) }} />
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
