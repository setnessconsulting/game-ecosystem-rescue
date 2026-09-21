// calibration-sim.mjs — GAME-317 / ER-01 evidence harness (NOT production code)
// Implements the candidate SCIENCE_MODEL v1.1 rules in plain JS so the frozen
// parameter set can be verified against §11 commitments before ER-03 exists.
// Run: node docs/design/evidence/calibration-sim.mjs
// Zero dependencies. Floats are fine here; the shipping kernel (ER-03) uses
// fixed-point integers per TECHNICAL_DESIGN §D-3 — magnitudes are far below
// 2^53 and rules are rational functions, so results transfer.

// ---------------------------------------------------------------------------
// Parameters (candidate frozen set — must match SCIENCE_MODEL §9 exactly)
// ---------------------------------------------------------------------------
const P = {
  // producers
  algaeGrowthRate: 0.30,      // R-01 logistic intrinsic rate
  maxAlgae: 100,              // index cap
  crashDecayRate: 0.35,       // R-01b decay-from-excess after ceiling collapse
  senescenceAlgae: 0.02,      // R-04 fraction -> sediment /tick
  weedGrowthRate: 0.10,       // R-02
  weedK: 70,                  // R-02 weed carrying capacity (frozen, was missing)
  senescenceWeeds: 0.015,     // R-04
  shadingCoefficient: 0.9,    // R-03
  // consumers (R-10/R-11: removal is DIRECTLY parameterized, not derived from intake)
  halfSaturation: 25,         // R-10 Holling half-saturation (shared)
  removalRate: { flea: 0.05, mayfly: 0.05, snail: 0.05, bluegill: 0.02, dragonfly: 0.02 },
  maxIntake:    { flea: 0.35, mayfly: 0.30, snail: 0.30, bluegill: 0.30, dragonfly: 0.30 },
  secondaryGrazeFactor: 0.7,  // mayfly/snail graze the shared pool less efficiently
  reproduction: 0.45,         // R-12 births on intake surplus
  maintenance: 0.05,          // R-12
  backgroundMortality: 0.015, // R-12
  starveBase: 0.05,           // R-41 starvation base mortality
  starveEscalation: 0.5,      // R-41 +50% per tick beyond the 3rd hungry tick
  starveCap: 5,               // R-41 max multiplier
  // sediment / decomposition / nutrients (closed loop with exports)
  decompRate: 0.15,           // R-21 fraction of sediment decomposed /tick
  tempFactor: 1.0,            // frozen constant in v1 (no temperature simulation)
  mineralizationFraction: 0.9,// R-21 share of decomposed matter returned to nutrient pool
  egestionFraction: 0.60,     // R-20 share of grazed biomass that is not converted to consumer biomass
  exportFraction: 0.20,       // R-21b share of consumer mortality+egestion leaving the pond (emergence/outflow)
  backgroundInflow: 0.40,     // R-30 constant watershed nutrient inflow /tick
  nutrientSink: 0.008,        // R-30 fraction of nutrient pool settling/denitrified /tick
  // oxygen (R-22/R-23)
  o2Saturation: 9.0,
  reAeration: 0.15,
  reAerationAerated: 0.28,    // aeration intervention value
  o2PerDecomp: 0.052,
  o2PerPhoto: 0.002,
  photoCap: 0.5,
  o2RespirationBasal: 0.056,
  // stress (R-40)
  stressWindow: 2,            // running-average window (ticks), frozen
  stressMortality: 0.10,
  thresholds: {               // onset / severe (mg/L), frozen per review finding #5
    mayfly:   { onset: 5.5, severe: 3.0 },
    flea:     { onset: 4.0, severe: 2.0 },
    dragonfly:{ onset: 4.0, severe: 2.0 },
    bluegill: { onset: 5.0, severe: 2.5 },
    snail:    { onset: 2.0, severe: 1.0 },
  },
  // stochasticity (R-50)
  noisePct: 0.02,
};

const ORDER = ["algae", "weeds", "flea", "mayfly", "snail", "bluegill", "dragonfly"];
const POP_CAP = 100, SED_CAP = 100, NUT_CAP = 100, DO_CAP = 15;

// Seeded PRNG (mulberry32) — the only stochasticity, reproduction terms only (R-50)
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
const holling = (x) => x / (P.halfSaturation + x);

// ---------------------------------------------------------------------------
// Initial state (canonical spring pond)
// ---------------------------------------------------------------------------
function initialState() {
  return {
    tick: 0,
    nutrients: 50, algae: 40, weeds: 60, flea: 40, mayfly: 30, snail: 30,
    bluegill: 25, dragonfly: 15, sediment: 25,
    do: 7.6, clarity: 100 - P.shadingCoefficient * 40,
    doHist: [7.6, 7.6],                 // for the 2-tick stress average
    hungry: { flea: 0, mayfly: 0, snail: 0, bluegill: 0, dragonfly: 0 },
    rng: null, seed: 1,
  };
}

// ---------------------------------------------------------------------------
// One tick. Order is FROZEN (SCIENCE_MODEL §6.5): all flows computed from the
// snapshot S; stocks updated once; DO last; clamps at end of tick only.
// ---------------------------------------------------------------------------
function step(s, cfg) {
  // cfg: { runoff(tick)->input, reAerationOverride?, interventions... }
  const S = { ...s, doHist: [...s.doHist], hungry: { ...s.hungry } };
  const f = {}; // flows, for the mass invariant + evidence layer

  // -- R-03 clarity (from snapshot algae)
  const clarity = clamp(100 - P.shadingCoefficient * S.algae, 0, 100);

  // -- R-01 algal growth (nutrient ceiling from snapshot nutrients)
  const ceiling = P.maxAlgae * Math.min(1, S.nutrients / 100);
  const grossAlgaeGrowth = ceiling > 0
    ? P.algaeGrowthRate * S.algae * (1 - S.algae / ceiling)
    : 0;
  const algaeUptake = Math.max(0, grossAlgaeGrowth); // nutrient cost of new algal biomass

  // -- R-01b bloom-crash: decay-from-excess (frozen rate; ceiling=0 => exponential floor)
  const excess = Math.max(0, S.algae - ceiling);
  const crashDeath = P.crashDecayRate * excess;

  // -- R-04 senescence
  const algaeSenescence = P.senescenceAlgae * S.algae;
  const weedSenescence = P.senescenceWeeds * S.weeds;

  // -- R-02 weed growth (clarity-scaled logistic toward weedK)
  const weedGrowth = P.weedGrowthRate * S.weeds * (1 - S.weeds / P.weedK)
    * (0.2 + 0.8 * (clarity / 100));
  const weedsUptake = Math.max(0, weedGrowth); // nutrient cost of new weed biomass

  // -- R-10/R-11 grazing & predation (frozen order: flea, mayfly, snail, bluegill, dragonfly)
  //    removal rates are direct parameters (review finding #6); capped by remaining prey.
  const prey = { algae: S.algae, flea: S.flea, mayfly: S.mayfly, snail: S.snail };
  const removal = { fleaA: 0, mayflyA: 0, snailA: 0, bluegillF: 0, bluegillMy: 0, bluegillS: 0, dragonflyF: 0, dragonflyMy: 0, dragonflyS: 0 };
  const intake = {}; // for consumer growth (Holling term, pre-removal-rate)
  intake.flea = P.maxIntake.flea * holling(S.algae);
  intake.mayfly = P.secondaryGrazeFactor * P.maxIntake.mayfly * holling(S.algae);
  intake.snail = P.secondaryGrazeFactor * P.maxIntake.snail * holling(S.algae);
  removal.fleaA = Math.min(P.removalRate.flea * holling(S.algae) * S.flea, prey.algae); prey.algae -= removal.fleaA;
  removal.mayflyA = Math.min(P.removalRate.mayfly * holling(S.algae) * S.mayfly, prey.algae); prey.algae -= removal.mayflyA;
  removal.snailA = Math.min(P.removalRate.snail * holling(S.algae) * S.snail, prey.algae); prey.algae -= removal.snailA;
  intake.bluegill = {
    flea: P.maxIntake.bluegill * holling(S.flea),
    mayfly: P.maxIntake.bluegill * holling(S.mayfly),
    snail: P.maxIntake.bluegill * holling(S.snail),
  };
  intake.dragonfly = {
    flea: P.maxIntake.dragonfly * holling(S.flea),
    mayfly: P.maxIntake.dragonfly * holling(S.mayfly),
    snail: P.maxIntake.dragonfly * holling(S.snail),
  };
  removal.bluegillF = Math.min(P.removalRate.bluegill * holling(S.flea) * S.bluegill, prey.flea); prey.flea -= removal.bluegillF;
  removal.bluegillMy = Math.min(P.removalRate.bluegill * holling(S.mayfly) * S.bluegill, prey.mayfly); prey.mayfly -= removal.bluegillMy;
  removal.bluegillS = Math.min(P.removalRate.bluegill * holling(S.snail) * S.bluegill, prey.snail); prey.snail -= removal.bluegillS;
  removal.dragonflyF = Math.min(P.removalRate.dragonfly * holling(S.flea) * S.dragonfly, prey.flea); prey.flea -= removal.dragonflyF;
  removal.dragonflyMy = Math.min(P.removalRate.dragonfly * holling(S.mayfly) * S.dragonfly, prey.mayfly); prey.mayfly -= removal.dragonflyMy;
  removal.dragonflyS = Math.min(P.removalRate.dragonfly * holling(S.snail) * S.dragonfly, prey.snail); prey.snail -= removal.dragonflyS;

  // -- R-12 births / deaths, R-41 starvation (noise on births only, R-50)
  const rng = S.rng;
  const noise = () => 1 + (rng() * 2 - 1) * P.noisePct;
  const pops = { flea: S.flea, mayfly: S.mayfly, snail: S.snail, bluegill: S.bluegill, dragonfly: S.dragonfly };
  const births = {}, deaths = {}, starve = {}, stress = {};
  const totalIntake = {
    flea: intake.flea,
    mayfly: intake.mayfly,
    snail: intake.snail,
    bluegill: intake.bluegill.flea + intake.bluegill.mayfly + intake.bluegill.snail,
    dragonfly: intake.dragonfly.flea + intake.dragonfly.mayfly + intake.dragonfly.snail,
  };
  // R-40 stress input: running average of DO over stressWindow (frozen = 2)
  const doAvg = (S.doHist.slice(-P.stressWindow).reduce((a, b) => a + b, 0)) / P.stressWindow;
  for (const sp of ["flea", "mayfly", "snail", "bluegill", "dragonfly"]) {
    births[sp] = P.reproduction * Math.max(0, totalIntake[sp] - P.maintenance) * pops[sp] * noise();
    deaths[sp] = P.backgroundMortality * pops[sp];
    // R-41 starvation
    if (totalIntake[sp] < P.maintenance) S.hungry[sp] += 1; else S.hungry[sp] = 0;
    if (S.hungry[sp] >= 3) {
      const mult = Math.min(P.starveCap, 1 + P.starveEscalation * (S.hungry[sp] - 3));
      starve[sp] = P.starveBase * mult * pops[sp];
    } else starve[sp] = 0;
    // R-40 DO stress (linear ramp onset -> severe on the averaged DO)
    const t = P.thresholds[sp];
    const frac = clamp((t.onset - doAvg) / (t.onset - t.severe), 0, 1);
    stress[sp] = P.stressMortality * frac * pops[sp];
  }

  // -- R-20/R-21b detritus (sediment) budget with export
  const consumerDeathMass = (["flea", "mayfly", "snail", "bluegill", "dragonfly"])
    .reduce((a, sp) => a + deaths[sp] + starve[sp] + stress[sp], 0);
  const grazedTotal = removal.fleaA + removal.mayflyA + removal.snailA;
  const predationTotal = removal.bluegillF + removal.bluegillMy + removal.bluegillS
    + removal.dragonflyF + removal.dragonflyMy + removal.dragonflyS;
  const grazedConverted = (["flea", "mayfly", "snail"]).reduce((a, sp) => a + births[sp], 0); // births come from grazed mass
  const predConverted = (["bluegill", "dragonfly"]).reduce((a, sp) => a + births[sp], 0);
  const egestion = P.egestionFraction * grazedTotal + P.egestionFraction * predationTotal; // coarse frozen split
  const detritusInflow = algaeSenescence + weedSenescence + crashDeath + consumerDeathMass * (1 - P.exportFraction) + egestion * (1 - P.exportFraction);

  // -- R-21 decomposition
  const decomposition = P.decompRate * S.sediment * P.tempFactor;
  const mineralized = P.mineralizationFraction * decomposition; // returns to nutrient pool
  const buried = decomposition - mineralized;                    // leaves the active cycle

  // -- R-30 nutrient pool
  const runoff = cfg.runoff ? cfg.runoff(S.tick) : 0;
  const nutIn = runoff + P.backgroundInflow;

  // -- R-22/R-23 oxygen (uses decomposition flow + snapshot algae)
  const photo = Math.min(P.photoCap, P.o2PerPhoto * S.algae);
  const reAer = (cfg.aerated ? P.reAerationAerated : P.reAeration) * (P.o2Saturation - S.do);
  const consumption = P.o2PerDecomp * decomposition + P.o2RespirationBasal;

  // ---- apply (single pass from snapshot) ----
  const n = {};
  n.nutrients = S.nutrients + nutIn + mineralized - algaeUptake - weedsUptake - P.nutrientSink * S.nutrients;
  n.algae = S.algae + grossAlgaeGrowth - crashDeath - algaeSenescence - grazedTotal;
  n.weeds = S.weeds + weedGrowth - weedSenescence;
  n.sediment = S.sediment + detritusInflow - decomposition;
  n.flea = pops.flea + births.flea - deaths.flea - starve.flea - stress.flea - removal.bluegillF - removal.dragonflyF;
  n.mayfly = pops.mayfly + births.mayfly - deaths.mayfly - starve.mayfly - stress.mayfly - removal.bluegillMy - removal.dragonflyMy;
  n.snail = pops.snail + births.snail - deaths.snail - starve.snail - stress.snail - removal.bluegillS - removal.dragonflyS;
  n.bluegill = pops.bluegill + births.bluegill - deaths.bluegill - starve.bluegill - stress.bluegill;
  n.dragonfly = pops.dragonfly + births.dragonfly - deaths.dragonfly - starve.dragonfly - stress.dragonfly;
  n.do = clamp(S.do + photo + reAer - consumption, 0, DO_CAP);
  n.clarity = clamp(100 - P.shadingCoefficient * clamp(n.algae, 0, POP_CAP), 0, 100);

  // clamps (end of tick only — R-52)
  for (const k of ORDER) n[k] = clamp(n[k], 0, POP_CAP);
  n.nutrients = clamp(n.nutrients, 0, NUT_CAP);
  n.sediment = clamp(n.sediment, 0, SED_CAP);
  n.do = clamp(n.do, 0, DO_CAP);

  n.tick = S.tick + 1;
  n.doHist = [...S.doHist, n.do].slice(-4);
  n.hungry = S.hungry;
  n.rng = S.rng; n.seed = S.seed;
  n._flows = { grossAlgaeGrowth, crashDeath, decomposition, mineralized, buried, detritusInflow, algaeUptake, weedsUptake, nutIn, egestion, consumerDeathMass };
  return n;
}

function run(days, cfg, seed = 1) {
  let s = initialState();
  s.seed = seed; s.rng = mulberry32(seed);
  const hist = [{ ...s }];
  for (let t = 0; t < days; t++) { s = step(s, cfg); hist.push({ ...s }); }
  return hist;
}

// ---------------------------------------------------------------------------
// Mass-accounting invariant (MS-LS2-3 loop made testable): nutrients + live
// biomass + sediment may only change via inflow, uptake->biomass is internal,
// burial/export are the only sinks. We verify per-tick accounting.
// ---------------------------------------------------------------------------
function massInvariantCheck(hist) {
  let worst = 0;
  for (let i = 1; i < hist.length; i++) {
    const a = hist[i - 1], b = hist[i];
    const totalBefore = a.nutrients + a.algae + a.weeds + a.flea + a.mayfly + a.snail + a.bluegill + a.dragonfly + a.sediment;
    const totalAfter = b.nutrients + b.algae + b.weeds + b.flea + b.mayfly + b.snail + b.bluegill + b.dragonfly + b.sediment;
    const f = b._flows;
    // expected change = inflow - buried - exported(consumer deaths+egestion share)
    const expected = f.nutIn - f.buried - (f.consumerDeathMass + f.egestion) * P.exportFraction;
    // biomass bookkeeping: uptake removes from pool and adds to biomass; growth/losses are internal
    const uptakeTotal = f.algaeUptake + f.weedsUptake;
    const diff = Math.abs((totalAfter - totalBefore) - (expected - 0)) ;
    // NOTE: uptake converts pool->biomass (no total change); crash/senescence/grazing are internal.
    worst = Math.max(worst, Math.abs(diff - 0) - 1e-9 > 0 ? diff - Math.abs(uptakeTotal - uptakeTotal) : diff);
  }
  return worst;
}

// ---------------------------------------------------------------------------
// Scenarios + commitment checks
// ---------------------------------------------------------------------------
const band = (v) => v >= 65 ? "thriving" : v >= 35 ? "stable" : v >= 15 ? "strained" : "crashing";

function report(name, hist) {
  const last = hist[hist.length - 1];
  const min = (k) => Math.min(...hist.map(h => h[k]));
  const max = (k) => Math.max(...hist.map(h => h[k]));
  console.log(`\n== ${name} ==`);
  console.log(`final: nutrients=${last.nutrients.toFixed(1)} algae=${last.algae.toFixed(1)} weeds=${last.weeds.toFixed(1)} flea=${last.flea.toFixed(1)} mayfly=${last.mayfly.toFixed(1)} snail=${last.snail.toFixed(1)} bluegill=${last.bluegill.toFixed(1)} dragonfly=${last.dragonfly.toFixed(1)} sed=${last.sediment.toFixed(1)} DO=${last.do.toFixed(2)} clarity=${last.clarity.toFixed(0)}`);
  console.log(`extrema: algae[max ${max("algae").toFixed(1)}] DO[min ${min("do").toFixed(2)}] clarity[min ${min("clarity").toFixed(0)}] mayfly[min ${min("mayfly").toFixed(1)}] bluegill[min ${min("bluegill").toFixed(1)}]`);
  return { last, min, max, hist };
}

let failures = 0;
const check = (ok, label) => { console.log(`  ${ok ? "PASS" : "FAIL"} — ${label}`); if (!ok) failures++; };
const firstBelow = (hist, k, v) => { const i = hist.findIndex(h => h[k] < v); return i < 0 ? null : i; };
const firstAbove = (hist, k, v) => { const i = hist.findIndex(h => h[k] > v); return i < 0 ? null : i; };

// --- C1: baseline stability (no disruption, 60 ticks)
{
  const h = run(60, {});
  const r = report("C1 baseline (60d, no disruption)", h);
  for (const k of ["algae", "weeds", "flea", "mayfly", "snail", "bluegill", "dragonfly"]) {
    const init = { algae: 40, weeds: 60, flea: 40, mayfly: 30, snail: 30, bluegill: 25, dragonfly: 15 }[k];
    check(Math.abs(r.last[k] - init) <= 10 && Math.abs(r.min(k) - init) <= 12 && Math.abs(r.max(k) - init) <= 12,
      `${k} within ±10 of ${init} (final ${r.last[k].toFixed(1)}, range ${r.min(k).toFixed(1)}–${r.max(k).toFixed(1)})`);
  }
  check(Math.abs(r.last.do - 7.6) <= 1.5, `DO near baseline (final ${r.last.do.toFixed(2)})`);
}

// --- C2: canonical runoff (days 0–10), no intervention
{
  const runoff = (t) => (t < 10 ? 6.0 : 0);
  const h = run(60, { runoff });
  const r = report("C2 canonical runoff, no intervention", h);
  const algaeDay = firstAbove(h, "algae", 75);
  check(algaeDay !== null && algaeDay >= 12 && algaeDay <= 18, `algae ≥ 75 by day 12–18 (day ${algaeDay})`);
  const clarityDay = firstBelow(h, "clarity", 30);
  check(clarityDay !== null && clarityDay >= 15 && clarityDay <= 25, `clarity < 30 by day 15–25 (day ${clarityDay})`);
  const doDay = firstBelow(h, "do", 5.0);
  check(doDay !== null && doDay >= 18 && doDay <= 30, `DO < 5.0 between days 18–30 (day ${doDay})`);
  const mayflyDay = firstBelow(h, "mayfly", 20);
  check(mayflyDay !== null && mayflyDay >= 30 && mayflyDay <= 40, `mayflies < 20 by day 30–40 (day ${mayflyDay})`);
  const bgDay = firstBelow(h, "bluegill", 25 * 0.8);
  check(bgDay !== null && bgDay >= 35 && bgDay <= 50, `bluegill visibly declining by day 35–50 (day ${bgDay})`);
  check(r.last.do < 5.0 && r.last.do > 1.5, `DO ends hypoxic but not anoxic (${r.last.do.toFixed(2)})`);
}

// --- C3: early remediation (day 5: runoff diverted + buffer)
{
  const runoff = (t) => (t < 5 ? 6.0 : 0);
  const h = run(60, { runoff });
  const r = report("C3 early remediation (divert at day 5)", h);
  const doDay = firstBelow(h, "do", 5.0);
  const crashDay = firstBelow(h, "algae", 40); // bloom collapse begins
  check(doDay === null || doDay >= 25, `DO never or late below 5.0 (first day ${doDay})`);
  const doRecover = (() => { // after any dip, first day back above 5.0
    const dip = firstBelow(h, "do", 5.0);
    if (dip === null) return true;
    for (let i = dip; i < h.length; i++) if (h[i].do > 5.0) return (i - dip) <= 15;
    return false;
  })();
  check(doRecover, `DO recovers above 5.0 within ~10–15 ticks of any dip`);
  check(r.last.weeds > 62 && r.last.weeds < 95, `weeds recovering but not to 100 (final ${r.last.weeds.toFixed(1)})`);
}

// --- C4: aeration only (from day 12), runoff continues
{
  const runoff = (t) => (t < 10 ? 6.0 : 0);
  const hBase = run(60, { runoff });
  const hAer = run(60, { runoff, aerated: true });
  report("C4 aeration-only vs baseline", hAer);
  let maxImprovement = 0;
  for (let i = 0; i < 60; i++) maxImprovement = Math.max(maxImprovement, hAer[i].do - hBase[i].do);
  check(maxImprovement > 0.5 && maxImprovement <= 3.0, `aeration transient improvement ≤ 3.0 mg/L (max ${maxImprovement.toFixed(2)})`);
  check(hAer[30].algae > 60, `bloom persists under aeration (algae day 30: ${hAer[30].algae.toFixed(1)})`);
}

// --- S1: dose-response ordering
{
  const order = (h) => {
    const a = firstBelow(h, "clarity", 30), b = firstBelow(h, "do", 5.0), c = firstBelow(h, "mayfly", 20), d = firstBelow(h, "bluegill", 20);
    return [a, b, c, d];
  };
  const h1 = run(60, { runoff: (t) => (t < 10 ? 6.0 : 0) });
  const h2 = run(60, { runoff: (t) => (t < 10 ? 12.0 : 0) });
  const o1 = order(h1), o2 = order(h2);
  const ordered = (o) => o.every((v, i) => v !== null && (i === 0 || v >= o[i - 1]));
  check(ordered(o1) && ordered(o2), `ordering clarity→DO→mayfly→bluegill holds at 1× and 2× dose (1×: ${o1}, 2×: ${o2})`);
  const t1 = o1[1], t2 = o2[1];
  check(t2 !== null && t1 !== null && t2 < t1 * 0.8, `2× dose reaches DO stress ≥20% sooner (${t1} → ${t2})`);
}

// --- S3: cascade direction
{
  // remove bluegill at day 10 under canonical runoff; compare fleas/algae at day 30/45
  const runoff = (t) => (t < 10 ? 6.0 : 0);
  const hA = run(45, { runoff });
  // emulate intervention: patch step via cfg (bluegill removal)
  // (simplest: run with a hook — here we re-run with reduced initial bluegill from day 10 approximation)
  const hB = run(45, { runoff });
  // manual: apply removal mid-run
  let s = initialState(); s.rng = mulberry32(1); const hC = [{ ...s }];
  for (let t = 0; t < 45; t++) {
    if (t === 10) s.bluegill = s.bluegill * 0.5;
    s = step(s, { runoff });
    hC.push({ ...s });
  }
  const r = report("S3 cascade (bluegill −50% at day 10)", hC);
  check(r.last.flea > hA[45].flea + 5, `fleas higher with fewer bluegill (${r.last.flea.toFixed(1)} vs ${hA[45].flea.toFixed(1)})`);
  check(r.last.algae < hA[45].algae - 3, `algae lower with fewer bluegill (${r.last.algae.toFixed(1)} vs ${hA[45].algae.toFixed(1)})`);
}

// --- S4: recovery shape (cut nutrients at bloom peak day 15)
{
  const runoff = (t) => (t < 15 ? 6.0 : 0);
  const h = run(60, { runoff });
  const r = report("S4 crash-then-slow-recovery (runoff stops day 15)", h);
  const crashDepth = Math.min(...h.slice(16, 40).map(x => x.algae));
  check(crashDepth < 45, `bloom crashes after nutrient cut (min algae ${crashDepth.toFixed(1)})`);
  const weedsRec = h[59].weeds;
  check(weedsRec > 50 && weedsRec < 95, `weeds recover slowly, not to 100 (final ${weedsRec.toFixed(1)})`);
}

// --- S6: soak 10,000 ticks
{
  const h = run(10000, {});
  let ok = true, minDo = 15, maxAny = 0;
  for (const x of h) {
    for (const k of [...ORDER, "nutrients", "sediment"]) if (!(x[k] >= 0 && x[k] <= 100)) ok = false;
    if (!Number.isFinite(x.do) || x.do < 0 || x.do > 15) ok = false;
    minDo = Math.min(minDo, x.do); maxAny = Math.max(maxAny, x.algae);
  }
  console.log(`\n== S6 soak (10,000 ticks) == bounds ok=${ok}, min DO=${minDo.toFixed(2)}, max algae=${maxAny.toFixed(1)}`);
  check(ok, `10k-tick soak stays bounded, no NaN`);
}

// --- S7: seed sensitivity
{
  const traces = [1, 2, 3, 4, 5].map(seed => run(60, { runoff: (t) => (t < 10 ? 6.0 : 0) }, seed));
  let maxSpread = 0;
  for (let t = 0; t <= 60; t++) {
    for (const k of ORDER) {
      const vals = traces.map(h => h[t][k]);
      maxSpread = Math.max(maxSpread, Math.max(...vals) - Math.min(...vals));
    }
  }
  console.log(`\n== S7 seed sensitivity == max index spread across 5 seeds: ${maxSpread.toFixed(2)}`);
  check(maxSpread <= 5, `noise changes traces by ≤ ±5 (max ${maxSpread.toFixed(2)})`);
}

// --- mass invariant sanity on the canonical run
{
  const h = run(60, { runoff: (t) => (t < 10 ? 6.0 : 0) });
  const w = massInvariantCheck(h);
  console.log(`\n== mass invariant == worst per-tick accounting residual: ${w.toExponential(2)}`);
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASS" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
