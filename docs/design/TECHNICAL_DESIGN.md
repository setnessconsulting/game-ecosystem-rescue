# TECHNICAL_DESIGN.md — Ecosystem Rescue

| | |
| --- | --- |
| Status | **FROZEN v1.0 (GAME-317 / ER-01)** — ER-02 implements these seams; ER-03…ER-09 build inside them |
| Authority | GAME-316 "Simulation authority — binding" + GAME-317 requirements |
| Companion docs | [SCIENCE_MODEL.md](SCIENCE_MODEL.md) (model rules R-*), [TECH_STACK_ADR.md](TECH_STACK_ADR.md) (choices), [UX_USER_FLOW.md](UX_USER_FLOW.md) (flows), [ACCEPTANCE_CONTRACT.md](ACCEPTANCE_CONTRACT.md) (gates) |

## D-1. Architecture overview

```
┌──────────────────────────────────────────────────────────────────────┐
│ React 19 semantic application layer (DOM owns: text, tables, charts, │
│ controls, focus, announcements, settings, error/fatal shells)        │
└──────────▲───────────────────────────────▲───────────────────────────┘
           │ typed props/callbacks          │ SceneIntent (tokened) / RenderSnapshot
┌──────────┴───────────┐        ┌───────────┴────────────────┐
│ Mission state machine │◄──────►│ Phaser 4.2.1 habitat scene │
│ (deterministic TS)    │        │ (renderer/input adapter)   │
└──────────▲────────────┘        └───────────▲────────────────┘
           │ actions / snapshots              │ read-only projection
┌──────────┴──────────────────────────────────┴────────────┐
│ Pure TypeScript simulation kernel (sole ecological truth) │
│ no DOM · no Phaser · no React · no storage · no clock ·   │
│ no Math.random · deterministic seeded PRNG only           │
└──────────▲───────────────────────────────────────────────┘
           │ loads/validates
┌──────────┴────────────────────────────────────────────────┐
│ Scenario/content data (versioned JSON, strict schema)      │
└───────────────────────────────────────────────────────────┘
```

Authority flow (one direction): **scenario → kernel state → mission machine → React/Phaser projections.** Nothing downstream writes ecological truth. This mirrors the proven sibling pattern (Math Detective `EngineState → SceneModel → React/Phaser`) with a stronger kernel boundary.

## D-2. The simulation kernel (ER-03)

**Package:** `src/sim/` — zero imports from DOM, React, Phaser, storage, network, or clock APIs. Enforced by an ER-02 boundary-check script (sibling `verify-boundary.mjs` pattern) plus a lint rule banning the imports in that directory.

- **State.** `EcosystemState` = frozen, serializable object: per-organism scaled-integer stocks (SCIENCE_MODEL §3/§6 R-51), DO (scale-10 fixed point), nutrient/detritus/oxygen-demand internal stocks, tick counter, PRNG state, `SIM_MODEL_VERSION`, `PARAM_SET_VERSION`, `scenarioId`, `seed`. `Object.freeze`d; every transition returns a new state.
- **Actions.** `SimAction = advanceDays(n) | applyIntervention(id, params) | noop`. All validated against scenario legality before execution. Unknown actions rejected (fail-closed).
- **Step function.** `step(state, action) → { state, events }` where `events` are derived, non-authoritative annotations (threshold crossings, rule firings) for the evidence/UI layers. Events never feed back into state (kernel-internal causality only).
- **PRNG.** Kernel-owned seeded generator (ER-02 selects mulberry32 or xorshift128+; recorded in code + replay header). Used only by rules R-50-permitted terms. Never `Math.random()` anywhere in the repo (CI grep).
- **Invariants.** Enforced in-step (clamps per R-52) and re-validated post-step; violation ⇒ deterministic `InvalidStateError` (no silent repair): NaN/∞ rejected, bounds checked, divergence guard (any stock moving > 50 index/tick for 3 consecutive ticks without an intervention flags a kernel bug in dev/test).

**Time rule (binding).** The kernel has no clock. `advanceDays` is the only time authority. UI pacing, animation timing, frame rate, and wall-clock values may not influence state (GAME-316 authority list).

## D-3. Determinism & numerical strategy

1. **Fixed-point, not floats.** All authoritative state uses scaled integers (SCALE=1000 for indices/flows; SCALE=10 for DO). Division floors toward zero; multiplication promotes to 64-bit-safe ranges (JS numbers are exact ≤ 2^53 — our magnitudes stay ≪ that, and integer-only ops are exact).
2. **No transcendentals in state transitions.** Logistic/Holling terms are rational functions (SCIENCE_MODEL R-01/R-10) — no `exp/log/pow`. If a future rule needs one, it must ship with a quantized table approximation + determinism note.
3. **Canonical arithmetic order.** Each rule's formula fixes evaluation order (documented in code next to the rule ID) so reordered refactors cannot change results; golden traces catch drift.
4. **Canonical serialization.** `canonicalJSON(state)` — fixed key order (documented schema), scale-preserved integers, no floats, UTF-8, no NaN/∞ (serializer throws). Traces store one canonical JSON per tick.
5. **Replay format.** `replay = { header: { simModelVersion, paramSetVersion, scenarioId, scenarioVersion, seed, kernelVersion }, actions: [{tick, action}...], expectedStateHash?: sha256 }`. Replay = apply actions to initial state via public kernel API. Hash compare uses canonical JSON.
6. **Golden traces.** Per scenario: byte-identical canonical trace on Chromium/Firefox/WebKit (Playwright-run node-context comparison) before release. Fixture updates require explicit diff review in PR.
7. **Versioning & migration.** `SIM_MODEL_VERSION`/`PARAM_SET_VERSION` in header and state. Policy: **traces never migrate.** A version change invalidates old fixtures (regenerate + science re-verification, Jira-recorded). Scenario versions track content separately from rules; loader rejects mismatched versions (§D-8).
8. **Cross-platform note.** Integer math avoids the float pitfall entirely; JS number semantics are spec-uniform across engines for integer ops ≤ 2^53. No `Date`, no `performance.now` in kernel.

## D-4. Phaser boundary (ER-07)

- **RenderSnapshot** (kernel→Phaser): read-only projection — per-organism band/trend/density hints, clarity/DO derived visuals, event flags for effects (bubble burst, surfacing). Computed by the presentation layer from state+events; Phaser holds **no** other state source.
- **SceneIntent** (Phaser→kernel/UI): bounded, token-stamped requests (`select-organism`, `focus-organism`, `inspect`) — presentation-only requests; ecological actions never originate in the scene (mirrors sibling SceneIntent contract).
- **Ownership:** Phaser owns transforms, animation, particles, camera, pointer world-mapping. React owns all semantic info (cards, tables, charts, controls). Every Phaser-presented fact has a React equivalent (a11y contract; UX §9).
- **Lifecycle:** single habitat scene; scene restart on mission reset is a projection refresh — never a state re-source. Renderer failure behavior: §D-9.

## D-5. React semantic layer & accessibility architecture (ER-08)

- **Layout:** app shell = header (mission state, time controls) + main region with two coordinated views: habitat (Phaser canvas) + **Habitat Data panel** (semantic: organism cards, food web, trends, evidence, notebook). Panel and canvas are peer focusable regions; all science data lives in the panel regardless of canvas health.
- **Live regions:** one `aria-live="polite"` status region (time advances, outcome changes, confirmations) + one `assertive` region (fatal errors). Announcement vocabulary frozen in UX §8.
- **Focus management:** modal/panel focus trapping per UX §9; focus moves to the affected panel after time-run completes; visible focus everywhere (WCAG 2.4.7).
- **Controls:** every control is a native or correctly-attributed accessible control; drag interactions (polish-pass only) always have menu/keyboard equivalents (GAME-316 hard rule).
- **Charts:** SVG charts carry `<title>/<desc>`, an accessible data table (visually-hidden or toggleable), and a one-sentence summary; food-web SVG has a link-list equivalent.
- **Kind labels:** every index value renders its kind (SCIENCE_MODEL §3) — e.g., "Water fleas — relative abundance 38/100 (strained ↓)"; DO renders "4.2 mg/L (below 5.0 stress line)".
- **Reduced motion:** honors `prefers-reduced-motion` + in-game toggle; static frames + text state (UX §9). **Mute-first audio** with visible enable (ADR-8).
- **Targets:** ≥44×44 px touch targets (GAME-316); 360 px portrait reflow with no horizontal loss; 200% zoom reflow.

## D-6. Scenario/content contract (ER-04)

- Versioned JSON documents (`scenarioVersion`, `simModelVersion` range required), strict validated loader: unknown/missing/malformed fields ⇒ fail-closed error state (§D-9), never partial running (GAME-318 contract).
- Schema sections (per GAME-320): species/roles + trophic links (mapping to R-11 ids), abiotic ranges, initial conditions, disruption timeline, evidence definitions, interventions (from SCIENCE_MODEL §10 vocabulary + constraints/costs), hypotheses/prediction affordances, mission criteria (multidimensional bands + resilience probes), accessibility labels/descriptions, provenance references (source-ledger IDs), simplification notes.
- Content lives in code-reviewable data files; loading is deterministic (no remote fetch at runtime beyond same-origin immutable assets).

## D-7. Persistence & privacy (binding behavior)

- **Mechanism:** `sessionStorage` (tab-local), single key `ecr-session-v1`; schema version inside the blob. Graceful fallback chain: sessionStorage → in-memory (with one-time honest notice) — gameplay never blocks on storage.
- **Contents (allowlist, nothing else):** settings {reducedMotion, audioEnabled, audioVolume}; active mission snapshot {scenarioId, scenarioVersion, seed, tick, canonical state, committed actions, hypothesis/prediction/evidence selections}; last mission conclusion summaries. **No:** identifiers, free text beyond the bounded hypothesis nuance field, telemetry, analytics, timestamps beyond in-model day counts.
- **Lifecycle:** written on committed actions and settings changes (not per tick); restored only on refresh within the same tab; on schema-version mismatch → discard blob, fresh session (v1 policy: nothing valuable enough to migrate). Cleared on mission conclusion ("start fresh" default) or explicit restart.
- **Storage failure behavior:** unavailable/quota-exceeded ⇒ memory mode + notice (UX §10 rows); never blocks play; never throws to learner.
- **Privacy posture:** no network calls beyond same-origin assets (ADR-12); no cookies; no third-party frames; no `localStorage`/IndexedDB in v1 (deliberate: nothing survives tab close). This section is the normative contract the ER-02 privacy guards test against.

## D-8. Failure behavior matrix (normative; UX_USER_FLOW §10 is the learner-facing view)

| Condition | Detection | Behavior | Never |
| --- | --- | --- | --- |
| Malformed scenario JSON | loader schema validation | fail-closed fatal state: scenario id/version, retry, exit | partial execution |
| Unsupported scenario/sim version | loader version gate | same as malformed + clear "update required" text | attempting to run mismatched rules |
| Corrupt/missing asset | loader error events | degraded render mode: semantic panel fully functional + visible notice | fabricated scene state |
| WebGL/context creation failure | Phaser boot error | semantic-only mode (canvas hidden, data panel full) + notice | blank screen with silent canvas |
| Renderer runtime exception | scene error handler | disable scene, keep React shell, log-safe message | crash the app |
| sessionStorage unavailable/blocked | feature test at boot | memory mode + one-time notice | blocking play |
| Quota exceeded on write | write try/catch | drop to memory mode + notice | data corruption |
| Refresh mid-mission | session restore | restore prompt: resume / restart | silent partial restore |
| Background tab / resume | visibilitychange | kernel untouched (no wall-clock); only UI pause of auto-run | time drift |
| Network loss during initial load | fetch errors | retry + cached-assets notice + exit guidance | infinite spinner |
| Network loss after load | n/a (no runtime network) | play continues unaffected | — |
| Keyboard+pointer mixed input | n/a (both paths first-class) | no mode lock-in | input-mode assumptions |
| Double activation | idempotent action dedupe (token per commit) | second activation no-ops with visible acknowledgment | duplicate interventions |
| Route unmount/remount | React lifecycle | remount from canonical state projection | state loss |
| Repeated mission reset | confirm-first pattern | reset to canonical initial state | partial reset |
| Fatal unexpected exception | top error boundary | accessible fatal shell: safe description, copyable diagnostics (no stack traces), restart/exit | raw stack exposure; fabricated results |

**Standing rules:** failures never fabricate mission results, never silently corrupt state (kernel validation throws deterministically), and never expose raw stack traces to learners (diagnostics are curated, learner-safe strings + a technical detail block for adults/bug reports).

## D-9. Testing & validation strategy (ER-02 establishes, ER-03+ expand)

- **Kernel:** unit tests per rule (R-*), invariant/property tests (bounds, determinism, no-NaN), golden traces per scenario (§D-3.6), kernel-cost test (ADR-10 budget), boundary-import test.
- **Mission machine:** state-machine transition table tests; invalid-transition rejection; recovery-path tests.
- **UI:** component tests (Vitest + Testing Library) for panels; axe on all routes/states in Playwright; keyboard-only path E2E; 360 px + 200% zoom visual checks in CI where feasible.
- **E2E:** boot smoke (ER-02), full guided-mission happy path, restore-after-refresh path, fatal-error path (fixture-driven).
- **Docs:** markdown link check (relative links) + markdownlint in CI (lightweight, no app needed).
- **Fixtures:** malformed scenario, unsupported version, missing asset, WebGL-fail (stubbed) — wired as E2E/unit fixtures per GAME-318.

## D-10. Repository layout (target, ER-02)

```
src/
  sim/            # kernel (pure; no DOM/Phaser/React/storage/network/clock)
  scenario/       # schema, loader, validation, content data
  mission/        # mission state machine, evidence/prediction contracts
  render/phaser/  # scene, RenderSnapshot projection, SceneIntent handling
  ui/             # React shell, panels, charts, a11y primitives
  persistence/    # session store + guards
  host/           # future LevelBest host contract seam (typed, inert in v1)
  app/            # boot, error boundaries, routing-lite
docs/design/      # this package
tests/            # e2e, fixtures, golden traces
scripts/          # boundary-check, release-manifest, checks
```

## D-11. Host (LevelBest) boundary — inert in v1

`src/host/` defines a **typed, versioned, inert** seam: `HostContext` (bounded placement/session/deadline context, optional) and `HostFacts` (idempotent completion/summary emissions). Rules: host may not import game internals beyond this seam; game runs identically with no host present; the seam is exercised by unit tests but disabled at runtime in v1 (GAME-316 "Standalone and host boundary"). ER-15 implements against this frozen seam; any seam change before then is a DECISIONS.md event.
