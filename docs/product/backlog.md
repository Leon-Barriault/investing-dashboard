# Backlog

Priority is top to bottom inside each band. v0.2.0 is the public slice. Nothing below it is in the build.

## MVP (v0.2.0) — done

| ID    | Story                         | Notes                                                       |
| ----- | ----------------------------- | ----------------------------------------------------------- |
| US-01 | Load the synthetic sample     | 25 rows, 2024-01-10 to 2025-01-20                           |
| US-02 | Cash KPIs                     | Sample net deposits $3,970.00                               |
| US-03 | Account, date, symbol filters | Symbol does not rewrite deposits                            |
| US-04 | Six chart views               | Contributions, trades, dividends, fees, symbols, allocation |
| US-05 | Drill-down and trade log      | Search, sort, page, CSV                                     |
| US-06 | Estimated positions           | Average cost, labelled                                      |
| US-07 | Browser import                | French export only                                          |
| US-08 | Light and dark                | Stored locally                                              |

## Next

1. **Local price file.** A CSV Léon drops beside the export (`symbol, price, currency, as of`) so allocation can show a market value he typed himself. Still no quote API. This is the only honest way to approach the balance he sees in Wealthsimple.
2. **Transfer review.** A queue of `TRANSFER` rows that the RRSP rule did not treat as external, so a future institutional transfer into a TFSA is not missed. Let him mark a row as external once.
3. **Adjusted cost base gaps.** Return of capital, reinvested distributions that are not already trades, and the superficial-loss rule. The current average cost is a simplified ACB and should stay labelled that way until these exist.
4. **French interface.** The export is French. A language toggle, with the same numbers.
5. **Statement check.** Side-by-side of a month's cash total against a figure he types in from a Wealthsimple statement, so he can see the delta instead of trusting the parser blindly.
6. **Saved views.** Named filter sets in `localStorage` (one account, one year, one symbol).

## Later

- Realized-gain report grouped by account and year, still estimated.
- Split buys that are DRIPs from discretionary buys.
- Keyboard-first chart alternative that is visible, not only the filter bar.
- A second household member's export kept in a separate browser profile, not a multi-user server.

## Out of scope

- Live quotes, brokerage connections, or anything that phones home.
- Tax filing output. The estimates are not a T-slip.
- Committing a personal activity export. The public repository and GitHub Pages ship the synthetic sample only.
