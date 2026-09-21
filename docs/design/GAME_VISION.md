# GAME_VISION.md — Ecosystem Rescue

| | |
| --- | --- |
| Product | Ecosystem Rescue |
| Version of this document | 1.0 (GAME-317 / ER-01 freeze) |
| Status | **FROZEN for ER-02..ER-16** — changes require a Jira decision record on GAME-316/GAME-317 and a matching `DECISIONS.md` update |
| Epic | [GAME-316](https://setnessconsulting.atlassian.net/browse/GAME-316) |
| This gate | [GAME-317](https://setnessconsulting.atlassian.net/browse/GAME-317) |
| Canonical repository | [setnessconsulting/game-ecosystem-rescue](https://github.com/setnessconsulting/game-ecosystem-rescue) |
| Package index | [docs/design/README.md](README.md) |

---

## 1. One-paragraph vision

Ecosystem Rescue is a browser-first middle-school ecology game in which the player is a **field scientist** sent into a destabilized freshwater habitat. The game never announces the answer. The player observes the pond, gathers evidence, states a bounded hypothesis, makes an explicit prediction, chooses an intervention, runs the ecosystem forward in controlled time steps, and then compares prediction against observed system response — revising and re-testing until the evidence supports a defensible conclusion. The first production biome is **Pond Crisis**, a nutrient-runoff (eutrophication) disturbance modeled as a pedagogical causal system: nutrient load → producer/algal response → shading and decomposition → dissolved-oxygen stress → consumer impacts, with honest causal lags. The product is a small, polished, evidence-driven vertical game — not a sandbox, not a quiz, and not a 90-second earned-break game.

## 2. Locked product facts (binding)

| Item | Locked value |
| --- | --- |
| Target learner | Middle school, **grades 6–8** (approx. ages 11–14). Playable outside that band; curriculum and validation are middle-school-first. |
| Platform | Browser (desktop + mobile), standalone static-web build; no backend for core play. |
| First biome | Pond Crisis (freshwater pond, nutrient-runoff/eutrophication disruption). |
| Biological scope v1 | 7 organism groups + an implicit decomposer layer; 3 learner-visible abiotic variables (nutrient load, dissolved oxygen, water clarity); temperature/water level frozen scenario inputs (details frozen in [SCIENCE_MODEL.md](SCIENCE_MODEL.md)). |
| Session shape | One guided first mission ≈ **10–15 minutes**; replay/variant missions ≈ **6–10 minutes**. |
| Missions at release | 1 guided tutorial-style mission, 1 independent mission, ≥2 seeded variants, ≥1 replay path with a plausible-but-ineffective first intervention (per GAME-316). |
| Curriculum authority | NGSS MS-LS2-1 … MS-LS2-5 (see [CURRICULUM_MAP.md](CURRICULUM_MAP.md)). |
| Science authority | Pure deterministic TypeScript simulation kernel (sole ecological authority). |
| Release vehicle | games-site static-web release contract (`<slug>/<version>/` immutable R2 path). |
| Host integration | LevelBest full-session activity, **later**, via a typed versioned host contract only. |
| Monetization/engagement | None. No ads, streaks, FOMO mechanics, loot boxes, or playtime leaderboards. |

## 3. The core loop (product definition)

**Observe → hypothesize → predict → intervene → run → inspect evidence → compare → revise/explain.**

1. **Observe** — inspect the habitat, organism cards, the food web, and trend charts without acting.
2. **Hypothesize** — select a bounded hypothesis from scenario-offered options (e.g., "excess nutrients from the farm field are driving the fish decline").
3. **Predict** — commit a directional prediction with magnitude and time lag ("algae rise sharply within days; fish decline follows after a lag").
4. **Intervene** — choose from scientifically meaningful interventions under explicit constraints (cost, speed, reversibility).
5. **Run** — advance deterministic simulation ticks (step or bounded auto-run).
6. **Inspect evidence** — read organism states, environmental indicators, and derived facts.
7. **Compare** — mark evidence as supporting / refuting / uncertain for the hypothesis; compare against the prediction.
8. **Revise or explain** — refine hypothesis/intervention, or conclude with an evidence-based explanation.

Success is judged against **scenario-specific, multidimensional outcome criteria** (population/resource ranges, resilience, constraints) — never a single universal "ecosystem health" score. Revision using new evidence is never penalized.

## 4. Player promise (what we guarantee the learner)

- The world responds according to **understandable, inspectable rules** — not scripted win/fail flags.
- Every learner-visible number is labeled with what it represents (index vs. real unit) — no false precision.
- Cause and effect may be delayed, and the game makes the lag observable rather than magical.
- Evidence is always available in semantic (text/table) form — never only as a picture.
- Being wrong is safe: wrong predictions produce explanations, not red-X shame.
- Any drag interaction has a non-drag equivalent; no essential action requires hover, color, audio, or precision.

## 5. Non-goals (v1, locked by GAME-316)

- Not a general ecology sandbox; not multi-biome; not open world.
- Not a research-grade ecological model — a pedagogical causal model with declared boundaries.
- No accounts, no child identity, no remote telemetry, no backend dependency, no ads.
- No multiplayer, no generative-AI tutor in the learner runtime.
- Not Unity, not Blender, not FMOD, not Rive-owned presentation, not PWA.
- No 90-second earned-break variant (explicitly excluded from the Epic).
- Never copies comparator text, art, names, layouts, audio, or scenario content (Tyto Ecology / Terra Nil / Eco are quality benchmarks only — see [QUALITY_BENCHMARK.md](QUALITY_BENCHMARK.md)).

## 6. Quality bar in one sentence

A grades-6–8 learner can, unassisted, discover the problem, run the inquiry loop, and **explain at least one observed cause/effect relationship using in-game evidence** — in an accessible, calm, polished pond that feels alive and responds visibly to intervention — on a low-end laptop, a Chromebook-class device, or a 360 px phone.

## 7. Success signals at release (from GAME-316 release gates)

- Science model and scenario sources reviewed; no unresolved high-severity science finding.
- Deterministic golden traces pass; same seed + actions ⇒ byte-identical trace.
- A fresh player completes the tutorial without external instructions (human playtest evidence).
- Playtest rubric shows ≥1 evidence-based cause/effect explanation produced by the player.
- No essential action depends on color, hover, precision dragging, or audio; axe + manual SR review pass.
- Clean browser console in qualified flows; no known P0/P1 defect.
- Performance budgets pass on the reference device/browser matrix ([PERFORMANCE_BUDGETS.md](PERFORMANCE_BUDGETS.md)).
- Comparator rubric evaluated against the frozen matrix ([QUALITY_BENCHMARK.md](QUALITY_BENCHMARK.md), [COMPARATOR_RUBRIC.md](COMPARATOR_RUBRIC.md)).
- Immutable games-site preview qualified; rollback proven before public promotion.

## 8. Document authority map

| Question | Canonical document |
| --- | --- |
| Product scope, session shape, non-goals | **GAME_VISION.md** (this file) |
| Mechanics, missions, scoring philosophy, game feel | [GDD.md](GDD.md) |
| Ecological rules, units, lags, boundaries, source ledger | [SCIENCE_MODEL.md](SCIENCE_MODEL.md) |
| NGSS traceability | [CURRICULUM_MAP.md](CURRICULUM_MAP.md) |
| Architecture, determinism, persistence, failure behavior | [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md) |
| Technology selections and declined alternatives | [TECH_STACK_ADR.md](TECH_STACK_ADR.md) |
| Learner flow, screens, error/edge states, a11y behavior | [UX_USER_FLOW.md](UX_USER_FLOW.md) |
| Comparator targets | [QUALITY_BENCHMARK.md](QUALITY_BENCHMARK.md) + [COMPARATOR_RUBRIC.md](COMPARATOR_RUBRIC.md) |
| Performance budgets | [PERFORMANCE_BUDGETS.md](PERFORMANCE_BUDGETS.md) |
| Verifiable release acceptance | [ACCEPTANCE_CONTRACT.md](ACCEPTANCE_CONTRACT.md) |
| Decision ledger | [DECISIONS.md](DECISIONS.md) |

Conflicts resolve in this order: **Jira (GAME-316/317) > SCIENCE_MODEL.md > GAME_VISION.md/GDD.md > other design docs > code comments.** A discovered contradiction is a Jira reconciliation comment plus a docs fix, never a silent local divergence.
