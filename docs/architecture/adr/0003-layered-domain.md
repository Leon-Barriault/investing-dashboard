# ADR 0003 — Domain and aggregation stay out of the components

## Status

Accepted

## Context

The rules that move a number (what counts as a deposit, how a sell changes average cost) are the part most likely to be wrong, and the part a chart should not reimplement.

## Decision

- Activities are classified once, in `domain/classify.ts`.
- Aggregations are pure functions over `Activity[]`.
- `buildDashboard` produces the view model the page renders.
- React components receive that model. They may sort, search, and page a list they were given. They may not sum money.
- `App.tsx` is the composition root: it owns the loaded ledger and the filters, and it is the only component that calls `buildDashboard`.

## Consequences

- A visual change does not require a fixture of the full CSV.
- The full CSV is still tested, once, in `buildDashboard.test.ts`, so the headline totals cannot drift.
- Adding a chart means adding a series to the view model, then a component that plots it.
