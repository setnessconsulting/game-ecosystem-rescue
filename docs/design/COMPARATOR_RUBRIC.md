# COMPARATOR_RUBRIC.md — ER-14 evaluation instrument

| | |
| --- | --- |
| Status | **FROZEN v1.0 (GAME-317 / ER-01)** — the scoring form ER-14 must use against [QUALITY_BENCHMARK.md](QUALITY_BENCHMARK.md) |
| Scoring model | **Observational bands, not one overall score.** No weighted average, no single number (GAME-316 forbids meaningless composite) |
| Independence | Two reviewers score independently; protocol in QUALITY_BENCHMARK §4 |

## 1. Bands

| Band | Meaning (observable) |
| --- | --- |
| **Meets target** | Dimension target (parity/exceed/INC) from QUALITY_BENCHMARK §2 is satisfied; evidence cited |
| **Exceeds target** | Clearly beyond the frozen target; evidence cited |
| **Below target — remediable** | Fixable within normal production work; remediation list required |
| **Below target — release-blocking** | Touches dimension 1 (science), 2 (causality), or 9 (accessibility), or is otherwise unshippable; blocks release per QUALITY_BENCHMARK §4.3 |

## 2. Per-dimension form (ER-14 copies this section per dimension)

```
Dimension # / name:            ___
Frozen target:                 parity / exceed / INC (from QUALITY_BENCHMARK §2)
Observed evidence:             (recorded session refs, screenshots, traces, a11y reports, playtest notes)
Comparator observation:        (what Tyto/TerraNil/Eco does on this dimension, observed firsthand)
Band:                          meets / exceeds / below-remediable / below-blocking
Notes (convergence record):    ___
```

## 3. Dimension-specific observables (what "meets" requires — concretized)

1. **Science fidelity/misconception risk** — trace file walkthrough showing each observed outcome maps to named R-* rules; checklist of M-1…M-9 guardrails observed in playtest; zero unresolved science-review findings.
2. **Systemic coherence** — recorded run showing full chain with lags; a revision-path run where the ineffective intervention fails *for explainable reasons*; cascade-lever test (bluegill removal → grazer rise → algae drop) reproduced.
3. **Evidence readability** — a playtest learner (or reviewer role-play at minimum) answers "what happened and why" using only evidence UI; decoy-correlation variant solved via evidence comparison.
4. **Intervention agency** — ≥6 interventions shipped; ≥2 defensible solution paths demonstrated in recorded runs for one mission.
5. **Tradeoffs** — recorded example of an indicator improving while another worsens/lags; tradeoff named by the player in conclusion text.
6. **Visual cause/effect** — paired screenshots/video: intervention → visible response ≤2 simulated days; equivalent text state captured simultaneously.
7. **Onboarding** — fresh-player test (target: ≥4 of 5 unaided completions of M1 in playtest; interim CI proxy: guided flow completable keyboard-only).
8. **Feedback/recovery** — revision path exercised with zero punitive UI observed; hint ladder used without answer-reveal.
9. **Accessibility** — axe reports clean on all routes/states; keyboard-only full-mission recording; human SR (NVDA or VoiceOver) run of one mission; 360 px + 200% zoom screenshots; non-drag paths exercised.
10. **Performance** — PERFORMANCE_BUDGETS §7 measurement sheets pass on reference matrix.
11. **Art direction** — style-guide conformance; contrast checks; no comparator-style borrowing (side-by-side check).
12. **Animation** — cause/effect cue catalog; reduced-motion equivalence screenshots.
13. **Audio/game feel** — muted-first flow complete without disadvantage; audio-on adds ambience only.
14. **Production polish** — copy pass (no lorem, consistent voice); all UX §10 error states demoed.
15. **Replayability** — variant runs show changed outcomes from changed conditions while rules hold; a returning player finds M3–M5 meaningfully different, not reskinned.
16. **Originality/IP** — side-by-side asset/text/layout comparison vs comparators; provenance ledger (ER-10) complete; zero matches.

## 4. Reviewer log requirements

Each reviewer records: identity/context (separate from implementation run), date, build SHA, session evidence refs, per-dimension form, and a closing statement listing any below-target dimensions with proposed severities. The two logs are reconciled into the ER-14 Jira evidence packet; unresolved >1-band disagreements are recorded, not averaged away.
