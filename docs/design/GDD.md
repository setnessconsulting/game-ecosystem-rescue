# GDD.md — Ecosystem Rescue (Pond Crisis v1)

| | |
| --- | --- |
| Status | **FROZEN v1.0 (GAME-317 / ER-01)** — ER-04…ER-09 implement this as written; changes require a DECISIONS.md entry |
| Vision | [GAME_VISION.md](GAME_VISION.md) · Science rules | [SCIENCE_MODEL.md](SCIENCE_MODEL.md) |

## 1. Player fantasy & tone

The player is a **field scientist** on their first pond assignment — competent, equipped with real monitoring tools, trusted with real decisions. Tone: calm, curious, empowering; the pond is *sick, not doomed*. No doom timers, no scolding, no arcade failure. The narrator voice ("Field Notes") speaks like a supportive senior ecologist: asks questions, never reveals answers, celebrates good reasoning (including well-argued revisions).

## 2. Player roles

1. **Observer** — inspect habitat, organisms, food web, trends (always available, never forced).
2. **Reasoner** — select/revise bounded hypotheses; make explicit predictions; classify evidence.
3. **Interventionist** — choose interventions under constraints; commit; observe consequences.
4. **Explainer** — conclude each mission with an evidence-cited explanation.

## 3. Core loop (mechanical)

```
 ┌───────────── observe (no cost, unlimited) ─────────────┐
 │  habitat view · organism cards · food web · trends     │
 ▼                                                        │
 select hypothesis → select prediction → choose intervention(s)
        │                                          │
        │                          commit (explicit, confirmable)
        ▼                                          ▼
   run ticks (step 1d/7d or auto-run ≤60d, interruptible)
        │
        ▼
 inspect outcome → classify evidence (supports/refutes/uncertain)
        │
        ├── mismatch or new question ──► revise hypothesis/intervention (no penalty)
        └── criteria met ──► mission conclusion (evidence-based summary) ──► debrief → next
```

Loop rhythm per mission: **3–6 minutes observation/planning**, 1–3 interventions, 10–60 simulated days, 2–4 minutes evidence review. A mission is completable in 6–15 minutes (session targets in GAME_VISION §2).

## 4. Systems

### 4.1 Observation tools (ER-05)
- **Habitat view** (Phaser scene): pond cross-section, animated organisms, water tint/clarity effects, seasonal light. All visual states are projections of simulation state (TECHNICAL_DESIGN §D-4). Tapping/clicking/focusing an organism opens its card.
- **Organism cards** (React): role, diet/predators, current band + trend, DO sensitivity note, "what it represents" note. Keyboard-focusable; each card has a semantic equivalent in the Habitat Data panel.
- **Food web view** (React semantic + SVG): nodes = organisms + decomposer + abiotic (nutrients, DO, light); typed edges (eats, grazes, decomposes, shades, stresses-via-low-DO). Filterable by interaction type. Table alternative always present.
- **Trends view**: per-quantity charts (SVG) + data table + textual summary ("Water fleas: strained ↓ for 5 days; lowest 12 on day 19").
- **Field notebook**: the player's evidence shelf — pinned observations, selected evidence items with auto-captured citations ("Day 14: DO 4.2 mg/L, below the 5.0 stress line").

### 4.2 Hypothesis & prediction (ER-06)
- Hypotheses are **bounded selections** (scenario-authored chips + player-added nuance text ≤ 200 chars, never graded). At least one hypothesis is a plausible distractor grounded in a real correlation in the world (M-3).
- **Prediction contract** (frozen): per quantity, a direction (↑/↓/flat), a magnitude band (small/moderate/large), and a lag window (immediately/within days/within weeks). 1–4 predictions per mission step. Stored verbatim for later comparison.
- Prediction comparison shows per-item: confirmed / partially confirmed (direction right, magnitude/lag off) / not confirmed — plus the evidence that explains the difference. No scoring penalty for misses.

### 4.3 Interventions (ER-06)
- Frozen vocabulary in SCIENCE_MODEL §10; each card shows mechanism ("Cuts the nutrient source"), constraint tags (cost/speed/reversibility), and a science note.
- Committing is **explicit** (button + confirmation of what will change); no accidental drags commit actions. Every drag-style interaction (e.g., placing a buffer strip in a later polish pass) has a menu-based equivalent from day one (a11y rule, UX_USER_FLOW §9).
- Multiple interventions can compose; some combinations are intentionally suboptimal (e.g., aeration alone) to reward reasoning about sources vs symptoms.

### 4.4 Evidence & reasoning (ER-05/ER-06)
- Evidence items are **captured facts** (auto-recorded at the moment of observation) — never free text the player must invent. Examples: "Mayflies fell below 'strained' before fish declined", "Clarity rose within 3 days of runoff diversion", "Aeration raised DO but algae kept climbing".
- Classification: each selected evidence item is marked supports / refutes / uncertain for the active hypothesis — with the option to flag *why* via canned mechanism tags ("timing matches", "magnitude too large", "alternative cause exists").
- The conclusion builder (§6) assembles hypothesis + top evidence + comparison result into a short paragraph — the mission's real "score".

### 4.5 Time control (ER-03/ER-06)
- Step buttons: +1 day, +7 days; auto-run with visible progress and **pause/stop always available**; speed is presentation-only (kernel ticks are identical). All time advances are explicit player actions or scenario scripted phases (disruption window in guided mode).

## 5. Difficulty, scaffolding, and hints

- **No fail state.** A mission "fails" only in the sense that criteria aren't met yet; the pond keeps running and the player keeps options. No lives, no timers, no streaks.
- **Hint ladder** (per mission stage, frozen semantics):
  1. *Evidence pointer* — highlights where in existing data a relevant pattern is visible ("Compare the mayfly and snail curves after day 12").
  2. *Relationship pointer* — names the mechanism to consider ("What does the runoff window do to nutrients? What follows nutrients?").
  3. *Reasoning support* — frames the reasoning ("If decomposition consumes oxygen, what would you expect a week after a bloom crashes?").
  Hints never reveal the hypothesis or the correct intervention. Using hints is recorded in session evidence but never displayed as a penalty/score deduction.
- **Guided mission (M1)** embeds stage prompts (observe → hypothesize → …) with skippable callouts; independent missions present the same tools without the prompt rail.

## 6. Scoring philosophy & learner feedback (frozen)

- **No arcade score. No numeric score at all in v1** unless a concrete ER-09 justification changes this via DECISIONS.md; if one is ever added, it must measure a defined quantity (e.g., evidence-citation coverage) and never speed or attempt count.
- Feedback artifacts: (a) **prediction comparison record**; (b) **evidence classification quality** (citations linked to claims — quality shown as coverage, not correctness verdicts); (c) **mission conclusion** (the player's own paragraph); (d) **outcome summary** vs scenario criteria bands (multidimensional, per SCIENCE_MODEL §8 M-1).
- Revising a hypothesis after new evidence is *always* framed as good science (it is literally the loop we teach). Experimentation is never punished; "Do nothing (observe)" is a legitimate choice.
- The mission debrief includes **one model-behavior highlight** chosen by scenario (e.g., "Notice the DO curve kept falling for 3 days after the bloom peaked — decomposition lag") to reinforce lag literacy (M-2).

## 7. Missions (release content targets for ER-04)

| # | Working title | Focus PE | Premise | Canonical twist |
| --- | --- | --- | --- | --- |
| M1 | First Day on the Job | LS2-4 (+1,2) | Guided; runoff begins mid-briefing | Teaches the loop on a scripted timeline; must include the decomposition lag reveal |
| M2 | Pond Crisis | LS2-1+4 | Independent; same pond, no guidance, disruption starts day 0 | Player must find the driver themselves; ≥2 defensible solution paths |
| M3 | Downstream Farm (variant) | LS2-2 | Different farm/septic mix, different starting populations | Includes the **decoy correlation** (dragonfly decline vs clarity wobble) |
| M4 | Legacy Load (variant) | LS2-5 | Runoff already cut before day 0; detritus legacy dominates | Competing solutions; "patience" is a valid partial answer with tradeoffs |
| M5 | Clear-Water Puzzle (replay path) | LS2-2 | Bluegill reduction looks like the fix but doesn't hold | Canonical plausible-but-ineffective first intervention; revision required |

All missions share the Pond Crisis scenario schema (ER-04) — only initial conditions, disruption windows, decoys, and criteria differ. **No scripted win/fail events**: every criterion is evaluated from simulation state (GAME-316 authority rule).

## 8. Onboarding & tutorial boundaries

- First-run experience: mission select (single card) → briefing → M1 guided loop with stage callouts. No menus that require reading docs; tooltips are progressive, not blocking.
- Tutorial cannot be failed; skippable at any point (jumps to M2 with tools available). Returning players see a condensed briefing (remember-me is per-tab session storage only — TECHNICAL_DESIGN §D-7).
- Terminology policy: learner-facing names are plain English ("water fleas", "mayflies"); scientific names appear once on each organism card as secondary text (*Daphnia*-class, Ephemeroptera) — vocabulary exposure without gatekeeping.

## 9. Game feel & audio direction

- **Feel targets** (Terra Nil benchmark, QUALITY_BENCHMARK §4): calm pacing; every intervention produces a visible, textually equivalent acknowledgment; the pond always visibly responds within 1–2 simulated days of a state change (tint, motion density, bubble cues); idle animation keeps the pond alive without masking trends.
- **Motion**: ambient swimming/drift loops; bloom = increased particulate density + green tint; low DO = slowed motion, fish surfacing behavior (R-42), reduced bubble activity. All decorative motion respects reduced-motion (static frames + text state, UX_USER_FLOW §9).
- **Audio** (native Web Audio, default muted-first experience with a prominent enable): gentle ambience layer (water, insects, birds), soft one-shot confirmations, subtle low-DO cue when fish surface. Audio never carries state information (a11y rule). Full spec deferred to ER-10 within this frozen direction; FMOD declined (TECH_STACK_ADR ADR-8).

## 10. Art direction (bounded now, detail in ER-DESIGN/ER-10)

- **Style**: friendly naturalist field-guide aesthetic; flat-shaded vector shapes with soft gradients; believable species (not cartoon mascot faces); readable silhouettes at 32–48 px.
- **Palette**: clear-water teals/greens; bloom shifts toward opaque pea-green; stressed states desaturate. **Color is never the only carrier of state** — tint changes pair with pattern/opacity changes and text state.
- **Composition**: single-screen pond cross-section (surface → sediment); organism density reflects relative abundance bands (not exact counts — M-9).
- Originality/IP: all names, writing, art, and scenario content are original (GAME-316 boundary). Comparator material lives only in non-shipping docs.

## 11. Content boundaries (frozen)

- Grades 6–8 reading level for learner-facing text (target Flesch-Kincaid ≤ 7.5); science notes may run slightly higher with glossing.
- No horror imagery for die-offs; declines are shown as fading/reduced activity plus band words, not corpses.
- No real place names, brands, or real-person references in scenario fiction.
- Toxin/HAB safety content stays out of gameplay decisions (SCIENCE_MODEL §7); the parent-facing science notes may mention that real blooms can be toxic as context only.
- Cultural/safety review of scenario fiction (farm, septic, town framing) happens at ER-04 science/content review.
