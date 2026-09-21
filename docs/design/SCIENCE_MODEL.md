# SCIENCE_MODEL.md — Ecosystem Rescue, Pond Crisis

| | |
| --- | --- |
| Status | **FROZEN v1.0, STRUCTURAL REVISION v1.1 (GAME-317 / ER-01)** — see banner below. Rules/structure are frozen; the v1.0 numeric parameter set is **SUPERSEDED**. A recalibrated candidate set (`pc1-params-1.1`) with an executable verification harness now exists (§9.1), but it does **not yet reproduce every §11 window** — see §9.1 for the measured gap and the range revision it requires. |
| Model class | Pedagogical causal model — **not** a research-grade ecology simulator |
| Rule IDs | `R-*` (stable identifiers; ER-03 code and golden traces must reference these IDs) |
| Model version identity | `SIM_MODEL_VERSION = "pond-crisis-1.0"`, `PARAM_SET_VERSION = "pc1-params-1.0"` (emitted in every replay trace) |
| Curriculum anchors | [CURRICULUM_MAP.md](CURRICULUM_MAP.md) — MS-LS2-1…MS-LS2-5 |
| Review requirement | ER-04 requires an independent, source-based science review bound to this document's exact revision (GAME-317 acceptance) |

> **ER-01 close-out banner (2026-09-21, review finding dispositions).** Independent fresh-context review (REVIEW_ER01.md, packet A) demonstrated by scratch simulation that the v1.0 parameter set cannot produce the canonical hypoxia outcome and that the nutrient loop lacked two load-bearing formulas. Structural fixes below are **frozen now** (they change rule form, which is a SIM_MODEL_VERSION event): (1) R-01b bloom-crash is an explicit decay-from-excess flow at a frozen rate — the logistic term never inverts, ceiling = 0 means exponential crash, crash mortality flows to detritus; (2) R-21 gains `mineralizationFraction` (decomposed matter returns to the nutrient pool; remainder buried/exported — closes the MS-LS2-3 loop); (3) R-20 gains `egestionFraction` and `exportFraction` (grazing/predation unassimilated mass → detritus; a frozen share of consumer mortality + egestion leaves the pond — emergence/outflow), so `p.nutrientSink` no longer drains a nominally closed baseline; (4) R-30 gains explicit `backgroundInflow`; (5) R-10 consumer→prey removal is directly parameterized per link (`p.removalRate.*`), not derived from intake; (6) R-41 starvation escalation is `p.starveBase × min(p.starveCap, 1 + p.starveEscalation × (hungryTicks − 3))` per tick after the 3rd hungry tick; (7) R-40 bluegill onset is **5.0 mg/L** (matching S7/S8) with severe at 2.5, and the stress input is a **2-tick** running average; (8) §6.5 freezes the per-tick evaluation order (all flows from the pre-tick snapshot, single update pass, clamps end-of-tick only). The §9 numeric values are being recalibrated against §11 commitments with `evidence/calibration-sim.mjs` (run it: `node docs/design/evidence/calibration-sim.mjs`); **ER-03 must not begin until that harness passes and §9 is re-frozen as `pc1-params-1.1` with a Jira record.**

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
| Causal lag | Two-step lags via intermediate stocks: **nutrients → algae** (days, same-tick growth once nutrients available), **algae → detritus → DO stress** (2–4 tick lag via decomposition pipeline, R-21), **DO stress → consumer decline** (1–2 tick running-average lag, R-40). See §6. |
| Disruption window | Scenario data (ER-04); canonical Pond Crisis injects runoff on days 0–10 (loading phase) — the player observes the response, not the injection itself. |

**Lag pedagogy (misconception guard).** The model must never show "nutrients rise → fish die instantly" — the causal chain is sequential [S2, S3]. The evidence UI exposes the chain steps with their lags; the learner-facing language (frozen in UX_USER_FLOW §3.5) is: "Each day the pond answers the *last* few days' conditions."

## 3. Learner-visible quantities: units and semantics

Every learner-visible value is one of four kinds, with the kind **always rendered** in UI (TECHNICAL_DESIGN §D-5 label rule):

| Kind | Meaning | Rendering rule |
| --- | --- | --- |
| `index` | Abstract 0–100 model unit. **Never** a count or a real measurement. | Label shows "index (0–100)"; organism cards show trend arrows + band words. |
| `relative abundance` | 0–100 index interpreted as *density relative to typical spring level for that role*. | "relative abundance (typical spring = 50)" |
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
| Primary consumer (benthic) | **Mayflies** | Sensitive scraper/collector | Graze algae/periphyton on surfaces; prey for bluegill & dragonflies | **First to decline** in low DO (pollution-sensitive indicator, S11); bloom siltation also harms them | S11, S12 |
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

- **R-01 Algal growth (nutrient-driven).** Algae increase toward a nutrient-carrying ceiling: `algaeGrowth = p.algaeGrowthRate × algae × (1 − algae/nutrientCeiling)` where `nutrientCeiling = p.maxAlgae × min(1, nutrients/100)`. Logistic, no overshoot. *Source:* S2, S3, S6 (nutrient-enriched algal overgrowth). *Simplification:* growth not light/temperature-dependent in v1.
- **R-02 Waterweed growth.** Logistic growth toward a fixed carrying capacity, **scaled by clarity**: rate multiplier `0.2 + 0.8 × (clarity/100)`. Shaded weeds barely grow; recovery after clearing is visibly slow (multi-tick). *Source:* S3, S5, S9 (bloom shades out underwater plants). *Simplification:* no seasonality; no grazing on weeds in v1.
- **R-03 Light competition.** Clarity = `100 − p.shadingCoefficient × algae` (clamped ≥ 0). Algae reduce light; waterweeds have no reciprocal effect on planktonic algae in v1. *Source:* S3, S5 ("blocks sunlight").
- **R-04 Producer death.** Background senescence: constant small fraction of algae and weeds flows to Detritus each tick (`p.senescence`). Bloom algae die *en masse* when nutrient supply collapses (nutrientCeiling falls below current algae → the logistic term reverses; **bloom-crash** emerges from R-01 rather than a scripted die-off). *Source:* S3 ("eventually, the algae dies too"), S5 (bloom-crash sequence).

### 6.2 Consumers and predation

- **R-10 Consumer intake (Holling-II).** For predator P eating prey X: `intake = p.maxIntake × X/(p.halfSaturation + X)`. Bounded (no extermination by appetite); at high prey density intake saturates. *Source:* standard functional-response form; parametrized to keep coexistence stable in sanity tests (§10).
- **R-11 Predation links (frozen).** Water fleas ← Algae (grazing). Mayflies ← Algae/periphyton (grazing, shares the algae pool with water fleas at reduced efficiency). Snails ← Algae/periphyton (grazing, reduced efficiency). Bluegill ← Water fleas, Mayflies, Snails. Dragonfly nymphs ← Water fleas, Mayflies, Snails. No cannibalism; no consumer–consumer predation beyond dragonfly→grazer links; no link in either direction between dragonfly nymphs and bluegill (neither eats the other in v1). *Source:* S10, S12, S13, S14, S15.
- **R-12 Consumer reproduction & natural mortality.** Net reproduction = intake surplus above maintenance: `births = p.reproduction × max(0, intake − p.maintenance)`, capped by carrying capacity; constant background mortality `p.backgroundMortality`. Populations cannot exceed 100.
- **R-13 Predation pressure (top-down).** Bluegill intake on water fleas uses the same Holling-II form; when bluegill are removed (intervention), water fleas rise → algae fall (clear-water effect). This is a **bounded** trophic-cascade rule: the model produces the classic cascade direction but does not promise magnitude fidelity. *Source:* S14, S16. *Simplification:* no refuges, no behavior-mediated effects.
- **R-14 Competition (explicit).** Algae vs waterweeds compete for light via R-03 only. Mayflies/snails/water fleas do **not** compete in v1 (their shared resource R-11 handles depletion implicitly). *Source:* S12. *Rationale:* keeps MS-LS2-2's "competition" pattern legible as a single clean light-competition story.

### 6.3 Decomposition, oxygen, and the eutrophication chain

- **R-20 Death → detritus.** All mortality (senescence, starvation, stress) flows to Detritus. Detritus is an internal stock; **not learner-visible in v1** — its effects are visible through Decomposer activity, DO, and clarity (declared simplification, §7).
- **R-21 Decomposition & oxygen consumption.** `decomposition = p.decompRate × detritus × tempFactor`; `oxygenDemand += p.o2PerDecomposition × decomposition`. Decomposer activity index displayed = normalized decomposition rate. The decomposition pipeline introduces the canonical **2–4 tick lag** between bloom and DO stress. *Source:* S2 ("when the algae die, they are decomposed by bacteria — this process consumes the oxygen dissolved in the water"), S3, S18.
- **R-22 Re-aeration & photosynthetic O₂.** DO relaxes toward saturation `p.o2Saturation` with rate `p.reAeration`; algae add `p.o2PerPhotosynthesis × algae` (capped). *Source:* S18; USGS water-properties doctrine (oxygen from atmosphere + photosynthesis). *Simplification:* no diurnal cycle (§7).
- **R-23 DO update.** `DO += (photosynthesis − oxygenDemand − respirationBasal) + reAerationTerm`, clamped [0, 15.0]. The DO value is the model's single real-unit quantity (mg/L).
- **R-30 Nutrient loading (disruption).** Scenario-driven inflow during the disruption window: `nutrients += runoffInput`. RunoffInput is scenario data; canonical Pond Crisis uses farm-field fertilizer + failing septic contributions combined into one inflow [S6]. Nutrients decay via **uptake** (R-01 consumption proxies uptake) and a small settling/denitrification sink `p.nutrientSink` [S2 — phosphates settle; denitrification in low-O₂ waters].
- **R-31 Nutrient interventions.** Each intervention maps to parameterized stock/flow effects (see §10 interventions table), e.g., runoff diversion reduces `runoffInput` to ~0; aeration raises `reAeration` and breaks stratification proxy; buffer strips cut future runoff fraction. *Source:* S20.
- **R-40 Stress and mortality from DO.** Organism DO-stress thresholds (mg/L): mayflies 5.5, dragonflies 4.0, water fleas 4.0, bluegill 3.0 (stress onset 5.0 per S7/S8, severe 2–3 per S4 — modeled as escalating mortality curve: none above threshold, ramping below), snails 2.0. Stress mortality = `p.stressMortality × max(0, threshold − DO)/threshold` per tick, plus a **1–2 tick running average of DO** drives the stress term (short lag so multi-day lows, not single-day dips, kill). *Source:* S4, S7, S8, S11, S12. *Simplification:* thresholds are fixed constants, not acclimatizing.
- **R-41 Food limitation.** If intake < maintenance for 3+ consecutive ticks, starvation mortality escalates (prevents perpetual coexistence at zero food). *Source:* standard population-model practice; qualitative support from S10 (grazers cannot persist without adequate food availability).
- **R-42 Behavioral visibility.** Below stress thresholds, organisms display state words (e.g., bluegill "gasping at surface" below 2.5 mg/L) — a **presentation fact** derived from DO + thresholds, never an independent state. *Source:* S8 (piping behavior).

### 6.4 Determinism constraints on the math (binding for ER-03)

- **R-50 Seeded stochasticity (only where allowed).** Small multiplicative noise (±p.noisePct, default 2%) on reproduction and colonization terms only, generated by the kernel-owned seeded PRNG (xorshift128+ or mulberry32 — ER-02 choice, TECH_STACK_ADR §7). Growth, flows, and DO use **no noise**. This keeps traces clean while making populations feel alive; the seed is part of scenario identity.
- **R-51 Integer quantization.** All stocks are stored as **scaled integers** (fixed-point, SCALE = 1000). Arithmetic is integer-only; division uses floor toward zero after scaling; DO keeps one decimal (scale 10). No floating-point in authoritative state (full strategy in TECHNICAL_DESIGN §D-3).
- **R-52 Bounds & invariants.** Clamp stocks to [0, cap] every tick; reject NaN/∞ at serialization (TECHNICAL_DESIGN §D-6). Invariant tests in ER-03: non-negativity, caps, no divergence (all stocks stay bounded over 10,000-tick soak), DO ∈ [0, 15].

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

## 9. Parameters (initial canonical set — ER-04 may refine within declared ranges only)

All values are model units. Ranges are the legal ER-04 tuning space; changing a value outside its range, adding a parameter, or changing rule structure requires a new `PARAM_SET_VERSION`/`SIM_MODEL_VERSION` and Jira record.

| Parameter | Value | Legal range | Used by | Notes |
| --- | --- | --- | --- | --- |
| p.algaeGrowthRate | 0.18 /tick | 0.10–0.30 | R-01 | Logistic intrinsic rate |
| p.maxAlgae | 100 | 100 (cap) | R-01 | Index cap |
| p.senescence | 0.04 | 0.02–0.08 | R-04 | Fraction to detritus/tick |
| p.shadingCoefficient | 0.9 | 0.6–1.2 | R-03 | Clarity loss per algae index point |
| p.weedGrowthRate | 0.10 /tick | 0.05–0.20 | R-02 | Slow — weeds recover slower than algae |
| p.maxIntake (grazers) | 0.35 of body/tick | 0.2–0.5 | R-10 | Per prey type |
| p.halfSaturation | 25 | 15–40 | R-10 | Prey index at half intake |
| p.reproduction | 0.15 /tick | 0.08–0.25 | R-12 | On intake surplus |
| p.maintenance | 0.10 | 0.05–0.20 | R-12 | Intake needed to hold |
| p.backgroundMortality | 0.02 | 0.01–0.05 | R-12 | /tick |
| p.decompRate | 0.25 /tick | 0.15–0.40 | R-21 | Fraction of detritus decomposed/tick (warm) |
| p.o2PerDecomposition | 0.020 mg/L per unit activity | 0.01–0.04 | R-21 | Calibrated so a full bloom crash can pull DO from 8→3 mg/L over ~10 ticks |
| p.o2Saturation | 9.0 mg/L | 8.0–10.0 | R-22 | Warm-water saturation anchor [S8] |
| p.reAeration | 0.10 /tick | 0.05–0.25 | R-22 | Relaxation toward saturation; aeration intervention ⇒ 0.30 |
| p.o2PerPhotosynthesis | 0.004 mg/L per algae/tick | 0.002–0.008 | R-22 | Modest; bloom photosynthesis cannot offset its own crash |
| p.o2RespirationBasal | 0.05 mg/L/tick | 0.03–0.10 | R-23 | Pond-wide basal consumption |
| p.nutrientSink | 0.05 /tick | 0.02–0.10 | R-30 | Settling/denitrification fraction |
| p.noisePct | 0.02 | 0–0.05 | R-50 | Reproduction/colonization noise only |
| p.stressMortality | 0.10 /tick | 0.05–0.20 | R-40 | Max per-tick mortality at DO=0 |
| DO stress thresholds (mg/L) | mayfly 5.5, dragonfly 4.0, water flea 4.0, bluegill 3.0, snail 2.0 | ±0.5 | R-40 | Anchored to S4/S7/S8 bands |

### 9.1 Calibration outcome — candidate `pc1-params-1.1` (2026-09-21, GAME-317 / ER-01)

An executable harness (`evidence/calibration-sim.mjs`, zero-dependency Node, run
`node docs/design/evidence/calibration-sim.mjs`) implements every rule above and tests it against
the §11 commitments and the §5 matter-loop identity. Its current status and the verified facts are
recorded in [EVIDENCE.md](EVIDENCE.md); the headline findings are:

| # | Finding | Consequence |
| --- | --- | --- |
| F-1 | The v1.0 numeric ranges are **flux-infeasible**: a consumer whose maintenance/egestion is levied on body mass (or whose production is a small share of intake) cannot be supported by the algal production available at any baseline where the consumers sit in the upper abundance bands. | `p.maintenance` is defined on the **assimilated intake** (R-12 restated mass-budget form); `p.reproduction` is **removed** as a separate parameter (production falls out of the mass budget). |
| F-2 | The bloom's unconstrained equilibrium under the declared ranges is **≈70–73 index** — below the §11 window "algae ≥ 75". It is set by `r·A(1−A/C) = G·holl(A) + senescence·A` with `r ≤ 0.30`, `C ≤ 92` (the ceiling is the instantaneous nutrient pool, capped at 100), and `G` at or above the minimum that keeps three grazer species alive (F-3). | The ≥75 window is **not reachable** inside the declared ranges. ER-04 must either raise the `p.algaeGrowthRate` ceiling above 0.30, raise the nutrient index's internal cap above 100 (it is simultaneously the pool cap and the bloom ceiling), or restate the window (e.g. "the bloom rises above ~70 and at least doubles the baseline index"). |
| F-3 | A single shared Holling half-saturation cannot both keep grazing near saturation at bloom density (needed for F-2) and stop predators from over-taking sparse prey (which drives a grazer extinct). | Add `p.predationHalfSaturation` (distinct from the grazing `p.halfSaturation`). |
| F-4 | A **ceiling-excess** bloom-crash term provably never fires (a bloom in this rule set tracks its instantaneous ceiling and never overshoots it); only a **density-excess** term crashes a bloom. | R-01b is frozen as density-excess; the ceiling reading is recorded as non-firing. |
| F-5 | The canonical pulse saturates the nutrient index at its 100 cap, and the end-of-tick clamp then **destroys matter** (the §5 loop identity fails, worst residual ≈ 2.9/tick). | ER-03 must define cap behaviour: spill/reject the inflow at the cap rather than clamp the stock. Scenario magnitude must also be shaped so the pool does not pin at the cap. |

**Candidate values** (harness-verified facts in parentheses): `p.algaeGrowthRate 0.30` · `p.algaeSenescence 0.012` · `p.bloomCrashThreshold 70` (F-4) · `p.bloomCrashRate 1.00` · `p.shadingCoefficient 0.95` · `p.weedGrowthRate 0.12` · `p.weedSenescence 0.020` · `p.weedK 85` · `p.halfSaturation 5` · `p.predationHalfSaturation 40` (F-3) · `p.removalRate {flea 0.030, mayfly 0.030, snail 0.030, bluegill 0.013, dragonfly 0.013}` · `p.egestionFraction 0.02` · `p.maintenance 0.03` · `p.backgroundMortality 0.010` · `p.decompRate 0.38` · `p.mineralizationFraction 0.90` · `p.o2PerDecomp 0.040` · `p.reAeration 0.12` · `p.o2RespirationBasal 0.05` · `p.nutrientSinkRate 0.05` · `p.nutrientReference 50` · `p.backgroundInflow 0.627` · `p.exportFraction 0.15` · `p.stressMortality 0.15` · `p.noisePct 0.02` · `p.carryingCapacity {flea 140, mayfly 120, snail 128, bluegill 100, dragonfly 50}`. Canonical scenario: runoff 9 index units/tick for days 0–10; the undisturbed fixed point the candidate produces (anchored at nutrients = 50) is `{nutrients 50, algae 38.2, weeds 65.0, flea 36.6, mayfly 20.2, snail 27.8, bluegill 33.9, dragonfly 16.9, sediment 19.0, DO 7.60}` — every stock inside its healthy band and stationary over 60 ticks (verified).

**Range revisions required by the findings above** (declared, not silent): `p.halfSaturation` 3–40 (was 15–40); `p.algaeSenescence` 0.008–0.08 (was 0.02–0.08); `p.maintenance` 0.02–0.20 redefined on assimilated intake; `p.egestionFraction` 0–0.40 and `p.exportFraction` 0.05–0.50 (new); `p.backgroundMortality` 0.004–0.04 (was 0.01–0.05); `p.removalRate.*` 0.004–0.30 (replaces `p.maxIntake`, which the v1.1 R-10 restatement supersedes); `p.predationHalfSaturation` 8–80 (new); `p.bloomCrashThreshold` 45–80 and `p.bloomCrashRate` 0.05–2.0 (new, R-01b).

**Handoff.** The exact numeric demonstration of the §11 windows is an **ER-04** deliverable (this section's own rule): ER-04 starts from this candidate set and the harness, resolves F-2 by the range decision above, and must show the harness passing before ER-03's kernel is calibrated against it. The harness is the acceptance test.

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
