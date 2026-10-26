# Carnet

A browser ledger for a French Wealthsimple activity export. It shows contributions, trades, dividends, fees, and estimated holdings.

The file in this repository is a **synthetic sample**. Account ids start with `SAMPLE-`, and every description says the row is invented. It has **25** rows from **10 January 2024** to **20 January 2025**. Net deposits computed from that sample are **$3,970.00**. Positions are an estimated average cost. The sample has no market prices, so Carnet does not display a portfolio market value.

Open the app and you see that sample, with a banner that says so. Import your own Wealthsimple CSV to replace it. Parsing stays in the browser, and the file is kept in `localStorage` on that device only. Do not commit a real export. `.gitignore` excludes `*activities-export*.csv`, `data/private/`, and `uploads/`.

There are no analytics or third-party trackers.

## Run it locally

Requires Node 22.

```bash
npm install
npm run dev
```

The dev server listens on port **4179**. A production build is `npm run build` and `npm run preview`.

```bash
npm test
npm run lint
npm run typecheck
```

GitHub Actions runs the same checks. The Pages workflow publishes the static build, with the synthetic sample as the only CSV, at `https://leon-barriault.github.io/investing-dashboard/`.

## What you can do

- Filter by account, date, and symbol. Presets cover all history, year to date, and 12 months.
- Click a chart to filter the trade log or the cash activity under it.
- Search, sort, page, and export the trade log.
- Import a Wealthsimple activity CSV. Use **Use synthetic sample** to drop the imported file.
- Switch light and dark. The choice is stored on this device only.

## How the sample numbers work

These figures are computed from `public/data/sample-activity.csv`. They are not a personal balance.

| Figure         | Sample result                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Net deposits   | $3,970.00. External EFT deposits and withdrawals, Interac in, and the positive RRSP `TRANSFER`. Internal transfers are excluded. |
| Dividends      | $20.00 of cash dividends.                                                                                                        |
| Fees           | $8.00 paid, $3.00 refunded, $5.00 net.                                                                                           |
| Cash           | $3,592.25 uninvested CAD across the sample accounts.                                                                             |
| Estimated book | $4,222.25. Average cost of open holdings plus that cash. Labelled as an estimate.                                                |

Detail lives in `docs/architecture/adr/0004-position-estimates.md`, `docs/architecture/adr/0005-net-deposit-rules.md`, and `docs/architecture/adr/0007-public-repository.md`.

## Project map

```text
docs/product        vision, personas, stories, backlog
docs/architecture   C4 overview, layers, ADRs
src/domain          activity model, accounts, classification
src/parsing         French Wealthsimple CSV
src/aggregation     flows and position replay
src/view            dashboard view model
src/components      UI, including shadcn primitives
public/data         synthetic sample-activity.csv
```

Product and engineering process: `CONTRIBUTING.md`. Version history: `CHANGELOG.md`. Current version: **0.2.0**.
