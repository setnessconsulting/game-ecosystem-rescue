# game-ecosystem-rescue

**Ecosystem Rescue** — a browser-first middle-school ecology game (NGSS MS-LS2) in which the player is a field scientist investigating a destabilized pond through evidence-based inquiry: **observe → hypothesize → predict → intervene → run → compare → revise/explain**.

| | |
| --- | --- |
| Work authority | [Jira Epic GAME-316](https://setnessconsulting.atlassian.net/browse/GAME-316) (gates: [GAME-317 / ER-01](https://setnessconsulting.atlassian.net/browse/GAME-317), [GAME-318 / ER-02](https://setnessconsulting.atlassian.net/browse/GAME-318)) |
| Design authority | [`docs/design/`](docs/design/README.md) — the frozen GAME-317 final-state design package |
| First biome | **Pond Crisis** — nutrient-runoff (eutrophication) disturbance |
| Architecture | Pure deterministic TypeScript simulation kernel ← React 19 semantic layer ← Phaser 4.2.1 habitat renderer ← Vite static-web build |
| Release vehicle | games-site static-web contract (`<slug>/<version>/` immutable releases) |
| Privacy | Local-first: no accounts, no trackers, no backend; versioned session-tab storage only |

## Status (honest)

| Layer | State |
| --- | --- |
| Design package (ER-01 / GAME-317) | Rule **structure frozen**; **parameter values provisional**. The evidence harness `docs/design/evidence/calibration-sim.mjs` does not pass — see `docs/design/SCIENCE_MODEL.md` §9.1, findings F-8/F-9. |
| App foundation (ER-02 / GAME-318) | In place: pinned stack, kernel boundary gate, CI, subpath build, walking skeleton. |
| Science kernel (ER-03) | Started: the producer / cycling / oxygen core, with the MS-LS2-3 matter-loop identity machine-checked on every run. |

The mission's hypoxia beat is **not demonstrable** at the current parameter set, which is why the
consumer rules are not in the build yet: a species the rules cannot keep alive must not be put in
front of a learner. The fix is a rules decision recorded in `SCIENCE_MODEL.md` §9.1 (F-9), not a
tuning change.

## Commands

Requires Node 24 and npm. Versions are pinned exactly; the lockfile is committed.

```
npm ci          # clean install from the lockfile (what CI runs)
npm run dev     # dev server at http://localhost:5173
npm run build   # production build into dist/
npm run preview # serve the production build
npm run verify  # the full gate: typecheck, lint, tests, boundary, no-random, subpath build, build
```

`npm run verify` is the same command CI runs, and it is the one that must be green before any change
is proposed for release.

### What the specialised gates check

- **`verify:boundary`** — nothing under `src/sim/` may touch the DOM, React, Phaser, storage, the
  network, or a clock ([`TECHNICAL_DESIGN.md`](docs/design/TECHNICAL_DESIGN.md) §D-2). The kernel has
  to stay replayable: a trace must be reproducible from a scenario, a seed and a list of actions.
- **`verify:no-random`** — no `Math.random()` anywhere in `src/` ([`SCIENCE_MODEL.md`](docs/design/SCIENCE_MODEL.md) R-50).
  Stochasticity is only ever the kernel's seeded PRNG.
- **`verify:build-base`** — the built app must load from a versioned subpath, not the domain root,
  per the games-site release contract.

## Layout

```
docs/design/        the governing package + the evidence harness (start at its README)
src/sim/            the simulation kernel — no DOM, no React, integers only
  fixed.ts          fixed-point arithmetic (R-51)
  params.ts         the parameter set; the only place those numbers live
  kernel.ts         the rules and the frozen per-tick order (§6.5)
  types.ts          state, actions, flow ledger
src/                the app shell (React) and its presentation helpers
scripts/            the boundary / no-random / subpath verification gates
tests/              kernel contract tests: determinism, matter loop, rule directions
```

## Ground rules for contributors

1. The design package is normative. If code and document disagree, the document wins until a
   Jira-recorded decision changes it.
2. Nothing is computed twice: the UI renders kernel state and never re-derives ecology.
3. Every parameter lives in `src/sim/params.ts` and is traceable to `SCIENCE_MODEL.md` §9. Changing a
   value outside its declared range is a model-version event, not a tuning commit.
4. `npm run verify` green on a clean clone before review.
