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
// All seven organism groups are present (§4): algae and waterweeds as producers, water fleas,
// mayflies and snails as grazers, bluegill as the secondary consumer, dragonfly nymphs as the
// invertebrate predator, plus the implicit decomposer layer that is the detritus pipeline.
import { SCALE, DO_SCALE, INDEX_MAX, DO_MAX, mul, div, clamp } from "./fixed.js";
import {
  producers,
  consumers,
  cycling,
  oxygen,
  scenario,
  CANONICAL_INITIAL,
  CONSUMER_ORDER,
  type ConsumerKey,
} from "./params.js";
import type {
  EcosystemState,
  FlowLedger,
  TickResult,
  SimAction,
  ScenarioFlags,
  SimEvent,
  ConsumerStocks,
} from "./types.js";

const INDEX_CAP = INDEX_MAX * SCALE;
const DO_CAP = DO_MAX * DO_SCALE;
/** §10: a shoreline buffer cuts the remaining runoff by ~70%, so 30% still arrives. */
const BUFFER_STRIP_REMAINING = Math.trunc((SCALE * 3) / 10);
/** R-02: even in the dark a waterweed grows at this share of its rate (the `0.2 +` of the rule). */
const WEED_MIN_FACTOR = Math.trunc((SCALE * 2) / 10);
/** §10: a grazer boost adds this many index points of water fleas. */
const GRAZER_BOOST = 20 * SCALE;
/** The grazers whose functional response is filter-feeding rather than predation. */
const GRAZERS: readonly ConsumerKey[] = ["flea", "mayfly", "snail"];

export type Scenario = {
  /**
   * Runoff as a function of tick, in fixed point. The canonical scenario pulses for ten days: the
   * player observes the pond's response, never the injection itself (§2).
   */
  readonly runoffAt: (tick: number) => number;
  /**
   * R-30 the undisturbed watershed supply. It belongs to the scenario because §9 says it is
   * *solved* for the pond rather than chosen: the settle drives it until the nutrient index rests
   * on its reference and every stock stops moving. Absent, the parameter set's value applies.
   */
  readonly backgroundInflow?: number;
};

export const canonicalScenario: Scenario = {
  runoffAt: (tick) => (tick < scenario.runoffDays ? scenario.runoffPerDay : 0),
};

/** R-50: the only stochasticity in the model, and it is seeded (mulberry32, §6.4). */
function nextRandom(seed: number): { value: number; seed: number } {
  const a = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: a >>> 0 };
}

/** A fresh state at the canonical spring pond. */
export function initialState(seed = 1): EcosystemState {
  const init = CANONICAL_INITIAL;
  const doStart = init.do;
  return {
    tick: 0,
    nutrients: init.nutrients,
    algae: init.algae,
    weeds: init.weeds,
    consumers: {
      flea: init.flea,
      mayfly: init.mayfly,
      snail: init.snail,
      bluegill: init.bluegill,
      dragonfly: init.dragonfly,
    },
    hungry: { flea: 0, mayfly: 0, snail: 0, bluegill: 0, dragonfly: 0 },
    detritus: init.detritus,
    do: doStart,
    clarity: clarityOf(init.algae),
    doHistory: [doStart, doStart],
    crashActive: false,
    flags: { runoffDiverted: false, bufferStrip: false, aerated: false },
    rngSeed: seed >>> 0,
    events: [],
  };
}

/** R-03 clarity from the bloom: algae shade the water. */
export function clarityOf(algae: number): number {
  return clamp(SCALE * 100 - mul(producers.shadingCoefficient, algae), 0, SCALE * 100);
}

const zeroStocks = (): ConsumerStocks => ({ flea: 0, mayfly: 0, snail: 0, bluegill: 0, dragonfly: 0 });

/**
 * One tick, in the frozen order (§6.5): the snapshot is read, every flow is computed from it, and
 * the new state is written once.
 */
export function tick(state: EcosystemState, sc: Scenario = canonicalScenario): TickResult {
  const s = state;
  const events: SimEvent[] = [];
  const stock = s.consumers;

  // -- R-01 algal growth. The logistic ceiling is the fixed self-shading capacity; the pool enters
  //    as a saturating supply factor and as the hard mass constraint (uptake <= nutrients).
  const supplyFactor = div(s.nutrients, producers.nutrientHalfSaturation + s.nutrients);
  const algaeGrowth =
    s.algae > 0
      ? Math.min(
          mul(mul(producers.algaeGrowthRate, supplyFactor), mul(s.algae, SCALE - div(s.algae, producers.maxAlgae))),
          s.nutrients,
        )
      : 0;

  // -- R-04 senescence, producers
  const algaeSenescence = mul(producers.algaeSenescence, s.algae);
  const weedSenescence = mul(producers.weedSenescence, s.weeds);

  // -- R-02 waterweed growth, clarity-scaled so a bloom starves the littoral plants of light:
  //    rate multiplier 0.2 + 0.8 x (clarity/100)
  const clarity = clarityOf(s.algae);
  const clarityFactor = WEED_MIN_FACTOR + mul(SCALE - WEED_MIN_FACTOR, div(clarity, SCALE * 100));
  const weedGrowth =
    s.weeds > 0
      ? Math.max(0, mul(mul(producers.weedGrowthRate, s.weeds), mul(SCALE - div(s.weeds, producers.weedK), clarityFactor)))
      : 0;

  // -- R-10/R-11 removal, in the frozen order: grazers take from the algal pool, predators take
  //    from the grazers, and each link is capped by the prey the snapshot still has.
  const prey: Record<string, number> = {
    algae: s.algae,
    flea: stock.flea,
    mayfly: stock.mayfly,
    snail: stock.snail,
  };
  const removed = zeroStocks();
  const take = (pred: ConsumerKey, preyKey: string): number => {
    const isGrazer = GRAZERS.includes(pred);
    const h = isGrazer
      ? div(prey[preyKey]!, consumers.halfSaturation[pred as "flea" | "mayfly" | "snail"] + prey[preyKey]!)
      : div(prey[preyKey]! * prey[preyKey]!, consumers.predationHalfSaturation * consumers.predationHalfSaturation + prey[preyKey]! * prey[preyKey]!);
    const want = mul(mul(consumers.removalRate[pred], h), stock[pred]);
    const got = Math.min(want, prey[preyKey]!);
    prey[preyKey]! -= got;
    removed[pred] += got;
    return got;
  };
  const grazedAlgae = {
    flea: take("flea", "algae"),
    mayfly: take("mayfly", "algae"),
    snail: take("snail", "algae"),
  };
  const predation = zeroStocks();
  for (const predator of ["bluegill", "dragonfly"] as const) {
    for (const grazer of GRAZERS) predation[grazer] += take(predator, grazer);
  }

  // -- R-40 stress input: the running average of DO, so a single-day dip is not fatal and a
  //    multi-day low is.
  const stressHistory = s.doHistory.slice(-consumers.stressWindow);
  const doAverage = Math.trunc(stressHistory.reduce((a, b) => a + b, 0) / stressHistory.length);

  // -- R-01b, now that grazing is known: the bloom sheds the part of its own losses that its
  //    growth no longer covers. With the consumers present this is the mass death R-04 promises.
  const losses = algaeSenescence + grazedAlgae.flea + grazedAlgae.mayfly + grazedAlgae.snail;
  const shortfall = losses > algaeGrowth ? losses - algaeGrowth : 0;
  const algaeDieback = mul(producers.bloomCrashRate, shortfall);
  const crashActive = shortfall > 0;
  if (crashActive && !s.crashActive) {
    events.push({ rule: "R-01b", kind: "bloom-dieback-onset", value: shortfall });
  }

  // -- R-12/R-20/R-41 consumer mass budget. Removed prey mass splits into egestion, maintenance
  //    respiration and production; production is capped by recruitment, and what cannot be
  //    recruited is shed back to detritus so matter is never stranded at a cap.
  let rngSeed = s.rngSeed;
  const births = zeroStocks();
  const deaths = zeroStocks();
  const starve = zeroStocks();
  const stress = zeroStocks();
  let respiredTotal = 0;
  let shedTotal = 0;
  let egestionTotal = 0;
  for (const sp of CONSUMER_ORDER) {
    const egestion = mul(consumers.egestionFraction, removed[sp]);
    egestionTotal += egestion;
    const assimilated = removed[sp] - egestion;
    const respired = mul(consumers.maintenance, assimilated);
    respiredTotal += respired;
    const surplus = assimilated - respired;
    const recruitment = clamp(SCALE - div(stock[sp], consumers.carryingCapacity[sp]), 0, SCALE);
    const noise = nextRandom(rngSeed);
    rngSeed = noise.seed;
    const noiseFactor = SCALE + Math.trunc((noise.value * 2 - 1) * consumers.noisePct * SCALE);
    births[sp] = mul(mul(surplus, recruitment), noiseFactor);
    shedTotal += surplus - births[sp];
    deaths[sp] = mul(consumers.backgroundMortality, stock[sp]);

    // R-41 food limitation: consecutive ticks where what the species assimilates cannot cover its
    // own maintenance.
    if (assimilated < respired) s.hungry[sp] += 1;
    else s.hungry[sp] = 0;
    if (s.hungry[sp] >= 3) {
      const mult = Math.min(consumers.starveCap, 1 + consumers.starveEscalation * (s.hungry[sp] - 3));
      starve[sp] = mul(mul(consumers.starveBase, mult), stock[sp]);
    }

    // R-40 stress: a linear ramp from onset to severe on the averaged DO.
    const th = consumers.thresholds[sp];
    const frac = clamp(div(th.onset - doAverage, th.onset - th.severe), 0, SCALE);
    stress[sp] = mul(mul(consumers.stressMortality, frac), stock[sp]);
    if (frac > 0 && doAverage < th.onset) {
      events.push({ rule: "R-40", kind: "stress", organism: sp, value: frac });
    }
  }

  // -- R-20/R-21b detritus budget, with the export share leaving the pond (emergence, outflow)
  const deadMass = CONSUMER_ORDER.reduce((a, sp) => a + deaths[sp] + starve[sp] + stress[sp], 0);
  const exportLoss = mul(cycling.exportFraction, deadMass + egestionTotal);
  const detritusInflow =
    algaeSenescence + weedSenescence + algaeDieback + respiredTotal + shedTotal + deadMass + egestionTotal - exportLoss;

  // -- R-21 decomposition, and the burial that leaves the active cycle
  const decomposition = mul(cycling.decompRate, s.detritus);
  const mineralized = mul(cycling.mineralizationFraction, decomposition);
  const buried = decomposition - mineralized;

  // -- R-30 the pool: scenario runoff + the watershed supply, minus uptake and the excess sink
  let runoff = sc.runoffAt(s.tick);
  if (s.flags.runoffDiverted) runoff = 0;
  if (s.flags.bufferStrip) runoff = mul(runoff, BUFFER_STRIP_REMAINING);
  const inflow = runoff + (sc.backgroundInflow ?? cycling.backgroundInflow);
  const nutrientSinkLoss = mul(cycling.nutrientSinkRate, Math.max(0, s.nutrients - cycling.nutrientReference));

  // -- R-22/R-23 oxygen: photosynthesis in, decomposition + basal respiration out, re-aeration
  //    relaxing toward saturation with the aerated rate when the intervention is active.
  const reAerationRate = s.flags.aerated ? oxygen.aerationRate : oxygen.reAeration;
  const o2Produced = Math.min(oxygen.photoCap, mul(oxygen.o2PerPhoto, s.algae));
  const o2Demand = mul(oxygen.o2PerDecomp, decomposition) + mul(oxygen.o2PerBurst, detritusInflow);
  const o2Respiration = oxygen.respirationBasal;
  const o2Reaeration = mul(reAerationRate, oxygen.saturation - s.do);

  // ---- one update pass, from the snapshot ----
  const nutrients = clamp(s.nutrients + inflow + mineralized - algaeGrowth - weedGrowth - nutrientSinkLoss, 0, INDEX_CAP);
  const algae = clamp(s.algae + algaeGrowth - algaeDieback - algaeSenescence - (grazedAlgae.flea + grazedAlgae.mayfly + grazedAlgae.snail), 0, INDEX_CAP);
  const weeds = clamp(s.weeds + weedGrowth - weedSenescence, 0, INDEX_CAP);
  const nextConsumers = zeroStocks();
  for (const sp of CONSUMER_ORDER) {
    nextConsumers[sp] = clamp(stock[sp] + births[sp] - deaths[sp] - starve[sp] - stress[sp] - predation[sp], 0, INDEX_CAP);
  }
  const detritus = clamp(s.detritus + detritusInflow - decomposition, 0, INDEX_CAP);
  const doNext = clamp(s.do + o2Produced + o2Reaeration - o2Demand - o2Respiration, 0, DO_CAP);

  const doHistory = [...s.doHistory, doNext].slice(-4);
  const next: EcosystemState = {
    tick: s.tick + 1,
    nutrients,
    algae,
    weeds,
    consumers: nextConsumers,
    hungry: s.hungry,
    detritus,
    do: doNext,
    clarity: clarityOf(algae),
    doHistory,
    crashActive,
    flags: s.flags,
    rngSeed,
    events: [...s.events, ...events].slice(-64),
  };

  const flows: FlowLedger = {
    runoff,
    inflow,
    algaeGrowth,
    algaeDieback,
    algaeSenescence,
    weedGrowth,
    weedSenescence,
    grazedAlgae: grazedAlgae.flea + grazedAlgae.mayfly + grazedAlgae.snail,
    removed,
    predation,
    births,
    deaths,
    starve,
    stress,
    respired: respiredTotal,
    shed: shedTotal,
    egestion: egestionTotal,
    deadMass,
    exportLoss,
    detritusInflow,
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
      const next = { ...state, flags };
      // §10's stock interventions act on the stock itself, at the tick boundary (§6.5).
      if (action.id === "grazer-boost") {
        next.consumers = { ...state.consumers, flea: clamp(state.consumers.flea + GRAZER_BOOST, 0, INDEX_CAP) };
      }
      if (action.id === "bluegill-removal") {
        next.consumers = { ...next.consumers, bluegill: clamp(Math.trunc(next.consumers.bluegill / 2), 0, INDEX_CAP) };
      }
      return {
        ...next,
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
  const total = (s: EcosystemState) =>
    s.nutrients +
    s.algae +
    s.weeds +
    s.detritus +
    CONSUMER_ORDER.reduce((a, sp) => a + s.consumers[sp], 0);
  let worst = 0;
  let worstTick: number | null = null;
  for (let i = 1; i < trace.length; i++) {
    const before = trace[i - 1]!;
    const after = trace[i]!;
    const f = after.flows;
    const expected = f.inflow - f.nutrientSinkLoss - f.buried - f.exportLoss;
    const residual = Math.abs(total(after.state) - total(before.state) - expected);
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
  const trace: TickResult[] = [{ state: s, flows: EMPTY_FLOWS }];
  for (let i = 0; i < days; i++) {
    const r = tick(s, sc);
    trace.push(r);
    s = r.state;
  }
  return trace;
}

const EMPTY_FLOWS: FlowLedger = {
  runoff: 0,
  inflow: 0,
  algaeGrowth: 0,
  algaeDieback: 0,
  algaeSenescence: 0,
  weedGrowth: 0,
  weedSenescence: 0,
  grazedAlgae: 0,
  removed: zeroStocks(),
  predation: zeroStocks(),
  births: zeroStocks(),
  deaths: zeroStocks(),
  starve: zeroStocks(),
  stress: zeroStocks(),
  respired: 0,
  shed: 0,
  egestion: 0,
  deadMass: 0,
  exportLoss: 0,
  detritusInflow: 0,
  decomposition: 0,
  mineralized: 0,
  buried: 0,
  nutrientSinkLoss: 0,
  o2Produced: 0,
  o2Demand: 0,
  o2Reaeration: 0,
  o2Respiration: 0,
};
