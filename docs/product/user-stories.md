# User stories

Identifiers are stable. v0.1 stories are the MVP. Later stories are tracked in the backlog and are not built.

## US-01 Load the synthetic sample

As a visitor, I open Carnet and see a working ledger without providing a personal file.

**Acceptance**

- The synthetic French sample loads from the app itself, and the page says it is synthetic.
- The header shows 10 Jan 2024 – 20 Jan 2025 and 25 rows.
- A file that is not the French activity export shows the missing columns and does not invent a ledger.

## US-02 See whether the cash story adds up

As Léon, I want the headline figures to be computable from the file.

**Acceptance**

- Net deposits are external EFT deposits and withdrawals, Interac transfers in, and positive RRSP `TRANSFER` rows. On the synthetic sample that is $3,970.00.
- Dividends are $20.00. Management fees paid are $8.00, refunds $3.00, net cost $5.00.
- The sample CESG grant ($50.00), interest, referral bonus, and non-resident tax are visible and are not folded into net deposits.
- Internal transfers are excluded from net deposits and still listed in cash activity.
- No card shows a market value.

## US-03 Filter the whole page

As Léon, I choose an account, a date range, and a symbol, and the page follows.

**Acceptance**

- Account and dates apply to every flow.
- A symbol filters trades, dividends, tax, and estimated positions. Deposits, fees, and cash stay at account level, and the page says so.
- Presets cover all history, year-to-date through the latest row, and the trailing 12 months.
- An inverted date range is called out instead of rendering a silent empty chart.

## US-04 Read the charts

As Léon, I see contributions, trades, dividends, fees, active symbols, and estimated allocation.

**Acceptance**

- Contributions are a cumulative stack of external money by account.
- Trades can be counted by month or by quarter, with buys and sells separated.
- Dividends and fees are yearly. Fees show refunds beside amounts paid.
- The symbol chart ranks by execution count.
- Allocation is estimated cost basis by account, with a visible Estimate label. Cash is listed beside it, not mixed into the slices.

## US-05 Drill into the rows

As Léon, I select a chart mark and land on the matching activity.

**Acceptance**

- A trade period or symbol filters the trade log and scrolls to it.
- A dividend year, fee year, or contribution month filters the same dates and opens cash activity.
- An account slice or legend filters the trade log to that account.
- The log can be searched, sorted, paged, and exported to CSV. The export is the filtered set, not only the current page, and a formula-like description is neutralized.

## US-06 Trust the positions

As Léon, I see what the trades imply I still hold.

**Acceptance**

- Positions use average cost. On the sample, PINE remains 12 units with a $300.00 cost basis. RRSP estimated cost is $200.00. The closed non-registered account has no leftover quantity.
- A same-symbol name change does not wipe cost basis. A crypto swap moves CAD cost and does not treat the USD notional as Canadian dollars.
- Book value is that cost plus CAD cash ($3,592.25 on the sample, $4,222.25 together) and is labelled as an estimate, as of the end date.
- The start date does not rewind holdings. Cash and positions use history through the end date.
- A closed account that still shows a quantity (crypto) carries a warning that the export may omit an in-kind transfer out.

## US-07 Replace the file

As Léon, I import a newer Wealthsimple export without sending it anywhere.

**Acceptance**

- The import control accepts the French CSV, including a semicolon-delimited file and comma decimals.
- Parsing happens in the browser. The file can be stored in `localStorage` and cleared by restoring the synthetic sample.
- A failed import leaves the current ledger in place and explains the problem.

## US-08 Read it at night

As Léon, I switch between light and dark.

**Acceptance**

- The choice is remembered in this browser.
- The first paint follows the saved choice or the system theme.
