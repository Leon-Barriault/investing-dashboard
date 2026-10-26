# ADR 0001 — The ledger stays in the browser

## Status

Accepted

## Context

The CSV is a complete activity history: account ids, deposits, trades, and grants. Carnet is for one person. A convenient chart library or font host would put that page on someone else's network.

## Decision

- Parse and aggregate on the client.
- The only network request is the synthetic sample CSV from the same origin, and only when no imported file is stored.
- An imported file is kept in `localStorage` under `carnet.import.v1`, or only in memory if storage refuses the write.
- Fonts are packaged (`@fontsource`), not loaded from a CDN.
- No analytics script, error reporter, or quote API.
- `package.json` is `"private": true` so npm will not publish the package. The git repository is public. What it may contain is decided in ADR 0007.
- CSV export prefixes formula-like text cells so a description cannot become a spreadsheet formula.

## Consequences

- There is no multi-device sync. That is a feature.
- Market prices cannot be fetched. See ADR 0004.
- A public host may serve the synthetic sample. It must not serve a personal export. See ADR 0007.
