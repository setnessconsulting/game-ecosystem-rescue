// The simulation kernel — the game's ecological authority (SCIENCE_MODEL §6, TECHNICAL_DESIGN §D-2).
//
// Design rules this file obeys, all of them non-negotiable:
//   1. Integers only (R-51). No float ever touches `EcosystemState`.
//   2. One update pass per tick, all flows from the pre-tick snapshot (SCIENCE_MODEL §6.5).
//   3. Clamps at the end of the tick only.
//   4. No clock, no DOM, no storage, no network, no unseeded randomness — enforced by
//      `scripts/verify-boundary.mjs`, which fails CI if any of them appears under src/sim/.
//   5. Matter is conserved by construction: every stock-to-stock transfer is a mass transfer, so
//      `loopResidual` can assert the MS-LS2-3 identity on any trace.
//
// This slice implements the producer / cycling / oxygen core: the nutrient pulse, the bloom, the
// clarity loss, the detritus pipeline and the oxygen sag. The consumer rules (R-10…R-14, R-40,
// R-41) are deliberately absent until calibration finding F-9 is resolved — a consumer loop that
// cannot keep its species alive would put a dead species in front of a learner.
import { SCALE, DO_SCALE, INDEX_MAX, DO_MAX, mul, div, clamp } from "./fixed.js";
import { producers, cycling, oxygen, scenario, CANONICAL_INITIAL } from "./params.js";
import type { EcosystemState, FlowLedger, TickResult, SimAction, ScenarioFlags, SimEvent } from "./types.js";

const INDEX_CAP = INDEX_MAX * SCALE;
const DO_CAP = DO_MAX * DO_SCALE;
/** §10: a shoreline buffer cuts the remaining runoff by ~70%, so 30% still arrives. */
const BUFFER_STRIP_REMAINING = Math.trunc((SCALE * 3) / 10);

export type Scenario = {
  /**
   * Runoff as a function of tick, in fixed point. The canonical scenario pulses for ten days: the
   * player observes the pond's response, never the injection itself (§2).
   */
  readonly runoffAt: (tick: number) => number;
};

export const canonicalScenario: Scenario = {
  runoffAt: (tick) => (tick < scenario.runoffDays ? scenario.runoffPerDay : 0),
};

/** A fresh state at the canonical spring pond. */
export function initialState(seed = 1): EcosystemState {
  const doStart = CANONICAL_INITIAL.do;
  return {
    tick: 0,
    nutrients: CANONICAL_INITIAL.nutrients,
    algae: CANONICAL_INITIAL.algae,
    detritus: CANONICAL_INITIAL.detritus,
    do: doStart,
    clarity: clarityOf(CANONICAL_INITIAL.algae),
    doAverage: doStart,
    doHistory: [doStart, doStart],
    flags: { runoffDiverted: false, bufferStrip: false, aerated: false },
    rngSeed: seed >>> 0,
    events: [],
  };
}

/** R-03 clarity from the bloom: algae shade the water. */
export function clarityOf(algae: number): number {
  return clamp(SCALE * 100 - mul(producers.shadingCoefficient, algae), 0, SCALE * 100);
}

/**
 * One tick, in the frozen order (§6.5): the snapshot is read, every flow is computed from it, and
 * the new state is written once.
 */
export function tick(state: EcosystemState, sc: Scenario = canonicalScenario): TickResult {
  const s = state;
  const events: SimEvent[] = [];

  // -- R-01 algal growth. The logistic ceiling is the fixed self-shading capacity; the pool enters
  //    as a saturating supply factor and as the hard mass constraint (uptake <= nutrients).
  const supplyFactor = div(s.nutrients, producers.nutrientHalfSaturation + s.nutrients);
  const rawGrowth =
    s.algae > 0
      ? mul(
          mul(producers.algaeGrowthRate, supplyFactor),
          mul(s.algae, SCALE - div(s.algae, producers.maxAlgae)),
        )
      : 0;
  const algaeGrowth = rawGrowth < s.nutrients ? rawGrowth : s.nutrients;

  // -- R-04 senescence
  const algaeSenescence = mul(producers.algaeSenescence, s.algae);

  // -- R-01b bloom die-back: the bloom sheds the part of its own losses that its growth no longer
  //    covers. With no consumers in this slice the only loss is senescence, so this term is small —
  //    which is exactly finding F-8: the magnitude of the crash comes from the grazing, and the
  //    grazing needs a consumer community the rules can keep alive (F-9).
  const losses = algaeSenescence;
  const shortfall = losses > algaeGrowth ? losses - algaeGrowth : 0;
  const algaeDieback = mul(producers.bloomCrashRate, shortfall);
  if (shortfall > 0 && !s.events.some((e) => e.kind === "bloom-dieback-onset")) {
    events.push({ rule: "R-01b", kind: "bloom-dieback-onset", value: shortfall });
  }

  // -- R-21 decomposition, and the burial that leaves the active cycle
  const decomposition = mul(cycling.decompRate, s.detritus);
  const mineralized = mul(cycling.mineralizationFraction, decomposition);
  const buried = decomposition - mineralized;

  // -- R-20 detritus inflow: producers shed into it. The export share applies to consumer
  //    mortality + egestion, which this slice does not yet have, so it is zero here — and the
  //    identity that `loopResidual` asserts is written to match, not fitted to it.
  const detritusInflow = algaeSenescence + algaeDieback;

  // -- R-30 the pool: scenario runoff + the watershed supply, minus uptake and the excess sink.
  let runoff = sc.runoffAt(s.tick);
  if (s.flags.runoffDiverted) runoff = 0;
  if (s.flags.bufferStrip) runoff = mul(runoff, BUFFER_STRIP_REMAINING);
  const inflow = runoff + cycling.backgroundInflow;
  const nutrientSinkLoss = mul(cycling.nutrientSinkRate, Math.max(0, s.nutrients - cycling.nutrientReference));

  // -- R-22/R-23 oxygen: photosynthesis in, decomposition + basal respiration out, re-aeration
  //    relaxing toward saturation with the aerated rate when the intervention is active.
  const reAerationRate = s.flags.aerated ? oxygen.aerationRate : oxygen.reAeration;
  const o2Produced = Math.min(oxygen.photoCap, mul(oxygen.o2PerPhoto, s.algae));
  const o2Demand = mul(oxygen.o2PerDecomp, decomposition);
  const o2Respiration = oxygen.respirationBasal;
  const o2Reaeration = mul(reAerationRate, oxygen.saturation - s.do);

  // ---- one update pass, from the snapshot ----
  const nutrients = clamp(s.nutrients + inflow + mineralized - algaeGrowth - nutrientSinkLoss, 0, INDEX_CAP);
  const algae = clamp(s.algae + algaeGrowth - algaeDieback - algaeSenescence, 0, INDEX_CAP);
  const detritus = clamp(s.detritus + detritusInflow - decomposition, 0, INDEX_CAP);
  const doNext = clamp(s.do + o2Produced + o2Reaeration - o2Demand - o2Respiration, 0, DO_CAP);

  const doHistory = [...s.doHistory, doNext].slice(-4);
  const last = doHistory[doHistory.length - 1]!;
  const prev = doHistory[doHistory.length - 2] ?? last;
  const doAverage = Math.trunc((last + prev) / 2);

  const next: EcosystemState = {
    tick: s.tick + 1,
    nutrients,
    algae,
    detritus,
    do: doNext,
    clarity: clarityOf(algae),
    doAverage,
    doHistory,
    flags: s.flags,
    rngSeed: s.rngSeed,
    events: [...s.events, ...events].slice(-64),
  };

  const flows: FlowLedger = {
    runoff,
    inflow,
    algaeGrowth,
    algaeDieback,
    algaeSenescence,
    decomposition,
    mineralized,
    buried,
    nutrientSinkLoss,
    o2Produced,
    o2Demand,
    o2Reaeration,
    o2Respiration,
  };

  return { state: next, flows };
}

/** Apply an action. `advanceDays` is bounded per commit; unknown actions throw (fail-closed). */
export function step(state: EcosystemState, action: SimAction, sc: Scenario = canonicalScenario): EcosystemState {
  switch (action.kind) {
    case "noop":
      return state;
    case "advanceDays": {
      if (!Number.isInteger(action.days) || action.days < 0 || action.days > 7) {
        throw new Error(`advanceDays must be an integer 0..7, received ${action.days}`);
      }
      let s = state;
      for (let i = 0; i < action.days; i++) s = tick(s, sc).state;
      return s;
    }
    case "applyIntervention": {
      const flags: ScenarioFlags = {
        runoffDiverted: state.flags.runoffDiverted || action.id === "divert-runoff",
        bufferStrip: state.flags.bufferStrip || action.id === "buffer-strip",
        aerated: state.flags.aerated || action.id === "aeration",
      };
      return {
        ...state,
        flags,
        events: [...state.events, { rule: "R-31", kind: "intervention-applied", value: 0 }].slice(-64),
      };
    }
    default: {
      const never: never = action;
      throw new Error(`unknown action ${JSON.stringify(never)}`);
    }
  }
}

/**
 * The matter identity of §5: on any tick, the change in (nutrients + biomass + detritus) equals
 * inflow − sink − burial − export. Returns the worst per-tick residual over a trace, which must be
 * zero for a correct kernel — the anchor the whole mission is built on (MS-LS2-3).
 */
export function loopResidual(trace: readonly TickResult[]): { worst: number; worstTick: number | null } {
  let worst = 0;
  let worstTick: number | null = null;
  for (let i = 1; i < trace.length; i++) {
    const before = trace[i - 1]!;
    const after = trace[i]!;
    const totalBefore = before.state.nutrients + before.state.algae + before.state.detritus;
    const totalAfter = after.state.nutrients + after.state.algae + after.state.detritus;
    const f = after.flows;
    const expected = f.inflow - f.nutrientSinkLoss - f.buried;
    const residual = Math.abs(totalAfter - totalBefore - expected);
    if (residual > worst) {
      worst = residual;
      worstTick = after.state.tick;
    }
  }
  return { worst: worst / SCALE, worstTick };
}

/** Run ticks and collect the trace (state + ledger per tick), for tests and the evidence layer. */
export function run(days: number, sc: Scenario = canonicalScenario, seed = 1): TickResult[] {
  let s = initialState(seed);
  const trace: TickResult[] = [{ state: s, flows: ZERO_FLOWS }];
  for (let i = 0; i < days; i++) {
    const r = tick(s, sc);
    trace.push(r);
    s = r.state;
  }
  return trace;
}

const ZERO_FLOWS: FlowLedger = {
  runoff: 0,
  inflow: 0,
  algaeGrowth: 0,
  algaeDieback: 0,
  algaeSenescence: 0,
  decomposition: 0,
  mineralized: 0,
  buried: 0,
  nutrientSinkLoss: 0,
  o2Produced: 0,
  o2Demand: 0,
  o2Reaeration: 0,
  o2Respiration: 0,
};
