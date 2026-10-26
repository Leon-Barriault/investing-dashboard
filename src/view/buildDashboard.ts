import {
  dividendsByYear,
  feesByYear,
  contributionSeries,
  inFlow,
  isTradeRow,
  mostTradedSymbols,
  sumKind,
  tradesByMonth,
  tradesByQuarter,
} from "../aggregation/flows.ts";
import { snapshotPositions } from "../aggregation/positions.ts";
import { KIND_LABEL, sideLabel } from "../domain/activity.ts";
import type { Activity } from "../domain/activity.ts";
import { accountById } from "../domain/ledger.ts";
import type { Ledger } from "../domain/ledger.ts";
import { formatDay } from "../domain/dates.ts";
import type { Filters } from "../domain/filters.ts";
import { sumDec, zero } from "../domain/money.ts";
import { formatCad, formatCount, formatPercent, formatPrice, formatQty } from "./format.ts";
import type { CashRow, DashboardModel, PositionView, TradeRow } from "./types.ts";

function profilesFor(ledger: Ledger, ids: Iterable<string>) {
  const accounts = accountById(ledger);
  return [...ids]
    .map((id) => accounts.get(id))
    .filter((account) => account !== undefined)
    .sort((a, b) => a.rank - b.rank);
}

function tradeRow(activity: Activity, accountLabel: string): TradeRow {
  const quantity = activity.quantity?.abs() ?? zero();
  const fees = activity.commission?.abs() ?? zero();
  return {
    id: activity.id,
    date: activity.date,
    time: activity.time,
    settlement: activity.settlementDate ?? "",
    accountId: activity.accountId,
    accountLabel,
    side: activity.side ? sideLabel(activity.side) : "",
    symbol: activity.symbol ?? "",
    name: activity.name ?? "",
    quantity: formatQty(quantity),
    quantityValue: quantity.toNumber(),
    price: formatPrice(activity.price),
    priceRaw: activity.price ? activity.price.toString() : "",
    priceValue: activity.price ? activity.price.toNumber() : null,
    currency: activity.currency ?? "",
    fees: activity.commission ? formatCad(fees) : "—",
    feesRaw: activity.commission ? fees.toString() : "",
    feesValue: fees.toNumber(),
    net: activity.netAmount ? formatCad(activity.netAmount) : "—",
    netRaw: activity.netAmount ? activity.netAmount.toString() : "",
    netValue: activity.netAmount ? activity.netAmount.toNumber() : null,
    fx: activity.fxRate ? activity.fxRate.toString() : "",
    description: activity.description,
  };
}

function cashRow(activity: Activity, accountLabel: string): CashRow {
  return {
    id: activity.id,
    date: activity.date,
    accountLabel,
    category: KIND_LABEL[activity.kind],
    symbol: activity.symbol ?? "",
    amount: activity.netAmount ? formatCad(activity.netAmount) : "—",
    amountValue: activity.netAmount ? activity.netAmount.toNumber() : 0,
    description: activity.description,
  };
}

export function buildDashboard(ledger: Ledger, filters: Filters): DashboardModel {
  const accounts = accountById(ledger);
  const labelOf = (accountId: string) => accounts.get(accountId)?.label ?? accountId;
  const asOf = filters.to ?? ledger.maxDate;
  const snapshot = snapshotPositions(ledger.activities, {
    accountId: filters.accountId,
    asOf,
    realizedFrom: filters.from,
    symbol: filters.symbol,
  });

  const contributions = contributionSeries(ledger.activities, filters);
  const contributionIds = new Set<string>();
  for (const point of contributions) {
    for (const id of Object.keys(point.cumulative)) contributionIds.add(id);
  }

  const dividends = dividendsByYear(ledger.activities, filters);
  const dividendIds = new Set<string>();
  for (const year of dividends) {
    for (const id of Object.keys(year.byAccount)) dividendIds.add(id);
  }

  let buys = 0;
  let sells = 0;
  let swaps = 0;
  const trades: TradeRow[] = [];
  const cashRows: CashRow[] = [];
  for (const activity of ledger.activities) {
    if (!inFlow(activity, filters)) continue;
    if (isTradeRow(activity)) {
      if (filters.symbol && activity.symbol !== filters.symbol) continue;
      if (activity.side === "BUY") buys += 1;
      else if (activity.side === "SELL") sells += 1;
      else swaps += 1;
      trades.push(tradeRow(activity, labelOf(activity.accountId)));
      continue;
    }
    if (filters.symbol && activity.symbol !== filters.symbol) continue;
    cashRows.push(cashRow(activity, labelOf(activity.accountId)));
  }
  trades.reverse();
  cashRows.reverse();

  const netDeposits = sumDec([
    sumKind(ledger.activities, filters, "deposit", false),
    sumKind(ledger.activities, filters, "withdrawal", false),
    sumKind(ledger.activities, filters, "external-transfer-in", false),
  ]);
  const dividendsTotal = sumKind(ledger.activities, filters, "dividend", true);
  const feesSigned = sumKind(ledger.activities, filters, "fee", false);
  const refundsSigned = sumKind(ledger.activities, filters, "fee-refund", false);
  const feesPaid = feesSigned.abs();
  const feeRefunds = refundsSigned.abs();
  const grants = sumKind(ledger.activities, filters, "grant", false);
  const interest = sumKind(ledger.activities, filters, "interest", false);
  const bonus = sumKind(ledger.activities, filters, "bonus", false);
  const tax = sumKind(ledger.activities, filters, "tax", false);

  const positionCost = sumDec(snapshot.positions.map((position) => position.cost));
  const cash = sumDec(snapshot.cashByAccount.map((entry) => entry.cash));
  const book = filters.symbol ? positionCost : positionCost.plus(cash);

  const positions: PositionView[] = snapshot.positions.map((position) => {
    const account = accounts.get(position.accountId);
    const average = position.quantity.gt(0) ? position.cost.div(position.quantity) : null;
    const closedAccount = account?.closed ?? false;
    return {
      id: `${position.accountId}-${position.symbol}`,
      accountId: position.accountId,
      accountLabel: account?.label ?? position.accountId,
      symbol: position.symbol,
      name: position.name,
      quantity: formatQty(position.quantity),
      averageCost: average ? formatCad(average) : "—",
      costBasis: formatCad(position.cost),
      costValue: position.cost.toNumber(),
      closedAccount,
      warning: closedAccount
        ? "Estimated quantity is still on the books after this account was closed. The export may omit an in-kind transfer out."
        : null,
    };
  });

  const allocationBase = positions.filter((position) => position.costValue > 0);
  const allocationByAccount = new Map<string, number>();
  for (const position of allocationBase) {
    allocationByAccount.set(
      position.accountId,
      (allocationByAccount.get(position.accountId) ?? 0) + position.costValue,
    );
  }
  const allocationTotal = [...allocationByAccount.values()].reduce(
    (total, value) => total + value,
    0,
  );
  const allocation = [...allocationByAccount.entries()]
    .map(([accountId, cost]) => ({
      accountId,
      label: labelOf(accountId),
      cost,
      costLabel: formatCad(cost),
      shareLabel: allocationTotal > 0 ? formatPercent(cost / allocationTotal) : "0%",
    }))
    .sort((a, b) => b.cost - a.cost);

  const extras = [
    { label: "CESG grants", value: grants, show: !grants.isZero() },
    { label: "Interest", value: interest, show: !interest.isZero() },
    { label: "Referral bonuses", value: bonus, show: !bonus.isZero() },
    { label: "Non-resident tax", value: tax, show: !tax.isZero() },
  ]
    .filter((item) => item.show)
    .map((item) => ({ label: item.label, value: formatCad(item.value) }));

  const tradeNote = [
    `${formatCount(buys)} buys`,
    `${formatCount(sells)} sells`,
    swaps > 0 ? `${formatCount(swaps)} swaps` : null,
  ]
    .filter((part) => part !== null)
    .join(" · ");

  const asOfLabel = asOf ? formatDay(asOf) : "the latest row";
  const bookNote = filters.symbol
    ? `Estimated average cost of ${filters.symbol} only. Cash is left out while a symbol is selected.`
    : `Estimated average cost plus cash as of ${asOfLabel}. Not a market value.`;

  return {
    kpis: {
      netDeposits: formatCad(netDeposits),
      dividends: formatCad(dividendsTotal),
      feesPaid: formatCad(feesPaid),
      feeRefunds: formatCad(feeRefunds),
      netFees: formatCad(feesPaid.minus(feeRefunds)),
      trades: formatCount(buys + sells + swaps),
      tradeNote,
      bookValue: formatCad(book),
      bookNote,
      cash: formatCad(cash),
      openPositions: positions.length,
      realized: formatCad(snapshot.realized),
      extras,
    },
    contributions,
    contributionAccounts: profilesFor(ledger, contributionIds),
    tradesByMonth: tradesByMonth(ledger.activities, filters),
    tradesByQuarter: tradesByQuarter(ledger.activities, filters),
    dividends,
    dividendAccounts: profilesFor(ledger, dividendIds),
    fees: feesByYear(ledger.activities, filters),
    symbols: mostTradedSymbols(ledger.activities, filters),
    allocation,
    positions,
    cashLines: snapshot.cashByAccount.map((entry) => ({
      accountId: entry.accountId,
      label: labelOf(entry.accountId),
      amount: formatCad(entry.cash),
      amountValue: entry.cash.toNumber(),
    })),
    trades,
    cashRows,
    symbolBanner: filters.symbol
      ? `${filters.symbol} filters trades, dividends, tax, and estimated positions. Deposits, fees, and cash stay at the account level.`
      : null,
    asOfLabel,
    warnings: ledger.warnings,
    filters,
  };
}
