// calibration-sim.mjs — GAME-317 / ER-01 evidence harness (NOT production code)
//
// Purpose: implement SCIENCE_MODEL v1.2's rules in plain JS and test the provisional parameter
// set (`pc1-params-1.2`) against every §11 calibration commitment and sanity test, plus the
// MS-LS2-3 matter-loop conservation identity (§5).
//
// Run: node docs/design/evidence/calibration-sim.mjs      (exit 0 = all checks pass)
//      node docs/design/evidence/calibration-sim.mjs --crash=ceiling --growth=pool   (variants)
//
// STATUS (2026-09-21, GAME-317): the RULE STRUCTURE is frozen — this harness is the authority on
// what the frozen rules do. The VALUES are provisional and the harness does NOT pass yet: see
// EVIDENCE.md §5 for exactly which §11 windows fail, by how much, and the measured diagnosis
// (the nutrient loop's return flux, finding F-6). ER-04 owns the numeric demonstration.
//
// Zero dependencies (node: builtins only). Floats are used here; the shipping kernel (ER-03)
// uses fixed-point integers per TECHNICAL_DESIGN §D-3. Every operation in the rule set is a
// rational function (+, −, ×, ÷, min, max, comparison), so results transfer under fixed-point
// quantization; magnitudes stay far below 2^53.
//
// Vocabulary: rule IDs R-* mirror SCIENCE_MODEL §6. Checks are labelled
//   C1..C4  = §11 calibration commitments
//   S1..S7  = §11 sanity tests
//   LOOP    = matter-loop conservation identity (§5, the MS-LS2-3 anchor)
//   X1..    = intervention-menu direction checks (§10)
//
// ---------------------------------------------------------------------------
// Design decisions encoded here (recorded in SCIENCE_MODEL §9 / DECISIONS D-30)
// ---------------------------------------------------------------------------
// 1. Consumer production is MASS-BASED: a predator converts the prey mass it actually
//    removes into (a) assimilated biomass → births, (b) egestion → detritus, and (c)
//    maintenance respiration → detritus. R-12's "surplus above maintenance" semantics are
//    preserved, but measured in mass units. The v1.0 form (births from the Holling *intake
//    rate*, with removal separately parameterized) made the loop non-conservative and left
//    every baseline run pinned at the caps, so R-12/R-41 could not be calibrated at all.
// 2. That makes the matter loop EXACT for every tick: the only sources/sinks are the
//    scenario inflow, the settling/denitrification sink, burial, and the emergence/outflow
//    export share. LOOP asserts the identity to float precision.
// 3. The canonical spring pond is the *undisturbed fixed point* of the frozen rules with the
//    nutrient index anchored at 50 (solved by bisection in `anchorEquilibrium`, not hand-set).

import { pathToFileURL } from "node:url";

export const SIM_MODEL_VERSION = "pond-crisis-1.3";
export const PARAM_SET_VERSION = "pc1-params-1.3";

// ---------------------------------------------------------------------------
// Parameters — provisional set `pc1-params-1.3` (must match SCIENCE_MODEL §9 exactly).
// STATUS: the STRUCTURE below is frozen (GAME-317 decision (d), see SCIENCE_MODEL §9.1); the
// VALUES are the best the calibration search has reached and do NOT yet satisfy every §11 window.
// The harness is expected to report failures — read the summary line, not the exit code, and see
// EVIDENCE.md §5 for which windows fail and why. This file is the acceptance test ER-04 inherits.
// ---------------------------------------------------------------------------
export const P = {
  // producers (R-01/R-01b/R-02/R-03/R-04)
  algaeGrowthRate: 0.30,        // R-01 self-shading growth rate (range top)
  maxAlgae: 100,                // R-01 the logistic ceiling = the self-shading capacity (NOT the pool)
  nutrientHalfSaturation: 28,   // R-01 pool level at half the growth rate (the supply factor)
  bloomCrashThreshold: 70,      // R-01b density reading only — retired by the frozen reading
  bloomCrashRate: 2.00,         // R-01b share of the growth shortfall shed per tick (range top)
  algaeSenescence: 0.015,       // R-04 fraction of algae -> detritus /tick
  weedGrowthRate: 0.20,         // R-02
  weedK: 85,                    // R-02 weed carrying capacity
  weedSenescence: 0.008,        // R-04
  shadingCoefficient: 0.95,     // R-03 clarity loss per algae index point
  // consumers (R-10/R-11: per-link removal is directly parameterized)
  // PER-LINK grazing half-saturation (v1.3, finding F-9). A single shared value for all three
  // grazers makes them ecologically identical — same food, same functional response — and the
  // model then competes them to exclusion (measured: one grazer survives, the other two reach
  // zero, taking the grazing that the bloom's die-back needs with them). Differentiating the
  // affinities gives each species its own equilibrium resource level, which is the smallest
  // change that can let them coexist on a fluctuating resource.
  halfSaturation: { flea: 12, mayfly: 30, snail: 20 },
  predationHalfSaturation: 40,  // R-10 Holling half-saturation, PREDATION (separate: a predator's
                                // functional response saturates at a different prey density than a
                                // filter-feeder's, and a single shared value cannot both keep the
                                // grazers' intake near saturation at bloom density and keep the
                                // predator from over-taking sparse prey; see EVIDENCE.md)
  removalRate: { flea: 0.040, mayfly: 0.040, snail: 0.040, bluegill: 0.020, dragonfly: 0.020 },
  egestionFraction: 0.050,      // R-20 share of removed prey mass egested (not assimilated)
  maintenance: 0.100,          // R-12 maintenance respiration as a fraction of assimilated intake
  carryingCapacity: { flea: 52, mayfly: 45, snail: 48, bluegill: 80, dragonfly: 40 }, // R-12 recruitment cap
  starveBase: 0.02,             // R-41 starvation base mortality (unreachable under R-12's mass
                                // form — see SCIENCE_MODEL R-41's recorded limitation)
  starveEscalation: 0.5,        // R-41 +50% per tick beyond the 3rd hungry tick
  starveCap: 5,                 // R-41 max multiplier
  backgroundMortality: 0.008,   // R-12 /tick
  // detritus / nutrients (closed loop with exports)
  decompRate: 0.15,             // R-21 fraction of detritus decomposed /tick
  mineralizationFraction: 0.30, // R-21 share of decomposed matter returned to the nutrient pool
                                // (the remainder is buried). NOTE: the return flux is
                                // mineralizationFraction × decompRate × detritus and is therefore
                                // proportional to the detritus stock — it grows exactly when the
                                // canonical chain needs the pool to fall. See F-6.
  backgroundInflow: 1.713,      // R-30 constant watershed nutrient inflow /tick (settles N at the reference)
  nutrientSinkRate: 0.050,     // R-30 fraction of the nutrient EXCESS over the reference settling/denitrifying /tick
  nutrientReference: 9,        // R-30 sediment-water exchange equilibrium: net settling above it, no net release below
  exportFraction: 0.500,        // R-20/R-21b share of consumer mortality + egestion leaving the pond
  // oxygen (R-22/R-23)
  o2Saturation: 9.0,
  reAeration: 0.084,
  reAerationAerated: 0.30,      // §10 aeration intervention value
  o2PerDecomp: 0.040,           // O2 cost per unit of decomposed matter — sets the DO trough depth
                                // jointly with the detritus FLUX (o2PerDecomp × decomposition)
  o2PerPhoto: 0.001,
  photoCap: 0.5,
  o2RespirationBasal: 0.100,
  // stress (R-40)
  stressWindow: 2,              // running-average window (ticks)
  stressMortality: 0.15,        // max per-tick mortality at doAvg <= severe
  thresholds: {                 // onset / severe (mg/L) — R-40's frozen ramp, §6.3
    mayfly:    { onset: 5.5, severe: 3.0 },
    flea:      { onset: 4.0, severe: 2.0 },
    dragonfly: { onset: 4.0, severe: 2.0 },
    bluegill:  { onset: 5.0, severe: 2.5 },
    snail:     { onset: 2.0, severe: 1.0 },
  },
  // stochasticity (R-50)
  noisePct: 0.02,
};

export const CONSUMERS = ["flea", "mayfly", "snail", "bluegill", "dragonfly"];
export const PRODUCERS = ["algae", "weeds"];
export const ORGANISMS = [...PRODUCERS, ...CONSUMERS];
const ALL_STOCKS = [...ORGANISMS, "nutrients", "sediment"];
const POP_CAP = 100, SED_CAP = 100, NUT_CAP = 100, DO_CAP = 15;
const CONSUMER_ORDER = [...CONSUMERS]; // FROZEN evaluation order (SCIENCE_MODEL §6.5)

// ---------------------------------------------------------------------------
// Canonical spring pond — the settled fixed point of `pc1-params-1.3`. These are the measured
// values, including the uncomfortable ones: the mayfly sits at 0.5 because the three grazers are
// still competed towards exclusion (finding F-9). Freezing the measurement as it is, rather than a
// prettier number the rules do not produce, is the point of this file.
// ---------------------------------------------------------------------------
export const CANONICAL_INITIAL = Object.freeze({
  nutrients: 9.0, algae: 46.4, weeds: 76.2,
  flea: 20.9, mayfly: 0.5, snail: 12.5, bluegill: 16.9, dragonfly: 8.5,
  sediment: 13.7, do: 7.40,
});

// Canonical disruption: the scenario injects farm-fertilizer + septic runoff during the
// loading phase (SCIENCE_MODEL §2). Magnitude is set so the nutrient index rises toward ~85.
export const CANONICAL_RUNOFF_DAYS = 10;
export const CANONICAL_RUNOFF_PER_DAY = 10.0;

export function canonicalRunoff(tick) {
  return tick < CANONICAL_RUNOFF_DAYS ? CANONICAL_RUNOFF_PER_DAY : 0;
}

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) — the only stochasticity, reproduction terms (R-50)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// R-01b crash form — FROZEN reading is `shortfall` (the bloom sheds the part of its own losses
// that its growth no longer covers). `density` (shed above a fixed bloom-density threshold) and
// `ceiling` (shed above the instantaneous nutrient ceiling) are the two alternatives the review
// disposition and the earlier session considered; both were measured and neither fires usefully
// under a pool-keyed R-01 — see EVIDENCE.md §5. `both` takes the larger excess. The variants stay
// reachable behind `--crash=…` so the F-4 claim remains reproducible rather than asserted.
// ---------------------------------------------------------------------------
export const CRASH_MODES = ["density", "ceiling", "both", "shortfall"];
export const bloomCrashMode = { mode: "shortfall" };
export function setBloomCrashMode(mode) {
  if (!CRASH_MODES.includes(mode)) throw new Error(`unknown crash mode ${mode} (expected ${CRASH_MODES.join("|")})`);
  bloomCrashMode.mode = mode;
}
// The bloom's natural losses (senescence + grazing) on the snapshot — the reference the
// `shortfall` reading compares growth against.
function naturalLosses(S, grazedAlgae) {
  return P.algaeSenescence * S.algae + grazedAlgae.flea + grazedAlgae.mayfly + grazedAlgae.snail;
}
function crashThreshold(S, ceiling, growth, losses) {
  const densityExcess = Math.max(0, S.algae - P.bloomCrashThreshold);
  const ceilingExcess = Math.max(0, S.algae - ceiling);
  switch (bloomCrashMode.mode) {
    case "ceiling": return { key: "ceiling", excess: ceilingExcess, ref: ceiling };
    case "both": return { key: "ceiling", excess: Math.max(densityExcess, ceilingExcess), ref: ceiling };
    case "shortfall": return { key: "ceiling", excess: Math.max(0, losses - growth), ref: ceiling };
    default: return { key: "density", excess: densityExcess, ref: P.bloomCrashThreshold };
  }
}
// ---------------------------------------------------------------------------
// R-01 growth limitation. The FROZEN reading is `supply`: the logistic ceiling is the fixed
// self-shading capacity p.maxAlgae, the pool scales the growth as a saturating supply factor, and
// the available nutrient mass is a hard uptake constraint (R-01, GAME-317 decision (d)).
// `capacity` is the same without the pool factor — it does NOT respond to a nutrient pulse at all
// until the mass constraint binds (measured), which is why `supply` rather than `capacity` is the
// frozen reading. `pool` is the pre-decision reading: nutrientCeiling = maxAlgae × min(1,
// nutrients/100) as the logistic ceiling. Because the growth then falls with the pool, the bloom
// self-arrests before it can exhaust its supply — the pool's equilibrium sits strictly above the
// bloom, and R-04's "die en masse when nutrient supply collapses" can never happen (measured:
// EVIDENCE.md "why the ceiling never binds"). All three stay reachable behind `--growth=…`.
// ---------------------------------------------------------------------------
export const GROWTH_LIMITS = ["pool", "capacity", "supply"];
export const growthLimit = { mode: "supply" };
export function setGrowthLimit(mode) {
  if (!GROWTH_LIMITS.includes(mode)) throw new Error(`unknown growth limit ${mode} (expected ${GROWTH_LIMITS.join("|")})`);
  growthLimit.mode = mode;
}

// R-10 functional response. Grazers saturate on the algal pool with a **per-link** half-saturation
// (F-9: a shared one makes the three grazers ecologically identical and the model excludes two of
// them); predators saturate on their prey stocks with their own single value (F-3).
const GRAZER_SET = new Set(["flea", "mayfly", "snail"]);
const hollG = (x, sp) => x / (P.halfSaturation[sp] + x);
const hollP = (x) => x / (P.predationHalfSaturation + x);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
export function initialState(init = CANONICAL_INITIAL, seed = 1) {
  return {
    tick: 0,
    nutrients: init.nutrients, algae: init.algae, weeds: init.weeds,
    flea: init.flea, mayfly: init.mayfly, snail: init.snail,
    bluegill: init.bluegill, dragonfly: init.dragonfly,
    sediment: init.sediment, do: init.do,
    // R-03 clarity is a derived quantity, but it must be present from tick 0 so traces are
    // total (a missing field made every `first`/min over the history NaN).
    clarity: clamp(100 - P.shadingCoefficient * init.algae, 0, 100),
    doHist: [init.do, init.do],
    hungry: { flea: 0, mayfly: 0, snail: 0, bluegill: 0, dragonfly: 0 },
    crashActive: false,
    flags: { runoffDiverted: false, bufferStrip: false, aerated: false },
    events: [],
    rng: mulberry32(seed), seed,
  };
}

// ---------------------------------------------------------------------------
// R-31 interventions — applied at the tick boundary, before flows are computed.
// Declared menu order is frozen (SCIENCE_MODEL §10); each application is logged.
// ---------------------------------------------------------------------------
const MENU_ORDER = ["divert-runoff", "buffer-strip", "aeration", "grazer-boost", "bluegill-removal", "dredge"];

function applyIntervention(S, id) {
  switch (id) {
    case "divert-runoff": S.flags.runoffDiverted = true; break;
    case "buffer-strip": S.flags.bufferStrip = true; break;
    case "aeration": S.flags.aerated = true; break;
    case "grazer-boost": S.flea = clamp(S.flea + 20, 0, POP_CAP); break;        // §10: +bump to water fleas
    case "bluegill-removal": S.bluegill = clamp(S.bluegill * 0.5, 0, POP_CAP); break; // §10: −50%
    case "dredge": S.sediment = clamp(S.sediment * 0.4, 0, SED_CAP); break;     // §10: detritus −60%
    default: throw new Error(`unknown intervention ${id}`);
  }
  S.events.push({ rule: "R-31", kind: "intervention-applied", id });
}

// ---------------------------------------------------------------------------
// One tick. Order is FROZEN (SCIENCE_MODEL §6.5): interventions at the tick boundary,
// then every flow is computed from the pre-tick snapshot S, exactly one update pass,
// clamps at end of tick only.
// ---------------------------------------------------------------------------
export function step(state, cfg = {}) {
  const S = {
    ...state,
    doHist: [...state.doHist],
    hungry: { ...state.hungry },
    flags: { ...state.flags },
    events: [...state.events],
  };
  const f = {};

  // -- R-31 tick-boundary interventions (declared menu order, deterministic)
  const scheduled = (cfg.interventions ?? []).filter((iv) => iv.tick === S.tick);
  for (const id of MENU_ORDER) {
    if (scheduled.some((iv) => iv.id === id)) applyIntervention(S, id);
  }

  // -- R-03 clarity (from snapshot algae)
  const clarity = clamp(100 - P.shadingCoefficient * S.algae, 0, 100);

  // -- R-01 algal growth. The logistic ceiling is the FIXED self-shading capacity p.maxAlgae;
  //    the pool enters as a saturating SUPPLY factor and as a hard mass constraint
  //    (uptake <= nutrients), so a bloom can overshoot the nutrient supply and starve (F-2).
  const ceiling = P.maxAlgae * Math.min(1, S.nutrients / 100);
  const supplyFactor = S.nutrients / (P.nutrientHalfSaturation + S.nutrients);
  let growthCeiling, growthFactor;
  if (growthLimit.mode === "pool") { growthCeiling = ceiling; growthFactor = 1; }
  else if (growthLimit.mode === "capacity") { growthCeiling = P.maxAlgae; growthFactor = 1; }
  else { growthCeiling = P.maxAlgae; growthFactor = supplyFactor; }
  const rawGrowth = growthCeiling > 0 && S.algae > 0
    ? Math.max(0, P.algaeGrowthRate * growthFactor * S.algae * (1 - S.algae / growthCeiling))
    : 0;
  // The cells cannot take up more nutrient than is dissolved (mass, and it keeps the pool >= 0).
  const algaeGrowth = Math.min(rawGrowth, Math.max(0, S.nutrients));
  const nutrientUptakeAlgae = algaeGrowth; // mass: new algal biomass draws from the pool 1:1

  // -- R-04 senescence
  const algaeSenescence = P.algaeSenescence * S.algae;
  const weedSenescence = P.weedSenescence * S.weeds;

  // -- R-02 weed growth (logistic toward weedK, clarity-scaled, never negative)
  const weedGrowth = S.weeds > 0
    ? Math.max(0, P.weedGrowthRate * S.weeds * (1 - S.weeds / P.weedK) * (0.2 + 0.8 * (clarity / 100)))
    : 0;
  const nutrientUptakeWeeds = weedGrowth;

  // -- R-10/R-11 grazing & predation. Removal is directly parameterized per link, capped by
  //    the remaining prey pool; the evaluation order is the frozen §6.5 order.
  const prey = { algae: S.algae, flea: S.flea, mayfly: S.mayfly, snail: S.snail };
  const link = (path) => path.reduce((a, k) => a[k], f);
  f.removed = { flea: 0, mayfly: 0, snail: 0, bluegill: 0, dragonfly: 0 };
  const graze = (pred, preyKey) => {
    const h = GRAZER_SET.has(pred) ? hollG(S[preyKey], pred) : hollP(S[preyKey]);
    const take = Math.min(P.removalRate[pred] * h * S[pred], prey[preyKey]);
    prey[preyKey] -= take;
    f.removed[pred] += take;
    return take;
  };
  f.grazedAlgae = { flea: graze("flea", "algae"), mayfly: graze("mayfly", "algae"), snail: graze("snail", "algae") };
  f.predation = {
    flea: graze("bluegill", "flea") + graze("dragonfly", "flea"),
    mayfly: graze("bluegill", "mayfly") + graze("dragonfly", "mayfly"),
    snail: graze("bluegill", "snail") + graze("dragonfly", "snail"),
  };
  // NOTE: predator intake on grazer prey is drawn bluegill-then-dragonfly by the frozen
  // order above; that is a declared, deterministic simplification (SCIENCE_MODEL §6.5).

  // -- R-01b bloom die-back ("bloom crash"). The bloom sheds an excess each tick at a frozen
  //    rate. The frozen reading keys that excess to the SHORTFALL of growth against the bloom's
  //    own losses (`senescence·A + grazing`): while the bloom is well supplied it sheds nothing,
  //    and when the supply collapses the shortfall *is* the mass death — R-04's "bloom algae die
  //    en masse when nutrient supply collapses", which a clamped logistic term cannot express
  //    (measured: EVIDENCE.md "why the ceiling never binds"). Computed after the grazing block so
  //    the shortfall sees the real grazing losses; every flow still comes from the pre-tick
  //    snapshot, so the §6.5 single-update-pass order is preserved. The ceiling-keyed reading
  //    (shed above the instantaneous nutrient ceiling), the fixed density threshold, and their
  //    max stay available behind `--crash=ceiling|both|density` for the record.
  const grazedAlgaeTotal = f.grazedAlgae.flea + f.grazedAlgae.mayfly + f.grazedAlgae.snail;
  const bloomCrash = crashThreshold(S, ceiling, algaeGrowth, naturalLosses(S, f.grazedAlgae));
  const algaeCrash = P.bloomCrashRate * bloomCrash.excess;

  // -- R-40 stress input: 2-tick running average of DO
  const doAvg = S.doHist.slice(-P.stressWindow).reduce((a, b) => a + b, 0) / P.stressWindow;
  f.doAvg = doAvg;

  // -- R-12/R-20/R-41 consumer mass budget + mortality
  const noise = () => 1 + (S.rng() * 2 - 1) * P.noisePct;
  const births = {}, deaths = {}, starve = {}, stress = {}, respired = {}, egestion = {}, shed = {};
  for (const sp of CONSUMER_ORDER) {
    const removedMass = f.removed[sp];
    egestion[sp] = P.egestionFraction * removedMass;              // R-20 unassimilated share -> detritus
    const assimilated = removedMass - egestion[sp];
    // R-12 maintenance respiration. v1.0 read `p.maintenance` as a share of the intake
    // quantity (intake and maintenance compared in the same units); the v1.1 mass-budget
    // form keeps that reading — a share of the ASSIMILATED intake — rather than making it a
    // share of body mass. A body-mass-scaled rate is flux-infeasible against the declared
    // algae growth range at any baseline where the consumers sit in the upper abundance
    // bands (the algae's logistic production near its nutrient ceiling cannot supply it);
    // see EVIDENCE.md "flux feasibility".
    const maintenanceCost = P.maintenance * assimilated;
    respired[sp] = maintenanceCost;                                // -> detritus (metabolic waste)
    // R-12: production is surplus above maintenance, capped by the species carrying capacity
    // (recruitment limitation). Mass that cannot be recruited to standing biomass is shed back
    // to detritus, so the matter loop stays exact.
    const surplus = assimilated - respired[sp];
    const recruitment = clamp(1 - S[sp] / P.carryingCapacity[sp], 0, 1);
    births[sp] = surplus * recruitment * noise();
    shed[sp] = surplus * (1 - recruitment);
    deaths[sp] = P.backgroundMortality * S[sp];
    // R-41 food limitation (assimilated intake below maintenance for 3+ consecutive ticks)
    if (assimilated < maintenanceCost) S.hungry[sp] += 1; else S.hungry[sp] = 0;
    if (S.hungry[sp] >= 3) {
      const mult = Math.min(P.starveCap, 1 + P.starveEscalation * (S.hungry[sp] - 3));
      starve[sp] = P.starveBase * mult * S[sp];
    } else starve[sp] = 0;
    // R-40 DO stress (linear ramp onset -> severe on the averaged DO)
    const th = P.thresholds[sp];
    const frac = clamp((th.onset - doAvg) / (th.onset - th.severe), 0, 1);
    stress[sp] = P.stressMortality * frac * S[sp];
  }

  // -- R-20/R-21b detritus budget with export
  const deadMass = CONSUMER_ORDER.reduce((a, sp) => a + deaths[sp] + starve[sp] + stress[sp], 0);
  const egestionTotal = CONSUMER_ORDER.reduce((a, sp) => a + egestion[sp], 0);
  const maintenanceTotal = CONSUMER_ORDER.reduce((a, sp) => a + respired[sp] + shed[sp], 0);
  const exportLoss = P.exportFraction * (deadMass + egestionTotal); // emergence / downstream outflow
  const detritusInflow = algaeSenescence + weedSenescence + algaeCrash
    + maintenanceTotal + (deadMass + egestionTotal) - exportLoss;

  // -- R-21 decomposition (also drives the O2 demand)
  const decomposition = P.decompRate * S.sediment;
  const mineralized = P.mineralizationFraction * decomposition;   // returns to the nutrient pool
  const buried = decomposition - mineralized;                     // leaves the active cycle

  // -- R-30 nutrient pool
  let runoff = cfg.runoff ? cfg.runoff(S.tick) : 0;
  if (S.flags.runoffDiverted) runoff = 0;
  if (S.flags.bufferStrip) runoff *= 0.3;                          // §10: buffer cuts remaining runoff ~70%
  const nutIn = runoff + P.backgroundInflow;
  // R-30 settling/denitrification acts on the nutrient EXCESS above the sediment-water
  // exchange equilibrium: a shallow pond's sediments buffer the water column (net adsorption
  // above the equilibrium, no net release below in v1). A purely proportional sink instead
  // makes the pool relax exponentially back to its baseline, so the bloom can never be
  // starved and the canonical crash is unreachable.
  const nutrientSinkLoss = P.nutrientSinkRate * Math.max(0, S.nutrients - P.nutrientReference);

  // -- R-22/R-23 oxygen
  const photo = Math.min(P.photoCap, P.o2PerPhoto * S.algae);
  const reAerRate = S.flags.aerated ? P.reAerationAerated : P.reAeration;
  const reAer = reAerRate * (P.o2Saturation - S.do);
  const o2Demand = P.o2PerDecomp * decomposition;
  const consumption = o2Demand + P.o2RespirationBasal;

  // ---- apply: single update pass from the snapshot ----
  const n = {};
  n.nutrients = S.nutrients + nutIn + mineralized - nutrientUptakeAlgae - nutrientUptakeWeeds - nutrientSinkLoss;
  n.algae = S.algae + algaeGrowth - algaeCrash - algaeSenescence - grazedAlgaeTotal;
  n.weeds = S.weeds + weedGrowth - weedSenescence;
  for (const sp of CONSUMER_ORDER) {
    // f.predation is keyed by PREY species: only flea/mayfly/snail are eaten (R-11).
    n[sp] = S[sp] + births[sp] - deaths[sp] - starve[sp] - stress[sp] - (f.predation[sp] ?? 0);
  }
  n.sediment = S.sediment + detritusInflow - decomposition;
  n.do = clamp(S.do + photo + reAer - consumption, 0, DO_CAP);
  n.clarity = clamp(100 - P.shadingCoefficient * clamp(n.algae, 0, POP_CAP), 0, 100);

  // clamps (end of tick only — R-52)
  for (const k of ORGANISMS) n[k] = clamp(n[k], 0, POP_CAP);
  n.nutrients = clamp(n.nutrients, 0, NUT_CAP);
  n.sediment = clamp(n.sediment, 0, SED_CAP);
  n.do = clamp(n.do, 0, DO_CAP);

  // -- evidence-layer events (D-3.4: derived, non-authoritative, fixed key order)
  const events = [...S.events];
  for (const sp of CONSUMER_ORDER) {
    const th = P.thresholds[sp];
    if (doAvg < th.onset && S.doHist.slice(-P.stressWindow).every((d) => d >= th.onset)) {
      events.push({ rule: "R-40", kind: "stress-onset", organism: sp, doAvg });
    }
  }
  if (bloomCrash.excess > 0 && !state.crashActive) {
    events.push({ rule: "R-01b", kind: "bloom-dieback-onset", mode: bloomCrash.key, algae: S.algae, ref: bloomCrash.ref });
  }

  n.tick = S.tick + 1;
  n.crashActive = bloomCrash.excess > 0;
  n.doHist = [...S.doHist, n.do].slice(-4);
  n.hungry = S.hungry;
  n.flags = S.flags;
  n.rng = S.rng; n.seed = S.seed;
  n.events = events.slice(0, 64);
  n._flows = {
    algaeGrowth, algaeCrash, algaeSenescence, weedGrowth, weedSenescence,
    grazed: f.grazedAlgae, predation: f.predation, removed: f.removed,
    births, deaths, starve, stress, respired, shed, egestion, deadMass, egestionTotal,
    detritusInflow, decomposition, mineralized, buried, exportLoss,
    nutrientUptakeAlgae, nutrientUptakeWeeds, nutIn, nutrientSinkLoss, runoff,
    photo, reAer, o2Demand, consumption, doAvg, clarity,
  };
  return n;
}

export function run(days, cfg = {}, { seed = 1, init = CANONICAL_INITIAL } = {}) {
  let s = initialState(init, seed);
  const hist = [{ ...s, _flows: null }];
  for (let t = 0; t < days; t++) {
    s = step(s, cfg);
    hist.push({ ...s });
  }
  return hist;
}

// ---------------------------------------------------------------------------
// LOOP — matter-loop conservation identity (SCIENCE_MODEL §5, MS-LS2-3 anchor).
// Per tick: Δ(nutrients + biomass + detritus) must equal
//   inflow − settling/denitrification sink − burial − export share of mortality+egestion
// to float precision. This is the check that makes "every loss on one edge appears on
// another" a machine-verified property rather than a promise.
// ---------------------------------------------------------------------------
export function loopResidual(hist) {
  let worst = 0, worstTick = null;
  for (let i = 1; i < hist.length; i++) {
    const a = hist[i - 1], b = hist[i], f = b._flows;
    const totalBefore = ALL_STOCKS.reduce((s, k) => s + a[k], 0);
    const totalAfter = ALL_STOCKS.reduce((s, k) => s + b[k], 0);
    const expected = f.nutIn - f.nutrientSinkLoss - f.buried - f.exportLoss;
    worst = Math.max(worst, Math.abs((totalAfter - totalBefore) - expected));
    if (Math.abs((totalAfter - totalBefore) - expected) > 1e-9) worstTick = b.tick;
  }
  return { worst, worstTick };
}

// ---------------------------------------------------------------------------
// Undisturbed fixed point (canonical spring pond), solved rather than hand-set.
// Bounds the nutrient index at `targetN` by bisecting the watershed background inflow.
// ---------------------------------------------------------------------------
export function convergeToFixedPoint({ backgroundInflow, noisePct = 0, ticks = 6000, seed = 1,
  init = { nutrients: 50, algae: 45, weeds: 60, flea: 40, mayfly: 30, snail: 30, bluegill: 25, dragonfly: 15, sediment: 30, do: 7.6 } }) {
  const savedInflow = P.backgroundInflow, savedNoise = P.noisePct;
  P.backgroundInflow = backgroundInflow; P.noisePct = noisePct;
  try {
    const h = run(ticks, {}, { seed, init });
    return h[h.length - 1];
  } finally {
    P.backgroundInflow = savedInflow; P.noisePct = savedNoise;
  }
}

export function anchorEquilibrium(targetN = 50) {
  let lo = 0.0, hi = 2.0;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const s = convergeToFixedPoint({ backgroundInflow: mid });
    if (s.nutrients < targetN) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------
const band = (v) => (v >= 65 ? "thriving" : v >= 35 ? "stable" : v >= 15 ? "strained" : "crashing");
const firstBelow = (hist, k, v) => { const i = hist.findIndex((h) => h[k] < v); return i < 0 ? null : i; };
const firstAbove = (hist, k, v) => { const i = hist.findIndex((h) => h[k] > v); return i < 0 ? null : i; };
const minOf = (hist, k) => Math.min(...hist.map((h) => h[k]));
const maxOf = (hist, k) => Math.max(...hist.map((h) => h[k]));

let failures = 0;
const results = [];
const check = (ok, label) => {
  console.log(`  ${ok ? "PASS" : "FAIL"} — ${label}`);
  results.push({ ok, label });
  if (!ok) failures++;
};
const report = (name, hist) => {
  const last = hist[hist.length - 1];
  console.log(`\n== ${name} ==`);
  console.log(`  final: ${ALL_STOCKS.map((k) => `${k}=${last[k].toFixed(1)}`).join(" ")} DO=${last.do.toFixed(2)} clarity=${last.clarity.toFixed(0)}`);
  console.log(`  extrema: algae[max ${maxOf(hist, "algae").toFixed(1)}] DO[min ${minOf(hist, "do").toFixed(2)}] clarity[min ${minOf(hist, "clarity").toFixed(0)}] mayfly[min ${minOf(hist, "mayfly").toFixed(1)}] bluegill[min ${minOf(hist, "bluegill").toFixed(1)}] sediment[max ${maxOf(hist, "sediment").toFixed(1)}]`);
  return { last };
};

function canonicalOutcome(hist) {
  const last = hist[hist.length - 1];
  return {
    bloomDay: firstAbove(hist, "algae", 75),
    clarityDay: firstBelow(hist, "clarity", 30),
    doDay: firstBelow(hist, "do", 5.0),
    mayflyDay: firstBelow(hist, "mayfly", 20),
    bluegillDay: firstBelow(hist, "bluegill", 0.8 * CANONICAL_INITIAL.bluegill),
    doFinal: last.do, doMin: minOf(hist, "do"), algaeMax: maxOf(hist, "algae"),
    weedsFinal: last.weeds,
    mayflyBand: band(last.mayfly), bluegillBand: band(last.bluegill),
    mayflyFell: last.mayfly < CANONICAL_INITIAL.mayfly,
    bluegillFell: last.bluegill < 0.8 * CANONICAL_INITIAL.bluegill,
    doHypoxicEnd: last.do < 5.0,
  };
}

// ---------------------------------------------------------------------------
// All checks, in one callable envelope so the tuner can import the engine alone.
// ---------------------------------------------------------------------------
export function runAllChecks() {
failures = 0; results.length = 0;

// ---------------------------------------------------------------------------
// LOOP check (runs first — if this fails, nothing downstream is trustworthy)
// ---------------------------------------------------------------------------
console.log("== LOOP — matter-loop conservation identity (per tick) ==");
{
  const h = run(60, { runoff: canonicalRunoff });
  const { worst, worstTick } = loopResidual(h);
  console.log(`  worst per-tick residual: ${worst.toExponential(3)} (tick ${worstTick ?? "—"})`);
  check(worst < 1e-9, `Δ(nutrients+biomass+detritus) = inflow − sink − burial − export every tick (worst ${worst.toExponential(2)})`);
  const c = h[0]._flows === null && h[1]._flows && Object.keys(h[1]._flows).length > 0;
  check(c, "per-tick flow ledger is emitted for the evidence layer");
}

// ---------------------------------------------------------------------------
// C1 — baseline stability: undisturbed pond holds every stock for 60 ticks
// ---------------------------------------------------------------------------
{
  const h = run(60, {});
  report("C1 baseline (60 ticks, no disruption)", h);
  const last = h[h.length - 1];
  for (const k of ALL_STOCKS) {
    const init = CANONICAL_INITIAL[k];
    check(Math.abs(last[k] - init) <= 10 && Math.abs(minOf(h, k) - init) <= 12 && Math.abs(maxOf(h, k) - init) <= 12,
      `${k} within ±10 of ${init} (final ${last[k].toFixed(1)}, range ${minOf(h, k).toFixed(1)}–${maxOf(h, k).toFixed(1)})`);
  }
  check(Math.abs(last.do - CANONICAL_INITIAL.do) <= 1.5, `DO near baseline (final ${last.do.toFixed(2)})`);
  const monotone = ALL_STOCKS.filter((k) => last[k] < CANONICAL_INITIAL[k] - 5);
  check(monotone.length === 0, `no monotonic drift-collapse of any stock (${monotone.join(",") || "none"})`);
}

// ---------------------------------------------------------------------------
// C2 — canonical runoff, no intervention: the teachable eutrophication chain
// ---------------------------------------------------------------------------
let canonicalHist;
{
  const h = run(60, { runoff: canonicalRunoff });
  canonicalHist = h;
  report("C2 canonical runoff (days 0–10), no intervention", h);
  const o = canonicalOutcome(h);
  const peakN = maxOf(h, "nutrients");
  console.log(`  nutrient peak ${peakN.toFixed(1)} (target ~85 over the 10-tick loading phase)`);
  check(peakN >= 80 && peakN <= 92, `nutrient index reaches ~85 in the loading phase (peak ${peakN.toFixed(1)})`);
  check(o.bloomDay !== null && o.bloomDay >= 12 && o.bloomDay <= 18, `algae ≥ 75 by day 12–18 (day ${o.bloomDay})`);
  check(o.clarityDay !== null && o.clarityDay >= 15 && o.clarityDay <= 25, `clarity < 30 by day 15–25 (day ${o.clarityDay})`);
  check(o.doDay !== null && o.doDay >= 18 && o.doDay <= 30, `DO < 5.0 between days 18–30 (day ${o.doDay})`);
  check(o.mayflyDay !== null && o.mayflyDay >= 30 && o.mayflyDay <= 40, `mayflies < 20 by day 30–40 (day ${o.mayflyDay})`);
  check(o.bluegillDay !== null && o.bluegillDay >= 35 && o.bluegillDay <= 50, `bluegill visibly declining by day 35–50 (day ${o.bluegillDay})`);
  check(o.doFinal < 5.0 && o.doFinal > 1.5, `DO ends hypoxic but not anoxic (${o.doFinal.toFixed(2)})`);
  const ordering = [o.bloomDay, o.clarityDay, o.doDay, o.mayflyDay, o.bluegillDay];
  check(ordering.every((v, i) => v !== null && (i === 0 || v >= ordering[i - 1])),
    `canonical event ordering bloom→clarity→DO→mayfly→bluegill holds (${ordering.join(",")})`);
}

// ---------------------------------------------------------------------------
// C3 — early remediation (divert runoff at day 5 + shoreline buffer)
// ---------------------------------------------------------------------------
{
  const h = run(60, {
    runoff: canonicalRunoff,
    interventions: [{ tick: 5, id: "divert-runoff" }, { tick: 5, id: "buffer-strip" }],
  });
  report("C3 early remediation (divert + buffer at day 5)", h);
  const o = canonicalOutcome(h);
  check(o.doDay === null || o.doDay >= 25, `DO never below 5.0, or only late (first day ${o.doDay})`);
  const dip = firstBelow(h, "do", 5.0);
  let recovered = true;
  if (dip !== null) recovered = h.slice(dip).some((x) => x.do > 5.0);
  check(recovered, "DO recovers above 5.0 after any dip within the horizon");
  check(o.weedsFinal > 62 && o.weedsFinal < 95, `waterweeds recovering but not to 100 (final ${o.weedsFinal.toFixed(1)})`);
  check(o.algaeMax < 75, `bloom stays sub-canonical under early remediation (max algae ${o.algaeMax.toFixed(1)})`);
}

// ---------------------------------------------------------------------------
// C4 / S5 — aeration only: transient relief, bloom persists (§11-5)
// ---------------------------------------------------------------------------
{
  const hBase = run(60, { runoff: canonicalRunoff });
  const hAer = run(60, { runoff: canonicalRunoff, interventions: [{ tick: 12, id: "aeration" }] });
  report("C4/S5 aeration only (from day 12), runoff continues", hAer);
  let maxImprovement = 0, day30Improvement = 0;
  for (let i = 0; i <= 60; i++) maxImprovement = Math.max(maxImprovement, hAer[i].do - hBase[i].do);
  day30Improvement = hAer[30].do - hBase[30].do;
  console.log(`  improvement: peak ${maxImprovement.toFixed(2)} mg/L, day 30 ${day30Improvement.toFixed(2)} mg/L`);
  check(maxImprovement > 0.5 && maxImprovement <= 3.0, `aeration transient improvement > 0.5 and ≤ 3.0 mg/L (max ${maxImprovement.toFixed(2)})`);
  check(maxImprovement - day30Improvement > 0.2, `relief decays while the bloom continues (peak ${maxImprovement.toFixed(2)} → day 30 ${day30Improvement.toFixed(2)})`);
  check(hAer[30].algae > 60, `bloom persists under aeration (algae day 30: ${hAer[30].algae.toFixed(1)})`);
  check(hAer[30].mayfly < 0.8 * CANONICAL_INITIAL.mayfly, `aeration alone does not rescue mayflies (day 30: ${hAer[30].mayfly.toFixed(1)})`);
}

// ---------------------------------------------------------------------------
// S1 — nutrient dose-response: ordering invariant, 2× dose reaches stress sooner
// ---------------------------------------------------------------------------
{
  const h1 = run(60, { runoff: (t) => (t < 10 ? CANONICAL_RUNOFF_PER_DAY : 0) });
  const h2 = run(60, { runoff: (t) => (t < 10 ? 2 * CANONICAL_RUNOFF_PER_DAY : 0) });
  const o1 = canonicalOutcome(h1), o2 = canonicalOutcome(h2);
  console.log(`\n== S1 dose-response ==\n  1×: ${[o1.bloomDay, o1.clarityDay, o1.doDay, o1.mayflyDay, o1.bluegillDay].join(",")}\n  2×: ${[o2.bloomDay, o2.clarityDay, o2.doDay, o2.mayflyDay, o2.bluegillDay].join(",")}`);
  const ordered = (o) => {
    const seq = [o.bloomDay, o.clarityDay, o.doDay, o.mayflyDay, o.bluegillDay];
    return seq.every((v, i) => v !== null && (i === 0 || v >= seq[i - 1]));
  };
  check(ordered(o1) && ordered(o2), "event ordering (bloom→clarity→DO→mayfly→bluegill) holds at 1× and 2× dose");
  check(o2.doDay !== null && o1.doDay !== null && o2.doDay < o1.doDay, `2× dose reaches DO stress sooner (day ${o1.doDay} → ${o2.doDay})`);
  check(o2.doDay !== null && o1.doDay !== null && o2.doDay <= o1.doDay * 0.8, `2× dose reaches DO stress ≥ 20% sooner (${o1.doDay} → ${o2.doDay})`);
}

// ---------------------------------------------------------------------------
// S2 — no-threshold flip: ±10% on any single parameter must not flip the outcome.
// Fingerprint = the five canonical verdicts the mission is scored on.
// ---------------------------------------------------------------------------
{
  const fingerprint = (h) => {
    const o = canonicalOutcome(h);
    return [o.bloomDay !== null, o.doDay !== null, o.doHypoxicEnd, o.mayflyFell, o.bluegillFell].join("");
  };
  const baseline = fingerprint(canonicalHist);
  const skipped = new Set(["maxAlgae", "stressWindow", "noisePct"]);
  const offenders = [];
  // Nested numeric parameters are probed too. They used to be skipped entirely (only top-level
  // scalars were scaled), which left removalRate, carryingCapacity, halfSaturation, thresholds and
  // o2Saturation outside the test whose whole purpose is to catch knife-edge gameplay.
  const targets = [];
  for (const key of Object.keys(P)) {
    if (skipped.has(key)) continue;
    if (typeof P[key] === "number") targets.push({ path: [key], get: () => P[key], set: (v) => { P[key] = v; } });
    else if (P[key] && typeof P[key] === "object") {
      for (const sub of Object.keys(P[key])) {
        if (typeof P[key][sub] !== "number") continue;
        targets.push({ path: [key, sub], get: () => P[key][sub], set: (v) => { P[key][sub] = v; } });
      }
    }
  }
  for (const t of targets) {
    for (const scale of [0.9, 1.1]) {
      const saved = t.get();
      t.set(saved * scale);
      try {
        if (fingerprint(run(60, { runoff: canonicalRunoff })) !== baseline) offenders.push(`${t.path.join(".")}×${scale}`);
      } finally { t.set(saved); }
    }
  }
  console.log(`\n== S2 no-threshold flip (±10% single-parameter) ==\n  baseline fingerprint ${baseline}; ${targets.length * 2} variants probed; offenders: ${offenders.join(", ") || "none"}`);
  check(offenders.length === 0, `no ±10% single-parameter perturbation flips the canonical outcome (${offenders.length} of ${targets.length * 2} variants)`);
}

// ---------------------------------------------------------------------------
// S3 — cascade direction: removing bluegill raises grazers and lowers algae
// ---------------------------------------------------------------------------
{
  const hA = run(45, { runoff: canonicalRunoff });
  const hB = run(45, { runoff: canonicalRunoff, interventions: [{ tick: 10, id: "bluegill-removal" }] });
  report("S3 cascade (bluegill −50% at day 10)", hB);
  const fA = hA[45], fB = hB[45];
  console.log(`  day 45: fleas ${fA.flea.toFixed(1)} → ${fB.flea.toFixed(1)}; algae ${fA.algae.toFixed(1)} → ${fB.algae.toFixed(1)}`);
  check(fB.flea > fA.flea, `fleas higher with fewer bluegill (${fA.flea.toFixed(1)} → ${fB.flea.toFixed(1)})`);
  check(fB.algae < fA.algae, `algae lower with fewer bluegill (${fA.algae.toFixed(1)} → ${fB.algae.toFixed(1)})`);
  const hAdd = run(45, { runoff: canonicalRunoff, interventions: [{ tick: 10, id: "grazer-boost" }] });
  check(hAdd[45].algae < hA[45].algae, `adding water fleas lowers algae — the intervention-menu direction (§10) (${hA[45].algae.toFixed(1)} → ${hAdd[45].algae.toFixed(1)})`);
}

// ---------------------------------------------------------------------------
// S4 — recovery shape: cut nutrients at peak bloom → crash then slow recovery
// ---------------------------------------------------------------------------
{
  const h = run(60, { runoff: (t) => (t < 15 ? CANONICAL_RUNOFF_PER_DAY : 0) });
  report("S4 crash-then-slow-recovery (runoff stops day 15)", h);
  const crashDepth = minOf(h.slice(16, 41), "algae");
  check(crashDepth < 45, `bloom crashes after the nutrient cut (min algae days 16–40: ${crashDepth.toFixed(1)})`);
  check(h[59].weeds > 30 && h[59].weeds < 95, `weeds recover slowly, not to 100 (final ${h[59].weeds.toFixed(1)})`);
  check(minOf(h.slice(20), "do") < 5.0, `the delayed DO trough still occurs after the cut (min DO ${minOf(h.slice(20), "do").toFixed(2)})`);
}

// ---------------------------------------------------------------------------
// S6 — soak: 10,000 ticks bounded, no NaN, no short lock-up oscillation
// ---------------------------------------------------------------------------
{
  const h = run(10000, {});
  let ok = true, minDo = DO_CAP;
  for (const x of h) {
    for (const k of ALL_STOCKS) if (!(x[k] >= 0 && x[k] <= 100)) ok = false;
    if (!Number.isFinite(x.do) || x.do < 0 || x.do > DO_CAP) ok = false;
    minDo = Math.min(minDo, x.do);
  }
  console.log(`\n== S6 soak (10,000 ticks) ==\n  bounds ok=${ok}, min DO=${minDo.toFixed(2)}, final tick ${h[h.length - 1].tick}`);
  check(ok, "10k-tick undisturbed soak stays bounded with no NaN");
}

// ---------------------------------------------------------------------------
// S7 — seed sensitivity: R-50 noise moves traces by ≤ ±5
// ---------------------------------------------------------------------------
{
  const traces = [1, 2, 3, 4, 5].map((seed) => run(60, { runoff: canonicalRunoff }, { seed }));
  let maxSpread = 0;
  for (let t = 0; t <= 60; t++) {
    for (const k of ORGANISMS) {
      const vals = traces.map((h) => h[t][k]);
      maxSpread = Math.max(maxSpread, Math.max(...vals) - Math.min(...vals));
    }
  }
  console.log(`\n== S7 seed sensitivity ==\n  max index spread across 5 seeds: ${maxSpread.toFixed(2)}`);
  check(maxSpread <= 5, `seeded noise changes traces by ≤ ±5 index points (max ${maxSpread.toFixed(2)})`);
  const orderOk = traces.every((h) => {
    const o = canonicalOutcome(h);
    const seq = [o.bloomDay, o.clarityDay, o.doDay, o.mayflyDay, o.bluegillDay];
    return seq.every((v, i) => v !== null && (i === 0 || v >= seq[i - 1]));
  });
  check(orderOk, "canonical event ordering is invariant across seeds");
}

// ---------------------------------------------------------------------------
// X1–X3 — intervention menu direction (§10 frozen vocabulary)
// ---------------------------------------------------------------------------
{
  const base = run(60, { runoff: canonicalRunoff });
  const dredge = run(60, { runoff: canonicalRunoff, interventions: [{ tick: 18, id: "dredge" }] });
  const buffer = run(60, { runoff: canonicalRunoff, interventions: [{ tick: 5, id: "buffer-strip" }] });
  const divert = run(60, { runoff: canonicalRunoff, interventions: [{ tick: 5, id: "divert-runoff" }] });
  report("X1 dredge at day 18 (legacy sediment load)", dredge);
  console.log(`  DO min: base ${minOf(base, "do").toFixed(2)} → dredge ${minOf(dredge.slice(18), "do").toFixed(2)}`);
  console.log(`  nutrient peak: nothing ${maxOf(base, "nutrients").toFixed(1)} > buffer ${maxOf(buffer, "nutrients").toFixed(1)} > divert ${maxOf(divert, "nutrients").toFixed(1)}`);
  check(minOf(dredge.slice(18), "do") > minOf(base.slice(18), "do"), "dredge raises the DO trough (treats the legacy sediment load)");
  check(maxOf(buffer, "nutrients") < maxOf(base, "nutrients") && maxOf(buffer, "nutrients") > maxOf(divert, "nutrients"),
    "buffer strip sits between doing nothing and diverting runoff (slow prevention vs source cut)");
  check(divert[59].weeds > base[59].weeds, `runoff diversion leaves more waterweed cover at day 60 (${base[59].weeds.toFixed(1)} → ${divert[59].weeds.toFixed(1)})`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const passed = results.length - failures;
console.log(`\n${"=".repeat(72)}`);
console.log(`calibration-sim ${PARAM_SET_VERSION} (${SIM_MODEL_VERSION}): ${passed}/${results.length} checks pass`);
if (failures) console.log(results.filter((r) => !r.ok).map((r) => `  FAIL: ${r.label}`).join("\n"));
console.log(`${failures === 0 ? "ALL CHECKS PASS" : failures + " CHECK(S) FAILED"}`);
return { failures, results, passed, total: results.length };
} // end runAllChecks

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  // `--crash=density|ceiling|both` selects the R-01b crash form; `--growth=pool|capacity` selects
  // the R-01 growth limitation. Defaults are the frozen readings (density / pool); the variants
  // are diagnostic and are what the F-2/F-4 claims are measured against.
  const crashArg = process.argv.find((a) => a.startsWith("--crash="));
  if (crashArg) setBloomCrashMode(crashArg.split("=")[1]);
  const growthArg = process.argv.find((a) => a.startsWith("--growth="));
  if (growthArg) setGrowthLimit(growthArg.split("=")[1]);
  console.log(`R-01b crash form: ${bloomCrashMode.mode} | R-01 growth limitation: ${growthLimit.mode}`);
  const { failures } = runAllChecks();
  process.exit(failures === 0 ? 0 : 1);
}
