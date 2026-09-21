# CURRICULUM_MAP.md — Ecosystem Rescue ↔ NGSS MS-LS2

| | |
| --- | --- |
| Status | **FROZEN v1.0 (GAME-317 / ER-01)** |
| Standard | NGSS MS-LS2 — Ecosystems: Interactions, Energy, and Dynamics (grades 6–8) |
| Source of record | [NGSS DCI arrangement](https://www.nextgenscience.org/dci-arrangement/ms-ls2-ecosystems-interactions-energy-and-dynamics) (nextgenscience.org); PE/clarification/DCI text quoted from the [NY Science Standards Wiki mirrors](https://nyssls.info/) of NGSS PE pages, retrieved 2026-09-21 |
| Companion docs | [SCIENCE_MODEL.md](SCIENCE_MODEL.md) (mechanics), [GDD.md](GDD.md) (missions), [ACCEPTANCE_CONTRACT.md](ACCEPTANCE_CONTRACT.md) (evidence) |

## 1. Performance expectations — verbatim anchors

| PE | Statement (verbatim) | Clarification statement (verbatim, abridged where noted) |
| --- | --- | --- |
| MS-LS2-1 | Analyze and interpret data to provide evidence for the effects of resource availability on organisms and populations of organisms in an ecosystem. | Emphasis is on cause and effect relationships between resources and growth of individual organisms and the numbers of organisms in ecosystems during periods of abundant and scarce resources. |
| MS-LS2-2 | Construct an explanation that predicts patterns of interactions among organisms in a variety of ecosystems. | Emphasis is on predicting patterns of interactions such as competition, predation, mutualism, and parasitism in terms of the relationships among and between organisms. |
| MS-LS2-3 | Develop a model to describe the cycling of matter and flow of energy among living and nonliving parts of an ecosystem. | Emphasis is on describing the conservation of matter and flow of energy associated with ecosystem, and on defining the boundaries of the ecosystem. Assessment does not include the use of chemical reactions to describe the processes. |
| MS-LS2-4 | Construct an argument supported by empirical evidence that changes to physical or biological components of an ecosystem affect populations. | Emphasis is on recognizing patterns in data and making warranted inferences about shifts in populations due to changes in the ecosystem. |
| MS-LS2-5 | Evaluate competing design solutions for maintaining biodiversity and protecting ecosystem stability. | Examples of ecosystem protections could include water purification, waste management, nutrient recycling, prevention of soil erosion, and eradication of invasive species. Examples of design solution constraints could include scientific, economic, and social considerations. |

DCI language most relevant to mechanics (from the PE pages above): **LS2.A** — organisms with similar requirements compete for limited resources; growth is limited by resource access (MS-LS2-1). Predation can reduce or eliminate populations; mutually beneficial interactions can become interdependent (MS-LS2-2). **LS2.B** — food webs model matter/energy transfer among producers, consumers, decomposers; decomposers recycle nutrients back to the water; atoms cycle repeatedly between living and nonliving parts (MS-LS2-3). **LS2.C** — ecosystems are dynamic; disruptions to any physical or biological component can shift all populations (MS-LS2-4); biodiversity integrity is a measure of ecosystem health (MS-LS2-5, NYSED addition). **ETS1.B** — a solution needs testing and modification based on results (secondary to MS-LS2-5).

## 2. Coverage matrix — mechanics → PEs

Coverage classes: **Direct** — the mechanic is the PE practiced in-game; **Supporting** — the mechanic builds prerequisites/context; **Content-only** — taught in science-note text, not simulated (declared boundary).

| Game mechanic / mission element | LS2-1 | LS2-2 | LS2-3 | LS2-4 | LS2-5 | Class | Evidence the learner produces |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Nutrient runoff disruption (R-30) — nutrient availability drives bloom | ● | ○ | ○ | ● | | Direct (1,4) | Trend evidence linking runoff window → algae rise |
| Algal shading of waterweeds (R-02/R-03) — light competition | ● | ● | ○ | ● | | Direct (1,2,4) | Clarity + weed decline comparison |
| Food-web view with typed links (predation/grazing/decomposition) | | ● | ● | ○ | | Direct (2,3) | Explained pathway between two organisms |
| Decomposer card + nutrient-loop trace (R-20/R-21) | | | ● | ○ | | Direct (3) | Traced loop: nutrients→producers→detritus→nutrients |
| DO curve with 5.0 mg/L stress line (R-21/R-23/R-40) | ● | | ○ | ● | | Direct (1,4) | DO evidence vs consumer declines |
| Sensitive-vs-tolerant contrast (mayfly vs snail timing) | ● | ● | | ● | | Direct (1,2,4) | Ordering-of-declines evidence |
| Hypothesis + prediction + compare (mission loop) | | ○ | | ● | | Direct (4) | Prediction record; support/refute/uncertain classification |
| Evidence classification (supports/refutes/uncertain) | ● | | | ● | | Direct (1,4) | Cited evidence items per claim |
| Intervention menu with cost/speed/reversibility tags | | | | ● | ● | Direct (4,5) | Tradeoff comparison; justified choice |
| Plausible-but-ineffective first intervention + revision path | | | | ● | ● | Direct (4,5) | Revised argument after observing outcome |
| Trophic-cascade lever (bluegill reduction, R-13) | | ● | | ● | | Supporting | Second-order-effect prediction & test |
| Aeration (symptom relief) vs runoff diversion (source control) | | | | | ● | Direct (5) | Evaluation of competing solutions |
| Seed variants with different initial conditions | ● | ○ | | ● | | Supporting | Generalization across cases |
| Science notes ("what the model does not show") | | | ● | | | Content-only | Boundary awareness (LS2-3 "define the boundaries") |
| Energy-flow arrows (direction only, no quantities) | | | ● | | | Content-only | LS2.B energy-flow vocabulary |

● = explicit target of the mechanic. ○ = incidentally exercised.

**Direct-coverage guarantee:** each PE is hit by ≥2 **learner-evidence-bearing** Direct mechanics backed by a frozen rule, and every PE has ≥3 Direct-class mechanics counted by the matrix above (counting rows whose class cell names that PE in Direct). No PE is covered by content text alone: LS2-1 (runoff→bloom, DO stress, contrast pairs, evidence classification), LS2-2 (food web, shading competition, cascade lever), LS2-3 (decomposer loop, food-web transfer arrows, **nutrient-loop budget accounting (R-21 mineralization/egestion/export — Direct, evidence: traced loop with conservation accounting)**, boundary notes), LS2-4 (prediction/compare loop, evidence classification, ordering evidence, intervention testing), LS2-5 (intervention tradeoffs, competing solutions, revision path).

## 3. Mission ↔ PE mapping

| Mission (GDD §7) | Primary PE | Secondary PE | What "done" requires (evidence-based) |
| --- | --- | --- | --- |
| M1 "First Day on the Job" (guided) | LS2-4 | LS2-1, LS2-2 | Explain the bloom→DO→consumer chain with ≥3 cited evidence items; prediction compared; guided hypothesis revised at least once if evidence warrants |
| M2 "Pond Crisis" (independent) | LS2-1 + LS2-4 | LS2-2, LS2-5 | Identify the driver (nutrient runoff) via evidence; state prediction; choose/justify intervention; outcome bands met with tradeoff acknowledged |
| M3 "Downstream Farm" (variant A) | LS2-2 | LS2-4, LS2-5 | Different initial conditions incl. decoy correlation; explain why evidence discriminates driver vs decoy |
| M4 "Legacy Load" (variant B) | LS2-5 | LS2-3, LS2-4 | Nutrients already cut; detritus legacy dominates; compare competing solutions incl. dredge vs aeration vs patience |
| M5 "Clear-Water Puzzle" (replay path) | LS2-2 | LS2-4 | Top-down lever (bluegill) as first plausible-but-insufficient step; revision to combined solution |

## 4. Practices & crosscutting concepts exercised

| NGSS dimension | Where exercised |
| --- | --- |
| Analyzing & Interpreting Data (SEP-4) | Trend charts/tables; band words; comparing windows (LS2-1, LS2-4) |
| Constructing Explanations (SEP-6) | Hypothesis→evidence→conclusion flow; mission conclusion builder (LS2-2, LS2-4) |
| Engaging in Argument from Evidence (SEP-7) | Support/refute/uncertain classification; revision without penalty (LS2-4, LS2-5) |
| Developing & Using Models (SEP-2) | Food web as model; nutrient-loop trace; boundary notes (LS2-3) |
| Cause & Effect (CCC-2) | Every causal rule carries a learner-facing arrow label |
| Stability & Change (CCC-7) | Trend windows; lag mechanics; recovery trajectories |
| Energy & Matter (CCC-5) | Nutrient-loop trace; decomposition (LS2-3) |
| Systems & System Models (CCC-4) | Food web; "what the model does not show" notes |

## 5. Misconception coverage (link to SCIENCE_MODEL §8)

The NGSS bundle's emphasis on *evidence-based argument* and *dynamic (not static) ecosystems* is operationalized through guardrails M-1…M-9. The two most load-bearing: **M-1** (no single balance/health score — success is multidimensional and scenario-specific) and **M-2/M-3** (lags are visible; correlation is not accepted as causation — missions require comparing evidence, never single-chart answers).

## 6. Out-of-scope curricular claims (honesty boundary)

- No claim of full NGSS MS-LS2 *bundle* coverage (e.g., LS2-2's mutualism/parasitism patterns are content-only in v1: snail–weed habitat texture is referenced in notes, not simulated; parasitism excluded entirely — SCIENCE_MODEL §7).
- No assessment claim: the game produces **learner evidence artifacts**, not standardized-test predictions.
- Energy quantities (kcal/J, 10% rule) are content-only, not simulated (SCIENCE_MODEL §5, §7).
- Chemical reactions (photosynthesis/respiration equations) are content-only per the MS-LS2-3 assessment boundary.
