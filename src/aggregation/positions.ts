import type { Activity } from "../domain/activity.ts";
import { compareActivities } from "../domain/activity.ts";
import { Decimal, dec, isDust, zero } from "../domain/money.ts";

export interface OpenPosition {
  accountId: string;
  symbol: string;
  name: string;
  quantity: Decimal;
  cost: Decimal;
}

export interface AccountCash {
  accountId: string;
  cash: Decimal;
}

export interface PositionSnapshot {
  positions: OpenPosition[];
  cashByAccount: AccountCash[];
  /** Average-cost gain on sells whose dates fall in the flow window. */
  realized: Decimal;
}

interface Lot {
  accountId: string;
  symbol: string;
  name: string;
  quantity: Decimal;
  cost: Decimal;
}

function lotKey(accountId: string, symbol: string): string {
  return `${accountId}::${symbol}`;
}

function getLot(
  lots: Map<string, Lot>,
  accountId: string,
  symbol: string,
  name: string | null,
): Lot {
  const key = lotKey(accountId, symbol);
  const existing = lots.get(key);
  if (existing) {
    if (name) existing.name = name;
    return existing;
  }
  const created: Lot = { accountId, symbol, name: name ?? symbol, quantity: zero(), cost: zero() };
  lots.set(key, created);
  return created;
}

function snap(lot: Lot): void {
  if (isDust(lot.quantity)) {
    lot.quantity = zero();
    lot.cost = zero();
  }
}

function cadAmount(activity: Activity): Decimal | null {
  if (!activity.netAmount) return null;
  if (activity.currency === "CAD") return activity.netAmount;
  if (activity.currency === "USD" && activity.fxRate)
    return activity.netAmount.mul(activity.fxRate);
  return null;
}

function applyBuy(lot: Lot, quantity: Decimal, cost: Decimal, name: string | null): void {
  lot.quantity = lot.quantity.plus(quantity);
  lot.cost = lot.cost.plus(cost);
  if (name) lot.name = name;
  snap(lot);
}

function releaseCost(lot: Lot, quantity: Decimal): Decimal {
  const held = Decimal.max(lot.quantity, 0);
  const covered = Decimal.min(quantity, held);
  const average = held.gt(0) ? lot.cost.div(held) : zero();
  const removed = average.mul(covered);
  lot.quantity = lot.quantity.minus(quantity);
  lot.cost = lot.cost.minus(removed);
  snap(lot);
  return removed;
}

function applyCorporateActions(lots: Map<string, Lot>, batch: Activity[]): void {
  const negatives = batch.filter((activity) => activity.quantity?.isNeg());
  const positives = batch.filter((activity) => activity.quantity?.gt(0));
  let pool = zero();
  for (const activity of negatives) {
    const quantity = activity.quantity?.abs() ?? zero();
    const lot = getLot(lots, activity.accountId, activity.symbol ?? "", activity.name);
    pool = pool.plus(releaseCost(lot, quantity));
  }
  const incoming = positives.reduce(
    (total, activity) => total.plus(activity.quantity?.abs() ?? zero()),
    zero(),
  );
  for (const activity of positives) {
    const quantity = activity.quantity?.abs() ?? zero();
    const share = incoming.gt(0) ? pool.mul(quantity).div(incoming) : zero();
    const symbol = activity.symbol ?? "";
    applyBuy(
      getLot(lots, activity.accountId, symbol, activity.name),
      quantity,
      share,
      activity.name,
    );
  }
}

function applySwaps(lots: Map<string, Lot>, batch: Activity[]): void {
  const outs = batch.filter((activity) => activity.side === "SWAP_OUT");
  const ins = batch.filter((activity) => activity.side === "SWAP_IN");
  let released = zero();
  for (const activity of outs) {
    const quantity = activity.quantity?.abs() ?? zero();
    const lot = getLot(lots, activity.accountId, activity.symbol ?? "", activity.name);
    released = released.plus(releaseCost(lot, quantity));
  }
  const weights = ins.map(
    (activity) => activity.netAmount?.abs() ?? activity.quantity?.abs() ?? dec(1),
  );
  const weightTotal = weights.reduce((total, weight) => total.plus(weight), zero());
  ins.forEach((activity, index) => {
    const quantity = activity.quantity?.abs() ?? zero();
    const weight = weights[index] ?? zero();
    const share =
      weightTotal.gt(0) && ins.length > 0 ? released.mul(weight).div(weightTotal) : zero();
    const symbol = activity.symbol ?? "";
    applyBuy(
      getLot(lots, activity.accountId, symbol, activity.name),
      quantity,
      share,
      activity.name,
    );
  });
}

export interface SnapshotQuery {
  accountId: string | null;
  /** Include activity on or before this date. Null means the full history. */
  asOf: string | null;
  /** Realized gains count only on or after this date. Null means the full history. */
  realizedFrom: string | null;
  symbol: string | null;
}

export function snapshotPositions(activities: Activity[], query: SnapshotQuery): PositionSnapshot {
  const relevant = activities
    .filter((activity) => !query.accountId || activity.accountId === query.accountId)
    .filter((activity) => !query.asOf || activity.date <= query.asOf)
    .sort(compareActivities);

  const lots = new Map<string, Lot>();
  const consumed = new Set<string>();
  let realized = zero();

  for (const activity of relevant) {
    if (consumed.has(activity.id)) continue;

    if (activity.kind === "corporate-action") {
      const batch = relevant.filter(
        (candidate) =>
          candidate.kind === "corporate-action" &&
          candidate.accountId === activity.accountId &&
          candidate.date === activity.date,
      );
      for (const item of batch) consumed.add(item.id);
      applyCorporateActions(lots, batch);
      continue;
    }

    if (activity.kind === "crypto-swap") {
      const batch = relevant.filter(
        (candidate) =>
          candidate.kind === "crypto-swap" &&
          candidate.accountId === activity.accountId &&
          candidate.date === activity.date &&
          candidate.time === activity.time,
      );
      for (const item of batch) consumed.add(item.id);
      applySwaps(lots, batch);
      continue;
    }

    if (activity.kind !== "trade" || !activity.symbol || !activity.quantity) continue;
    const lot = getLot(lots, activity.accountId, activity.symbol, activity.name);
    const quantity = activity.quantity.abs();
    const cash = cadAmount(activity);

    if (activity.side === "BUY") {
      applyBuy(lot, quantity, cash ? cash.neg() : zero(), activity.name);
      continue;
    }

    if (activity.side === "SELL") {
      const proceeds = cash ?? zero();
      const removed = releaseCost(lot, quantity);
      const counts =
        (!query.realizedFrom || activity.date >= query.realizedFrom) &&
        (!query.symbol || activity.symbol === query.symbol);
      if (counts) realized = realized.plus(proceeds.minus(removed));
    }
  }

  const positions = [...lots.values()]
    .filter((lot) => !isDust(lot.quantity))
    .filter((lot) => !query.symbol || lot.symbol === query.symbol)
    .map((lot) => ({
      accountId: lot.accountId,
      symbol: lot.symbol,
      name: lot.name,
      quantity: lot.quantity,
      cost: lot.cost,
    }))
    .sort((a, b) => b.cost.comparedTo(a.cost) || a.symbol.localeCompare(b.symbol));

  const cashTotals = new Map<string, Decimal>();
  for (const activity of relevant) {
    if (activity.currency !== "CAD" || !activity.netAmount) continue;
    cashTotals.set(
      activity.accountId,
      (cashTotals.get(activity.accountId) ?? zero()).plus(activity.netAmount),
    );
  }
  const cashByAccount = [...cashTotals.entries()]
    .map(([accountId, cash]) => ({ accountId, cash }))
    .filter((entry) => !entry.cash.isZero())
    .sort((a, b) => b.cash.comparedTo(a.cash));

  return { positions, cashByAccount, realized };
}
