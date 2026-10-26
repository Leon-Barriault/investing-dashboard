import type { AccountProfile } from "./accounts.ts";
import { profileFor } from "./accounts.ts";
import type { Activity } from "./activity.ts";
import { compareActivities } from "./activity.ts";

export interface Ledger {
  activities: Activity[];
  accounts: AccountProfile[];
  warnings: string[];
  minDate: string | null;
  maxDate: string | null;
  sourceName: string;
}

export function toLedger(activities: Activity[], warnings: string[], sourceName: string): Ledger {
  const sorted = [...activities].sort(compareActivities);
  const frenchType = new Map<string, string>();
  for (const activity of sorted) {
    if (!frenchType.has(activity.accountId)) {
      frenchType.set(activity.accountId, activity.frenchAccountType);
    }
  }
  const accounts = [...frenchType.entries()]
    .map(([id, french]) => profileFor(id, french))
    .sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label));

  return {
    activities: sorted,
    accounts,
    warnings,
    minDate: sorted[0]?.date ?? null,
    maxDate: sorted.at(-1)?.date ?? null,
    sourceName,
  };
}

export function accountById(ledger: Ledger): Map<string, AccountProfile> {
  return new Map(ledger.accounts.map((account) => [account.id, account]));
}
