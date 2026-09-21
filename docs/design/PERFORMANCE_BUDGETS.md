# PERFORMANCE_BUDGETS.md — Ecosystem Rescue

| | |
| --- | --- |
| Status | **FROZEN v1.0 (GAME-317 / ER-01)** — ER-02 wires measurement; ER-12/ER-14 enforce against release candidates |
| Derivation | Sibling-game measured payloads (this session), games-site delivery model, target hardware, expected habitat complexity — no invented numbers |
| Companion | [TECH_STACK_ADR.md](TECH_STACK_ADR.md) ADR-10 (kernel cost trigger), [ACCEPTANCE_CONTRACT.md](ACCEPTANCE_CONTRACT.md) §5 |

## 1. Derivation evidence (measured 2026-09-21, sibling release builds)

| Evidence | Value | Consequence for us |
| --- | --- | --- |
| Math Detective `dist/assets/phaser.esm-*.js` | 1,375,290 B raw / ~346 KB gzip | Phaser ESM is the dominant fixed payload; budgeted as a known constant |
| Math Detective app chunk `index-*.js` | 287,130 B raw / ~88 KB gzip | React+app logic ceiling for a comparable game |
| Math Detective CSS | 24,302 B raw / ~6 KB gzip | Styling ceiling sanity |
| Math Detective total shipped JS | ~1.66 MB raw / ~440 KB gzip | Proof: a Phaser+React sibling game ships in this envelope on the same Vite/static pipeline |
| games-site release shape | immutable `<slug>/<version>/` + `release-manifest.json` (per-file hash/size), same-origin R2 via Pages Function, immutable cache headers | Cacheability: Phaser chunk cached across versions? No — versioned prefixes are immutable per version; caching helps only within a version. Budget accordingly (first-visit cost) |
| Target hardware reality | School Chromebooks, low-end laptops, 360 px Android-class phones; classroom Wi-Fi | Transfer budget must survive ~10 Mbps shared Wi-Fi; CPU budget must survive 2018-class Celeron/ARM |

Habitat complexity expectation (drives runtime budgets): single 2D scene, ~6 organism groups with ≤ ~40 animated sprites each ambient max, tint/particle effects, no tilemaps larger than one screen, no video, no large atlases in v1 (art direction: flat vector-style shapes — GDD §10).

## 2. Reference device/browser matrix (release-measurement set)

| Tier | Device class | Browser |
| --- | --- | --- |
| R1 (floor) | 2018-class Chromebook / low-end laptop (Celeron/ARM, 4 GB) | Chrome current−2 |
| R2 (floor mobile) | 360 px Android-class phone, mid-range SoC from ~4 years back | Chrome Android current−2 |
| R3 (desktop mainstream) | Mid laptop | Chrome, Firefox, Safari/WebKit current−2 |
| R4 (iOS) | iPhone SE-class | Safari iOS current−2 |

Release threshold = must pass on **R1 + R2 + R3 all browsers**; warning threshold = investigate if tripped anywhere.

## 3. Transfer & bundle budgets (initial load, gzipped transfer)

| Metric | Release threshold (≤) | Warning (≥) | Notes |
| --- | --- | --- | --- |
| JS total (initial) | **500 KB gz** | 450 KB | Sibling ships ~440 KB; 60 KB headroom for evidence/mission layers. Phaser ~346 KB of it |
| CSS total | 40 KB gz | 30 KB | |
| Initial image/asset payload | 700 KB | 500 KB | Vector-style art per GDD §10; if ER-10 art exceeds, load post-boot progressively |
| Audio payload | 0 B at boot (muted-first); ≤ 1.5 MB after opt-in, lazy | 1 MB | ADR-8 |
| Total first-visit transfer | ≤ 1.25 MB | 1.0 MB | ≈ 10–12 s on 1 Mbps classroom Wi-Fi worst case; < 3 s on 10 Mbps |
| Cold start → title interactive (R1) | ≤ 6.0 s | 4.5 s | On R1 CPU + 10 Mbps |
| Cold start → title interactive (R3) | ≤ 3.0 s | 2.2 s | |
| Game-ready (habitat scene interactive, R1) | ≤ 9.0 s from nav start | 7 s | Title → briefing → habitat are progressive; briefing usable before scene finishes |
| Lazy chunks after boot | ≤ 200 KB gz total | 150 KB | Variants/content modules |

**Measurement method:** Lighthouse (Slow 4G/4× CPU throttle) + `performance.getEntriesByType('resource')` audit on R1/R3; Playwright trace assertion of transferred bytes in CI (fail on release-threshold breach). Manifest per-file sizes cross-checked against games-site `release-manifest.json` (source of truth for delivered bytes).

## 4. Input responsiveness

| Metric | Release threshold | Warning | Notes |
| --- | --- | --- | --- |
| Control tap/keystroke → visible acknowledgment | ≤ 100 ms p95 (R1) | 75 ms | Acknowledgment = focus/press state or live-region text; not full scene effect |
| Panel tab switch (React) | ≤ 150 ms p95 (R1) | 100 ms | |
| Organism card open from canvas select | ≤ 200 ms p95 (R1) | 150 ms | SceneIntent → React card |

**Method:** Playwright + `performance.mark` harness on R1-class VM (CI), spot-checked manually on physical R2 device during ER-14 device playtest.

## 5. Simulation step cost (kernel)

| Metric | Release threshold | Warning | Notes |
| --- | --- | --- | --- |
| Median `advanceDays(1)` | ≤ 1.0 ms (R1) | 0.5 ms | Pure integer math; trivially achievable per SCIENCE_MODEL rule count |
| Median `advanceDays(7)` batch | ≤ 5 ms (R1) | 3 ms | |
| 60-tick mission replay | ≤ 40 ms (R1) | 25 ms | Whole-mission kernel replay stays under one long-task limit |

**Trigger (ADR-10):** p95 of a committed tick batch > 50 ms on R1, or long-task budgets below fail ⇒ worker decision escalates. **Method:** Vitest kernel-cost test with per-op timing on CI (regression gate at 2× budget); ER-14 manual confirmation on R1.

## 6. Runtime rendering & memory

| Metric | Release threshold | Warning | Notes |
| --- | --- | --- | --- |
| Habitat frame pacing (R1) | ≥ 30 FPS steady during auto-run; zero jank > 200 ms | 45 FPS | Auto-run visual pacing ~2 days/s; ambient animation at reduced-motion off |
| Long tasks (>50 ms) during gameplay minute | ≤ 2 (R1) | 0 target | Kernel is the main suspect; budget 5 guarantees detection |
| JS heap (R1, 10-min session) | ≤ 150 MB steady, no monotonic growth > 10 MB | 100 MB | |
| Repeated restart/remount ×10 (mission select → habitat → reset loop) | Heap returns within ±5 MB of first-mount baseline; no listener/timer leak (detached-node count stable) | — | Guards the remount contract (TECHNICAL_DESIGN §D-8) |
| Total WebGL textures (v1 art) | ≤ 30 MB GPU | 20 MB | Vector-style art keeps this small |

**Method:** Playwright + Chrome tracing (`PerformanceObserver('longtask')`), heap snapshots across restart loop in CI; manual DevTools verification on R1/R2 at ER-14.

## 7. Budget enforcement protocol (release evidence)

1. CI (every PR): bundle-size assertion (release thresholds), kernel-cost regression test, long-task smoke.
2. Candidate builds (ER-12): full matrix run on R1/R3 VMs + Lighthouse; results attached to release manifest evidence.
3. ER-14: physical-device spot checks (R2/R4), repeating §3–§6 sheets verbatim; failures map to the remediation rules in ACCEPTANCE_CONTRACT §5.
4. Any budget change after ER-01 requires DECISIONS.md entry + Jira reconciliation comment (budgets are frozen, not aspirational).

## 8. Known non-goals

- No 60 FPS guarantee on R1 (30 FPS is the release bar; calm pacing makes this acceptable per GDD §9).
- No offline bundle target (PWA declined — ADR-11).
- No GPU-heavy effects (particles bounded; no post-processing pipeline) — if ER-10 art direction violates this, ER-10 must return to this document, not silently exceed budgets.
