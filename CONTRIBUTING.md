# Contributing to Carnet

Carnet is a public repository. The only activity file that belongs in git is the synthetic sample. Do not commit a personal Wealthsimple export, and do not add analytics, hosted fonts, or any request that sends activity data off the machine.

## Branching

Trunk-based. `main` is always releasable.

- Branch from `main` with a short name: `cursor/<topic>`.
- Keep the branch to one change.
- Open a pull request back to `main`. Squash merge when the definition of done is met.
- Delete the branch after it merges.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat: filter the trade log from a chart bar
fix: keep RRSP transfer-ins in net deposits
docs: record the average-cost assumption
test: cover French comma decimals
chore: refresh the CI node version
```

A breaking parser or filter change uses `feat!` or `fix!` and a `BREAKING CHANGE:` footer, and bumps the minor or major version. Until 1.0.0, incompatible changes bump the minor version and are called out in `CHANGELOG.md`.

## Definition of done

- The change matches an acceptance criterion, or the backlog item is updated.
- Business rules live in `src/domain`, `src/parsing`, or `src/aggregation`. Components render a view model.
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.
- New parser or aggregation behaviour has a unit test. UI behaviour that can break without a test has a component test.
- Numbers shown in the interface come from the export. Estimates are labelled.
- `CHANGELOG.md` is updated for anything a person using Carnet would notice.
- No new network calls, trackers, or secrets.

## Layout

See `docs/architecture/layers.md` before adding a module.
