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

> **ER-01 close-out status (updated 2026-09-21, second pass): STILL NOT DONE — and now for one identifiable reason.** Packet A's blockers are structurally resolved (R-01/R-01b restated, the loop closed, the lag chain defined) and packet B has now run with no BLOCKER. What remains is the *numeric* demonstration: `evidence/calibration-sim.mjs` passes 27 of 45 checks, so §11-2's canonical chain is not yet demonstrated and §9's values are labelled provisional. GAME-317 acceptance criterion 4 (independent review with no unresolved objective blocker) is met at the document level; criterion 3's "no implementation story needs to invent scope" is met by the structure freeze. The blocker is criterion 1 in its strongest reading — the documents agree with each other but the science model does not yet do what it says. GAME-317 therefore stays **Ready/In Progress**, not Done, and the diagnosis (F-6) plus the ER-04 gate list are the handoff.

### Packet B — tech/UX/process reviewer

Full unedited findings: [REVIEW_B_FINDINGS.md](REVIEW_B_FINDINGS.md).

**Reviewer context:** fresh opencode CLI session (`opencode-go/glm-5.3`), no prior contact with the repository, with the packet-B attack checklist (§1 below), permission to web-search and to write exactly one scratch file. It read the fifteen packet documents in full, cross-checked SCIENCE_MODEL/EVIDENCE, **executed the calibration harness itself** (independently reproduced 27/45), inspected the sibling repositories and the games-site release contract on this host, and verified the Phaser/React version claims against the public record. **Verdict: PASS-WITH-FIXES** — 0 BLOCKER, 4 MAJOR, 6 MINOR, 4 QUESTION. Independence limitation is the same as packet A's: an AI session, not a human reviewer.

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

### Packet B dispositions (authoring session, 2026-09-21)

Both packets' dispositions live here. "FIXED" means the document now says something different; "OPEN (owner)" means the finding is real, is not a documentation edit, and has been assigned rather than silently absorbed.

| # | Severity | Finding (abridged) | Disposition |
| --- | --- | --- | --- |
| B1 | MAJOR | PERFORMANCE_BUDGETS §3–§5: the measurement method (Lighthouse Slow-4G) cannot validate the R1 thresholds it enforces — Slow-4G is ≈1.6 Mbps, so a 1.25 MB first visit cannot fit in 6.0 s and CI false-fails compliant builds; the R1 VM is never defined against the Celeron reference. | **FIXED.** The R1 reference is now explicitly CPU = 2018-class Celeron/ARM, link = 10 Mbps/40 ms RTT; the reference matrix is authoritative and must record its calibration; Lighthouse is demoted to a supporting proxy with its profile stated, and Slow-4G numbers may not be reported as R1 pass/fail. |
| B2 | MAJOR | UX §9/§11 + ACCEPTANCE §6.1: claims WCAG 2.2 AA while the evidence envelope is 360 px + 200 % zoom; SC 1.4.10 reflow requires no 2-D scrolling at 320 CSS px (400 % zoom). No 320 px fixture exists. | **FIXED.** ACCEPTANCE §6.1 gains a 320 CSS px reflow fixture as its own case, and COMPARATOR_RUBRIC dim 9 requires both fixtures. The AA claim is now backed by an instrument that can test it. |
| B3 | MAJOR | COMPARATOR_RUBRIC §3.9 vs ACCEPTANCE §6.2 vs UX §9 give three different screen-reader requirements for one release-blocking dimension (rubric's "NVDA *or* VoiceOver" is weaker than the contract's "NVDA + VoiceOver at minimum"; UX adds JAWS). | **FIXED.** The rubric now states the contract's floor (NVDA + VoiceOver), marks JAWS optional-where-available, and cites the contract as the authority. One requirement, three documents. |
| B4 | MAJOR | ER-15's host channel (`HostContext`/`HostFacts`) is the only path by which anything leaves the page, and its evidence list requires no privacy review; the standalone posture in ADR-6 does not cover it. | **FIXED.** ER-15's evidence list in ACCEPTANCE §2 now requires a recorded privacy review of the boundary crossing *before* host activation. |
| B5 | MINOR | ACCEPTANCE §4 gate 12 names "ER-PROMOTE", a story that does not exist. | **FIXED.** Gate 12 names ER-13, which owns the rollback rehearsal, and says so. |
| B6 | MINOR | Cross-reference rot: TECHNICAL_DESIGN D-4/D-6 → §D-9 (the matrix is §D-8); SCIENCE_MODEL R-52 → §D-6 (serializer rejection is §D-3); R-50 → TECH_STACK_ADR §7 (PRNG is TECHNICAL_DESIGN §D-2); COMPARATOR_RUBRIC §3.10 → PERFORMANCE_BUDGETS §7 (the sheets are §3–§6). | **FIXED** at all five sites. |
| B7 | MINOR | README's docs table says the decision ledger is D-01…D-29; it is D-01…D-31, and D-31's values are provisional. | **FIXED.** |
| B8 | MINOR | GDD §8 promises a returning-player "remember-me" briefing, but D-7's frozen storage allowlist has no field for it. | **OPEN (ER-05).** Recorded as an ER-05 gate item: either add a briefing-seen flag to the D-7 allowlist (a DECISIONS event) or derive the briefing from mission state; the current pair of documents cannot both be honoured. |
| B9 | MINOR | ADR-5's revisit hook keys on a Terra Nil visual-quality parity target that QUALITY_BENCHMARK dim 3 declines as INC. | **OPEN (ER-10).** Retarget the hook to dim 6 (Exceed) and dim 12 (intentionally below) when ER-10 opens the art pipeline; the ADR as written cannot be invalidated by the instrument it names. |
| B10 | MINOR | COMPARATOR_RUBRIC §2's target vocabulary (parity/exceed/INC) does not cover dims 11–12's wording, so the frozen form cannot be filled for them. | **OPEN (ER-14).** Add the two vocabulary values when ER-14 instantiates the form; noted here so the gap is not rediscovered mid-review. |
| B11 | QUESTION | Human-evidence pipeline for minors (§4 gates 3/4/13, §6.2) specifies no consent, media, storage, or retention rules. | **OPEN (ER-14, product-owner input).** This one needs a human decision and possibly legal input; it is recorded rather than answered. |
| B12 | QUESTION | The fatal shell's "Copy diagnostic details" block has no content spec; if it embeds the session snapshot it exports learner text off-device. | **OPEN (ER-05).** Fold into the D-7 diagnostic allowlist when the fatal shell is built. |
| B13 | QUESTION | ~60 KB gz of JS headroom against a measured 88 KB gz sibling app chunk for a substantially larger surface; no per-layer allocation or early canary. | **OPEN (ER-02).** Add a per-layer allocation table plus a canary bundle check early in the build, so the budget breach is caught in Epic 2 rather than at the release gate. |
| B14 | QUESTION | The comparator instrument requires two human reviewers to play three commercial titles; no license or documented-footage fallback is defined, and one of them is a paid multiplayer game. | **OPEN (ER-14).** Define access or a documented-footage fallback; otherwise the instrument invites fabricated observations. |

**Packet-B bottom line.** No BLOCKER. The four MAJOR findings were all *instrument* defects — claims whose evidence protocol could not actually test the claim — and all four are fixed in this revision. The six MINORs and four QUESTIONs are dispositioned above; five are documentation fixes made now, and five are assigned to the story that owns them (ER-05/ER-10/ER-14/ER-02) with the reason recorded, because inventing answers for them would be exactly the scope invention this gate exists to prevent.

### Packet A structural amendments to TECHNICAL_DESIGN (folded in)

- **D-3.4/3.5:** per-tick `events` are serialized in the canonical trace with fixed key order (they are evidence-layer inputs, not state); auto-run interruption logs the exact completed `advanceDays` before yielding.
- **D-2:** divergence guard exempts rule-driven, clamped, rule-ID-stamped moves; threshold raised for non-crash stocks.

## Appendix A — Reviewer context (verbatim self-report)

Packet A reviewer: opencode CLI, model `opencode-go/glm-5.3`, fresh session with no access to the authoring conversation; prompted only with the attack checklist and file paths; used its own web research (NGSS mirrors) and independently reimplemented the frozen rules in a scratch simulation to test the arithmetic.

Packet B reviewer: same tool and model, fresh session, no prior contact with the repository; given the packet-B attack checklist, a focused file list, permission to web-search and to write exactly one scratch file, and required to write its report to a file rather than stdout (stdout truncation after tool calls was observed in packet A). It independently executed `node docs/design/evidence/calibration-sim.mjs` and reproduced the 27/45 result, inspected the sibling repositories and the games-site release contract on this host, and verified the Phaser/React version claims against the public record. Its full report is committed unedited at [REVIEW_B_FINDINGS.md](REVIEW_B_FINDINGS.md); its verified-clean list is recorded there rather than paraphrased here.

**Independence limitation (honest record, both packets):** these are AI reviewer sessions, not human scientists or human accessibility specialists. They are independent of the authoring conversation but not of the model family that produced the package, and no human has signed off. GAME-317 records this limitation in Jira; the ER-14 human review requirement remains open and is not satisfied by either packet.
