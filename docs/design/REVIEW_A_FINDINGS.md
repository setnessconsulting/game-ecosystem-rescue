# REVIEW-A-FINDINGS — Adversarial science/determinism review (GAME-317 design-freeze gate)

Scope: the four named docs, reviewed cold. Arithmetic verified by hand and by a scratch implementation of the frozen rules (charitable fills for missing formulas). NGSS quotes checked against the declared source of record (nyssls.info): MS-LS2-2 and MS-LS2-4 match verbatim. Format: [SEVERITY] doc §section — problem — evidence/reasoning — suggested fix.

1. [BLOCKER] SCIENCE_MODEL §9 + R-21/R-22/R-23 — canonical hypoxia is arithmetically unreachable with the frozen parameters, and DO moves the wrong sign during blooms — max demand = 0.020×0.25×detritus(≤100) = 0.5 mg/L/tick, decaying 25%/tick, vs re-aeration restoring 0.10×(9−DO); a full 100-unit detritus pulse integrates to ~2 mg/L total demand and a dip of ~1–1.5 mg/L (8→≈7), not "8→3 over ~10 ticks"; meanwhile algae≈85 adds +0.34 mg/L/tick photosynthesis, exceeding all consumption, so DO rises (simulated canonical run: DO 8→9.9, min 8.0; algae peak 54 vs required ≥75 — calibration #2/#4 fail); even a 4× misreading of p.o2PerDecomposition leaves DO above 8; fix requires all-corner multi-parameter recalibration (demand ~0.05–0.08 keyed to detritus, photosynthesis ≤0.002, reAeration ≈0.05), violating sanity test #2 (±10% no-flip).

2. [BLOCKER] SCIENCE_MODEL R-30 + §5 — the nutrient loop's two load-bearing edges have no formula — "uptake (R-01 consumption proxies uptake)" never defines how much nutrient algal growth consumes, and R-21's decomposition returns no nutrients although §4/§5 promise a closed loop ("every loss on one edge appears on another"); with charitable 1:1 fills, the p.nutrientSink 5%/tick leak drains the baseline (nutrients 50→10, algae 40→9 by day 60), failing calibration #1 — ER-03/ER-04 must invent uptake ratio, mineralization ratio, and a baseline inflow, i.e., the MS-LS2-3 anchor's core mechanics; fix: freeze both edges plus baseline inflow.

3. [BLOCKER] SCIENCE_MODEL R-01/R-04 (+R-20) — bloom-crash at nutrient collapse is a one-tick discontinuity with undefined semantics — as nutrients→0, nutrientCeiling→0, so (1−algae/ceiling) divides by zero and tends to −∞: algae 85→0 in one tick (sim-confirmed), contradicting "logistic, no overshoot," the 2–4-tick lag pedagogy (§2), and the "crash then slow recovery" shape (sanity test #4); unstated whether the reversed logistic is mortality flowing to Detritus per R-20 ("all mortality"); fix: explicit decay-from-excess flow at a frozen rate, define ceiling=0, bind crash death→detritus.

4. [BLOCKER] CURRICULUM_MAP §2 — "each PE is hit by ≥3 Direct mechanics" is false for LS2-3 — the matrix has exactly two Direct rows for LS2-3 (food-web view; decomposer card/loop trace), and the LS2-3 parenthetical justification counts "boundary notes," which the same table classes as Content-only — inflated guarantee at freeze; fix: add a third Direct LS2-3 mechanic or restate the guarantee.

5. [MAJOR] SCIENCE_MODEL R-40 vs §3/D-5 — bluegill threshold (3.0 mg/L) contradicts its own cited onset — the same sentence cites "stress onset 5.0 per S7/S8," and D-5 renders "4.2 mg/L (below 5.0 stress line)," yet the frozen formula gives bluegill zero stress at DO 4.0–5.0 while the chart says stressed — teaches a wrong threshold for the one organism with public-knowledge DO limits; fix: onset 5.0 ramping to severe at 2–3, or relabel the chart line.

6. [MAJOR] SCIENCE_MODEL R-10/R-11 — intake-to-prey-removal mapping undefined — "0.35 of body/tick" is a fraction of the predator's own index, but no rule states how intake converts to prey-index removed, and the "reduced efficiency" and per-prey-type maxIntake values are absent from §9 — all consumer dynamics and the "grazer boost may fail if bloom too dense" claim depend on these; fix: freeze the conversion and per-link efficiencies.

7. [MAJOR] SCIENCE_MODEL R-52 + TECHNICAL_DESIGN D-2/D-3.3 — intra-tick clamp and evaluation order unspecified — R-52 clamps "every tick" but rules read stocks mid-update: in the crash tick detritus receives ~130k raw units before R-21 reads it, so DO differs by hundreds of mg/L depending on whether flows see clamped or raw intermediates; D-3.3 defers evaluation order to code comments; fix: freeze the per-tick operator sequence including clamp points.

8. [MAJOR] SCIENCE_MODEL R-41 — starvation-escalation formula missing — "starvation mortality escalates" gives no rate, curve, or cap for the rule preventing perpetual zero-food coexistence; fix: freeze e.g. p.starveRate×(consecutiveTicks−3), capped.

9. [MAJOR] GDD §7 M4 + SCIENCE_MODEL §3/§10 — Legacy Load and the dredge intervention (detritus −60%) are keyed to a stock the learner cannot see — detritus is "not learner-visible in v1" and its proxy ("normalized decomposition rate") has no stated normalization, so M4's premise is unobservable; fix: define the normalization and detritus evidence items, or make detritus visible.

10. [MINOR] TECHNICAL_DESIGN D-2 — divergence guard false-positives on lawful dynamics — ">50 index/tick for 3 consecutive ticks flags a kernel bug," but the R-01 crash legitimately moves algae −85/tick and detritus +95 (finding 3); fix: exempt rule-driven clamped moves or raise the threshold.

11. [MINOR] SCIENCE_MODEL §9 — missing frozen parameters — R-02's weed "fixed carrying capacity" (value absent), R-21's tempFactor (no value), R-22's photosynthesis cap ("capped" at what?), R-12's "capped by carrying capacity" (undefined term), R-40's "1–2 tick running average" (window 1 or 2?); each forces ER-03 invention inside "frozen" rules; fix: add to §9.

12. [MINOR] SCIENCE_MODEL R-50/R-31/§4/§2 — dangling references to nonexistent mechanisms — noise on "colonization" (no such rule; immigration excluded §7); aeration "breaks stratification proxy" (stratification excluded, no proxy); "bloom siltation" harms mayflies (no siltation rule); lag table says nutrients→algae takes "days" yet is "same-tick growth"; fix: delete or define each.

13. [MINOR] SCIENCE_MODEL R-11 — "neither eats the other in v1" (bluegill/dragonfly) risks teaching a falsehood — S13 supports bluegill eating aquatic insects; if the food-web view presents the absence as fact rather than "not modeled," learners conclude fish don't eat dragonfly nymphs; fix: label the missing edge as simplification.

14. [MINOR] SCIENCE_MODEL §10 — "Remove some bluegill" tagged Reversible with no recovery mechanism — reproduction from −50% is slow and immigration is excluded (§7); fix: define the return path or retag one-shot/uncertain.

15. [MINOR] TECHNICAL_DESIGN D-2/D-3 — canonical serialization/replay gaps — step() `events` are outside the canonicalJSON contract (state only), so traces including events have no frozen form; auto-run is "interruptible" (GDD §4.5) but no rule states that interruption logs exact completed advanceDays; fix: state both.

16. [QUESTION] CURRICULUM_MAP §6 — "snail–weed habitat texture" as the mutualism hook — snails grazing periphyton on weeds is grazing, not mutualism; confirm notes never label it mutualism.

17. [QUESTION] CURRICULUM_MAP §3 — M3's primary PE is LS2-2 while its canonical twist (decoy-correlation discrimination) is LS2-4 argument-from-evidence work; is the mapping carried by the farm/septic interaction mix alone?

18. [QUESTION] SCIENCE_MODEL §3/GDD §6 — band words (thriving/stable/strained/crashing) and the M-1 "resilience probe" are learner-visible frozen vocabulary with no numeric definition in these docs — confirm frozen elsewhere before ER-04.

19. [QUESTION] SCIENCE_MODEL §3 — "relative abundance (typical spring = 50)" vs scenario-specific initial conditions — if a variant starts ≠50 the fixed label misleads; fix: per-scenario anchor.

Verified clean (no finding): NGSS quotes verbatim; DO bands (2–3, ~5 mg/L) and P-limitation match S4/S7/S8/S6; guardrails M-1–M-9 genuinely operationalized (no health score, visible lags, decoy, algae-not-always-bad); determinism architecture (fixed-point, no transcendentals, no-migration replay, fail-closed loaders) sound apart from findings 7/15.

VERDICT: FAIL

Justification: The frozen parameter set cannot produce the canonical teachable outcome — DO stress — under any faithful reading (DO rises during blooms and never approaches 5 mg/L), and the nutrient loop's two load-bearing edges plus several other "frozen" formulas do not exist, so ER-03/ER-04 would be inventing kernel science rather than implementing a frozen design. Curriculum quotes and most honesty boundaries verify clean, but the LS2-3 Direct-coverage guarantee is false as tabulated.

BLOCKERs: #1 (DO calibration/sign failure), #2 (missing uptake & mineralization formulas; baseline leak), #3 (R-01 ceiling-collapse discontinuity/undefined crash semantics), #4 (LS2-3 Direct-count guarantee false).
