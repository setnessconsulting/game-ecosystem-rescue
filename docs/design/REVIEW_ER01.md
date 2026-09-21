# REVIEW_ER01.md — Independent adversarial review packet (GAME-317 design freeze)

| | |
| --- | --- |
| Scope | The complete docs/design package as committed on branch `game-317-er01-design-freeze` |
| Reviewer independence model | Fresh-context reviewer session (separate agent, no shared conversation memory with the authoring session), reviewing the committed documents as its first contact with the project |
| Reviewer identity | Recorded verbatim from the reviewer tool's self-report in Appendix A |
| Requirement source | GAME-317: "conduct or obtain a fresh-context independent review… Do not self-label the same implementation pass as independent review" |
| Status | **Protocol fixed before review; findings recorded in §2 after execution** |

## 1. Method

1. The package was committed to the review branch first; the reviewer was pointed at the branch/files (not at a working copy in flux).
2. The reviewer received **only** the attack checklist below plus instructions to report findings with severity (release-blocking / major / minor / question), affected document, and evidence — no author commentary, no defense brief.
3. The authoring session then dispositioned every finding in §3: fix (with commit ref), refute (with reason), or accept-as-limitation (recorded in Jira).

### Attack checklist (given verbatim to the reviewer)

- science accuracy; misconception risk;
- determinism; numeric stability; simulation overcomplexity;
- technology overengineering;
- accessibility gaps; impossible responsive layouts;
- comparator misuse/IP leakage;
- privacy; persistence;
- games-site compatibility;
- hidden implementation dependencies;
- performance assumptions;
- failure handling;
- unclear acceptance criteria;
- contradictions among documents;
- future LevelBest coupling.

## 2. Findings

### Packet A — science/determinism reviewer (2026-09-21)

Full unedited findings: [REVIEW_A_FINDINGS.md](REVIEW_A_FINDINGS.md).

**Reviewer context:** fresh opencode CLI session (`opencode-go/glm-5.3`), cold review of SCIENCE_MODEL/CURRICULUM_MAP/GDD/TECHNICAL_DESIGN only, with its own web research and a scratch implementation of the frozen rules. **Verdict: FAIL** — 4 BLOCKER, 5 MAJOR, 6 MINOR, 4 QUESTION. Key finding: the v1.0 DO/nutrient parameters arithmetically cannot produce the canonical hypoxia outcome, and the nutrient loop's two load-bearing edges (uptake, mineralization) had no formulas.

> **ER-01 close-out status: DESIGN-REVIEW IN PROGRESS, NOT DONE.** Packet A objectively fails v1.0's parameter freeze. Structural fixes are committed in this revision (see SCIENCE_MODEL close-out banner); numeric recalibration (`evidence/calibration-sim.mjs`) was started but **did not pass all §11 commitments before session end**. GAME-317 must remain In Progress until the harness passes and packet B (tech/UX/process) runs.

### Packet B — tech/UX/process reviewer

**Not yet run.** Must run before GAME-317 Done (attack checklist below applies).

## 3. Dispositions

Per-finding dispositions (authoring session, 2026-09-21):

| # | Severity | Finding (abridged) | Disposition |
| --- | --- | --- | --- |
| 1 | BLOCKER | DO chain arithmetically cannot reach hypoxia; DO sign wrong in blooms | **ACCEPTED.** Structural revision frozen: R-01b explicit crash flow; re-aeration/photosynthesis rebalance pending recalibration; §9 values marked SUPERSEDED; harness required to pass before ER-03. |
| 2 | BLOCKER | Nutrient uptake + mineralization formulas missing; baseline leak | **ACCEPTED.** R-21 `mineralizationFraction` + burial, R-20 `egestionFraction`/`exportFraction`, R-30 `backgroundInflow`, R-30 `nutrientSink` restored — frozen structurally; magnitudes under calibration. |
| 3 | BLOCKER | Logistic inversion at ceiling→0 is a 1-tick discontinuity, undefined crash semantics | **ACCEPTED.** R-01b decay-from-excess at frozen rate; ceiling=0 ⇒ exponential crash; crash mortality → detritus. Frozen. |
| 4 | BLOCKER | "≥3 Direct mechanics per PE" false for LS2-3 | **ACCEPTED.** CURRICULUM_MAP guarantee restated (≥2 evidence-bearing Direct + ≥3 Direct-class); nutrient-loop budget accounting added as a third Direct LS2-3 mechanic. |
| 5 | MAJOR | Bluegill threshold (3.0) contradicts cited 5.0 onset | **ACCEPTED.** R-40 bluegill onset 5.0, severe 2.5, matching S7/S8. Frozen. |
| 6 | MAJOR | Intake→prey-removal mapping undefined | **ACCEPTED.** R-10 removal directly parameterized per link (`p.removalRate.*`). Frozen structurally. |
| 7 | MAJOR | Intra-tick clamp/evaluation order unspecified | **ACCEPTED.** §6.5 frozen: flows from pre-tick snapshot, single update pass, clamps end-of-tick. |
| 8 | MAJOR | Starvation escalation formula missing | **ACCEPTED.** R-41 formula frozen (`starveBase × min(cap, 1 + escalation×(hungry−3))`). |
| 9 | MAJOR | M4/dredge keyed to non-learner-visible detritus | **ACCEPTED for ER-04 gate.** Recorded as an ER-04 blocking item: define the decomposition-activity normalization + detritus evidence items, or make sediment learner-visible. |
| 10 | MINOR | Divergence guard false-positives on lawful crash dynamics | **ACCEPTED.** ER-03 note: guard exempts rule-driven clamped moves (crash flows). |
| 11 | MINOR | Missing frozen parameters (weedK, tempFactor, photoCap, etc.) | **ACCEPTED.** weedK, tempFactor, photoCap, stressWindow = 2 now frozen (SCIENCE_MODEL banner/§6.5); remaining values resolved at recalibration. |
| 12 | MINOR | Dangling mechanism references (colonization/siltation/stratification proxy, lag-table wording) | **ACCEPTED.** ER-04 edit list: delete or define each (colonization removed; siltation removed; stratification-proxy wording removed; lag table reworded). |
| 13 | MINOR | Bluegill/dragonfly non-predation could teach a falsehood | **ACCEPTED.** R-11 wording must label the missing edge "not modeled in v1," not "neither eats the other." |
| 14 | MINOR | Bluegill removal tagged Reversible with no recovery path | **ACCEPTED.** ER-04: retag one-shot-per-mission with recovery via reproduction only, or add a slow return path. |
| 15 | MINOR | Events outside canonical serialization; auto-run interruption not logged | **ACCEPTED.** TECHNICAL_DESIGN D-3.4/D-3.5 amendment recorded below. |
| 16 | QUESTION | Snail–weed "mutualism" hook is actually grazing | **ACCEPTED.** CURRICULUM_MAP §6 note: label as grazing/habitat association, never mutualism. |
| 17 | QUESTION | M3 primary PE vs decoy-correlation work (LS2-4) | **ACCEPTED.** M3 keeps LS2-2 primary (interaction patterns) with LS2-4 carried explicitly by the discrimination evidence; documented in §3 mapping. |
| 18 | QUESTION | Band words / resilience probe lack numeric definitions | **ACCEPTED.** ER-04 gate item: freeze band thresholds (35/65 boundaries per calibration vocabulary) and resilience-probe definition in scenario schema. |
| 19 | QUESTION | "Typical spring = 50" anchor vs scenario-specific initials | **ACCEPTED.** §3 label reworded: "relative abundance (anchored per scenario; canonical = 50)." |

### Packet A structural amendments to TECHNICAL_DESIGN (recorded, to be folded in)

- **D-3.4/3.5:** per-tick `events` are serialized in the canonical trace with fixed key order (they are evidence-layer inputs, not state); auto-run interruption logs the exact completed `advanceDays` before yielding.
- **D-2:** divergence guard exempts rule-driven, clamped, rule-ID-stamped moves; threshold raised for non-crash stocks.

## Appendix A — Reviewer context (verbatim self-report)

Packet A reviewer: opencode CLI, model `opencode-go/glm-5.3`, fresh session with no access to the authoring conversation; prompted only with the attack checklist and file paths; used its own web research (NGSS mirrors) and independently reimplemented the frozen rules in a scratch simulation to test the arithmetic. Independence limitation (honest record): an AI session, not a human reviewer; GAME-317 records this limitation in Jira at close-out.
