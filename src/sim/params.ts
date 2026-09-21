// The parameter set — the ONLY place these numbers live (SCIENCE_MODEL §9, set `pc1-params-1.3`).
//
// STATUS: provisional. The rule *structure* is frozen, but the values do not yet satisfy every §11
// commitment — the evidence harness (`docs/design/evidence/calibration-sim.mjs`) is the authority
// and it currently fails. Every value is therefore a named export with its truth recorded next to
// it, and it is converted to fixed point ONCE, here. Re-calibration must be a change to this file,
// never a change to the kernel's code.
//
// `s()` is the only place a decimal literal is allowed to exist: from the next line on, every
// quantity in the kernel is an integer (R-51). `d()` is the same for dissolved oxygen, which is
// carried at one decimal.
import { SCALE, DO_SCALE } from "./fixed.js";

export const SIM_MODEL_VERSION = "pond-crisis-1.3";
export const PARAM_SET_VERSION = "pc1-params-1.3";

/** Model units → fixed point, once, at load. */
const s = (modelUnits: number): number => Math.round(modelUnits * SCALE);
/** mg/L → deci-mg/L, once, at load. */
const d = (mgPerL: number): number => Math.round(mgPerL * DO_SCALE);

/** Producers (R-01, R-01b, R-03, R-04). */
export const producers = {
  /** R-01 self-shading growth rate, per tick. */
  algaeGrowthRate: s(0.3),
  /** R-01 the logistic ceiling = the bloom's self-shading capacity (NOT the nutrient pool). */
  maxAlgae: s(100),
  /** R-01 pool level at half the growth rate (the supply factor's knee). */
  nutrientHalfSaturation: s(30),
  /** R-01b share of the growth shortfall shed per tick. */
  bloomCrashRate: s(2.0),
  /** R-04 fraction of algae to detritus per tick. */
  algaeSenescence: s(0.015),
  /** R-03 clarity loss per algae index point. */
  shadingCoefficient: s(0.95),
} as const;

/** Detritus, the nutrient pool and the export share (R-20, R-21, R-30). */
export const cycling = {
  /** R-21 fraction of detritus decomposed per tick. */
  decompRate: s(0.15),
  /** R-21 share of decomposed matter returned to the pool; the rest is buried out of the cycle. */
  mineralizationFraction: s(0.3),
  /** R-20 share of consumer mortality and egestion that leaves the pond. */
  exportFraction: s(0.5),
  /** R-30 settling/denitrification applied to the pool's EXCESS over the reference. */
  nutrientSinkRate: s(0.05),
  /** R-30 the pristine pool level for the canonical scenario. */
  nutrientReference: s(9.0),
  /** R-30 the undisturbed watershed supply, solved so the pool rests on the reference. */
  backgroundInflow: s(1.713),
} as const;

/** Oxygen (R-22, R-23). */
export const oxygen = {
  /** Warm-water saturation anchor, mg/L [S8]. */
  saturation: d(9.0),
  /** Relaxation rate toward saturation per tick. */
  reAeration: s(0.084),
  /** The aeration intervention's substituted rate (§10). */
  aerationRate: s(0.3),
  /** O2 cost per unit of decomposed matter — sets the trough depth with the detritus flux. */
  o2PerDecomp: s(0.04),
  /** O2 released per unit algae per tick, capped at photoCap. */
  o2PerPhoto: s(0.001),
  photoCap: d(0.5),
  /** Pond-wide basal consumption, mg/L per tick. */
  respirationBasal: d(0.1),
} as const;

/** The canonical scenario's disruption (SCIENCE_MODEL §2). */
export const scenario = {
  runoffDays: 10,
  runoffPerDay: s(10.0),
} as const;

/**
 * The canonical spring pond — the settled fixed point of this parameter set, frozen so every run
 * starts from the same measured state.
 *
 * These are the harness's measured values, and the uncomfortable ones are kept: the consumer loop
 * is not yet calibrated (SCIENCE_MODEL §9.1 F-8/F-9) and the mission's hypoxia beat is not
 * demonstrable at this set, so this build ships the producers / cycling / oxygen core.
 */
export const CANONICAL_INITIAL = {
  nutrients: s(9.0),
  algae: s(46.4),
  detritus: s(13.7),
  do: d(7.4),
} as const;
