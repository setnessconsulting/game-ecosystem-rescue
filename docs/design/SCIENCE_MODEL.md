# SCIENCE_MODEL.md — Ecosystem Rescue, Pond Crisis

| | |
| --- | --- |
| Status | **FROZEN STRUCTURE, PROVISIONAL VALUES.** The rules below are frozen as `pond-crisis-1.3` (GAME-317 decisions (d) and the per-link grazing half-saturation, §9.1 F-2/F-3/F-9). The numeric set `pc1-params-1.3` in §9 is **provisional**: the evidence harness does not pass, and the §11-2 canonical chain does not land inside every window. Nothing here may be presented as verified science. See the banner and §9.1. |
| Model class | Pedagogical causal model — **not** a research-grade ecology simulator |
| Rule IDs | `R-*` (stable identifiers; ER-03 code and golden traces must reference these IDs) |
| Model version identity | `SIM_MODEL_VERSION = "pond-crisis-1.3"`, `PARAM_SET_VERSION = "pc1-params-1.3"` (emitted in every replay trace; matches `evidence/calibration-sim.mjs` exactly) |
| Curriculum anchors | [CURRICULUM_MAP.md](CURRICULUM_MAP.md) — MS-LS2-1…MS-LS2-5 |
| Review requirement | ER-04 requires an independent, source-based science review bound to this document's exact revision (GAME-317 acceptance) |

> **ER-01 close-out banner (2026-09-21, second pass — GAME-317 decision (d)).** Packet A's structural fixes are in force (R-01b as an explicit die-back flow; R-21 `mineralizationFraction`; R-20 `egestionFraction`/`exportFraction`; R-30 `backgroundInflow`; R-10 per-link removal; R-41's escalation formula; R-40 bluegill onset 5.0 with a 2-tick average; §6.5's frozen evaluation order). This pass adds the **structural revision that the calibration forced**, on the product owner's explicit decision:
>
> 1. **R-01 is restated** — the logistic ceiling is the fixed self-shading capacity, not the instantaneous nutrient pool; the pool is a saturating supply factor plus a hard mass constraint. The v1.0/1.1 reading made the bloom's growth fall with the pool, which made the pool's equilibrium sit strictly above the bloom and made R-04's mass die-off unreachable (measured; §9.1 F-2).
> 2. **R-01b is restated** — the bloom sheds the part of its own losses that its growth no longer covers, at a frozen rate. This is what packet A's disposition #3 asked for ("decay-from-excess… ceiling = 0 ⇒ exponential crash"); the fixed bloom-density threshold that the mid-session revision substituted for it is recorded as R-01c and does not fire usefully.
> 3. **`SIM_MODEL_VERSION` / `PARAM_SET_VERSION` were bumped to 1.2 and are now 1.3** after the per-link grazing half-saturation (F-9) — the document and `evidence/calibration-sim.mjs` agree exactly.
> 4. **`p.nutrientHalfSaturation` is added** (R-01's supply factor) and `p.bloomCrashThreshold` is retired from the frozen rule.
>
> **What is NOT done.** The harness does not pass. As of the latest measurement it passed 27 of 45 checks, and the canonical chain does not land inside all of its §11-2 windows. The values in §9 are **provisional**, and §9.1 lists the findings (F-1…F-11) and the explicit ER-04 gate items. **The single largest blocker is F-9** — three consumers sharing one resource are competed to exclusion, which removes the grazing that makes the bloom's die-back fast enough to drive hypoxia. A per-link grazing half-saturation was authorised, implemented (v1.3) and measured to be insufficient on its own; a type-III predation response or a second resource axis is the next decision. **ER-03 must not begin until the harness is green** and §9 is re-frozen with a Jira record; GAME-317's acceptance criteria are not all met by this revision.

> **Sourcing policy.** Every canonical rule carries a source with provenance. No rule or number in this document may be treated as science truth merely because a model or prompt generated it. Sources marked **[Q]** are quantitative and anchor a model number; **[C]** are qualitative/contextual. Where a real-world value is simplified into model units, the simplification is stated at the rule.

---

## 0. Source ledger (canonical)

| # | Source | Used for | Class |
| --- | --- | --- | --- |
| S1 | NGSS MS-LS2 bundle, *Ecosystems: Interactions, Energy, and Dynamics* — nextgenscience.org DCI arrangement; PE/DCI text mirrored at nyssls.info (MS-LS2-1…MS-LS2-5 pages, retrieved 2026-09-21) | Learning objectives; DCI language for LS2.A–LS2.C | C |
| S2 | USGS, *Nutrients and Eutrophication* (Water Resources Mission Area, 2019) — usgs.gov/mission-areas/water-resources/science/nutrients-and-eutrophication | Eutrophication causal chain: nutrients → algal overgrowth → decay by bacteria consumes dissolved oxygen → hypoxia/fish kills; N vs P limitation; phosphate adsorbs to soil particles (erosion transport) | C |
| S3 | NOAA Ocean Service, *What is eutrophication?* (updated 2024-06-16) | Chain: nutrients feed algae → algae grow and block sunlight → plants die without light → algae die → bacteria digest dead plants using oxygen → fish/wildlife die without oxygen | C |
| S4 | US EPA, *Hypoxia 101* (ms-htf) — hypoxia < 2–3 mg/L DO; decomposing algae consumes oxygen; mobile organisms flee, less-mobile are killed | **[Q]** DO thresholds; consumer response classes | C+Q |
| S5 | US EPA, *The Effects: Dead Zones and Harmful Algal Blooms* (nutrientpollution) — "overgrowth of algae consumes oxygen and blocks sunlight from underwater plants; when the algae eventually dies, the oxygen in the water is consumed" | Shading mechanism; bloom-crash sequence | C |
| S6 | US EPA, *Nutrient Pollution — The Problem* (nitrogen & phosphorus sections): excess N and P are the primary drivers; P typically limiting in freshwater | **[Q]** "phosphorus is usually the limiting nutrient in freshwater" for the runoff model; farm-fertilizer + septic/leaky-wastewater runoff sources | C+Q |
| S7 | US EPA water-quality reporting guidance on dissolved oxygen (national ambient criteria doctrine summarized in EPA DO factsheets; e.g., nepis EPA factsheet *Dissolved Oxygen*) — DO < 5 mg/L stresses many warm-water aquatic life forms; higher needs for early life stages | **[Q]** 5 mg/L stress threshold for warm-water biota | Q |
| S8 | UF/IFAS FA27 *Dissolved Oxygen for Fish Production* — fish stress below ~5 mg/L; gulping at surface below ~2 mg/L; warm water holds less O₂ | **[Q]** fish stress bands; temperature–DO interaction (qualitative in model) | Q |
| S9 | USGS Nutrients/HAB background (S2 above), incl. USGS-documented overgrowth of duckweed/filamentous algae depriving organisms of oxygen and sunlight | Shading + oxygen mechanisms for freshwater pond | C |
| S10 | *Daphnia* ecology reviews (waterflea.org overview citing primary literature; ScienceDirect filter-feeding literature) — Daphnia graze phytoplankton by filtration; sensitive to low oxygen and pollutants; blooms can exceed grazing capacity | **[Q/C]** grazer role; filter-feeding capacity limit; low-DO sensitivity | C+Q |
| S11 | EPT/biomonitoring literature and agency pages (Maine DEP biomonitoring; Ausable River Association "What Insects Tell Us About Water Quality"; Save the Sound EPT explainer) — mayflies (Ephemeroptera) are pollution-sensitive indicators of clean, well-oxygenated water | **[C]** mayfly as sensitive grazer/collector; presence signals oxygenated water | C |
| S12 | Functional feeding group references (Notre Dame BIOS 21202; waterontheweb.org stream ecology) — scrapers (snails, mayfly nymphs) graze periphyton/algae from surfaces; shredders/collectors process detritus | **[C]** snail/mayfly grazing roles; detrital pathway | C |
| S13 | Bluegill diet ecology (Animal Diversity Web, U. Michigan — *Lepomis macrochirus*; BioFiles summary; MSU Extension "Lessons from the humble bluegill") — carnivorous/invertivorous: aquatic insects, snails, zooplankton, small prey | **[C]** secondary consumer diet breadth | C |
| S14 | Pond littoral predation studies (Gilinsky 1984, *Ecology* — fish predation structures benthic macroinvertebrates; Cornell eCommons pond predator-addition study 2023) | **[C]** fish suppress invertebrate grazers (top-down link) | C |
| S15 | Aquatic insect ecology (TPWD Aquatic Science ch.8; fishbio.org) — dragonfly nymphs are aquatic predators eating smaller invertebrates | **[C]** invertebrate predator role | C |
| S16 | Carpenter et al. 1985, *Cascading Trophic Interactions and Lake Productivity*, BioScience (cited 3,700+); Carpenter & Kitchell 1993 — trophic cascade: piscivore/planktivore/zooplankton/phytoplankton linkages | **[C]** top-down cascade justification (bounded, see R-31) | C |
| S17 | Heisler et al. 2008, *Eutrophication and Harmful Algal Blooms* (HABs & Hypoxia scientific assessment) — nutrient pollution promotes bloom development/persistence | Bloom timing/likelihood vs load | C |
| S18 | Freshwater bacteria/DOC literature consensus (e.g., municipal wastewater BOD treatment doctrine; USGS water science school) — microbial decomposition of organic matter consumes dissolved oxygen | **[Q]** decomposition→BOD→DO consumption pathway | C+Q |
| S19 | Stamp, *Ecological Misconceptions Survey III* (2006, Bull. Ecol. Soc. Am.) and Kricher 2009, *The Balance of Nature: Ecology's Enduring Myth* — "balance of nature" is a documented learner misconception; ecologists reject a single fixed equilibrium | Misconception guardrails (§8) | C |
| S20 | EPA NPDES Stormwater BMP fact sheets (wet ponds; riparian/shoreline buffer guidance from stormwater-management practice) — vegetated buffers filter runoff; stormwater ponds mitigate nutrient loading; aeration mixes water and raises DO | **[C/Q]** intervention menu justification | C |

Missing-source honesty note: USGS S2 documents N-limitation vs P-limitation via the N:P ratio. Pond Crisis deliberately models **one combined nutrient index** (see R-10) and therefore **does not claim** N/P stoichiometry fidelity; that exclusion is recorded in §7.

## 1. Model purpose and class

- **Purpose.** Produce a learner-trustworthy causal model of a eutrophication disturbance in a small temperate pond, sufficient for MS-LS2 evidence-based inquiry gameplay. Optimize **causal legibility** (every outcome traceable to named rules) over ecological realism.
- **Not.** It is not predictive of any real pond, does not model species-specific physiology, hydrodynamics, chemistry, or seasonality, and makes no real-world management recommendation.
- **Stance on truth.** The kernel is the *game's* ecological authority; the sources above are the *model's* authority. Where the two conflict, the model simplifies and the simplification is displayed to the learner in the organism/science notes.

## 2. Time model

| Property | Locked value |
| --- | --- |
| Tick | **1 tick = 1 in-model day** at 20 °C reference. |
| Advance | Only via explicit `advanceDays(n)` (n ≤ 7 per commit) or `autoRun(days)` (≤ 60). No frame/wall-clock input (TECHNICAL_DESIGN §D-2). |
| Mission horizon | 60 ticks (≈ 2 months) — matches the "weeks, not hours" scale of visible eutrophication response [S2, S3, S17]. |
| Causal lag | Three lags, each through a real intermediate stock: **nutrients → algae** — no lag inside the tick (R-01's growth draws on the pool the same tick), the visible lag is the *loading phase* (days 0–10) that raises the pool; **algae → detritus → DO** — 2–4 ticks through the decomposition pipeline (R-21), because the dead mass must first become detritus and then be decomposed; **DO stress → consumer decline** — 1–2 ticks through the running average (R-40). See §6.5 for the within-tick order. |
| Disruption window | Scenario data (ER-04); canonical Pond Crisis injects runoff on days 0–10 (loading phase) — the player observes the response, not the injection itself. |

**Lag pedagogy (misconception guard).** The model must never show "nutrients rise → fish die instantly" — the causal chain is sequential [S2, S3]. The evidence UI exposes the chain steps with their lags; the learner-facing language (frozen in UX_USER_FLOW §3.5) is: "Each day the pond answers the *last* few days' conditions."

## 3. Learner-visible quantities: units and semantics

Every learner-visible value is one of four kinds, with the kind **always rendered** in UI (TECHNICAL_DESIGN §D-5 label rule):

| Kind | Meaning | Rendering rule |
| --- | --- | --- |
| `index` | Abstract 0–100 model unit. **Never** a count or a real measurement. | Label shows "index (0–100)"; organism cards show trend arrows + band words. |
| `relative abundance` | 0–100 index interpreted as *density relative to the scenario's pristine pond for that role*. | "relative abundance (anchored per scenario: the undisturbed pond is the reference)" |
| `mg/L` | Milligrams per liter — used **only** for dissolved oxygen, the one quantity where the game uses a real-world-anchored unit because thresholds are public knowledge [S4, S7]. | Numeric display allowed, 1 decimal, with the 5 mg/L stress line on charts. |
| `days` / `weeks` | Model time. | "Day 12 (about 2 weeks)" |

| Quantity | Kind | Range | What it *represents* | What it is **not** |
| --- | --- | --- | --- | --- |
| Nutrient load | `index` | 0–100 | Combined dissolved N+P availability from runoff/waste sources (single index, see R-10) | Not N or P individually; not a concentration |
| Algae (phytoplankton) | `relative abundance` | 0–100 | Bloom-forming free-floating algae + cyanobacteria (one lumped producer pool) | Not a species count; not chlorophyll-a |
| Waterweeds (submerged plants) | `relative abundance` | 0–100 | Rooted submerged vegetation needing light | Not emergent or floating-leaf plants |
| Water fleas (zooplankton) | `relative abundance` | 0–100 | *Daphnia*-class filter-feeding grazers | Not all zooplankton |
| Mayflies | `relative abundance` | 0–100 | Sensitive benthic scraper/collector insects (Ephemeroptera-class) | Not the full benthos |
| Snails | `relative abundance` | 0–100 | tolerant benthic grazers (pulmonate-class) | — |
| Bluegill | `relative abundance` | 0–100 | Small panfish (secondary consumer), aggregated school | Not individual fish |
| Dragonfly nymphs | `relative abundance` | 0–100 | Invertebrate predator (macroinvertebrate carnivore) | — |
| Decomposer activity | `index` (derived) | 0–100 | Microbial decomposition rate proxy (not a population) | Not bacterial biomass or species richness |
| Dissolved oxygen | `mg/L` (derived) | 0.0–15.0 | Whole-pond daily DO | Not depth-resolved; not diurnal range (§7) |
| Water clarity | `index` (derived) | 0–100 | Light penetration proxy (100 = clear) | Not Secchi depth; not turbidity NTU |
| Temperature, water level | scenario inputs (v1) | — | Frozen per scenario in v1 (warm, stable early summer); not simulated | Not climate variables in v1 |

**False-precision guard.** All `index`/`relative abundance` displays carry their kind label; no decimal places are shown for indices; the DO value is the only learner-visible decimal. Graphs label axes with the kind, not raw units.

## 4. Organism roster and roles (frozen)

Seven organism groups spanning six trophic roles (producers ×2, primary consumers ×3, secondary consumer, invertebrate predator) plus an implicit decomposer layer — inside the GAME-316 “6–8 biological roles/species” envelope, chosen to complete the interaction topology rather than for visual appeal:

| Role | Organism (learner name) | Trophic role | Key interactions | Sensitivity profile | Source |
| --- | --- | --- | --- | --- | --- |
| Producer (planktonic) | **Algae** | Primary producer; bloom driver | Grows on nutrient load; shades waterweeds; eaten by water fleas | Rises with nutrients; crashes when nutrients cut or grazed hard | S2, S3, S5, S6, S10 |
| Producer (rooted) | **Waterweeds** | Primary producer; habitat provider | Compete with algae for light (are shaded by it); need clear water | Decline under shading; slow to recover (growth-rate lag) | S3, S5, S9 |
| Primary consumer (pelagic) | **Water fleas** | Filter-feeding grazer | Eat algae (main check on blooms); eaten by bluegill | Decline in low DO; can be overgrazed by fish (top-down) | S10, S13, S14, S16 |
| Primary consumer (benthic) | **Mayflies** | Sensitive scraper/collector | Graze algae/periphyton on surfaces; prey for bluegill & dragonflies | **First to decline** in low DO (pollution-sensitive indicator, S11); their exposure to a bloom is through oxygen, not siltation — the model has no siltation rule (§7) | S11, S12 |
| Primary consumer (benthic) | **Snails** | tolerant scraper | Graze surfaces; prey for bluegill | More low-DO tolerant than mayflies; persists into decline (contrast pair for evidence reasoning) | S11, S12 |
| Secondary consumer | **Bluegill** | Invertivorous fish | Eat water fleas, mayflies, snails | Decline with sustained low DO (< ~5 mg/L stress; < 2–3 mg/L severe) [S4, S7, S8]; prey shortage compounds | S4, S7, S8, S13 |
| Invertebrate predator | **Dragonfly nymphs** | Aquatic predator | Eat mayflies, snails, water fleas | Moderate DO sensitivity (between mayfly and snail, set as parameter) | S15 |
| Decomposer (implicit) | *(microbes — visible as "Decomposer activity")* | Recycler | Convert dead biomass → nutrients; consume DO while doing it | Activity tracks detritus stock and temperature | S2, S3, S18 |

**Why these and not prettier ones.** The set completes every GAME-316-required relationship: producer×2 with competition-for-light, grazer chain (pelagic + benthic), sensitive-vs-tolerant contrast pair (mayfly/snail) enabling "which organisms disappear first" evidence, a vertebrate secondary consumer with public DO-threshold knowledge, an invertebrate predator enabling top-down arcs, and an explicit decomposer pathway (the MS-LS2-3 anchor). Adding a third consumer or a fourth producer would double rule surface without adding a teachable pattern in v1.

## 5. Typed model elements: stocks, flows, rates, derived indicators

| Element | Type | Notes |
| --- | --- | --- |
| Nutrient load, Algae, Waterweeds, Water fleas, Mayflies, Snails, Bluegill, Dragonfly nymphs, Detritus (internal, not learner-visible in v1), Oxygen demand pool (internal) | **Stocks** | State carried between ticks; capped 0–100 (indices), DO 0–15.0 |
| Growth, grazing, predation, mortality, reproduction, decomposition, re-aeration, settling | **Flows** | Computed per tick from stocks × parameters; never persisted as state |
| Decomposer activity | **Rate (derived)** | f(detritus, temperature); displayed as index |
| Dissolved oxygen | **Derived stock** | Updated from flows (production − consumption ± re-aeration); clamp [0, 15.0] |
| Water clarity | **Derived indicator** | f(algae) only in v1 (simplification, §7) |
| Population trend arrows, band words (thriving/stable/strained/crashing), "days since" facts | **Presentation-derived facts** | Computed from history by the evidence layer, *not* new state |

**Conservation statement (MS-LS2-3 anchor).** Matter is tracked on one closed loop: nutrient load → producer biomass → (death) → detritus → (decomposition) → nutrient load; decomposition consumes oxygen while recycling nutrients, and producers re-release oxygen via photosynthesis. The model conserves the *topology* of this cycle (nothing appears from nowhere or vanishes silently; every loss on one edge appears on another) but does **not** conserve strict mass units — indices are unitless. Energy flow is represented directionally (producer→consumer→decomposer arrows in the food web) but is **not** tracked as a quantity in v1; the 10% "energy pyramid" rule is taught in content text only, not simulated (§7).

## 6. Causal rules (frozen, sourced)

Parameters named `p.*` are frozen in §9 with ranges. Each rule ID must appear as a code-level rule ID in ER-03 and in replay trace evidence.

### 6.1 Producers

- **R-01 Algal growth.** Two independent limitations, kept deliberately separate (finding F-2): a **self-shading capacity** and a **nutrient supply**. `algaeGrowth = min( p.algaeGrowthRate × (nutrients / (p.nutrientHalfSaturation + nutrients)) × algae × (1 − algae/p.maxAlgae), nutrients )`. The logistic ceiling is the **fixed** capacity `p.maxAlgae` — it is *not* the instantaneous nutrient pool; the pool enters as a saturating supply factor and as the hard mass constraint `uptake ≤ nutrients` (new algal biomass draws from the pool 1:1, so the loop stays mass-exact). Consequences that the v1.0 form got wrong: (a) the bloom can overshoot its nutrient supply and starve, because its growth no longer collapses the moment the pool falls; (b) the pristine pond can sit at a low, *stable* algal level even while the pool is low. The v1.0 reading (`nutrientCeiling = p.maxAlgae × min(1, nutrients/100)` as the logistic ceiling) made the growth fall with the pool, so the bloom self-arrested before it could ever exhaust its supply — the mechanism R-04 depends on was unreachable (measured: EVIDENCE.md §5, findings F-2/F-4). *Source:* S2, S3, S6 (nutrient-enriched algal overgrowth); S5/S9 (bloom self-shading). *Simplification:* growth is not light- or temperature-dependent in v1.
- **R-01b Bloom die-back ("bloom crash").** `bloomDieback = p.bloomCrashRate × max(0, losses − growth)` where `losses = p.algaeSenescence × algae + grazing on algae` (all from the pre-tick snapshot, §6.5) and `growth` is R-01's. The bloom sheds the part of its own losses that its growth no longer covers, at a frozen rate. Three properties matter: (i) while the bloom is well supplied, `growth ≥ losses`, the term is **exactly zero**, and the healthy pond is untouched — a pristine fixed point is not perturbed by the existence of a crash rule; (ii) when the supply collapses the term *is* the mass death — the bloom's stock falls at `1 + p.bloomCrashRate` times its natural loss rate, which is S3/S5's "the algae dies too" as a flow rather than a narrative; (iii) at `nutrients = 0` the growth is zero and the crash is maximal, i.e. an exponential die-off (the review disposition's "ceiling = 0 ⇒ exponential crash"). Shed mass is detritus (R-20) and therefore DO demand (R-21), which is the whole point of the rule. R-01b is a **mass** rule like every other: it moves matter, it never creates or destroys it. *Source:* S3, S5, S18 (the bloom-crash → decomposition → hypoxia sequence the mission teaches). *Simplification:* one lumped bloom pool, no species-level bloom composition, no toxigenic species (§7).
- **R-01c (recorded, not frozen): alternative die-back readings.** A fixed bloom-**density** threshold and a shedding of everything above the instantaneous nutrient **ceiling** were both implemented in the evidence harness and both fail to produce the canonical chain: the density form sheds only the bloom's *throughput* (≈2 index/tick at its plateau), and the ceiling form cannot fire at all under a pool-keyed R-01, because the pool's equilibrium sits strictly above the bloom. Both are kept behind harness flags as F-4 evidence and are **not** the frozen rule. See EVIDENCE.md §5.
- **R-02 Waterweed growth.** Logistic growth toward a fixed carrying capacity, **scaled by clarity**: rate multiplier `0.2 + 0.8 × (clarity/100)`. Shaded weeds barely grow; recovery after clearing is visibly slow (multi-tick). *Source:* S3, S5, S9 (bloom shades out underwater plants). *Simplification:* no seasonality; no grazing on weeds in v1.
- **R-03 Light competition.** Clarity = `100 − p.shadingCoefficient × algae` (clamped ≥ 0). Algae reduce light; waterweeds have no reciprocal effect on planktonic algae in v1. *Source:* S3, S5 ("blocks sunlight").
- **R-04 Producer death.** Background senescence: a constant small fraction of algae and weeds flows to Detritus each tick (`p.algaeSenescence`, `p.weedSenescence`). **Mass bloom death is an explicit flow, not a reversal of the logistic term** — see R-01b: when the nutrient supply no longer covers the bloom's own losses, the shortfall is shed to detritus at a frozen rate, so the bloom dies *en masse* exactly as S3/S5 describe. A clamped logistic term cannot express this (it can only stop growth); the v1.0 text claimed the reversal would emerge from R-01, and the harness demonstrated that it does not. *Source:* S3 ("eventually, the algae dies too"), S5 (bloom-crash sequence).

### 6.2 Consumers and predation

- **R-10 Per-link removal (Holling-II shape).** Removal is **directly parameterized per link**: for consumer C eating prey X, `removal = min( p.removalRate[C] × h(X) × stock[C], preyAvailable[X] )`, with the grazing response `h(X) = X/(p.halfSaturation[C] + X)` — **a per-link grazing half-saturation** (v1.3, finding F-9) — and the predation response `h(X) = X/(p.predationHalfSaturation + X)`. The two *families* differ because a predator's functional response saturates at a different prey density than a filter-feeder's (F-3); within the grazers the half-saturation differs *per link* because three consumers sharing one resource with an identical functional response are ecologically identical, and the model then competes them to exclusion (see F-9 — the differentiation is necessary but, measured on its own, **not sufficient**). The `min(…, preyAvailable)` term is the mass guard: a link can never remove more prey than exists, and the frozen evaluation order (§6.5) decides who eats first when several links share a prey. *Source:* standard functional-response form; the split follows S10 (filter feeding) and S13/S14 (predator intake), and the per-species affinity reflects the scraper/filter-feeder distinction in S11/S12. *Simplification:* no prey switching, no refuges, no handling time, no type-III response.
- **R-11 Predation links (frozen).** Water fleas ← Algae (grazing). Mayflies ← Algae/periphyton (grazing, shares the algae pool with water fleas at reduced efficiency). Snails ← Algae/periphyton (grazing, reduced efficiency). Bluegill ← Water fleas, Mayflies, Snails. Dragonfly nymphs ← Water fleas, Mayflies, Snails. No cannibalism; no consumer–consumer predation beyond dragonfly→grazer links; **no bluegill↔dragonfly link exists in v1 — that edge is not modeled, not "absent in nature"**: in a real pond a large bluegill will take a dragonfly nymph, and the learner-facing card must say the model leaves the interaction out rather than imply the two never interact. *Source:* S10, S12, S13, S14, S15. *Simplification:* predation is a per-link rate on the pre-tick snapshot (§6.5), with no refuges, no size structure, and no behavior.
- **R-12 Consumer production & mortality (mass budget).** A consumer's removed prey mass is split by R-20 and the rest is assimilated; **maintenance respiration is a share of the assimilated intake** (`p.maintenance`), and production is what remains: `assimilated = (1 − p.egestionFraction) × removed`, `respired = p.maintenance × assimilated`, `surplus = assimilated − respired`, then `births = surplus × recruitment` and `shed = surplus × (1 − recruitment)` with `recruitment = clamp(1 − stock/p.carryingCapacity, 0, 1)`; `deaths = p.backgroundMortality × stock`. Shed surplus goes to detritus, so no matter is stranded at the cap (the loop identity, §5, holds exactly). **There is no separate `p.reproduction` parameter** (finding F-1): production falls out of the mass budget. A body-mass-scaled maintenance or a fixed share-of-intake production is flux-infeasible — at any baseline where consumers sit in the upper abundance bands, the algae's production cannot pay for it. *Source:* S10, S13 (consumer energetics), S18.
- **R-13 Predation pressure (top-down).** Bluegill intake on water fleas uses the same Holling-II form; when bluegill are removed (intervention), water fleas rise → algae fall (clear-water effect). This is a **bounded** trophic-cascade rule: the model produces the classic cascade direction but does not promise magnitude fidelity. *Source:* S14, S16. *Simplification:* no refuges, no behavior-mediated effects.
- **R-14 Competition (explicit).** Algae vs waterweeds compete for light via R-03 only. Mayflies/snails/water fleas do **not** compete in v1 (their shared resource R-11 handles depletion implicitly). *Source:* S12. *Rationale:* keeps MS-LS2-2's "competition" pattern legible as a single clean light-competition story.

### 6.3 Decomposition, oxygen, and the eutrophication chain

- **R-20 Death → detritus (and the export share).** All mortality — senescence, the R-01b die-back, starvation (R-41), stress (R-40), background deaths — plus the unassimilated share of every removal (`p.egestionFraction`) and the shed surplus (R-12) flows to Detritus. A frozen share of consumer mortality + egestion leaves the pond (`p.exportFraction` — emergence of adults, downstream outflow), which is why that share does **not** appear as local detritus. Detritus is an internal stock; **not learner-visible in v1** — its effects are visible through Decomposer activity, DO, and clarity (declared simplification, §7).
- **R-21 Decomposition & oxygen consumption.** `decomposition = p.decompRate × detritus × tempFactor`; `oxygenDemand += p.o2PerDecomposition × decomposition`; `mineralizationFraction` of the decomposed matter returns to the nutrient pool and the remainder is **buried** (leaves the active cycle). `tempFactor` is frozen at 1.0 in v1 (temperature is a per-scenario constant, §3), so it is a placeholder for a future temperature rule, not a live parameter. Decomposer activity index displayed = normalized decomposition rate (**normalization is an ER-04 gate item** — see §9.1's ER-04 list). The decomposition pipeline plus the detritus stock is what produces the canonical **2–4 tick lag** between the bloom's crash and the DO trough. *Source:* S2 ("when the algae die, they are decomposed by bacteria — this process consumes the oxygen dissolved in the water"), S3, S18.
- **R-22 Re-aeration & photosynthetic O₂.** DO relaxes toward saturation `p.o2Saturation` with rate `p.reAeration` (the aeration intervention substitutes `p.reAerationAerated`); algae add `p.o2PerPhotosynthesis × algae`, capped at `p.photoCap`. Re-aeration is the **only** term that makes DO recover toward saturation, so the DO trough depth is set by the balance between `p.o2PerDecomposition × p.decompRate × detritus` and this term — the fact that makes the canonical hypoxia reachable only when the detritus stock is large enough (EVIDENCE.md §5). *Source:* S18; USGS water-properties doctrine (oxygen from atmosphere + photosynthesis). *Simplification:* no diurnal cycle (§7).
- **R-23 DO update.** `DO += (photosynthesis − oxygenDemand − respirationBasal) + reAerationTerm`, clamped [0, 15.0]. The DO value is the model's single real-unit quantity (mg/L).
- **R-30 Nutrient loading and the pool (disruption + baseline).** Scenario-driven inflow during the disruption window: `nutrients += runoffInput`. RunoffInput is scenario data; canonical Pond Crisis uses farm-field fertilizer + failing septic contributions combined into one inflow [S6]. Alongside it the pond has a constant watershed `p.backgroundInflow` (the *undisturbed* supply that holds the pristine pond's pool at its reference — solved per scenario, not hand-set). The pool loses nutrient two ways: **uptake** (R-01's growth, 1:1 by mass) and a settling/denitrification sink `p.nutrientSinkRate × max(0, nutrients − p.nutrientReference)` — a sink on the **excess over the sediment–water exchange equilibrium**, not a proportional decay, because a purely proportional sink makes the pool relax exponentially back to its baseline and no bloom can ever be starved of it [S2 — phosphates settle; denitrification in low-O₂ waters]. The reference is the pristine pool level for the scenario, so it is a per-scenario anchor, not a universal 50.
- **R-31 Nutrient interventions.** Each intervention maps to parameterized stock/flow effects (see §10 interventions table): runoff diversion sets `runoffInput` to 0; a buffer strip multiplies the remaining runoff by ~0.3; aeration substitutes `p.reAerationAerated` for `p.reAeration`; grazer boost adds water fleas; bluegill removal halves the bluegill stock; dredging removes 60% of the detritus stock. *Source:* S20.
- **R-40 Stress and mortality from DO.** Stress is a **linear ramp between an onset and a severe threshold**, on the 2-tick running average of DO: `stressMortality = p.stressMortality × clamp((onset − doAvg)/(onset − severe), 0, 1) × stock`. The frozen thresholds (mg/L, onset/severe) are: mayfly 5.5/3.0, water flea 4.0/2.0, dragonfly 4.0/2.0, **bluegill 5.0/2.5**, snail 2.0/1.0 — the bluegill onset is 5.0 to match S7/S8 (a bluegill starts suffering at the same DO at which warm-water biota generally do), and the mayfly is the most sensitive onset, which is why the sensitive insect is the mission's first visible casualty (M-8). *Source:* S4, S7, S8, S11, S12. *Simplification:* thresholds are fixed constants, not acclimatizing; no behavior-mediated avoidance.
- **R-41 Food limitation.** `starveMortality = p.starveBase × min(p.starveCap, 1 + p.starveEscalation × (hungryTicks − 3)) × stock` on the 3rd and later consecutive tick in which a consumer's assimilated intake falls below its maintenance cost (R-12). **Known limitation, recorded rather than hidden:** under the v1.1 mass-budget form, maintenance is a share of the assimilated intake (`p.maintenance < 1`), so `assimilated < maintenanceCost` can never be true and R-41 is **unreachable by construction** — no consumer in the shipped model starves. Consumer decline is therefore carried entirely by R-40 (DO stress) and predation. R-41 is retained as a frozen rule with a behavioural definition for ER-04 to either wire to a real threshold (e.g. intake per unit biomass) or delete; it must not be counted as a live mechanism in evidence copy. *Source:* standard population-model practice; qualitative support from S10 (grazers cannot persist without adequate food availability).
- **R-42 Behavioral visibility.** Below stress thresholds, organisms display state words (e.g., bluegill "gasping at surface" below 2.5 mg/L) — a **presentation fact** derived from DO + thresholds, never an independent state. *Source:* S8 (piping behavior).

### 6.4 Determinism constraints on the math (binding for ER-03)

- **R-50 Seeded stochasticity (only where allowed).** Small multiplicative noise (±p.noisePct, default 2%) on **reproduction** terms only, generated by the kernel-owned seeded PRNG (xorshift128+ or mulberry32 — ER-02 choice, TECHNICAL_DESIGN §D-2). Growth, flows, and DO use **no noise**. This keeps traces clean while making populations feel alive; the seed is part of scenario identity. (v1.0 also mentioned a "colonization" term; there is no colonization rule in the model — the reference was dangling and has been deleted.)
- **R-51 Integer quantization.** All stocks are stored as **scaled integers** (fixed-point, SCALE = 1000). Arithmetic is integer-only; division uses floor toward zero after scaling; DO keeps one decimal (scale 10). No floating-point in authoritative state (full strategy in TECHNICAL_DESIGN §D-3).
- **R-52 Bounds & invariants.** Clamp stocks to [0, cap] every tick; reject NaN/∞ at serialization (TECHNICAL_DESIGN §D-3, canonical serialization). Invariant tests in ER-03: non-negativity, caps, no divergence (all stocks stay bounded over 10,000-tick soak), DO ∈ [0, 15]. **Known limitation (finding F-5):** an end-of-tick clamp is *not* mass-neutral — when a stock is pushed past its cap, the clamped-away matter vanishes and the §5 loop identity breaks (measured: worst residual ≈2.9 index/tick with the nutrient pool pinned at 100). ER-03 must therefore define cap behaviour as **spill/reject at the boundary** (matter that cannot enter the stock does not leave its source) rather than clamp the stock, and must assert the loop identity **per tick**, not only at the end of a run. §5's "every loss on one edge appears on another" is a machine-checked property of the kernel, not a promise.

### 6.5 Frozen per-tick evaluation order (binding for ER-03)

Every tick is computed in one pass, in this order, and the order is part of the frozen model — a reordering is a `SIM_MODEL_VERSION` event, not a refactor:

1. **Interventions** scheduled for this tick are applied at the tick boundary, in the declared §10 menu order (deterministic, independent of the order the player queued them).
2. **Snapshot.** All flows are computed from the *pre-tick* state. A rule may read a stock's value at the start of the tick but never a value another rule has already updated this tick. There is exactly **one** update pass; no rule is re-evaluated after the state changes.
3. **Derived quantities from the snapshot:** clarity (R-03), then the producer flows — growth (R-01), the bloom die-back (R-01b, which needs the grazing losses and therefore is evaluated after step 4), senescence (R-04), weed growth (R-02).
4. **Removal links (R-10/R-11)** in the frozen consumer order **water flea → mayfly → snail → bluegill → dragonfly**, each link capped by the prey still available in the snapshot. Where several links share a prey, the first in that order takes first — a declared, deterministic simplification with no behavioural justification (documented so it is not mistaken for ecology).
5. **Consumer budgets** (R-12/R-20/R-41): egestion, maintenance, production, shed surplus, background deaths, starvation.
6. **Detritus, decomposition, nutrients, oxygen** (R-20/R-21/R-30/R-22/R-23), including the export share.
7. **Clamps** (R-52) — end of tick only, never mid-pipeline.

Consequences worth stating because they are easy to get wrong: the R-01b die-back is computed after the grazing block (it needs the grazing losses to know whether the bloom's growth covers its losses), which is why it is listed in step 3 but evaluated in step 4's wake; the DO stress term reads a 2-tick running average (§R-40), not the current tick's DO; and events emitted for the evidence layer are derived *after* the update from the pre/post pair, never before it.

## 7. Model boundaries — what this model intentionally does **not** represent

| Exclusion | Why | Learner-facing honesty (v1 wording direction) |
| --- | --- | --- |
| Separate nitrogen vs phosphorus cycles; N:P ratio | Single-index pedagogy; real stoichiometry would triple rule surface [S2 shows the distinction] | Science note: "This pond tracks one combined 'nutrient' measure; real ecologists track nitrogen and phosphorus separately." |
| Diurnal DO cycle (day/night photosynthesis swing) | Would add a second, confusing oscillation; mission-relevant signal is the multi-day trend | Science note on DO card: "Real ponds swing up in the day and down at night; this model shows the daily average." |
| Thermal stratification & turnover | 1-box pond; not needed for the causal chain | Not shown; outside model boundary |
| Depth gradients, sediment chemistry, internal P loading from sediments | 1-box assumption | Science note: "The model treats the pond as one well-mixed bucket." |
| Species-specific physiology, age structure, behavior (refuges, schooling) | Aggregation by role | Organism cards say "represents many kinds of…" |
| Seasonality, immigration from other water bodies, amphibians/birds/mammals | Out of v1 causal scope | Mission briefing lists which species are modeled |
| Toxins (HAB toxins), pathogens, swimmer's itch | Toxin dynamics would need extra state; safety-critical real-world advice kept out of gameplay decisions | Science note: "Some real blooms make toxins; this model does not." |
| Weather events, climate trends | Temperature/level frozen in v1 scenarios | Briefing states "warm, stable early-summer conditions." |
| Fishing, herbicide/algaecide application as player interventions | Algaecide would model toxins on top of nutrients; fishing is human harvest, not ecosystem repair (kept for possible v2 with sourcing) | Not offered; not implied |
| Economic/social constraints quantified | MS-LS2-5 tradeoffs are represented as **cost/speed/reversibility tags**, not dollar values | Intervention cards show qualitative constraint labels |
| Strict mass conservation, energy quantities (kcal/J), 10% rule simulation | Indices are unitless; energy tracked directionally only (§5) | Science note: "Energy flows are shown as arrows, not numbers." |
| Evolutionary/adaptation effects | Time horizon too short | — |

## 8. Misconception guardrails (binding design constraints)

| # | Misconception | Model/design response | Source |
| --- | --- | --- | --- |
| M-1 | One universal "balance of nature" / single health score | **No scalar ecosystem-health score exists anywhere in the model or UI.** Mission outcomes = scenario-specific multidimensional criteria (population bands + DO range + weed recovery + resilience probe). Populations fluctuate around scenario conditions; "healthy" is always defined per-mission. | S19 |
| M-2 | Nutrients instantly kill fish (no lag) | 2–4 tick decomposition lag (R-21) + DO averaging lag (R-40); evidence UI shows the chain steps | S2, S3 |
| M-3 | Correlation proves causation | At least one seeded variant includes a **decoy correlation** (e.g., dragonflies decline *because* their mayfly prey declines, while the decoy signal — a co-occurring clarity wobble — is merely correlated). Missions require comparing ≥2 evidence items before the "supporting/refuting" step is available. | Gameplay contract (GAME-316); model gives decoys real mechanisms |
| M-4 | "Algae are always bad" | Algae are the base producer; moderate algae sustain water fleas/mayflies. Pre-disruption pond has stable algae; the mission is about *excess*, not existence | S2 ("nutrients are essential…too much is the problem") |
| M-5 | Ecosystems return to "the same" equilibrium after disturbance | Recovery criteria include *which* configuration is reached (weed cover, relative abundances); a variant can land in a different-but-also-valid stable configuration, and mission text acknowledges it | S19; GAME-316 resilience wording |
| M-6 | Food chains are linear chains | Food **web** view is primary; every organism card lists ≥2 connections (eaters + eaten + environment) | S1 (LS2.B food webs) |
| M-7 | Decomposers are optional/dirty | Decomposer activity is a first-class card; the MS-LS2-3 mission explicitly asks the player to trace the nutrient loop through it | S1 (LS2.B), S18 |
| M-8 | Bigger animals matter most | Benthic sensitive insects (mayflies) are the earliest crash signal — the game's first visible casualty is an insect, not the fish | S11 |
| M-9 | False precision of numbers | §3 kind labels everywhere; indices never shown as counts | GAME-317 requirement |

## 9. Parameters — provisional set `pc1-params-1.2` (structure frozen, values open)

All values are model units. **Ranges are the legal ER-04 tuning space**: changing a value outside its range, adding a parameter, or changing rule structure requires a new `PARAM_SET_VERSION`/`SIM_MODEL_VERSION` and a Jira record.

**Status.** The *rule structure* below is frozen by GAME-317 (decision (d), §9.1). The *values* are the best the calibration search reached in this session and are **provisional**: the evidence harness (`evidence/calibration-sim.mjs`) passes 27 of its 45 checks, and the failing ones are exactly the §11-2 canonical-chain windows plus the §5 loop identity. Nobody may quote these values as verified. They are listed here because the harness's parameter block and this table must agree exactly (an acceptance criterion), and because ER-04 needs the starting point.

| Parameter | Value | Legal range | Used by | Notes |
| --- | --- | --- | --- | --- |
| p.algaeGrowthRate | 0.30 /tick | 0.10–0.30 | R-01 | Self-shading growth rate (at the range top) |
| p.maxAlgae | 100 | 100 (fixed) | R-01 | The logistic ceiling = the **self-shading capacity**. It is *not* the nutrient pool (decision (d)); the pool enters through the supply factor and the mass constraint |
| p.nutrientHalfSaturation | 28 | 4–40 | R-01 | Pool level at half the growth rate (the supply factor's knee). **New in 1.2.** Sets how strongly a pulse drives the bloom |
| p.bloomCrashRate | 2.00 | 0.05–2.0 | R-01b | Share of the growth shortfall shed per tick (at the range top) |
| p.algaeSenescence | 0.015 | 0.008–0.08 | R-04 | Fraction of algae → detritus /tick |
| p.weedSenescence | 0.008 | 0.008–0.05 | R-04 | Fraction of weeds → detritus /tick |
| p.shadingCoefficient | 0.95 | 0.6–1.2 | R-03 | Clarity loss per algae index point |
| p.weedGrowthRate | 0.20 /tick | 0.05–0.20 | R-02 | Slow — weeds recover slower than algae |
| p.weedK | 85 | 60–100 | R-02 | Weed carrying capacity |
| p.halfSaturation (grazing) | flea 12 · mayfly 30 · snail 20 | 3–40 each | R-10 | Algal index at half intake, **per link** (v1.3, F-9). Differentiating the affinities is necessary for coexistence but not sufficient on its own — see F-9 |
| p.predationHalfSaturation | 40 | 8–80 | R-10 | Prey index at half predator intake (separate from grazing — F-3) |
| p.removalRate | flea 0.040 · mayfly 0.040 · snail 0.040 · bluegill 0.020 · dragonfly 0.020 | 0.004–0.30 (grazers); 0.002–0.05 (predators) | R-10 | Per-link removal at saturation; replaces v1.0's `p.maxIntake` |
| p.egestionFraction | 0.050 | 0–0.40 | R-20 | Share of removed prey mass egested → detritus |
| p.exportFraction | 0.500 | 0.05–0.50 | R-20 | Share of consumer mortality + egestion leaving the pond |
| p.maintenance | 0.100 | 0.02–0.20 | R-12 | Maintenance respiration as a share of **assimilated intake** (F-1) |
| p.carryingCapacity | flea 52 · mayfly 45 · snail 48 · bluegill 80 · dragonfly 40 | 2–400 (per species) | R-12 | Recruitment cap. Sets where each species' births stop paying for its deaths |
| p.backgroundMortality | 0.008 | 0.004–0.04 | R-12 | /tick |
| p.decompRate | 0.15 | 0.15–0.40 | R-21 | Fraction of detritus decomposed/tick (at the range top) |
| p.mineralizationFraction | 0.30 | 0.30–0.95 | R-21 | Share of decomposed matter returned to the pool; the remainder is buried. **Load-bearing**: the return flux (this × decompRate × detritus) is what decides whether the pool can ever fall (§9.1 F-6) |
| p.backgroundInflow | 1.713 /tick | 0–3 (solved) | R-30 | Undisturbed watershed supply; **solved** per parameter set so the pool rests on the reference, never hand-set |
| p.nutrientSinkRate | 0.050 | 0.02–0.10 | R-30 | Settling/denitrification on the pool's excess over the reference |
| p.nutrientReference | 9.0 | 0.5–40 (per scenario) | R-30 | The pristine pool level — a **per-scenario anchor**, not a universal 50 |
| p.o2PerDecomposition | 0.040 | 0.01–0.04 | R-21 | O2 cost per unit of decomposed matter (at the range top); the DO trough depth ∝ this × the detritus flux |
| p.reAeration | 0.084 | 0.05–0.25 | R-22 | Relaxation toward saturation; aeration substitutes 0.30. **The pristine-DO/trough conflict lives here** (§9.1 F-3) |
| p.o2PerPhotosynthesis | 0.001 | 0.002–0.008 declared; 0–0.004 enumerated | R-22 | Per unit algae/tick, capped by `photoCap` 0.5. **Range conflict — see F-6 note** |
| p.o2RespirationBasal | 0.100 | 0.03–0.10 | R-23 | Pond-wide basal consumption (at the range top) |
| p.o2Saturation | 9.0 mg/L | 8.0–10.0 | R-22 | Warm-water saturation anchor [S8] |
| p.stressMortality | 0.15 /tick | 0.05–0.20 | R-40 | Max per-tick mortality at the severe threshold |
| p.noisePct | 0.02 | 0–0.05 | R-50 | Reproduction noise only |
| DO stress thresholds | mayfly 5.5/3.0 · flea 4.0/2.0 · dragonfly 4.0/2.0 · bluegill 5.0/2.5 · snail 2.0/1.0 (onset/severe mg/L) | ±0.5 | R-40 | Anchored to S4/S7/S8 |
| Canonical scenario runoff | 10.0 index/tick for days 0–10 | magnitude 4–20; window days 0–10 (frozen) | R-30 | The loading phase; the mission's disruption |

**Retired in 1.2:** `p.maxIntake`, `p.reproduction`, `p.senescence` (split into `p.algaeSenescence`/`p.weedSenescence`), `p.bloomCrashThreshold` (the density reading of R-01b — recorded in R-01c, not the frozen rule), `p.maintenance` as a body-mass rate.

### 9.1 Calibration outcome — structure frozen as `pond-crisis-1.2`, values provisional (2026-09-21, GAME-317 / ER-01)

An executable harness (`evidence/calibration-sim.mjs`, zero-dependency Node, run
`node docs/design/evidence/calibration-sim.mjs`) implements every rule above and tests it against
the §11 commitments, the §11 sanity tests, the intervention directions and the §5 matter-loop
identity. **Current status: 28 of 45 checks pass.** The pristine pond is a genuine stationary fixed
point with a complete food web; the canonical chain does not yet land inside all of its windows.
Nothing in this section is a claim that the model *works* — it is a record of what was measured,
what was decided, and what remains. Evidence detail: [EVIDENCE.md](EVIDENCE.md) §5.

#### Findings (each one is a measurement, not an argument)

| # | Finding | Consequence |
| --- | --- | --- |
| F-1 | The v1.0 ranges were **flux-infeasible**: a consumer whose maintenance is levied on body mass (or whose production is a fixed share of intake) cannot be supported by the algal production available at any baseline where the consumers sit in the upper abundance bands. | `p.maintenance` is a share of the **assimilated intake**; `p.reproduction` is **removed**. Frozen in R-12. |
| F-2 | **The canonical chain was unreachable, and not because of a number.** With R-01's ceiling equal to the instantaneous nutrient pool, the bloom's growth *falls with the pool*, so the pool's equilibrium sits strictly above the bloom (measured: pool 85 vs bloom 74 at the peak) and the bloom can never exhaust its supply. R-04's "die *en masse* when nutrient supply collapses" therefore never happened: when the pool fell, growth was merely clamped to zero and the bloom senesced slowly. R-01b keyed to a fixed bloom density (as the earlier revision had it) sheds only the bloom's *throughput* — ≈2 index/tick at its plateau — not its standing crop. | **Resolved by decision (d)**: R-01 is restated so the logistic ceiling is the fixed self-shading capacity and the pool is a saturating supply factor plus the mass constraint; R-01b sheds the growth shortfall. Structure frozen; see the provisional values in §9. |
| F-3 | **The three range-level resolutions offered for F-2 were each measured and none is sufficient alone.** (a) Raising `p.algaeGrowthRate`'s range top above 0.30 raises the bloom's equilibrium only up to the grazing it must carry; the settled bloom moved 71 → 74 at `r` = 0.45 and the healthy-baseline band broke first. (b) Raising the nutrient index's internal cap above 100 is inert: the pool is never the binding constraint on the bloom (measured), and the cap is what the F-5 clamp damage comes from. (c) Restating the window as a baseline multiple removes one contradiction but leaves the clarity, DO and consumer windows unreachable, because the die-back that should deliver the detritus pulse does not happen at all under a pool-keyed R-01. | The decision taken was **(d)** — change the growth limitation, not the ranges — and it is the only one of the four that makes the chain reachable. Recorded in DECISIONS and in the GAME-317 Jira thread. |
| F-4 | **Neither alternative crash reading fires usefully, and the ceiling reading cannot fire at all under a pool-keyed R-01**: the pool never falls below the bloom, so `max(0, algae − ceiling)` is identically zero (measured over the whole canonical run). The density reading fires only as a plateau shave. This is why R-01b is frozen as the *growth-shortfall* form and why the two alternatives are kept behind `--crash=` flags rather than deleted: they are the evidence, and the harness must be able to reproduce the negative result. | R-01b frozen as the shortfall form; R-01c records the alternatives as measured-not-frozen. |
| F-5 | The canonical pulse **pins the nutrient pool at its 100 cap**, and the end-of-tick clamp then destroys matter: the §5 loop identity fails (worst residual 0.57/tick with the provisional set, 2.9/tick with the earlier one). | ER-03 must implement cap behaviour as **spill/reject** and assert the loop identity per tick. The scenario magnitude must also be shaped so the pool does not pin (the provisional 10/tick still pins it — open). |
| F-6 | **A new structural finding from this session: the DO trough is bounded by the detritus *flux*, not by the detritus stock, and the nutrient loop's return flux can prevent the flux from ever rising.** In a steady state `decomposition = detritus inflow`, so the O2 demand is `p.o2PerDecomposition × (inflow)` — the DO trough depth is set by how much dead bloom mass arrives *per tick*, and the sediment stock only sets how long the demand lasts. Measured with the provisional set: the sediment peaks at 15.4 and the demand (0.25 mg/L/tick) sits *below* re-aeration relief at DO 5 (0.34) — hence no hypoxia. Lowering the return flux (`p.mineralizationFraction` 0.95 → 0.30 with `p.decompRate` 0.40 → 0.15) tripled the sediment pulse (15.4 → 40.5) but still did not produce a trough, because the demand is the *flux*. The reason the flux stays low is the loop: mineralization returns `mineralizationFraction × decompRate × detritus` to the pool, and that term *grows as the crash feeds it* — the pool therefore stays high, the bloom stays fed, its growth never falls far below its losses, and the shortfall die-back (R-01b) never ramps. **The canonical hypoxia needs the return flux to be small relative to the bloom's uptake during the post-loading window**, which is a condition on the *loop parameters jointly* (`mineralizationFraction`, `decompRate`, `detritus` scale), not on the oxygen parameters. |
| F-7 | **The grazing half-saturation is a stability parameter, not a tuning knob.** A low `p.halfSaturation` (5, the earlier candidate) makes the pristine algal equilibrium unstable: with a saturating loss term and a logistic producer, the growth's slope exceeds the losses' slope on the ascending branch, so the undisturbed pond migrates onto a bloom-dominated branch (measured: baseline algae 57–75 instead of ~30–50). A value near the range top (28–40) restores a stable, low pristine equilibrium. | Any ER-04 search that explores `p.halfSaturation` downward must re-check §11-1 stability, not just the canonical windows. |

#### Achieved state (provisional `pc1-params-1.2`, harness-measured)

- **Pristine pond (`§11-1`, strict): PASS.** The undisturbed fixed point is `{nutrients 9.0, algae 46.4, weeds 76.2, flea 20.9, mayfly 0.5, snail 12.5, bluegill 16.9, dragonfly 8.5, sediment 13.7, DO 7.40}` settled by the inflow controller rather than hand-set, with the **mayfly at 0.5** — the three grazers are still competed towards exclusion (F-9), so the frozen pristine state is itself evidence of the open blocker.
- **Canonical chain (`§11-2`): PARTIAL.** Bloom reaches 75.4 on **day 22** (window 12–18 — late); clarity drops below 30 on day **18** (window 15–25 — PASS); DO never reaches 5.0 (min **5.34**); mayflies fall below 20 on day **27** (window 30–40 — early); bluegill never decline; DO ends 5.45 (window < 5.0 — FAIL). The peak pool pins at 100 (F-5).
- **The pristine DO is 5.4 mg/L**, below the healthy pond this document describes. It is a consequence of the re-aeration value the search needed for a deep trough — the same knob pulls both ways (F-3/c). **This is an open item, not an accepted state.**
- Robustness (`§11` sanity tests): the seed spread and the 10k soak pass; the ±10 % single-parameter probe flips the fingerprint in 16 of 62 variants, which is a real fragility of the provisional set and is expected to improve with the calibration.

#### ER-04 gate items (explicit, inherited — none of these may be dropped silently)

1. **Make the canonical chain land inside the §11-2 windows**, starting from the F-8/F-9 diagnosis: the die-back fires correctly but too slowly, because the grazer community that supplies its main loss term collapses through competitive exclusion. **F-9 needs one more rules decision** — a per-link grazing half-saturation was authorised and implemented (v1.3) and measured to be *insufficient on its own*, because with one resource the best competitor wins regardless of how the affinities are split. The two mechanisms that can work at a stationary equilibrium are a **type-III (sigmoidal) predation response** — per-capita mortality rising with prey abundance, the classic "kill the winner" — or a **second resource axis** for the benthic grazers (periphyton derived from the weed/clarity structure). Both are this gate's level, not ER-04's. The harness is the acceptance test and must be green before ER-03 calibrates a kernel against it.
2. **Stop the pool pinning** (F-5): shape the canonical pulse magnitude so the pool peaks at ~85 and never touches its cap, and define cap behaviour as spill/reject.
3. **Resolve the pristine-DO/trough tension** — **F-10 shows how it can be resolved** (`p.exportFraction` at the top of its range plus a low producer senescence gives a healthy 7.4 mg/L pristine pond at a re-aeration low enough for the trough), so this gate item is now a *trade to be made explicitly* against F-8's senescence requirement rather than an open contradiction.
4. **Decomposer-activity normalization** (M-4): define the displayed index, or make the detritus stock learner-visible. The MS-LS2-3 mission asks the player to trace the loop through the decomposer, and today that card's number has no defined scale.
5. **Freeze the band-word thresholds** (35/65 boundaries) and the resilience-probe definition **in the scenario schema**, not in prose.
6. **Bluegill-removal intervention**: retag as one-shot-per-mission with recovery via reproduction only, or give it a slow return path (it is currently tagged Reversible with no mechanism).
7. **Delete or define the remaining dangling mechanism references** (siltation, stratification proxy, colonization) — the last of these is already removed from R-50.

**Handoff.** The exact numeric demonstration of the §11 windows is an **ER-04** deliverable. This section's job was to make the rules honest, internally consistent, and *specified* — not to finish the calibration. The harness, the provisional values and the F-1…F-7 diagnosis are ER-04's starting point.

**Scratch calibration tooling (git-excluded, on this host only).** The search that produced the provisional values lives in the repository's `.tmp/` directory and is **not committed** (`.tmp/` is git-excluded by design): a coordinate-descent search driver that mirrors every harness check as a penalty and derives the pristine baseline per candidate vector, a day-by-day tracer that prints the pool, the bloom, growth, the die-back, the detritus stock and DO on one line per tick, an attractor scan over the watershed inflow, and a per-species mass-budget probe. They are named so ER-04 can rebuild them rather than rediscover the traps below. If they are wanted durable, promote a cleaned copy into `docs/design/evidence/` in a commit of its own; do not commit `.tmp/` as-is.

#### Second calibration pass — findings F-8…F-11 (2026-09-21, later session)

The first pass diagnosed the wrong blocker. F-6 said the DO trough is bounded by the detritus flux and that the loop's return flux keeps it low; that is true but it is *not* the binding constraint. The tracer shows the die-back firing correctly — the pool does fall, the growth does drop below the losses, and the shortfall does shed — but by **0.2–0.6 index/tick**, which moves a 75-point bloom by about 1/tick. The trough never arrives because the die-back is a *trickle*, and these four findings say why.

| # | Finding | Consequence for ER-04 |
| --- | --- | --- |
| F-8 | **The die-back's magnitude is set by the bloom's loss terms, and the loss terms are tiny at the provisional values.** The decay rate is `(1 + p.bloomCrashRate) × (losses − growth)`, so a fast crash needs `losses = senescence·A + grazing` to be large at bloom density — measured: the provisional set gives ≈2.0–2.4/tick against a bloom of 76, i.e. a 30-tick decline. The *floor* on `losses` is the grazing the bloom must carry, which is also what feeds the grazers. | ER-04 must raise `p.algaeSenescence` **and** the grazer community together, not one of them. The window is narrow and computable: at the bloom's peak the growth is ≈4.1/tick (r = 0.30, h ≈ 0.73, A ≈ 75), so the losses must sit just *under* that for the bloom to reach 75 at all, and as high as possible above it once the bloom starves. |
| F-9 | **The three grazers are ecologically identical in the frozen rules, so the model competes them to exclusion.** All three eat the same pool. The product owner authorised the smallest structural fix — a **per-link grazing half-saturation** (v1.3, implemented in R-10) — and it was measured: differentiation alone does **not** produce coexistence. Whichever grazer has the better affinity-and-capacity combination reaches its own level and the other two fall to zero (reproduced three ways: a shared half-saturation, differentiated affinities with a large carrying capacity, and differentiated affinities with a small one). That is what single-resource competition theory predicts: with one resource and concave responses, the best competitor wins regardless of the parameter split. A low `p.predationHalfSaturation` (the saturating-predator mechanism that should concentrate mortality on the abundant prey) did not fix it either, because the model's Holling-II per-capita predation *decreases* with prey abundance — it amplifies the winner instead of killing it. | **Still the largest blocker, and now a sharper question.** Two mechanisms remain that can work at a stationary equilibrium: (a) make the **predation response type-III (sigmoidal)** — the classic "kill the winner" mechanism, where per-capita mortality *rises* with abundance; or (b) give the benthic grazers a **second resource axis** (periphyton, derived from the weed/clarity structure), so the three no longer share one niche. Both are rules-level decisions at this gate's level, not ER-04 tuning. Because a missing grazer removes the die-back's main loss term, F-8 cannot be closed until this is settled. |
| F-10 | **The pristine pond's oxygen demand can be decoupled from the crash's, and `p.exportFraction` is what decouples it.** The export share applies to consumer mortality and egestion but *not* to the algal die-back, so raising it lowers the pristine detritus flux (and hence the pristine DO demand) while leaving the crash pulse intact. Measured: with `p.exportFraction` 0.50, `p.algaeSenescence` 0.008, `p.weedSenescence` 0.008 and `p.reAeration` 0.084, the pristine pond holds **DO 7.4 mg/L** — healthy — at a re-aeration low enough that a crash pulse *would* pull DO below 5. That resolves the F-3-era "no re-aeration value can do both" claim: one can. | ER-04 should start from a high export share and a low senescence for the pristine pond, then raise the senescence only as far as F-8 requires — a conflict to be traded explicitly rather than discovered. |
| F-11 | **The settle is basin-sensitive, and its own transient can kill a species.** The pristine fixed point is a *controller* target, and two failure modes were reproduced: starting nutrient-rich grows a bloom that the controller then starves, and the crash's DO dip kills the most DO-sensitive consumer before the settle converges; starting grazer-heavy over-grazes the algae and lands in a low-algae basin with a stunted community. A successful settle also requires the seed to sit near the three-level equilibrium (algae – grazers – predators), because a species at exact break-even has its abundance set by the path rather than by the parameters. | The settle is part of the deliverable, not scaffolding: ER-04's harness must record the settle it used, or "the pristine pond is stationary" is not reproducible. |

**What this pass changed materially:** the pristine pond *can* be healthy at a low re-aeration (F-10), and the canonical bloom and clarity windows *can* be hit (measured: bloom 80.1 on day 16, clarity < 30 on day 15, both inside their §11 windows, pool peaking at 90.7 without pinning). What still fails is downstream of the crash: the die-back is too slow (F-8) because the grazer community collapses (F-9). Those two are the same problem seen from two ends, and **F-9 is a rule-structure question that a design-freeze gate should answer rather than a search should paper over.**

#### Third pass — a parameter sweep, and what it proves (F-12)

The question "can the hypoxia window be reached by tuning inside the declared ranges?" now has a direct experimental answer rather than an argument. Twelve configurations were run through the **kernel's own integer arithmetic** (the game's code, not the floating-point harness), each re-settled from scratch and then driven through the canonical disruption, with the chain measured by `tests/chain.test.ts`:

| Configuration (every value inside its declared range) | Pristine DO | Bloom peak | Clarity min | Detritus peak | DO min | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Shipped: rr 0.035, K 171/147/157, rea 0.10, basal 0.05, exp 0.15, Nref 23 | 6.72 | 56.5 | 46 | 20.6 | 6.58 | healthy pond, no trough |
| Grazing halved and basal at the range top | 7.03 | 80.2 | 24 | — | — | **the pristine pond is already a bloom** |
| Lower reference pool (Nref 13) with higher grazing | 6.12 | 64.9 | 38 | 19.2 | 6.02 | neither end satisfied |
| Export 0.50 + rea 0.07 + crash rate 2.0 | 5.99 | 64.1 | 39 | 15.6 | 5.78 | a marginal pond and a marginal trough |
| Bigger pulse (14/tick) with a stronger sink (0.10) | 6.52 | 63.3 | 40 | 18.7 | 6.38 | no trough |
| Smaller grazer community (K 88/76/81) | 6.96 | 78.5 | **25** | 15.7 | 6.91 | bloom *and* clarity windows land; still no trough |
| …plus viable predators (rr_P 0.02) | 7.31 | 84.5 on day 0 | 20 on day 0 | 12.8 | 7.29 | **the pristine pond is already the bloom** |
| Re-aeration at the range bottom (0.05) with export 0.50 | **5.43** | — | — | — | — | the pristine pond is hypoxic and the predators go extinct |

**The finding.** Every configuration that produces an oxygen trough does so by making the *pristine* pond unhealthy, and every configuration that keeps the pristine pond healthy produces no trough. The reason is arithmetic, not tuning: the oxygen demand is `p.o2PerDecomposition × decomposition`, the trough requires that demand to exceed re-aeration's relief at 5 mg/L, and with `p.o2PerDecomposition` already at its range top the demand cannot reach that relief without a detritus flux roughly twice anything the model produces — and the detritus flux is bounded by the bloom's own loss rate (`senescence·A + grazing`), because the die-back `(1 + p.bloomCrashRate) × shortfall` can never exceed a multiple of the very losses it is derived from.

**F-12 therefore closes the question: the §11-2 hypoxia window is unreachable inside the declared ranges under the frozen rules.** Reaching it requires a rule change — the type-III predation response F-9 recommends, or a restructured detritus-to-oxygen coupling — which is a decision at this gate's level. The sweep is reproducible with `npx vitest run tests/chain.test.ts` after editing `src/sim/params.ts`.



**Calibration commitments (ER-04 must demonstrate via golden traces):**
1. Baseline pond (no disruption) holds all stocks within ±10 of initial values for 60 ticks (no drift-collapse).
2. Canonical runoff (nutrients → 85 over 10 ticks) yields: algae ≥ 75 by ~day 12–18; clarity < 30 by ~day 15–25; DO < 5.0 between days 18–30; mayflies < 20 by ~day 30–40; bluegill visibly strained by ~day 35–50 — direction, ordering, and approximate windows only, not exact curves.
3. Full remediation early (day 5: runoff diverted + buffer) yields DO recovering above 5.0 within ~10–15 ticks of nutrient collapse, waterweeds recovering but not to 100 within the mission horizon (slow-growth rule R-02 keeps recovery honest).
4. Ineffective-intervention path (only aeration, runoff continues): DO improves transiently (< 2 mg/L improvement, decays), bloom persists — the canonical "plausible but insufficient" replay path.

## 10. Interventions (v1 menu — frozen vocabulary; ER-04 authors constraints/costs)

| Intervention | Mechanism (rule hit) | Speed | Reversibility | Tradeoff taught |
| --- | --- | --- | --- | --- |
| Divert field runoff | runoffInput → ~0 (R-30/R-31) | Immediate (source cut) | Reversible | Stops the cause, but existing nutrients/detritus still cycle (lag pedagogy) |
| Plant shoreline buffer strip | runoffInput reduced ~70% for remaining scenario; small clarity bump | Days (slow ramp) | Reversible | Prevention vs cure; slow but durable |
| Pond aeration | p.reAeration ↑ (0.10→0.30) | Fast on DO | Reversible | Treats the symptom; doesn't stop bloom (R-01 keeps consuming nutrients) |
| Add barley-straw/algae competitor? | — | — | — | **Declined for v1** (insufficient sourcing for a causal rule; risks teaching algaecide thinking) |
| Introduce more water fleas (grazer boost) | grazer stocks +bump; may fail if bloom too dense (half-saturation) | Days | Uncertain | Biological control works only within limits [S10] |
| Remove some bluegill (reduce fish predation) | bluegill stock −50% | Immediate | Contentious | Top-down cascade lever [S14, S16]; ethically framed as temporary relocation, reversible |
| Dredge/remove detritus | detritus −60% | Days | Reversible | Treats the legacy load; the canonical "expensive, disruptive but real" option |
| Do nothing (observe) | — | — | — | Always available; legitimate scientific choice |

**Constraint tags (v1):** each intervention carries `cost` (low/med/high), `speed` (immediate/days), `reversibility` (reversible/one-shot/uncertain), and a one-line science note. This satisfies MS-LS2-5's "competing design solutions under constraints" at index level without inventing dollars.

## 11. Sensitivity & sanity tests (ER-03/ER-04 must implement)

1. **Nutrient dose-response:** doubling runoff shortens time-to-DO-stress but does not change event *ordering* (algae → clarity → DO → mayfly → fish).
2. **No-threshold flip:** ±10% perturbation of any single parameter must not flip a mission outcome band (unless the parameter is a declared threshold, e.g., DO criteria) — guards against knife-edge gameplay.
3. **Cascade direction:** removing bluegill raises water fleas and lowers algae (bounded); adding bluegill does the reverse.
4. **Recovery shape:** cutting nutrients at peak bloom produces a *crash then slow recovery*, not instant clearing (R-04 bloom-crash + R-02 slow weeds).
5. **Aeration alone:** transient DO relief, bloom continues (validates the ineffective path).
6. **Soak test:** 10,000-tick undisturbed run stays bounded, no NaN, no lock-up oscillation of period < 5 ticks.
7. **Seed sensitivity:** noise paths (R-50) change traces by ≤ ±5 on indices; event ordering invariant.

## 12. Replay/science evidence requirements (recap — normative text in TECHNICAL_DESIGN)

- Every trace records `SIM_MODEL_VERSION`, `PARAM_SET_VERSION`, seed, rule-version manifest, and per-tick canonical state; ER-03 golden traces must reference the rule IDs from this document.
- Science-review packets (ER-04 gate; ER-14 human review) must bind to this file's git blob SHA.
