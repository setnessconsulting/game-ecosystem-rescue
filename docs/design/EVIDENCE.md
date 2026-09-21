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

## 5. Calibration evidence — `docs/design/evidence/calibration-sim.mjs` (session 2026-09-21, packet-A follow-up)

Zero-dependency Node harness implementing every SCIENCE_MODEL rule and asserting the §11 commitments,
the §11 sanity tests, the intervention-menu directions, and the §5 matter-loop identity. Run:
`node docs/design/evidence/calibration-sim.mjs` (exit 0 = all pass).

**Verified (harness-passing) facts.** Rules implemented as frozen; the consumer mass budget is exact,
so `Δ(nutrients+biomass+detritus) = inflow − settling sink − burial − export` holds to float precision
*on every tick on which no stock is clamped at its cap*. The undisturbed pond is not hand-set: the
harness settles it (nutrient index anchored at the reference by no less than a legal controller) and
the candidate set produces a stationary fixed point — `{nutrients 50, algae 38.2, weeds 65.0, flea 36.6,
mayfly 20.2, snail 27.8, bluegill 33.9, dragonfly 16.9, sediment 19.0, DO 7.60}` with 60-tick drift
≈ 0.0 on every stock, i.e. §11-1 (baseline stability) in its strict form.

**Not yet reproduced — the calibration gap (21 of 43 checks fail with the candidate set).**
Measured with the candidate set: the canonical bloom peaks at **≈72 index** (window: ≥75 by day 12–18),
clarity bottoms at ≈31 (window: <30), and **no DO excursion below ~7.3 occurs** (window: <5.0 days
18–30), so the mayfly and bluegill windows do not trigger. Cause, established numerically:
1. The bloom's equilibrium is `r·A(1−A/C) = G·holl(A) + senescence·A`. With `r ≤ 0.30`, the ceiling
   `C` equal to the instantaneous nutrient pool (capped at 100, so reachable `C ≲ 92`), and the total
   grazing capacity `G` at or above the minimum that keeps all three grazers alive, that equilibrium
   lands at ≈70–73 — *below* the window.
2. Because the bloom tracks its ceiling, a **ceiling-excess** crash term never fires; only a density
   threshold crashes it, and a density threshold at/below the bloom's equilibrium simply caps the bloom
   (measured: threshold 65 → peak 65.8; threshold 70 → peak 72.3) and yields ≈2/tick of die-back — far
   less than the ≈10/tick detritus pulse needed to raise the sediment stock enough that
   `o2PerDecomp × decompRate × sediment` can outrun re-aeration and pull DO below 5 mg/L.
3. Lowering re-aeration (0.05, the bottom of the range) would make the *baseline* itself hypoxic
   (≈5.2–6.4 mg/L), violating §11-1's healthy baseline — so the range does not contain a re-aeration
   value that both keeps the pristine pond oxygenated and lets a ≤73-point bloom pull DO below 5.

**Consequence for the package.** The §11 windows and the §9 legal ranges are mutually inconsistent as
written: no parameter set inside the declared ranges satisfies them together. Resolutions, in
SCIENCE_MODEL §9.1 (F-2): raise the `p.algaeGrowthRate` range top above 0.30, raise the nutrient
index's internal cap above 100 (the pool cap is simultaneously the bloom ceiling), or restate the
window in terms of the multiple of the baseline index. ER-04 owns that decision and the numeric
demonstration; this harness is its acceptance test.

**Also verified, and binding on ER-03 (F-5).** When the nutrient index saturates at its 100 cap the
end-of-tick clamp *destroys matter* and the loop identity fails (worst residual ≈ 2.9/tick). Cap
behaviour must be defined as spill/reject rather than clamp, and the kernel must assert the identity
per tick, not only at the end of a run.
