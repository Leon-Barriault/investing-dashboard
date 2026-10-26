import { accountOptionLabel, type AccountProfile } from "@/domain/accounts";
import { filtersActive, type DatePreset, type Filters } from "@/domain/filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FilterBar({
  accounts,
  symbols,
  filters,
  presets,
  onChange,
}: {
  accounts: AccountProfile[];
  symbols: string[];
  filters: Filters;
  presets: DatePreset[];
  onChange: (filters: Filters) => void;
}) {
  const inverted = Boolean(filters.from && filters.to && filters.from > filters.to);
  return (
    <div className="bg-background/90 sticky top-0 z-20 -mx-4 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const active = preset.from === filters.from && preset.to === filters.to;
          return (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              onClick={() => onChange({ ...filters, from: preset.from, to: preset.to })}
            >
              {preset.label}
            </Button>
          );
        })}
        {filtersActive(filters) ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange({ accountId: null, symbol: null, from: null, to: null })}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="grid gap-1.5">
          <Label htmlFor="account-filter">Account</Label>
          <Select
            value={filters.accountId ?? "all"}
            onValueChange={(value) =>
              onChange({ ...filters, accountId: value === "all" ? null : value })
            }
          >
            <SelectTrigger id="account-filter" className="w-full">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {accountOptionLabel(account)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="from-date">From</Label>
          <Input
            id="from-date"
            type="date"
            value={filters.from ?? ""}
            onChange={(event) => onChange({ ...filters, from: event.target.value || null })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="to-date">To</Label>
          <Input
            id="to-date"
            type="date"
            value={filters.to ?? ""}
            onChange={(event) => onChange({ ...filters, to: event.target.value || null })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="symbol-filter">Symbol</Label>
          <Select
            value={filters.symbol ?? "all"}
            onValueChange={(value) =>
              onChange({ ...filters, symbol: value === "all" ? null : value })
            }
          >
            <SelectTrigger id="symbol-filter" className="w-full">
              <SelectValue placeholder="All symbols" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All symbols</SelectItem>
              {symbols.map((symbol) => (
                <SelectItem key={symbol} value={symbol}>
                  {symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {inverted ? (
        <p role="alert" className="text-destructive mt-2 text-sm">
          The start date is after the end date.
        </p>
      ) : null}
    </div>
  );
}
