# QUALITY_BENCHMARK.md — Ecosystem Rescue vs comparators

| | |
| --- | --- |
| Status | **FROZEN v1.0 (GAME-317 / ER-01)** — ER-14 evaluates the release candidate against **this exact matrix** (GAME-316 requirement); changes require DECISIONS.md entry |
| Comparators | Tyto Ecology (science-systems benchmark), Terra Nil (restoration readability/game-feel), Eco (systemic consequences) |
| Rubric instrument | [COMPARATOR_RUBRIC.md](COMPARATOR_RUBRIC.md) (observational scoring form) |
| IP boundary | Non-negotiable: no comparator text, names, art, audio, layouts, icons, characters, or scenario structures in shipping content |

## 1. What each comparator teaches us (mechanics observation only)

**Tyto Ecology** — build-and-maintain ecosystem simulator (habitats with producers/consumers/decomposers, population data panels, organism interaction monitoring, system collapse when balances break). Its proven lesson: *learner engagement can ride on watching interdependencies play out over time with real data on screen*. Its risk (we exploit as opportunity): breadth over narrative clarity; data presentation can overwhelm middle-schoolers. **Our bar: parity-or-better on causal clarity and evidence-driven learning with a deliberately smaller scope** (GAME-316 target).

**Terra Nil** — reverse city-builder restoring a wasteland; exemplary legibility of environmental recovery (visual gradients, animated revitalization, satisfying completion rhythms, calm pacing, no failure pressure). Its proven lesson: *restoration feedback itself can be the reward*. **Our bar: comparable deliberateness/satisfaction at our smaller scale, with stronger explicit scientific evidence and accessibility** (GAME-316 target).

**Eco** — multiplayer ecosystem sim where every player action propagates through a simulated world (server-wide economy/ecology; no scripted outcomes; collapses are earned, not triggered). Its proven lesson: *a world that answers according to systems, not scripts, produces genuine stakes*. **Our bar: the same sense of rule-driven response — without Eco's breadth, multiplayer, or long sessions** (GAME-316 target).

## 2. Required dimension matrix (frozen targets)

Targets: **Parity** = comparable quality at our scale · **Exceed** = we intend to be demonstrably better · **Intentionally not comparable (INC)** = outside our scope by design.

| # | Dimension | vs Tyto | vs Terra Nil | vs Eco | Ecosystem Rescue target definition (observable at ER-14) |
| --- | --- | --- | --- | --- | --- |
| 1 | Science fidelity / misconception risk | **Exceed** (causal legibility per scope) | INC | Parity | Every outcome traceable to named, sourced rules (SCIENCE_MODEL R-*); zero known misconception reinforcements; M-1…M-9 guardrails demonstrably honored; no high-severity science finding at review |
| 2 | Systemic/causal coherence | Parity-or-better | Parity | **Exceed in clarity, not breadth** | Full causal chain (nutrients→algae→shading→decomposition→DO→consumers) observable with lags; no scripted win/fail; second-order effects (cascade lever) reproducible by players |
| 3 | Evidence/data readability | **Exceed** | INC | Parity | Every quantity: chart + table + sentence + kind label; a middle-schooler can answer "what happened and why" from the evidence UI alone; decoy-correlation missions solvable from evidence |
| 4 | Intervention agency | Parity | Parity | Parity | ≥6 meaningful interventions with real tradeoffs; multiple defensible solution paths per mission; "do nothing" legitimate; no single magic fix |
| 5 | Meaningful tradeoffs | Parity | Parity | Parity | Cost/speed/reversibility tags create real dilemmas (source-vs-symptom; fast-vs-durable); at least one seeded variant forces an indicator-vs-indicator tradeoff (GAME-320 requirement) |
| 6 | Visual cause/effect communication | Parity | **Exceed** | Parity | Within 1–2 simulated days, the pond visibly answers state changes (tint/motion/density cues) with text-equivalent state; lag visible rather than magical |
| 7 | Onboarding | Parity | Parity | **Exceed** (single-session design) | Fresh player completes guided mission unaided (playtest gate); coaching skippable; flow completable keyboard-only |
| 8 | Feedback / recovery / revision | **Exceed** (revision-centered loop) | Parity | Parity | No punitive failure; revision always available & framed as good science; ineffective-intervention path teaches rather than punishes |
| 9 | Accessibility | **Exceed** | **Exceed** | **Exceed** | Full keyboard/pointer/touch parity; semantic equivalents for all science data; SR flow reviewed by humans; WCAG 2.2 AA automated + manual evidence (ACCEPTANCE_CONTRACT §6) |
| 10 | Responsive/browser performance | Parity | Parity | INC (native-class app) | Budgets in PERFORMANCE_BUDGETS pass on reference matrix incl. Chromebook-class + 360 px phone |
| 11 | Art direction | Parity (at our scale) | Parity (style-different) | INC | Original field-guide aesthetic; readable at target sizes; color never sole carrier of meaning; comparator-distinct (no style borrowing) |
| 12 | Animation | Parity | **Intentionally below Terra Nil's AAA polish, above minimum** | INC | Ambient life + cause/effect cues within reduced-motion contract; no uncanny or corpse imagery for die-offs |
| 13 | Audio / game feel | Parity | Parity | INC | Mute-first Web Audio ambience/cues; audio never essential; calm pacing preserved |
| 14 | Production polish (UI coherence, copy quality) | Parity | Parity | INC | Consistent field-notes voice; no lorem; error states polished (UX §10); polish judged in ER-14 rubric |
| 15 | Replayability (without rote memorization) | Parity | INC (puzzle-locked) | Parity | ≥2 seeded variants + revision path where the same "fix" behaves differently due to system state (not randomness theater); variants preserve scientific truth |
| 16 | Originality / IP separation | n/a | n/a | n/a | **Exceed (requirement)**: zero copied assets/text/names/layouts; mechanics comparisons documented only in non-shipping docs; ER-14 includes an explicit originality pass |

**Rule for INC usage:** each INC is justified by scope non-goals (GAME_VISION §5) — never by "we didn't get to it." Dimension 12's partial-INC is bounded: we set our own animation bar (functional cause/effect legibility) rather than matching Terra Nil's asset-quality investment in v1.

## 3. Deliberate non-goals vs comparators (frozen, from GAME-316)

- Not Tyto's breadth (many habitats/species) — one pond, deeply legible.
- Not Terra Nil's wordless abstraction — explicit evidence/reasoning is the point.
- Not Eco's multiplayer/economy/persistence — single-player, session-local, no backend.
- No comparator's exact level structures, progression math, or UI layouts.

## 4. Evaluation protocol at ER-14 (binding reference)

1. Two reviewers score the release candidate against COMPARATOR_RUBRIC.md independently; disagreements >1 band are discussed to convergence or recorded.
2. Each dimension cites observable evidence (recorded session, screenshots, trace files, a11y reports, playtest notes) — a generic "feels polished" is insufficient (GAME-316).
3. Any dimension below its frozen target ⇒ remediation list with severity; release-blocking if it touches dimensions 1, 2, 9 (science, causality, accessibility).
4. Originality pass (dimension 16) reviewed side-by-side with the three comparators by a reviewer who did not author the game content.
