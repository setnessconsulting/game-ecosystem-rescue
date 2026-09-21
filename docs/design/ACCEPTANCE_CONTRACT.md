# ACCEPTANCE_CONTRACT.md — Ecosystem Rescue

| | |
| --- | --- |
| Status | **FROZEN v1.0 (GAME-317 / ER-01)** — each downstream story's definition-of-done inherits the relevant sections; ER-12/ER-14 enforce release gates against exact SHAs |
| Purpose | Make GAME-316's release gates objectively checkable, and make every ER story's acceptance evidence-based rather than narrative |

## 1. How to read this contract

- **[G-n]** = GAME-316 release gate it operationalizes. **[D-n]** = derived, objective criterion added by ER-01.
- Evidence classes: **A** = machine-verifiable artifact (test output, trace, report, manifest); **B** = human judgment artifact (playtest note, review packet) recorded with reviewer identity; **A/B** = both required.
- "Done" for any story = its Jira acceptance criteria **plus** the applicable sections here. Conflicts resolve toward the stricter.

## 2. Story-level acceptance inheritance

| Story | Inherits (sections) | Extra story-specific evidence (summary) |
| --- | --- | --- |
| ER-02 GAME-318 | §3.1, §4, §6 (automated), §7 | clean-clone build; boundary-import test green; CI on PR+main; asset-base/subpath smoke; error fixtures present |
| ER-03 GAME-319 | §3.2, §6 | golden traces (5 cases); invariant/property suite; kernel-cost test; rule-ID traceability to SCIENCE_MODEL R-*; cross-browser trace equality |
| ER-04 GAME-320 | §3.2, §6, §8 (science) | scenario schema validation fixtures; calibration commitments demonstrated (SCIENCE_MODEL §9); ≥1 ineffective-intervention path; independent science review packet (class B) |
| ER-05 GAME-321 | §3.3, §6 | semantic equivalents for every visual datum; chart/table/summary triple; notebook capture tests |
| ER-06 GAME-322 | §3.3, §6 | state-machine transition table tests; prediction-compare semantics; idempotent commits |
| ER-07 GAME-323 | §3.3, §6 | RenderSnapshot/SceneIntent conformance tests; renderer-failure degraded mode; reduced-motion scene behavior |
| ER-08 GAME-324 | §3.3, §6, §6.1 | axe on all routes/states; keyboard-only E2E; 360 px/200% checks; live-region vocabulary conformance |
| ER-09 GAME-325 | §3.3, §6 | hint-ladder semantics (no answer reveal); conclusion builder output; no-score verification (grep + review) |
| ER-10 GAME-326 | §3.4 | provenance ledger (every asset's origin/license); art within budgets (PERFORMANCE_BUDGETS §3/§6); comparator-distinct style sign-off |
| ER-11 GAME-327 | §3.2, §8 | variants' golden traces; balance pass evidence; final science-content verification (class B) |
| ER-12 GAME-328 | §5 (consolidated) | full gate sheet on release candidate SHA |
| ER-13 GAME-329 | §5, §9 | immutable preview qualified; manifest hash-match; rollback rehearsal documented |
| ER-14 GAME-330 | §5, §6.2, COMPARATOR_RUBRIC | human playtest ≥5 learners; SR manual review; comparator rubric ×2 reviewers; device matrix physical checks |
| ER-15 GAME-331 | §3.5 | host contract conformance tests; standalone parity (no-host run identical); **privacy review of the host channel before activation** — HostContext/HostFacts are the only path by which anything leaves the page, so activating host mode requires a recorded review of exactly which fields cross the boundary and what the host may do with them (the standalone privacy posture in ADR-6 does not cover this path by construction) |
| ER-16 GAME-332 | §10 | exact-SHA chain (source→build→promotion); release notes; Epic closeout packet |

## 3. Objective criteria by layer

### 3.1 Foundation (ER-02)
- [D] Fresh clone → `npm ci` → lint/typecheck/test/build all green on Node 24 (commands documented in README).
- [D] `src/sim/**` imports none of: DOM, Phaser, React, storage, network, clock APIs (boundary script + CI).
- [D] Repo contains no `Math.random()` in authoritative code paths (CI grep; kernel/UI boundary).
- [D] Built app loads from a non-root asset base path in a fixture harness with zero console errors.
- [D] CI runs on PR + main, credential-free, < 15 min.

### 3.2 Simulation & content (ER-03/ER-04)
- [D] Same seed + scenario version + actions ⇒ byte-identical canonical trace across Chromium/Firefox/WebKit runs.
- [G] Golden traces exist for: stable baseline, stressed, intervention, recovery, ineffective-intervention.
- [D] Invariant suite: bounds, non-NaN, no divergence (10k-tick soak), seed-sensitivity (±5 index max, ordering invariant).
- [D] Every content parameter has unit/kind, legal range, rationale, source-or-simplification note (schema-enforced).
- [G/D] No single scalar "ecosystem health" anywhere in state or UI (grep + schema + review).
- [D] Mission criteria evaluated only from simulation state (no scripted outcome flags; code review + test proving outcome derivation).

### 3.3 UX layer (ER-05–ER-09)
- [G] No essential action requires hover, color, audio, precision dragging, or canvas-only information (checklist audit + keyboard-only E2E + SR walkthrough).
- [D] Every learner-visible quantity renders its kind label (index/relative abundance/mg/L) and unit-class (SCIENCE_MODEL §3) — component test.
- [D] Every drag interaction ships with a non-drag path from day one.
- [D] Focus is visible, trapped only in modals, restored after close; live-region vocabulary matches UX §8 (component tests).
- [D] Revision path: changing hypothesis/intervention never decrements any displayed metric; no penalty string exists (copy audit + test).

### 3.4 Content/art (ER-10/ER-11)
- [G] Provenance ledger covers 100% of shipped assets (origin, license, author, date).
- [D] Reading level of learner-facing text ≤ Flesch-Kincaid 7.5 (script check on copy source, warnings allowed on science notes with glossing).
- [D] Art/audio stay within PERFORMANCE_BUDGETS §3/§6.

### 3.5 Host (ER-15)
- [D] With no host present, runtime behavior identical (parity test); host contract versioned and conformance-tested; no import from LevelBest internals (boundary test).

## 4. Release gates (ER-12/ER-13/ER-14 consolidation) [G-1…G-13 mapped]

| # | Gate | Evidence class | When |
| --- | --- | --- | --- |
| 1 | Science model & scenario sources reviewed; no unresolved high-severity finding | B (independent packet + ER-14 human review) | ER-04, re-affirmed ER-11/ER-14 |
| 2 | Deterministic golden traces pass (all scenarios) | A | ER-03→ continuous → ER-12 |
| 3 | Fresh-player tutorial completion unaided | B (≥4/5 learners) | ER-14 |
| 4 | Player explains ≥1 cause/effect from game evidence (rubric) | B | ER-14 |
| 5 | No essential action depends on color/hover/drag/audio | A+B | ER-08 → ER-14 |
| 6 | Clean browser console in qualified flows | A | ER-12 |
| 7 | No known P0/P1 defect | A (issue tracker export) | ER-12/14 |
| 8 | Performance budgets pass (reference matrix) | A | ER-12 + ER-14 physical checks |
| 9 | Comparator/originality review passes frozen rubric | B ×2 reviewers | ER-14 |
| 10 | Independent review bound to exact RC SHA | B (fresh-context packet) | ER-14 |
| 11 | Immutable preview qualified before promotion | A | ER-13 |
| 12 | Rollback documented **and exercised** | A | ER-13 (owns the rollback rehearsal; the release gate consumes its evidence) |
| 13 | Human playtest judgments recorded as human evidence (no AI-fabricated fun/clarity approval) | B | ER-14 |

Promotion (production games-site) is forbidden until gates 1–11 pass on the exact candidate [G]. AI/automated output may support but never substitute evidence classes marked B.

## 5. Performance gate sheet (reference)

Use PERFORMANCE_BUDGETS §3–§7 sheets verbatim as the ER-12/ER-14 artifact. A budget breach maps: warning ⇒ remediation ticket (non-blocking); release threshold ⇒ blocking until fixed or a DECISIONS.md/Jira-recorded budget amendment exists (never silent).

## 6. Accessibility evidence boundaries [G]

### 6.1 Automated (necessary, not sufficient)
- axe clean on all routes + major states (guided/independent mission, degraded mode, fatal shell, restore dialog, settings).
- Keyboard-only E2E completes one guided mission.
- CI checks: visible focus (computed style), touch-target sizes ≥44 px, contrast ≥ AA, 200% reflow fixture, **320 CSS px reflow fixture (WCAG 2.2 SC 1.4.10: no two-dimensional scrolling at 320 CSS px, i.e. 400% zoom on a 1280 px viewport — this is *narrower* than the 360 px phone layout and is its own fixture, because the AA claim is being made for both)**, 360 px layout fixture.

### 6.2 Manual (human, cannot be automated)
- Screen-reader flow review (NVDA + VoiceOver at minimum) of one full mission — comprehension, not just reachability.
- Cognitive accessibility review of evidence/summary language with a middle-school reading lens.
- SR/zoom/touch findings triaged with severities; SR-blocking issues are release-blocking (dimension 9).

## 7. Validation command contract (documented from ER-02 onward)

`npm run lint`, `npm run typecheck`, `npm test` (unit/golden), `npm run e2e`, `npm run build`, plus `npm run check:boundaries`, `npm run check:links` (docs). ER-12 runs the full set on the candidate SHA and archives raw output (class A evidence).

## 8. Science evidence chain (recap with owners)

SCIENCE_MODEL source ledger (ER-01) → ER-04 content provenance + independent source-based review (reviewer context separate from implementation) → ER-11 final content verification → ER-14 human science/educator review. Each packet binds to the git blob SHA of SCIENCE_MODEL.md + scenario files it reviewed (project-game-maker contract layer pattern: no packet, no gate).

## 9. Games-site compatibility checklist (ER-13) [G]

- [D] Build output matches static-web contract: `index.html`, `assets/…`, `release-manifest.json` under `<slug>/<version>/`.
- [D] Manifest records source commit, version, per-file hash/size/content type, validation-evidence refs.
- [D] App resolves all references relative to the supplied asset base (no domain-root assumption) — fixture-tested.
- [D] No runtime network beyond same-origin release assets (CSP-compatible).
- [D] Rollback rehearsal recorded (revert pointer, prior state verified).

## 10. Epic-closeout evidence (ER-16) [G]

Exact source SHA → build identity → games-site promotion SHA chain; known limitations; release notes; QA result; independent review packet; benchmark rubric results; a11y evidence set; performance sheets; playtest records; Jira reconciliation (every G-gate linked to its artifact).
