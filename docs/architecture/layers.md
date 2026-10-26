# Layers

Dependencies point inward. A layer may import the ones below it and nothing above.

```text
src/components, src/App.tsx, src/app
        │
        ▼
src/view, src/export
        │
        ▼
src/aggregation, src/parsing
        │
        ▼
src/domain
```

## Domain

Plain values. `Activity` is the fact from one CSV row after classification. `Decimal` is the money type. Dates are `YYYY-MM-DD` strings so a timezone cannot move a trade to the previous day.

Account labels for the six synthetic sample ids live in `accounts.ts`. An unknown id, including every account in a personal import, is labelled from the French account type instead of being dropped.

## Parsing

`parseWealthsimpleCsv` is the only reader of the French columns. It checks the header, skips a bad row, and records why. Classification rules are in `domain/classify.ts` so a test can pin them without a file.

## Aggregation

Pure functions from activities to numbers.

- Flows respect the date range and account.
- Symbol scope is explicit: trades, dividends, and tax follow the symbol. Deposits, fees, and cash do not.
- `snapshotPositions` replays history through the end date. The start date limits realized gains, not the running quantity.

## View

`buildDashboard` is the seam. It turns decimals into display strings and chart numbers. Components do not add costs, and they do not decide whether a transfer is external.

## UI

Components hold view state only: sort column, page, search box, month-or-quarter, dialog open, theme. Filter changes and drill-down calls go back to `App.tsx`.

## What does not belong

- A `fetch` of quotes, fonts, or telemetry.
- A position quantity typed by hand into a component.
- A second parser for the cleaned English trade log. That file was a reference while the French parser was checked. The app reads the French export.
