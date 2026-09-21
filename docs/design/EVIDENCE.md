# EVIDENCE.md — measured/observed provenance for ER-01 decisions

Collected 2026-09-21 from the local clones of the sibling repositories (latest `main`) and the games-site release contract. Purpose: back D-10, D-12, D-13, D-14, D-24 with observations rather than memory. These repos are read-only references for this decision file; their content is not copied into Ecosystem Rescue.

## 1. Sibling dependency pins (from package.json)

| Dependency | game-math-detective | game-bridge-builder | game-number-line-jumper |
| --- | --- | --- | --- |
| engines.node | 24.x | 24.x | 24.x |
| react / react-dom | 19.2.3 | 19.2.3 | 19.2.3 |
| phaser | 4.2.1 | 4.2.1 | — (no Phaser needed) |
| vite (dev) | 8.3.0 | ^8.3.0 | 8.3.0 |
| typescript (dev) | 5.9.3 | ^5.9.3 | 5.9.3 |
| vitest (dev) | 4.1.11 | ^4.1.11 | 4.1.11 |
| @playwright/test (dev) | 1.63.0 | — | 1.62.1 |
| @axe-core/playwright (dev) | 4.13.0 | — | — |
| ESLint line | 9.39.x | 9.x | 9.x |

Observation: Math Detective is the most complete template (Phaser + React + axe + Playwright). ER-02 baseline (DECISIONS D-12) = Math Detective's exact pin set.

## 2. Sibling release payload (game-math-detective/dist, built 2026-09-21 from current main)

| File | Raw | gzip -c |
| --- | --- | --- |
| assets/phaser.esm-*.js | 1,375,290 B | 354,625 B (~346 KB) |
| assets/index-*.js (app+React) | 287,130 B | 88,305 B (~86 KB) |
| assets/index-*.css | 24,302 B | 6,381 B (~6 KB) |
| index.html | 607 B | 368 B |
| **Total JS** | **~1.66 MB** | **~440 KB** |

Consequence: PERFORMANCE_BUDGETS §3 release threshold (500 KB gz JS, 1.25 MB total first visit) is a ~14% headroom sibling-proof envelope, not an aspiration.

## 3. games-site static-web release contract (docs/game-release-contract.md, read 2026-09-21)

- Immutable tagged builds at `<slug>/<version>/` (index.html, assets/…, release-manifest.json).
- Static catalog record: `kind: "static"`, `entryFile`, `manifestFile`; manifest carries source commit, version, per-file hash/size/content type, validation-evidence refs.
- Builds must resolve relative to a supplied versioned asset base — no domain-root assumption.
- Production promotion = catalog PR (`coming-soon` → `playable` + pinned version); rollback = revert that PR; R2 builds are never deleted.
- games-site owns catalog/launcher/route/approved pointer; game repo owns source/build/manifest/evidence.

Consequence: DECISIONS D-25 and TECHNICAL_DESIGN §D-10/§D-8 align exactly with this contract; no new release format is introduced.

## 4. Portfolio agent/ops notes (context for D-29)

- The `project-jira-admin` repository documents a governed OAuth control plane for Jira writes; automation credentials for this site exist in the host OS credential store and were used (via a local, git-excluded helper) for Jira reads/comments/transitions in this session.
- The Epic's planning provenance note states the currently connected GitHub app cannot read `andrewsetness/project-software-development-team`; consistent with that, this session did not read that repository and relied on GAME-316/317, project-game-maker contracts (read from `setnessconsulting/project-game-maker/docs/`), sibling repos, and external sources.
- A fresh-context reviewer was available via the `opencode` CLI on this host; see REVIEW_ER01.md for the reviewer packet when committed.
