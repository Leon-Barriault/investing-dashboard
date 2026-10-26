# Architecture overview

C4-style, kept to the two levels this system actually has. There is one deployable and no backing service.

## Level 1 — Context

```text
Léon
  │  downloads a French activity CSV from Wealthsimple
  │  opens Carnet in a browser
  ▼
Carnet (this repository)
  │  reads the synthetic sample, or a file he drops
  │  draws flows, estimates, and the trade log
  ▼
His browser only

Wealthsimple is the source of the file. Carnet never calls it.
No analytics vendor, font host, or quote service is in the path.
```

## Level 2 — Container

One container: a static Vite app.

| Container   | Responsibility                       | Talks to                                                                                |
| ----------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| Browser app | Parse, aggregate, render, export CSV | Its own origin, for the synthetic sample. `localStorage` for theme and an imported CSV. |

There is no API server, database, or worker. `npm run dev` and `npm run build` produce that same app.

## Level 3 — Components inside the app

```text
UI components  →  view model  →  aggregation  →  domain
                      ↑
                   parsing  →  domain
```

| Module            | Role                                                        |
| ----------------- | ----------------------------------------------------------- |
| `src/domain`      | Accounts, activity kinds, money, dates, filters, the ledger |
| `src/parsing`     | French Wealthsimple CSV to activities                       |
| `src/aggregation` | Flows, counts, and the position snapshot                    |
| `src/view`        | Formats a ledger and filters into strings and chart rows    |
| `src/export`      | Trade-log CSV                                               |
| `src/components`  | Renders the view model and reports clicks                   |
| `src/app`         | Composition: load the file, theme, storage                  |
| `src/App.tsx`     | The only component that calls `buildDashboard`              |

`src/components` does not import the parser or the aggregations. `App.tsx` is the composition root and is allowed to.

## Runtime

1. On load, read an imported CSV from `localStorage` if the last import parsed. Otherwise `GET` `sample-activity.csv` from the same origin.
2. `parseWealthsimpleCsv` returns activities or a fatal error.
3. `toLedger` attaches account profiles.
4. `buildDashboard(ledger, filters)` returns the page model.
5. A chart click replaces part of `filters` and scrolls to `#activity`.

## Trust boundary

The CSV is untrusted text. It is parsed as data, rendered as text, and exported with formula characters prefixed. It is not evaluated. See ADR 0001.
