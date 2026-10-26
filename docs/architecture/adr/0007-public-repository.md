# ADR 0007 — Public repository, synthetic sample only

## Status

Accepted

## Context

Carnet is published at `https://github.com/Leon-Barriault/investing-dashboard`. A public git history is forever. A personal Wealthsimple export contains account ids, deposits, trades, and grants. ADR 0001 already keeps parsing in the browser. That is not enough if the file itself is committed.

## Decision

- The repository ships `public/data/sample-activity.csv` only. Every row is invented. Account ids start with `SAMPLE-`, and descriptions say the row is a synthetic sample.
- Tests and the README lock totals computed from that sample. They do not record figures from a personal export.
- A personal CSV is imported in the browser and stored in `localStorage` under `carnet.import.v1`, or kept in memory if storage refuses the write. It is not sent to a server.
- `.gitignore` excludes `*activities-export*.csv`, `data/private/`, and `uploads/`.
- Git history for this public remote starts at the 0.2.0 commit. Earlier private history is not part of this repository.
- `package.json` stays `"private": true` so the package is not published to npm. That flag does not make the git repository private.
- GitHub Pages, when enabled, builds the same static app. The sample is the only CSV in the artifact.

## Consequences

- The first screen is a demo, and the UI says so.
- Friendly labels and the closed-account flag are curated for the sample ids. An imported account is labelled from its French type and is not marked closed.
- Anyone cloning the repo can read the sample. They cannot read a personal export from git, from Pages, or from another person's browser.
