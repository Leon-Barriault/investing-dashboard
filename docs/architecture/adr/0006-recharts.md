# ADR 0006 — Recharts for the charts

## Status

Accepted

## Context

The page needs stacked areas, grouped bars, and a donut, with a click that becomes a filter. The series are small: under a hundred points.

## Decision

- Recharts, drawn from the view model.
- Colours for the eight known accounts are fixed in `view/palette.ts` so a slice does not change colour between visits.
- Animation follows `prefers-reduced-motion`.
- The filter bar is the keyboard path for the same choices a chart click makes. Chart marks are not the only way to apply a filter.

## Consequences

- The production bundle is one large chunk because Recharts is eager. That is acceptable for this single page. Splitting it is not worth a second request until the page grows.
- A different chart library would be a new ADR, not a drive-by replacement inside a component.
