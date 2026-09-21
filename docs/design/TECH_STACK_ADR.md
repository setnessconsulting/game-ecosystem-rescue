# TECH_STACK_ADR.md — Ecosystem Rescue

| | |
| --- | --- |
| Status | **FROZEN v1.0 (GAME-317 / ER-01)** — selections bind ER-02; upgrades governed by §11 |
| Scope | Technology selections and explicit declines for Ecosystem Rescue v1 (Pond Crisis) |
| Companion docs | [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md) (architecture), [PERFORMANCE_BUDGETS.md](PERFORMANCE_BUDGETS.md), [DECISIONS.md](DECISIONS.md) D-01…D-13 |

Each ADR below states: decision, alternatives considered, rationale, consequences, and invalidation condition. "Selected" = binding for v1. "Declined" = not used in v1 (reconsideration path documented).

---

## ADR-1 — Phaser 4.2.1 vs PixiJS (and canvas hand-rolled)

**Decision: SELECTED — Phaser 4.2.1** (exact pin), used strictly as a renderer/input adapter (TECHNICAL_DESIGN §D-4).

**Alternatives.**
- *PixiJS (v8 line)* — excellent WebGL renderer with a DOM accessibility overlay; but it is a renderer, not a game framework: we would hand-build scene lifecycle, asset pipeline, input abstraction, tweening, and world-to-screen management.
- *Hand-rolled canvas 2D* — smallest bundle; maximum custom code for scene graph, input, and animation; highest long-term maintenance cost.

**Rationale.**
- Phaser provides scene lifecycle, loader, input (pointer/touch/keyboard), tweens, particles, and camera in one maintained package — the exact needs of a single-habitat animated scene.
- Portfolio precedent: sibling games (Math Detective, Bridge Builder) run Phaser 4.2.1 with the same React-shell pattern; adapters and review checklists already exist to copy patterns from (not code — pattern provenance).
- PixiJS's a11y advantage is **not decisive by design**: React owns semantic accessibility in this architecture (TECHNICAL_DESIGN §D-5), so a canvas-internal accessibility tree adds nothing for us.
- Bundle cost is known and budgeted: Phaser ESM chunk measured at ~1.38 MB raw / ~346 KB gzip in sibling builds (PERFORMANCE_BUDGETS §1, §3).

**Consequences.** Phaser must never own science/evidence state; a typed SceneIntent boundary enforces this (§D-4). Phaser upgrades require explicit compatibility review (§11).

**Invalidation.** A measured Phaser defect or performance wall on the reference matrix that PixiJS demonstrably solves, with a migration plan under 1 sprint — otherwise the decision stands.

## ADR-2 — React + Phaser static web vs Unity Web

**Decision: SELECTED — React + Phaser static web. DECLINED — Unity Web (and any native engine).**

**Rationale.**
- The product is 2D, data/evidence-heavy, keyboard/touch/screen-reader-sensitive, and targeted at the games-site static-web release contract (`<slug>/<version>/` immutable R2 + release manifest, games-site/docs/game-release-contract.md).
- Unity Web adds a WASM runtime + loader overhead and a UI/accessibility integration problem (canvas-only UI is a regression against our a11y contract); it offers no capability this design needs.
- No requirement (3D, complex physics, console export) motivates Unity. This mirrors the Epic's binding direction (GAME-316 "Technology final-state decision").

**Consequences.** All future Unity-related tooling (Blender pipelines, FMOD middleware) remains declined by default (ADR-8, ADR-9). The static-web release shape is a hard constraint for ER-02's build config (base/subpath support, release-manifest.json).

**Invalidation.** A genuinely new product requirement (e.g., mandated 3D habitat) that the web-native stack cannot reasonably deliver — requires an Epic-level Jira decision, not an in-story change.

## ADR-3 — React version: 19.2.3 portfolio baseline vs 19.3

**Decision: SELECTED — React/React DOM 19.2.3** (sibling-identical) as the ER-02 bootstrap pin.

**Alternatives.** React 19.3 (current stable line per the React blog as of 2026-09: stabilizes View Transitions, adds Fragment Refs, `browser()`, Trusted Types support); remaining on 19.2.3.

**Rationale.**
- The portfolio baseline is proven end-to-end (build, axe, Playwright, CI, games-site release) across at least two shipped games; identical pins maximize pattern reuse and de-risk ER-02.
- 19.3's concrete benefits (View Transitions) are presentational; our UI moves are component-local and the reduced-motion contract (UX §9) would still require manual motion gating, weakening the benefit.
- GAME-317's policy: adopt newer only with full-suite evidence and a concrete benefit.

**Consequences.** 19.3 adoption is permitted **only** as the ER-02 controlled upgrade: PR with sibling-parity evidence + green type/lint/unit/a11y/E2E gates. No mid-epic React bumps.

**Invalidation.** A blocking bug in 19.2.3 on our reference matrix; or ER-02 demonstrates 19.3 with materially better a11y/test ergonomics at near-zero risk.

## ADR-4 — Vitest 4.1.x vs Vitest 5

**Decision: SELECTED — Vitest 4.1.x (sibling pin 4.1.11) at ER-02 bootstrap.**

**Rationale.** Proven config + golden-trace/contract test patterns exist in siblings; test-infrastructure novelty must not delay the science kernel (ER-03). GAME-317 explicitly defers this call to a controlled ER-02 decision.

**Consequences.** If Vitest 5 (current major line identified in GAME-317) is verified stable with our Node/TS/Vite pins by ER-02, adoption follows the same evidence protocol as ADR-3. Golden fixtures must be runner-independent (plain JSON, exact-byte compare) so a runner swap cannot silently change trace semantics.

**Invalidation.** Same protocol as ADR-3.

## ADR-5 — Data visualization: native SVG/HTML vs charting dependency

**Decision: SELECTED — native SVG + semantic HTML tables + textual summaries. DECLINED — charting libraries (Recharts/Chart.js/D3) for v1 core science data.**

**Rationale.**
- Accessibility is the requirement: charts must have table + text equivalents regardless of library; a library buys visual polish, not a11y, and costs bundle + integration risk.
- Our chart grammar is small: line/area trends with band annotations and a marked DO threshold line; food-web rendering as SVG with table fallback. Hand-rolled SVG with explicit `<title>`/`<desc>`, focusable points, and table alternative meets WCAG cleanly.
- Bundle discipline (PERFORMANCE_BUDGETS §1, §3) favors zero extra deps.

**Consequences.** ER-05 owns a tiny internal chart component (no external dependency); food-web SVG likewise. If ER-14 benchmarking shows visual-quality parity failure vs the Terra Nil data-presentation target, a library can be introduced for **non-essential embellishment only** — semantic alternatives remain authoritative.

**Invalidation.** Evidence that a library materially improves learner comprehension without a11y/bundle damage.

## ADR-6 — Persistence & privacy: versioned session/tab storage vs backend (Supabase) vs none

**Decision: SELECTED — versioned, privacy-safe session/tab-local storage with in-memory fallback; no backend. DECLINED — Supabase, accounts, remote persistence/telemetry (any vendor).**

**Locked behavior (normative detail in TECHNICAL_DESIGN §D-7):**
- Key `ecr-session-v1` (schema version embedded); contents: settings (motion/audio prefs), active mission snapshot (seed, scenario id, committed actions, tick), last conclusion summaries. Not sent anywhere; no identifiers.
- Active mission **survives refresh** (restore prompt: resume / restart); settings survive within the tab session; nothing survives a closed tab by design (sessionStorage semantics).
- Storage unavailable (private mode, blocked, quota): silent degrade to memory with an honest one-time notice; gameplay fully functional.
- Cleanup: single key, versioned; on version mismatch the old blob is discarded (not migrated — nothing valuable enough to migrate in v1) and a fresh session begins.

**Rationale.** Matches GAME-317 preferred direction; eliminates backend costs, privacy surface, and COPPA-adjacent data concerns entirely; refresh-survival is the only persistence need worth paying for.

**Invalidation.** A product decision to add cross-device progress (would be an Epic-level scope change with its own privacy review).

## ADR-7 — State management: deterministic reducers/state machines vs Redux/Zustand/XState

**Decision: SELECTED — plain TypeScript deterministic reducers + explicit state machines, React context/hooks for presentation state. DECLINED — Redux, Zustand, XState, MobX (any state library) for v1.**

**Rationale.**
- Authoritative state already lives in the simulation kernel + mission state machine (ER-03/ER-06 contracts); React only projects it. Libraries would duplicate truth or add ceremony around a reducer we already mandate.
- Determinism requirement (§D-3) makes the reducer pattern non-negotiable; adding a library cannot improve it and complicates replay/serialization guarantees.

**Consequences.** ER-06 must document the mission state machine explicitly (states/events table) since there is no framework graph to read it from.

**Invalidation.** Demonstrated complexity growth in ER-06/ER-08 that a specific library demonstrably reduces (e.g., undo/redo timeline needs) — decide then, with evidence.

## ADR-8 — Audio: native Web Audio vs Howler.js vs FMOD

**Decision: SELECTED — native Web Audio (+ HTML audio elements where convenient), default-muted with explicit enable. DECLINED — FMOD (middleware) for v1; Howler.js unnecessary (native API is sufficient for our scope).**

**Rationale.** Bounded ambience + one-shots do not justify middleware weight/complexity; FMOD integration would add runtime and pipeline complexity with no adaptive-audio requirement in the design (GDD §9). Mute-first respects classroom contexts; audio never carries essential state (a11y contract).

**Consequences.** ER-10 implements within Web Audio; volume + mute controls in settings; reduced-motion interaction documented in UX §9.

**Invalidation.** A measured adaptive-audio need (e.g., parameter-linked soundscape proven to aid learning in playtests) that Web Audio cannot cleanly deliver.

## ADR-9 — Rive (and Lottie) animation

**Decision: DECLINED for v1 core. Permitted later only as bounded presentational polish** (non-essential flourish), per GAME-316 policy.

**Boundary (binding if ever adopted):** Rive may never own science state, evidence, essential controls, or required feedback; must respect reduced-motion (static frame fallback); must degrade to nothing without breaking information parity.

**Rationale.** CSS/SVG/Phaser tweens cover v1 motion; another animation runtime adds attack surface without a needed capability.

**Invalidation.** ER-10 demonstrates a specific, otherwise-unreachable polish/quality gap with acceptable bundle/a11y cost — recorded as a DECISIONS.md revision.

## ADR-10 — Simulation threading: main thread vs Web Worker

**Decision: SELECTED — main-thread simulation with a worker-compatible boundary. DEFERRED — Web Worker until profiling shows need.**

**Rationale.** The kernel computes 60-tick missions in sub-millisecond-to-millisecond budgets (PERFORMANCE_BUDGETS §5: ≤ 1 ms/tick release threshold); moving it off-thread now adds async complexity to every contract for no learner-visible benefit. The boundary rules (serializable state/actions only, no DOM/clock in kernel) keep the worker door open.

**Consequences.** ER-03 CI includes a kernel cost test (median tick time budget, §5) so the "when to move" trigger is measurable: **if a committed action's synchronous tick batch exceeds 50 ms p95 on the reference low-end device, or long-tasks budgets (PERFORMANCE_BUDGETS §6) fail, ER-08 must raise the worker decision.**

**Invalidation.** Budget breach as defined above.

## ADR-11 — PWA / service worker

**Decision: DECLINED for v1.**

**Rationale.** games-site serves immutable versioned assets with caching headers; "offline installability" is not a product requirement from GAME-316. A service worker adds staleness/rollback risk to a promotion/rollback flow that is already solved by immutable paths.

**Consequences.** After first load, the game must tolerate transient network loss gracefully (assets already loaded — failure matrix UX §10). Revisit only if an offline-classroom requirement emerges (Jira decision).

## ADR-12 — Backend & network posture

**Decision: SELECTED — zero backend for core play. Runtime network limited to the game's own same-origin release assets. DECLINED — Supabase, telemetry SDKs (Sentry/analytics), ad/tracker SDKs, AI/LLM calls in the learner runtime.**

**Rationale.** GAME-316 privacy contract; static-web release model; school-network compatibility (no third-party endpoints → simpler CSP).

**Consequences.** CSP for ER-02 can be restrictive (`default-src 'self'`; no remote fonts/CDNs). Console-clean requirement (GAME-316 gate) is easier to guarantee.

## ADR-13 — Figma as design authority

**Decision: SELECTED — Figma is the production visual/interaction design authority from ER-DESIGN (GAME-333) onward.**

**Rationale.** Per GAME-316 technology direction; ER-01 intentionally ships without a Figma file (art preproduction is Gate 3+), so this ADR only freezes the authority relationship and the handoff contract (tokens + component specs + accessibility annotations reviewed before ER-07/ER-08 implementation).

**Consequences.** No visual-fidelity claims are made in ER-01 docs beyond art direction (GDD §10); ER-DESIGN owns the real design system.

## ADR-14 — Testing stack

**Decision: SELECTED — Vitest (unit/contract/golden-trace), Playwright (E2E, Chromium/Firefox/WebKit), @axe-core/playwright (automated a11y), plus kernel invariant/property tests in Vitest.**

**Rationale.** Matches GAME-316 mandate and sibling practice; golden traces are plain JSON for runner independence (ADR-4); cross-browser trace equality is a release gate (TECHNICAL_DESIGN §D-3.6).

**Consequences.** ER-02 wires all four into CI; axe coverage includes every route/major state; manual SR review remains a human gate (ACCEPTANCE_CONTRACT §6).

## ADR-15 — Dependency baseline summary (exact pins for ER-02; cross-referenced as §15)

Baseline = current proven sibling conventions, verified in this session from sibling `package.json` files (game-math-detective, game-bridge-builder, game-number-line-jumper; see evidence in DECISIONS.md D-10):

| Tool | Pin at ER-02 | Provenance |
| --- | --- | --- |
| Node | 24.x LTS | sibling engines field |
| npm + committed package-lock | yes | portfolio convention |
| TypeScript | 5.9.3 (strict) | sibling pin |
| Vite | 8.3.0 | sibling pin (8.3.x) |
| React / React DOM | 19.2.3 | sibling pin (ADR-3) |
| Phaser | 4.2.1 | sibling pin (ADR-1) |
| Vitest | 4.1.11 | sibling pin (ADR-4) |
| Playwright | 1.62–1.63 line (match sibling at bootstrap) | sibling pins |
| @axe-core/playwright | 4.13.0 | sibling pin |
| ESLint / typescript-eslint | 9.x / 8.x (sibling pins) | portfolio convention |
| GitHub Actions | credential-free CI | portfolio convention |
| Chart lib / state lib / audio lib / UI kit | **none** | ADR-5/7/8 |
| Supabase / telemetry / PWA tooling | **none** | ADR-6/11/12 |

## §11 — Upgrade & version policy (binding)

1. Versions are pinned exactly (no `^`/`~`) in `package.json`; lockfile committed.
2. Any upgrade = dedicated PR with: motivation, changelog/diff review, full green gates (type/lint/unit/golden/a11y/E2E), and a games-site release-shape re-check. No unrelated upgrades ride along ("do not mix unrelated dependency upgrades into later gameplay stories" — GAME-318).
3. Phaser minor upgrades require re-running the SceneIntent boundary conformance tests + visual smoke on the reference matrix.
4. React majors/minors additionally require axe re-audit on all routes.
5. If a pinned version stops receiving security fixes during the Epic, upgrade follows (2) with security as the recorded motivation.
