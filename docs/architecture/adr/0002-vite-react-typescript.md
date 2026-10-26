# ADR 0002 — Vite, React, and TypeScript

## Status

Accepted

## Context

The interface is one interactive page: filters, charts, a table. It does not need a server runtime. The language has to make illegal states obvious, because the cost of a wrong total is a person trusting it.

## Decision

- Vite, React 19, TypeScript in strict mode, including `noUncheckedIndexedAccess`.
- Tailwind and shadcn/ui for controls (button, input, select, dialog, tabs). Charts are Recharts (ADR 0006).
- Vitest and Testing Library. ESLint and Prettier. CI runs lint, typecheck, test, and build.
- Money is `decimal.js`. Chart points become numbers only at the view boundary, where the magnitudes in this file are safe.

## Consequences

- The dev server is the product. There is no separate API project to deploy.
- shadcn components are source in `src/components/ui` and can be edited.
- `baseUrl` is deprecated in TypeScript 6. It stays, with `ignoreDeprecations`, because the shadcn alias setup expects it.
