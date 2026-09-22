// The parameter set — the ONLY place these numbers live (SCIENCE_MODEL §9, set `pc1-params-1.3`).
//
// STATUS: provisional. The rule *structure* is frozen; the values do not yet satisfy every §11
// commitment — the evidence harness (`docs/design/evidence/calibration-sim.mjs`) is the authority
// and it currently fails. Every value is a named export with its truth recorded next to it, and it
// is converted to fixed point ONCE, here. Re-calibration must be a change to this file, never a
// change to the kernel's code.
//
// `s()` is the only place a decimal literal is allowed to exist: from the next line on, every
// quantity in the kernel is an integer (R-51).
import { SCALE, DO_SCALE } from "./fixed.js";

export const SIM_MODEL_VERSION = "pond-crisis-1.3";
export const PARAM_SET_VERSION = "pc1-params-1.3";

/** Model units → fixed point, once, at load. */
const s = (modelUnits: number): number => Math.round(modelUnits * SCALE);
/** Mg/L → fixed point, once, at load. DO shares SCALE, so this is the same conversion. */
const d = (mgPerL: number): number => Math.round(mgPerL * DO_SCALE);

/** The seven organism groups (SCIENCE_MODEL §4), in the frozen evaluation order (§6.5). */
export const CONSUMER_ORDER = ["flea", "mayfly", "snail", "bluegill", "dragonfly"] as const;
export type ConsumerKey = (typeof CONSUMER_ORDER)[number];

/** Producers (R-01, R-01b, R-03, R-04). */
export const producers = {
  /** R-01 self-shading growth rate, per tick. */
  algaeGrowthRate: s(0.3),
  /** R-01 the logistic ceiling = the bloom's self-shading capacity (NOT the nutrient pool). */
  maxAlgae: s(100),
  /** R-01 pool level at half the growth rate (the supply factor's knee). */
  nutrientHalfSaturation: s(20),
  /** R-01b share of the growth shortfall shed per tick. */
  bloomCrashRate: s(1.5),
  /** R-04 fraction of algae to detritus per tick. */
  algaeSenescence: s(0.013),
  /** R-03 clarity loss per algae index point. */
  shadingCoefficient: s(0.95),
  /** R-02 waterweed growth, capacity and senescence. */
  weedGrowthRate: s(0.12),
  weedK: s(85),
  weedSenescence: s(0.02),
} as const;

/** Consumers (R-10, R-11, R-12, R-40, R-41). */
export const consumers = {
  /** R-10 grazing half-saturation, per link (F-9: a shared value makes the grazers identical). */
  halfSaturation: { flea: s(30), mayfly: s(30), snail: s(30) } as Record<"flea" | "mayfly" | "snail", number>,
  /** R-10 predation half-saturation — a predator's response saturates at a different prey density. */
  predationHalfSaturation: s(40),
  /** R-10 removal at saturation, per link. */
  removalRate: {
    flea: s(0.035),
    mayfly: s(0.035),
    snail: s(0.035),
    bluegill: s(0.0073),
    dragonfly: s(0.0073),
  } as Record<ConsumerKey, number>,
  /** R-12 recruitment cap, per species. */
  carryingCapacity: {
    flea: s(171),
    mayfly: s(147),
    snail: s(157),
    bluegill: s(32),
    dragonfly: s(16),
  } as Record<ConsumerKey, number>,
  /** R-20 share of removed prey mass egested rather than assimilated. */
  egestionFraction: s(0.02),
  /** R-12 maintenance respiration as a share of ASSIMILATED intake (F-1). */
  maintenance: s(0.03),
  /** R-12 background mortality per tick. */
  backgroundMortality: s(0.01),
  /** R-41 starvation escalation. */
  starveBase: s(0.02),
  starveEscalation: s(0.5),
  starveCap: 5,
  /** R-40 the mortality ceiling at the severe threshold, and the 2-tick averaging window. */
  stressMortality: s(0.15),
  stressWindow: 2,
  /** R-40 onset/severe thresholds in mg/L [S4, S7, S8, S11, S12]. */
  thresholds: {
    mayfly: { onset: d(5.5), severe: d(3.0) },
    flea: { onset: d(4.0), severe: d(2.0) },
    dragonfly: { onset: d(4.0), severe: d(2.0) },
    bluegill: { onset: d(5.0), severe: d(2.5) },
    snail: { onset: d(2.0), severe: d(1.0) },
  } as Record<ConsumerKey, { onset: number; severe: number }>,
  /** R-50 reproduction noise, as a fraction. Applied only to births. */
  noisePct: 0.02,
} as const;

/** Detritus, the nutrient pool and the export share (R-20, R-21, R-30). */
export const cycling = {
  /** R-21 fraction of detritus decomposed per tick. */
  decompRate: s(0.3),
  /** R-21 share of decomposed matter returned to the pool; the rest is buried out of the cycle. */
  mineralizationFraction: s(0.9),
  /** R-20 share of consumer mortality and egestion that leaves the pond. */
  exportFraction: s(0.15),
  /** R-30 settling/denitrification applied to the pool's EXCESS over the reference. */
  nutrientSinkRate: s(0.08),
  /** R-30 the pristine pool level for the canonical scenario. */
  nutrientReference: s(23),
  /** R-30 the undisturbed watershed supply, solved so the pool rests on the reference. */
  backgroundInflow: s(1.651),
} as const;

/** Oxygen (R-22, R-23). */
export const oxygen = {
  /** Warm-water saturation anchor, mg/L [S8]. */
  saturation: d(9.0),
  /** Relaxation rate toward saturation per tick. */
  reAeration: s(0.1),
  /** The aeration intervention's substituted rate (§10). */
  aerationRate: s(0.3),
  /** O2 cost per unit of decomposed matter — sets the trough depth with the detritus flux. */
  o2PerDecomp: s(0.04),
  /** O2 released per unit algae per tick, capped at photoCap. */
  o2PerPhoto: s(0.001),
  photoCap: d(0.5),
  /** Pond-wide basal consumption, mg/L per tick. */
  respirationBasal: d(0.05),
} as const;

/** The canonical scenario's disruption (SCIENCE_MODEL §2). */
export const scenario = {
  runoffDays: 10,
  runoffPerDay: s(9.0),
} as const;

/**
 * The canonical spring pond — the fixed point the KERNEL itself settles to, frozen so every run
 * starts from the same measured state: seven organism groups alive, the waterweeds in the littoral
 * and oxygen just under 7 mg/L. It is solved (see `tests/settle.test.ts`) rather than chosen,
 * because a state settled in floating point is a different point and drifts visibly once integer
 * arithmetic and the seeded birth noise take over.
 */
export const CANONICAL_INITIAL = {
  nutrients: s(32.656),
  algae: s(41.634),
  weeds: s(64.258),
  flea: s(75.009),
  mayfly: s(63.358),
  snail: s(63.633),
  bluegill: s(7.306),
  dragonfly: s(3.361),
  detritus: s(18.232),
  do: d(6.72),
} as const;
