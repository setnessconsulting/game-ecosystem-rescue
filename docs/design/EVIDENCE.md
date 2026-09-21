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

## 5. Calibration evidence — `docs/design/evidence/calibration-sim.mjs` (2026-09-21, second pass)

Zero-dependency Node harness implementing every SCIENCE_MODEL rule and asserting the §11 commitments,
the §11 sanity tests, the intervention-menu directions, and the §5 matter-loop identity. Run:
`node docs/design/evidence/calibration-sim.mjs` (exit 0 = all pass). Variants are reachable with
`--crash=density|ceiling|both|shortfall` and `--growth=pool|capacity|supply`, which exist so the
findings below are *reproducible* rather than asserted.

**Status: 27 of 45 checks pass with the provisional set `pc1-params-1.2`.** The failures are the
canonical-chain windows, the loop identity, and three robustness probes. Nothing in this section is a
claim that the model is calibrated.

### 5.1 Verified facts (harness-passing)

1. **The consumer mass budget is exact.** `Δ(nutrients + biomass + detritus) = inflow − settling
   sink − burial − export` holds to float precision on every tick on which no stock is clamped, and
   `_flows` is emitted per tick for the evidence layer. This is the MS-LS2-3 anchor and it is the one
   property that survived every structural change.
2. **The undisturbed pond is solved, not hand-set, and is stationary.** The settle controls the
   watershed inflow so the nutrient index rests on its reference; the frozen fixed point is
   `{nutrients 21.0, algae 53.0, weeds 49.4, flea 30.1, mayfly 21.7, snail 27.0, bluegill 16.3,
   dragonfly 8.1, sediment 14.0, DO 5.40}` with 60-tick drift ≈ 0.00 on every stock — §11-1 in its
   strict form, with a complete food web (all five consumer species alive and self-sustaining).
3. **Clarity and the mayfly window are reachable in the canonical run** (clarity < 30 on day 18;
   mayflies < 20 on day 27), and the 10,000-tick soak stays bounded with no NaN.

### 5.2 The canonical chain does not yet land in its windows (measured, not inferred)

With `pc1-params-1.2`: bloom ≥ 75 first on **day 22** (window 12–18); clarity < 30 on **day 18**
(window 15–25, PASS); **DO never reaches 5.0** (minimum 5.34, window < 5.0 days 18–30); mayflies < 20
on **day 27** (window 30–40); bluegill never fall below 0.8 × baseline; DO ends at 5.45 (window < 5.0);
the nutrient pool **pins at its 100 cap** and the end-of-tick clamp destroys matter (loop residual
0.57/tick — see F-5).

### 5.3 Why — three measurements that changed the design

**(a) The pool never binds the bloom under a pool-keyed R-01, so the ceiling-excess crash cannot
fire.** Day-by-day trace of the earlier revision's canonical run: the nutrient pool sits at 60–100
while the bloom sits at 49–74 and *never* falls below it. The recurrence that governs the bloom is
`r·A(1−A/N) = G·holl(A) + senescence·A` with the ceiling `N` on *both* sides, so the pool's
equilibrium is dragged up with the bloom: the drawdown stalls because the growth it feeds stalls with
it. Measured consequence: `max(0, algae − ceiling)` is identically zero for the entire run, and
R-04's promised "die *en masse* when the nutrient supply collapses" never happens — when the ceiling
fell, growth was merely clamped to zero.

**(b) A density-keyed die-back sheds throughput, not stock.** Sweeping 72 legal combinations of the
crash threshold, crash rate, decomposition and re-aeration, DO never left its re-aeration
equilibrium: `mayfly min 20.3`, `bluegill min 34.0` in *every* row. The reason is that a plateau at
the threshold sheds only the bloom's growth flux (≈2 index/tick), and the sediment stock therefore
rises by ≤ 20 — far too little for `o2PerDecomp × decompRate × detritus` to outrun re-aeration.

**(c) The DO trough is bounded by the detritus *flux*, not by the detritus stock** (this is the
finding the design work ended on). In any steady state `decomposition = detritus inflow`, so the O2
demand is `p.o2PerDecomposition × (inflow)`: the trough depth is set by how much bloom mass dies *per
tick*, and the sediment stock only sets how long the demand lasts. With the provisional set the
sediment peaks at 15.4 → demand 0.25 mg/L/tick versus a re-aeration relief of 0.34 at DO 5. Lowering
the return flux (`mineralizationFraction` 0.95 → 0.30, `decompRate` 0.40 → 0.15) tripled the sediment
pulse (15.4 → 40.5) and *still* did not produce a trough. The blocker is the nutrient loop itself:
mineralization returns `mineralizationFraction × decompRate × detritus` to the pool, and that flux
*grows as the crash feeds it*, so the pool stays high, the bloom stays fed, its growth stays close to
its losses, and the shortfall die-back never ramps. **The canonical hypoxia requires the return flux
to be small relative to the bloom's uptake in the post-loading window** — a joint condition on the
loop parameters, not on the oxygen parameters. This is finding F-6 in SCIENCE_MODEL §9.1 and the
starting point ER-04 inherits.

### 5.4 The F-2 decision (recorded because it is a scope decision, not a tuning one)

The three range-level resolutions the earlier session proposed were each measured: (a) raising
`p.algaeGrowthRate`'s range top raised the settled bloom only 71 → 74 while breaking the healthy
baseline band; (b) raising the nutrient index cap is inert because the pool is never the binding
constraint; (c) restating the window removes one contradiction but leaves the rest of the chain
unreachable. The product owner was asked and chose **(d)**: decouple the growth from the pool (R-01
restated) and shed the growth shortfall (R-01b restated). The rule structure is frozen on that
decision; the numbers are not yet solved.

### 5.5 Independent review

Packet A (science/determinism, fresh-context AI reviewer) is recorded in
[REVIEW_ER01.md](REVIEW_ER01.md) §2 with its findings dispositioned in §3. Packet B
(tech/UX/benchmark/process/privacy/performance) is recorded there too, with the same method.
**Limitation, stated plainly:** both packets are AI reviewer sessions, not human scientists; the
ER-14 requirement for human review remains open and is recorded in Jira.
