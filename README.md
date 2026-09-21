# game-ecosystem-rescue

**Ecosystem Rescue** — a browser-first middle-school ecology game (NGSS MS-LS2) in which the player is a field scientist investigating a destabilized pond through evidence-based inquiry: **observe → hypothesize → predict → intervene → run → compare → revise/explain**.

| | |
| --- | --- |
| Work authority | [Jira Epic GAME-316](https://setnessconsulting.atlassian.net/browse/GAME-316) (current gate: [GAME-317 / ER-01](https://setnessconsulting.atlassian.net/browse/GAME-317)) |
| Design authority | [`docs/design/`](docs/design/README.md) — the frozen GAME-317 final-state design package |
| First biome | **Pond Crisis** — nutrient-runoff (eutrophication) disturbance |
| Architecture | Pure deterministic TypeScript simulation kernel ← React 19 semantic layer ← Phaser 4.2.1 habitat renderer ← Vite static-web build |
| Release vehicle | games-site static-web contract (`<slug>/<version>/` immutable releases) |
| Privacy | Local-first: no accounts, no trackers, no backend; versioned session-tab storage only |

## Status

**ER-01 (design freeze) in progress.** No application code yet, by design — GAME-317 is the scope/science/architecture gate that blocks implementation. Implementation begins with GAME-318 (ER-02) only after this package is merged and Jira-reconciled.

## Repository

```
docs/design/   # governing design package (start at README.md there)
```

Tooling (Node 24, TypeScript strict, Vite 8.3, React 19, Phaser 4.2.1, Vitest, Playwright, axe) is introduced by ER-02 at the exact pins frozen in [`docs/design/TECH_STACK_ADR.md`](docs/design/TECH_STACK_ADR.md) §15.
