# Changelog

All notable changes to Carnet are documented here. The format follows Keep a Changelog, and versions follow Semantic Versioning.

## [0.2.0] - 2026-10-26

First public release. The git history of this repository starts here and contains no personal activity export.

### Added

- Single-page ledger for a French Wealthsimple activity CSV: filters, charts, estimated positions, and a searchable trade log.
- A clearly labelled synthetic sample (`public/data/sample-activity.csv`) so the demo and the tests run without anyone's real file.
- Browser import. A personal export stays in `localStorage` on that device.
- Light and dark themes.
- Product notes, architecture notes and ADRs, Vitest coverage, and GitHub Actions for CI and GitHub Pages.

### Changed

- The app no longer ships a personal export. Opening it shows the synthetic sample until a file is imported.
- Tests lock the totals computed from that sample: net deposits $3,970.00, dividends $20.00, fees paid $8.00, fee refunds $3.00, cash $3,592.25, estimated book value $4,222.25, 25 rows, 10 trades.
