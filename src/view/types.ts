import type { AccountProfile } from "../domain/accounts.ts";
import type { Filters } from "../domain/filters.ts";
import type {
  ContributionPoint,
  FeeYear,
  PeriodCount,
  StackedYear,
  SymbolStat,
} from "../aggregation/flows.ts";

export interface KpiModel {
  netDeposits: string;
  dividends: string;
  feesPaid: string;
  feeRefunds: string;
  netFees: string;
  trades: string;
  tradeNote: string;
  bookValue: string;
  bookNote: string;
  cash: string;
  openPositions: number;
  realized: string;
  extras: Array<{ label: string; value: string }>;
}

export interface AllocationSlice {
  accountId: string;
  label: string;
  cost: number;
  costLabel: string;
  shareLabel: string;
}

export interface PositionView {
  id: string;
  accountId: string;
  accountLabel: string;
  symbol: string;
  name: string;
  quantity: string;
  averageCost: string;
  costBasis: string;
  costValue: number;
  warning: string | null;
  closedAccount: boolean;
}

export interface CashLine {
  accountId: string;
  label: string;
  amount: string;
  amountValue: number;
}

export interface TradeRow {
  id: string;
  date: string;
  time: string;
  settlement: string;
  accountId: string;
  accountLabel: string;
  side: string;
  symbol: string;
  name: string;
  quantity: string;
  quantityValue: number;
  price: string;
  priceRaw: string;
  priceValue: number | null;
  currency: string;
  fees: string;
  feesRaw: string;
  feesValue: number;
  net: string;
  netRaw: string;
  netValue: number | null;
  fx: string;
  description: string;
}

export interface CashRow {
  id: string;
  date: string;
  accountLabel: string;
  category: string;
  symbol: string;
  amount: string;
  amountValue: number;
  description: string;
}

export interface DashboardModel {
  kpis: KpiModel;
  contributions: ContributionPoint[];
  contributionAccounts: AccountProfile[];
  tradesByMonth: PeriodCount[];
  tradesByQuarter: PeriodCount[];
  dividends: StackedYear[];
  dividendAccounts: AccountProfile[];
  fees: FeeYear[];
  symbols: SymbolStat[];
  allocation: AllocationSlice[];
  positions: PositionView[];
  cashLines: CashLine[];
  trades: TradeRow[];
  cashRows: CashRow[];
  symbolBanner: string | null;
  asOfLabel: string;
  warnings: string[];
  filters: Filters;
}
