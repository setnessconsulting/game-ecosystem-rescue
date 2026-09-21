# docs/design — Ecosystem Rescue final-state design package (GAME-317 / ER-01)

This directory is the **governing contract** for implementing Ecosystem Rescue (GAME-316). Downstream stories (ER-02 … ER-16) must not invent product scope, science rules, architecture, UX structure, quality bars, budgets, or acceptance criteria — they are all here.

## Documents (canonical paths)

| # | Document | Owns |
| --- | --- | --- |
| 1 | [GAME_VISION.md](GAME_VISION.md) | Product scope, session shape, non-goals, conflict-resolution order |
| 2 | [GDD.md](GDD.md) | Loops, systems, missions, hints, scoring philosophy, game feel, content boundaries |
| 3 | [SCIENCE_MODEL.md](SCIENCE_MODEL.md) | Sourced causal rules (R-*), units, lags, parameters, boundaries, misconception guardrails |
| 4 | [CURRICULUM_MAP.md](CURRICULUM_MAP.md) | NGSS MS-LS2-1…5 traceability, mission mappings, honest out-of-scope claims |
| 5 | [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md) | Package boundaries, kernel contract, determinism strategy, persistence, failure matrix |
| 6 | [TECH_STACK_ADR.md](TECH_STACK_ADR.md) | Every technology selection/decline with rationale + upgrade policy |
| 7 | [UX_USER_FLOW.md](UX_USER_FLOW.md) | 20-step learner flow, screens, error/edge states, a11y interaction contract |
| 8 | [QUALITY_BENCHMARK.md](QUALITY_BENCHMARK.md) | Comparator targets (Tyto Ecology / Terra Nil / Eco), 16-dimension matrix |
| 9 | [COMPARATOR_RUBRIC.md](COMPARATOR_RUBRIC.md) | The ER-14 observational scoring instrument |
| 10 | [PERFORMANCE_BUDGETS.md](PERFORMANCE_BUDGETS.md) | Evidence-derived budgets, reference matrix, enforcement protocol |
| 11 | [ACCEPTANCE_CONTRACT.md](ACCEPTANCE_CONTRACT.md) | Verifiable gates per story + release gates + evidence classes |
| 12 | [DECISIONS.md](DECISIONS.md) | Decision ledger D-01…D-31 (D-30/D-31 record the calibration discipline and the F-2 resolution; D-31's numeric values are provisional and its evidence lives in SCIENCE_MODEL §9.1) |
| — | [EVIDENCE.md](EVIDENCE.md) | Measured sibling/portfolio evidence backing decisions |
| — | [REVIEW_ER01.md](REVIEW_ER01.md) | Independent adversarial review packet for this design freeze |

## Reading order for a new implementer

1. GAME_VISION → 2. GDD → 3. SCIENCE_MODEL → 4. TECHNICAL_DESIGN → 5. UX_USER_FLOW, then the rest by need. ER-02 starts from TECH_STACK_ADR ADR-15 (exact pins) + TECHNICAL_DESIGN §D-10 (layout) + §D-9 (test strategy).

## Change discipline

- These docs are **frozen** at v1.0 for the Epic's duration. Fix contradictions via PR + Jira reconciliation comment on GAME-316/GAME-317.
- Conflicts resolve: **Jira > SCIENCE_MODEL > GAME_VISION/GDD > other design docs > code** (GAME_VISION §8).
- Any decision status change: DECISIONS.md entry + Jira comment. Any budget change: PERFORMANCE_BUDGETS protocol. Any rule change: new SIM_MODEL_VERSION.
