import { useMemo, useState } from "react";
import { periodBounds, formatDay } from "@/domain/dates";
import { buildDatePresets, EMPTY_FILTERS, type Filters } from "@/domain/filters";
import { listSymbols } from "@/aggregation/flows";
import { buildDashboard } from "@/view/buildDashboard";
import { formatCad } from "@/view/format";
import { ThemeProvider } from "@/app/theme";
import { useLedger } from "@/app/useLedger";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { ContributionChart } from "@/components/charts/ContributionChart";
import { DividendChart } from "@/components/charts/DividendChart";
import { FeesChart } from "@/components/charts/FeesChart";
import { SymbolsChart } from "@/components/charts/SymbolsChart";
import { TradesChart } from "@/components/charts/TradesChart";
import { CashTable } from "@/components/CashTable";
import { ExtraFigures, KpiGrid } from "@/components/KpiGrid";
import { FilterBar } from "@/components/FilterBar";
import { Header } from "@/components/Header";
import { ImportDialog } from "@/components/ImportDialog";
import { PositionsTable } from "@/components/PositionsTable";
import { TradeLog } from "@/components/TradeLog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Dashboard />
      </TooltipProvider>
    </ThemeProvider>
  );
}

function Dashboard() {
  const { state, importCsv, restoreBundled } = useLedger();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [tab, setTab] = useState("trades");
  const [note, setNote] = useState<string | null>(null);

  const model = useMemo(() => {
    if (state.status !== "ready") return null;
    return buildDashboard(state.ledger, filters);
  }, [state, filters]);

  if (state.status !== "ready" || !model) {
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-24">
        <p className="text-primary text-xs tracking-[0.18em] uppercase">Wealthsimple ledger</p>
        <h1 className="font-heading text-4xl italic">Carnet</h1>
        <p className="text-muted-foreground" role={state.status === "error" ? "alert" : "status"}>
          {state.status === "error" ? state.message : "Reading the Wealthsimple export…"}
        </p>
        {state.status === "error" ? <ImportDialog onImport={importCsv} /> : null}
      </main>
    );
  }

  const { ledger } = state;
  const symbols = listSymbols(ledger.activities, filters.accountId);
  const presets = ledger.maxDate ? buildDatePresets(ledger.maxDate) : [];
  const resultKey = `${filters.accountId ?? ""}|${filters.symbol ?? ""}|${filters.from ?? ""}|${filters.to ?? ""}`;
  const allocationTotal = model.allocation.reduce((total, slice) => total + slice.cost, 0);

  function commit(next: Filters) {
    const allowed = new Set(listSymbols(ledger.activities, next.accountId));
    setFilters({ ...next, symbol: next.symbol && allowed.has(next.symbol) ? next.symbol : null });
    setNote(null);
  }

  function drillPeriod(key: string, nextTab: "trades" | "cash") {
    const bounds = periodBounds(key);
    setFilters((current) => ({ ...current, from: bounds.from, to: bounds.to }));
    setTab(nextTab);
    setNote(`Showing ${formatDay(bounds.from)} to ${formatDay(bounds.to)}.`);
    scrollTo("activity");
  }

  function drillAccount(accountId: string) {
    const account = ledger.accounts.find((item) => item.id === accountId);
    setFilters((current) => {
      const allowed = new Set(listSymbols(ledger.activities, accountId));
      return {
        ...current,
        accountId,
        symbol: current.symbol && allowed.has(current.symbol) ? current.symbol : null,
      };
    });
    setTab("trades");
    setNote(account ? `Showing ${account.label} in the activity log.` : null);
    scrollTo("activity");
  }

  function drillSymbol(symbol: string) {
    setFilters((current) => ({ ...current, symbol }));
    setTab("trades");
    setNote(`Showing ${symbol}.`);
    scrollTo("activity");
  }

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="bg-primary h-1" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <Header
          minDate={ledger.minDate}
          maxDate={ledger.maxDate}
          rows={ledger.activities.length}
          fileName={state.fileName}
          origin={state.origin}
          persisted={state.persisted}
          onImport={(text, name) => {
            const error = importCsv(text, name);
            if (!error) {
              setFilters(EMPTY_FILTERS);
              setNote(null);
            }
            return error;
          }}
          onRestore={() => {
            void restoreBundled();
            setFilters(EMPTY_FILTERS);
            setNote(null);
          }}
        />
        {state.origin === "sample" ? (
          <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm" role="status">
            Synthetic sample. The accounts and trades are invented so this public app can run
            without a personal export. Import a Wealthsimple CSV to replace it. The file stays in
            this browser.
          </p>
        ) : null}
        {ledger.warnings.length > 0 ? (
          <div
            role="status"
            className="border-destructive/40 bg-destructive/10 rounded-lg border px-3 py-2 text-sm"
          >
            {ledger.warnings.join(" ")}
          </div>
        ) : null}
        <FilterBar
          accounts={ledger.accounts}
          symbols={symbols}
          filters={filters}
          presets={presets}
          onChange={commit}
        />
        <main id="content" className="flex flex-col gap-6">
          {model.symbolBanner ? (
            <p className="text-muted-foreground text-sm" role="status">
              {model.symbolBanner}
            </p>
          ) : null}
          {note ? (
            <p className="text-sm" role="status">
              {note}
            </p>
          ) : null}
          <KpiGrid kpis={model.kpis} />
          <ExtraFigures extras={model.kpis.extras} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ContributionChart
              points={model.contributions}
              accounts={model.contributionAccounts}
              onMonth={(month) => drillPeriod(month, "cash")}
              onAccount={drillAccount}
            />
            <TradesChart
              byMonth={model.tradesByMonth}
              byQuarter={model.tradesByQuarter}
              onPeriod={(key) => drillPeriod(key, "trades")}
            />
            <DividendChart
              years={model.dividends}
              accounts={model.dividendAccounts}
              onYear={(year) => drillPeriod(year, "cash")}
              onAccount={drillAccount}
            />
            <FeesChart years={model.fees} onYear={(year) => drillPeriod(year, "cash")} />
            <SymbolsChart symbols={model.symbols} onSymbol={drillSymbol} />
            <AllocationChart
              slices={model.allocation}
              cashLines={model.cashLines}
              totalLabel={formatCad(allocationTotal)}
              onAccount={drillAccount}
            />
          </div>
          <Card id="positions">
            <CardContent>
              <PositionsTable positions={model.positions} />
            </CardContent>
          </Card>
          <Card id="activity">
            <CardContent>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="trades">Trades</TabsTrigger>
                  <TabsTrigger value="cash">Cash and income</TabsTrigger>
                </TabsList>
                <TabsContent value="trades" className="pt-4">
                  <TradeLog rows={model.trades} resultKey={resultKey} />
                </TabsContent>
                <TabsContent value="cash" className="pt-4">
                  <CashTable rows={model.cashRows} resultKey={resultKey} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <details className="text-muted-foreground text-sm">
            <summary className="text-foreground cursor-pointer font-medium">
              How these numbers are calculated
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Net deposits are external EFT deposits and withdrawals, Interac transfers in, and
                positive RRSP <span className="font-medium">TRANSFER</span> rows. Wealthsimple uses
                the same wording for internal cash moves, so other transfers stay out of the total.
              </li>
              <li>
                Positions are an estimated average cost, close to a simplified Canadian ACB. Buy
                commissions are included because they are already in the cash amount. Return of
                capital and superficial-loss rules are not applied.
              </li>
              <li>
                The activity export has no market prices, so Carnet does not show a current
                portfolio value. Book value is cost basis plus cash.
              </li>
              <li>
                The date range filters flows. Holdings and cash are as of the end date, using
                history up to that day.
              </li>
              <li>
                Import replaces the synthetic sample in this browser. The file stays in local
                storage on this device. Nothing is uploaded.
              </li>
            </ul>
          </details>
          <footer className="text-muted-foreground pb-8 text-xs">
            Carnet {APP_VERSION}. Parsed on this device. No third-party trackers.
          </footer>
        </main>
      </div>
    </>
  );
}

const APP_VERSION = "0.2.0";
