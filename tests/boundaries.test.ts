// Boundary and invariant tests for the kernel (test-hardening pass, ER-03 support).
//
// These are the cases the existing suite did not cover: population extinction and the carrying-cap
// ceiling, resource depletion and saturation, the oxygen floor/ceiling and the exact R-40 threshold
// arithmetic, the full action surface (including repeat and unaffordable/unknown actions), state
// invariants under adversarial combinations, replay/determinism edge cases (PRNG wraparound,
// mid-trace replay, input-state purity), and fail-closed rejection of malformed scenario/state data
// (TECHNICAL_DESIGN §D-2: "NaN/∞ rejected", "no silent repair").
//
// Everything here is deterministic, offline and fast: no clocks, no network, seeded PRNG only.
import { describe, expect, it } from "vitest";
import {
  CONSUMER_ORDER,
  DO_MAX,
  DO_SCALE,
  INDEX_MAX,
  SCALE,
  canonicalScenario,
  clarityOf,
  consumers,
  initialState,
  loopResidual,
  mul,
  run,
  step,
  tick,
  type ConsumerKey,
  type EcosystemState,
  type Scenario,
} from "@/sim/index.js";

const quiet: Scenario = { runoffAt: () => 0 };
const CAP = INDEX_MAX * SCALE;
const DO_CEILING = DO_MAX * DO_SCALE;
const GRAZERS: readonly ConsumerKey[] = ["flea", "mayfly", "snail"];

const dead = () => ({ flea: 0, mayfly: 0, snail: 0, bluegill: 0, dragonfly: 0 }) as EcosystemState["consumers"];

/** A state whose every stock is at its cap, the worst legal starting point. */
const allMax = (): EcosystemState => ({
  ...initialState(),
  nutrients: CAP,
  algae: CAP,
  weeds: CAP,
  detritus: CAP,
  do: DO_CEILING,
  clarity: clarityOf(CAP),
  consumers: { flea: CAP, mayfly: CAP, snail: CAP, bluegill: CAP, dragonfly: CAP },
});

/** Seeded states with a pinned DO so R-40's thresholds can be probed exactly. */
function stateWithDo(mgPerL: number, seed = 1): EcosystemState {
  const v = Math.round(mgPerL * DO_SCALE);
  return { ...initialState(seed), do: v, doHistory: [v, v] };
}

/** The full stock invariant: integer, finite, non-negative, inside its cap — for everything. */
function expectValidState(s: EcosystemState, label: string): void {
  const scalars: Record<string, number> = {
    nutrients: s.nutrients,
    algae: s.algae,
    weeds: s.weeds,
    detritus: s.detritus,
    do: s.do,
    clarity: s.clarity,
    tick: s.tick,
    rngSeed: s.rngSeed,
  };
  for (const [k, v] of Object.entries(scalars)) {
    expect(Number.isFinite(v), `${label}: ${k} is not finite (${v})`).toBe(true);
    expect(Number.isInteger(v), `${label}: ${k} is not an integer (${v})`).toBe(true);
  }
  for (const k of ["nutrients", "algae", "weeds", "detritus"] as const) {
    expect(s[k], `${label}: ${k} = ${s[k]} is negative`).toBeGreaterThanOrEqual(0);
    expect(s[k], `${label}: ${k} = ${s[k]} exceeds its cap`).toBeLessThanOrEqual(CAP);
  }
  expect(s.do, `${label}: DO out of range`).toBeGreaterThanOrEqual(0);
  expect(s.do, `${label}: DO out of range`).toBeLessThanOrEqual(DO_CEILING);
  for (const sp of CONSUMER_ORDER) {
    const v = s.consumers[sp];
    expect(Number.isFinite(v), `${label}: ${sp} is not finite`).toBe(true);
    expect(v, `${label}: ${sp} is negative (${v})`).toBeGreaterThanOrEqual(0);
    expect(v, `${label}: ${sp} exceeds the cap`).toBeLessThanOrEqual(CAP);
    expect(Number.isInteger(s.hungry[sp]), `${label}: hungry.${sp} is not an integer`).toBe(true);
  }
}

describe("state invariants under adversarial starts (R-52)", () => {
  it("keeps every stock bounded and integral from pathological initial states", () => {
    const starts: [string, EcosystemState][] = [
      ["everything at cap", allMax()],
      ["zero everywhere", { ...initialState(), nutrients: 0, algae: 0, weeds: 0, detritus: 0, do: 0, consumers: dead() }],
      ["zero oxygen, full detritus", { ...initialState(), do: 0, detritus: CAP }],
      ["no grazers, hungry predators", { ...initialState(), consumers: { ...dead(), bluegill: 90 * SCALE, dragonfly: 90 * SCALE } }],
      ["empty DO history edge", { ...initialState(), doHistory: [] as unknown as readonly number[] , nutrients: 0 }],
    ];
    for (const [label, start] of starts) {
      if (start.doHistory.length === 0) {
        // The empty history is rejected outright — the R-40 average would be undefined.
        expect(() => tick(start, quiet), `${label}: empty doHistory must be rejected`).toThrow();
        continue;
      }
      for (const [scName, sc] of [["quiet", quiet], ["canonical", canonicalScenario]] as const) {
        let s = start;
        for (let t = 1; t <= 300; t++) {
          s = tick(s, sc).state;
          expectValidState(s, `${label} (${scName}) @t=${t}`);
        }
      }
    }
  });

  it("stays bounded over a 2,000-tick soak under sustained maximum runoff", () => {
    const flood: Scenario = { runoffAt: () => 20 * SCALE };
    let s = initialState();
    for (let t = 1; t <= 2000; t++) {
      s = tick(s, flood).state;
      if (t % 100 === 0) expectValidState(s, `flood soak @t=${t}`);
    }
    expect(s.tick).toBe(2000);
  });

  it("never produces NaN from any single-species extinction or cap scenario", () => {
    for (const sp of CONSUMER_ORDER) {
      const without = { ...initialState(), consumers: { ...initialState().consumers, [sp]: 0 } };
      let s = without;
      for (let t = 0; t < 120; t++) s = tick(s, canonicalScenario).state;
      expectValidState(s, `no-${sp} after 120 canonical ticks`);
    }
  });
});

describe("population boundaries", () => {
  it("an extinct species stays extinct and does not resurrect through noise (R-50)", () => {
    let s = { ...initialState(), consumers: { ...dead(), bluegill: initialState().consumers.bluegill, dragonfly: initialState().consumers.dragonfly } };
    expect(s.consumers.flea).toBe(0);
    for (let t = 0; t < 300; t++) {
      s = tick(s, quiet).state;
      for (const g of GRAZERS) expect(s.consumers[g], `${g} resurrected from zero`).toBe(0);
    }
  });

  it("predators decay exponentially without prey and never recover (cascading species effects)", () => {
    // With no grazers a predator's intake is exactly zero (R-10's response is zero at zero prey),
    // so births stop and only R-12's background mortality remains: an exponential decay at
    // p.backgroundMortality per tick (half-life ≈ 138 ticks). Run long enough to see it.
    let s = { ...initialState(), consumers: { ...dead(), bluegill: 30 * SCALE, dragonfly: 15 * SCALE } };
    let prevBluegill = Number.POSITIVE_INFINITY;
    let monotonic = true;
    for (let t = 0; t < 700; t++) {
      s = tick(s, quiet).state;
      expectValidState(s, `predator decay @t=${t}`);
      if (s.consumers.bluegill > prevBluegill) monotonic = false;
      prevBluegill = s.consumers.bluegill;
    }
    expect(monotonic, "a prey-free predator population must never grow").toBe(true);
    expect(s.consumers.bluegill / SCALE, "bluegill without prey must decay toward extinction").toBeLessThan(1.5);
    expect(s.consumers.dragonfly / SCALE, "dragonfly without prey must decay toward extinction").toBeLessThan(1.5);
    // And the decay floor must hold: no resurrection without prey.
    const floorBluegill = s.consumers.bluegill;
    for (let t = 0; t < 50; t++) {
      s = tick(s, quiet).state;
      expect(s.consumers.bluegill, "predators must not resurrect from a prey-free floor").toBeLessThanOrEqual(floorBluegill);
    }
  });

  it("a species at its carrying capacity cannot exceed the cap and holds there", () => {
    // Recruitment is clamped to zero at the cap (R-12): births stop, background mortality trims,
    // and the stock must settle at or under K without ever breaching INDEX_MAX.
    let s = { ...initialState(), consumers: { ...initialState().consumers, flea: consumers.carryingCapacity.flea } };
    for (let t = 1; t <= 300; t++) {
      s = tick(s, quiet).state;
      expect(s.consumers.flea, `flea above cap at t=${t}`).toBeLessThanOrEqual(consumers.carryingCapacity.flea);
      expectValidState(s, `flea-at-K @t=${t}`);
    }
  });

  it("extreme consumer stocks remain inside the 0–100 index bounds regardless of carrying capacity", () => {
    // carryingCapacity caps RECRUITMENT, not the stock itself: an intervention can push a stock
    // above its K. The state cap (INDEX_MAX) is what must hold.
    let s = { ...initialState(), consumers: { flea: CAP, mayfly: CAP, snail: CAP, bluegill: CAP, dragonfly: CAP } };
    for (let t = 0; t < 200; t++) {
      s = tick(s, quiet).state;
      expectValidState(s, `all-consumers-max @t=${t}`);
    }
  });
});

describe("resource boundaries", () => {
  it("a fully depleted pool starves the bloom into collapse, then recycles (no NaN)", () => {
    // With zero inflow the R-01b die-back fires: the bloom sheds its uncovered losses and collapses
    // within days. The pond then recycles its own detritus (R-21 mineralization), so the pool
    // settles well below its reference — the collapse must never produce NaN or negative stocks.
    let s = { ...initialState(), nutrients: 0 };
    const startAlgae = s.algae;
    for (let t = 1; t <= 400; t++) {
      s = tick(s, { runoffAt: () => 0, backgroundInflow: 0 }).state;
      expectValidState(s, `starved pond @t=${t}`);
      if (t === 10) expect(s.algae / SCALE, "the bloom must collapse within ten starved ticks").toBeLessThan(5);
    }
    expect(s.algae, "the bloom must end far below its starting level").toBeLessThan(startAlgae);
    expect(s.nutrients / SCALE, "the recycled pool must sit below its pristine reference").toBeLessThan(10);
  });

  it("an unfed bloom plateaus below the cap (logistic self-shading) and never exceeds INDEX_MAX", () => {
    // R-01's ceiling is self-shading, not the pool: even a full nutrient pool with no grazers
    // plateaus below INDEX_MAX because growth halves as the bloom approaches it.
    let s = { ...initialState(), nutrients: CAP, consumers: { ...dead(), bluegill: 20 * SCALE, dragonfly: 10 * SCALE } };
    for (let t = 1; t <= 300; t++) {
      s = tick(s, quiet).state;
      expectValidState(s, `unfed bloom @t=${t}`);
      expect(s.algae, "the bloom must never exceed the index cap").toBeLessThanOrEqual(CAP);
    }
    expect(s.algae / SCALE, "an unfed bloom should establish (> 60 index)").toBeGreaterThan(60);
    expect(s.algae / SCALE, "the logistic plateau must sit below the cap").toBeLessThan(95);
    // And it must be a plateau, not a ramp: settled within a point over the last stretch.
    const plateau = s.algae;
    for (let t = 0; t < 50; t++) s = tick(s, quiet).state;
    expect(Math.abs(s.algae - plateau) / SCALE, "the plateau must hold within one index point").toBeLessThanOrEqual(1);
  });

  it("documents the F-5 clamp leak: cap-pinning breaks the matter identity while stocks stay bounded", () => {
    // SCIENCE_MODEL §9.1 F-5 / ER-03 gate item 2: an end-of-tick clamp is not mass-neutral, and a
    // scenario that pins the pool at its cap destroys matter. This is a RECORDED limitation of the
    // current design, not an accepted regression — the test pins the behaviour so any future
    // spill/reject implementation (the documented fix) shows up as an intentional change.
    const pin: Scenario = { runoffAt: () => 40 * SCALE };
    const trace = run(20, pin);
    for (const { state } of trace) expectValidState(state, "pool-pinning run");
    const { worst } = loopResidual(trace.slice(1));
    expect(worst, "F-5: cap-pinning still breaks the loop identity (recorded limitation)").toBeGreaterThan(0);
  });

  it("a pond at the detritus cap keeps every stock finite and the oxygen inside its bounds", () => {
    let s = { ...initialState(), detritus: CAP };
    for (let t = 1; t <= 120; t++) {
      s = tick(s, quiet).state;
      expectValidState(s, `max detritus @t=${t}`);
    }
  });
});

describe("oxygen boundaries (R-40, R-22, R-23)", () => {
  it("clamps DO at the floor of 0 without going negative or NaN", () => {
    let s: EcosystemState = { ...initialState(), do: 0.2 * DO_SCALE, doHistory: [0.2 * DO_SCALE, 0.2 * DO_SCALE], detritus: CAP };
    for (let t = 1; t <= 60; t++) {
      s = tick(s, quiet).state;
      expect(s.do).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(s.do)).toBe(true);
    }
  });

  it("at the oxygen floor the sensitive mayfly crashes hardest while the tolerant snail recovers first", () => {
    // R-40's ordering is the design's pollution-sensitivity story (M-8): everyone is stressed at
    // DO 0, the mayfly must fall fastest relative to the snail, and the pond is self-buffering —
    // re-aeration recovers DO once the detritus pulse decomposes, and the snail leads the rebound.
    let s: EcosystemState = { ...initialState(), do: 0, doHistory: [0, 0], detritus: CAP };
    for (let t = 1; t <= 150; t++) {
      s = tick(s, quiet).state;
      expectValidState(s, `oxygen floor @t=${t}`);
      if (t === 25) {
        expect(s.consumers.mayfly / SCALE, "the sensitive mayfly must crash harder than the tolerant snail").toBeLessThan(s.consumers.snail / SCALE);
        expect(s.consumers.mayfly / SCALE, "the mayfly must be near extinction at the floor").toBeLessThan(5);
      }
      if (t === 100) {
        expect(s.do / DO_SCALE, "the pond must self-buffer above the mayfly onset within 100 ticks").toBeGreaterThan(5.5);
        expect(s.consumers.mayfly / SCALE, "the mayfly must still be far below its pristine level").toBeLessThan(0.2 * (initialState().consumers.mayfly / SCALE));
      }
    }
  });

  it("aerated re-aeration relaxes DO toward saturation faster than the baseline rate", () => {
    const low = { ...stateWithDo(3), flags: { ...initialState().flags, aerated: true } };
    const base = stateWithDo(3);
    const aeratedFlow = tick(low, quiet).flows.o2Reaeration;
    const baselineFlow = tick(base, quiet).flows.o2Reaeration;
    expect(aeratedFlow, "aeration must substitute the faster relaxation rate below saturation").toBeGreaterThan(baselineFlow);
    for (let t = 1; t <= 60; t++) expectValidState(tick(low, quiet).state, `aerated @t=${t}`);
  });

  it("DO never exceeds its 15 mg/L ceiling even with aeration and maximum photosynthesis", () => {
    let s = { ...stateWithDo(8.5), algae: CAP, flags: { ...initialState().flags, aerated: true } };
    for (let t = 1; t <= 200; t++) {
      s = tick(s, quiet).state;
      expect(s.do, `DO above the ceiling at t=${t}`).toBeLessThanOrEqual(DO_CEILING);
      expectValidState(s, `oxygen ceiling run @t=${t}`);
    }
  });

  it("fires no stress at exactly the onset threshold and positive stress one decimal below (all species)", () => {
    for (const sp of CONSUMER_ORDER) {
      const { onset, severe } = consumers.thresholds[sp];
      const atOnset = tick(stateWithDo(onset / DO_SCALE), quiet).flows.stress[sp];
      expect(atOnset, `${sp}: stress must be zero AT the onset threshold`).toBe(0);

      // Thresholds are stored at DO_SCALE, so one decimal below onset is onset − 1 tenth.
      const below = tick(stateWithDo((onset - DO_SCALE / 10) / DO_SCALE), quiet).flows.stress[sp];
      expect(below, `${sp}: one decimal below the onset threshold must stress`).toBeGreaterThan(0);

      const atSevere = tick(stateWithDo(severe / DO_SCALE), quiet).flows.stress[sp];
      expect(atSevere, `${sp}: stress at the severe threshold must be the maximum ramp`).toBe(
        mul(consumers.stressMortality, stateWithDo(severe / DO_SCALE).consumers[sp]),
      );

      const above = tick(stateWithDo((onset + DO_SCALE / 2) / DO_SCALE), quiet).flows.stress[sp];
      expect(above, `${sp}: above the onset threshold there is no stress`).toBe(0);
    }
  });

  it("one tick below the onset threshold does not stress (the 2-tick running average, R-40)", () => {
    // A single-day dip must not be fatal: the stress term reads the average of the PREVIOUS window,
    // so today's crash is invisible to this tick's stress computation.
    const dipped = { ...stateWithDo(9), do: 0 };
    const r = tick(dipped, quiet);
    for (const sp of CONSUMER_ORDER) {
      expect(r.flows.stress[sp], `${sp} was stressed by a single-tick dip`).toBe(0);
    }
  });

  it("stress mortality is exactly the frozen ramp at the severe threshold, in fixed point", () => {
    const s = stateWithDo(2.0); // mayfly severe
    const r = tick(s, quiet);
    const expected = mul(mul(consumers.stressMortality, SCALE), s.consumers.mayfly);
    expect(r.flows.stress.mayfly).toBe(expected);
  });
});

describe("action surface: validation, affordability and repetition (§10, §D-2)", () => {
  it("accepts advanceDays 0..7 and produces exact tick counts", () => {
    for (const days of [0, 1, 7]) {
      const s = step(initialState(), { kind: "advanceDays", days }, canonicalScenario);
      expect(s.tick, `advanceDays(${days}) must advance exactly ${days} ticks`).toBe(days);
      expectValidState(s, `advanceDays(${days})`);
    }
  });

  it("rejects advanceDays outside 0..7, non-integers, NaN and Infinity, leaving state untouched", () => {
    for (const days of [-1, 8, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const before = JSON.stringify(initialState());
      expect(() => step(initialState(), { kind: "advanceDays", days }), `advanceDays(${String(days)}) must throw`).toThrow();
      expect(JSON.stringify(initialState())).toBe(before);
    }
  });

  it("noop is a pure identity (no tick, no copy, no drift)", () => {
    const s = initialState();
    expect(step(s, { kind: "noop" })).toBe(s);
    let cur = initialState();
    for (let i = 0; i < 50; i++) cur = step(cur, { kind: "noop" });
    expect(cur.tick).toBe(0);
    expectValidState(cur, "after 50 noops");
  });

  it("interventions are latching: repeating them never un-applies or double-applies a flag", () => {
    let s = initialState();
    for (let i = 0; i < 3; i++) s = step(s, { kind: "applyIntervention", id: "divert-runoff" });
    expect(s.flags.runoffDiverted).toBe(true);
    expect(s.flags.bufferStrip).toBe(false);
    expect(s.flags.aerated).toBe(false);
    expect(tick(s, canonicalScenario).flows.runoff, "diverted runoff must be zero even after repeats").toBe(0);
    // Buffer + divert together: divert wins (runoff is zero either way) and both flags hold.
    s = step(s, { kind: "applyIntervention", id: "buffer-strip" });
    expect(s.flags.runoffDiverted && s.flags.bufferStrip).toBe(true);
    expect(tick(s, canonicalScenario).flows.runoff).toBe(0);
  });

  it("grazer-boost clamps at the index cap instead of overflowing", () => {
    const maxed = { ...initialState(), consumers: { ...initialState().consumers, flea: CAP } };
    const boosted = step(maxed, { kind: "applyIntervention", id: "grazer-boost" });
    expect(boosted.consumers.flea).toBe(CAP);
    expectValidState(boosted, "boost at cap");
  });

  it("repeated bluegill-removal floors at zero and keeps the pond valid", () => {
    let s = initialState();
    for (let i = 0; i < 40; i++) {
      s = step(s, { kind: "applyIntervention", id: "bluegill-removal" });
      expect(s.consumers.bluegill).toBeGreaterThanOrEqual(0);
      expectValidState(s, `bluegill-removal #${i + 1}`);
    }
    expect(s.consumers.bluegill).toBe(0);
  });

  it("combined interventions (simultaneous pressures) keep every invariant", () => {
    let s = initialState();
    for (const id of ["divert-runoff", "buffer-strip", "aeration", "grazer-boost", "bluegill-removal"] as const) {
      s = step(s, { kind: "applyIntervention", id });
    }
    expectValidState(s, "all interventions");
    for (let t = 1; t <= 120; t++) {
      s = tick(s, canonicalScenario).state;
      expectValidState(s, `all interventions @t=${t}`);
    }
  });

  it("rejects an unknown action (fail-closed) without touching the state", () => {
    const before = initialState();
    const snapshot = JSON.stringify(before);
    // @ts-expect-error — deliberately invalid action for the fail-closed test
    expect(() => step(before, { kind: "summon-catastrophe" })).toThrow();
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("a player cannot push a stock past the index cap through any intervention (unaffordable overflow)", () => {
    let s = { ...initialState(), consumers: { ...initialState().consumers, flea: CAP - 5 * SCALE } };
    s = step(s, { kind: "applyIntervention", id: "grazer-boost" });
    expect(s.consumers.flea).toBe(CAP);
  });
});

describe("determinism, replay and input purity (R-50, R-51, §D-2)", () => {
  it("tick() never mutates its input state, including the R-41 hungry counters", () => {
    const s: EcosystemState = {
      ...initialState(),
      hungry: { flea: 5, mayfly: 4, snail: 3, bluegill: 2, dragonfly: 1 },
    };
    const snapshot = JSON.stringify(s);
    tick(s, quiet);
    step(s, { kind: "applyIntervention", id: "grazer-boost" });
    step(s, { kind: "advanceDays", days: 7 });
    step(s, { kind: "applyIntervention", id: "divert-runoff" });
    expect(JSON.stringify(s), "the kernel must return new state, never write in place").toBe(snapshot);
  });

  it("ticking the same state twice produces identical results (fork determinism)", () => {
    const s = { ...initialState(), hungry: { flea: 5, mayfly: 5, snail: 5, bluegill: 5, dragonfly: 5 } };
    const a = tick(s, quiet);
    const b = tick(s, quiet);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("a run can be resumed exactly from any mid-trace state", () => {
    const full = run(60, canonicalScenario, 42);
    const resumed = (() => {
      let s = full[17]!.state;
      for (let i = 17; i < 60; i++) s = tick(s, canonicalScenario).state;
      return s;
    })();
    expect(JSON.stringify(resumed)).toBe(JSON.stringify(full[60]!.state));
  });

  it("the seeded PRNG handles seed wraparound deterministically", () => {
    const a = tick(initialState(0xffffffff), quiet);
    const b = tick(initialState(0xffffffff), quiet);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(Number.isInteger(a.state.rngSeed)).toBe(true);
  });

  it("R-50 noise is confined to births and bounded to ±2% of the mass-budget term", () => {
    // Recompute each species' deterministic recruitment term from the ledger alone and check the
    // realised births sit inside the ±noisePct band around it (truncation gives a unit of slop).
    for (const seed of [1, 2, 99] as const) {
      let s = initialState(seed);
      for (let t = 0; t < 40; t++) {
        const r = tick(s, canonicalScenario);
        for (const sp of CONSUMER_ORDER) {
          const egestion = mul(consumers.egestionFraction, r.flows.removed[sp]);
          const assimilated = r.flows.removed[sp] - egestion;
          const respired = mul(consumers.maintenance, assimilated);
          const surplus = assimilated - respired;
          const recruitment = Math.min(SCALE, Math.max(0, SCALE - Math.trunc((s.consumers[sp] * SCALE) / consumers.carryingCapacity[sp])));
          const expected = mul(mul(surplus, recruitment), SCALE);
          const slop = Math.max(2, Math.trunc(consumers.noisePct * expected) + 2);
          expect(
            r.flows.births[sp],
            `${sp} births outside the ±2% noise band at t=${t} (noise must apply to births only)`,
          ).toBeGreaterThanOrEqual(expected - slop);
          expect(r.flows.births[sp]).toBeLessThanOrEqual(expected + slop);
        }
        s = r.state;
      }
    }
    // And the downstream inheritance of that noise (through R-12's shed surplus → detritus →
    // mineralization) stays a bounded wobble, never a divergence.
    const a = run(60, canonicalScenario, 1);
    const b = run(60, canonicalScenario, 2);
    for (let i = 0; i <= 60; i++) {
      for (const k of ["nutrients", "algae", "weeds", "detritus"] as const) {
        expect(Math.abs(a[i]!.state[k] - b[i]!.state[k]) / SCALE, `${k} seed spread at tick ${i}`).toBeLessThan(5);
      }
      // R-21's BOD burst keys part of the DO demand to the detritus inflow, which inherits the
      // shed noise; the inherited DO drift stays below 0.1 mg/L over the whole mission.
      expect(a[i]!.state.do, `DO seed drift at tick ${i}`).toBeLessThanOrEqual(b[i]!.state.do + 100);
      expect(a[i]!.state.do).toBeGreaterThanOrEqual(b[i]!.state.do - 100);
    }
  });

  it("seed sensitivity stays inside the §11-7 envelope (≤ ±5 index) and event ordering is invariant", () => {
    const a = run(60, canonicalScenario, 1);
    const b = run(60, canonicalScenario, 2);
    for (let i = 0; i <= 60; i++) {
      for (const sp of CONSUMER_ORDER) {
        expect(Math.abs(a[i]!.state.consumers[sp] - b[i]!.state.consumers[sp]) / SCALE, `${sp} seed spread at tick ${i}`).toBeLessThanOrEqual(5);
      }
    }
    const rulesOf = (t: ReturnType<typeof run>) => t.map((x) => x.state.events.map((e) => `${e.rule}:${e.kind}:${e.organism ?? "-"}`).join("|")).join("|");
    expect(rulesOf(a)).toBe(rulesOf(b));
  });

  it("initialState is a pure factory: fresh objects every call, unaffected by later ticks", () => {
    const a = initialState();
    const b = initialState();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a).not.toBe(b);
    tick(a, canonicalScenario);
    expect(JSON.stringify(b)).toBe(JSON.stringify(initialState()));
  });

  it("advanceDays(0) is an exact identity", () => {
    const s = initialState();
    expect(step(s, { kind: "advanceDays", days: 0 })).toBe(s);
  });
});

describe("malformed scenario and state data (fail-closed, §D-2/§D-6)", () => {
  it("rejects NaN and infinite runoff at the tick boundary", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => tick(initialState(), { runoffAt: () => bad }), `runoff ${String(bad)} must be rejected`).toThrow();
      expect(() => step(initialState(), { kind: "advanceDays", days: 1 }, { runoffAt: () => bad })).toThrow();
    }
  });

  it("rejects non-integer and NaN backgroundInflow", () => {
    for (const bad of [Number.NaN, 1.5]) {
      expect(() => tick(initialState(), { runoffAt: () => 0, backgroundInflow: bad })).toThrow();
    }
  });

  it("rejects poisoned state: NaN anywhere in the stocks is refused, not clamped", () => {
    const badDo = { ...initialState(), do: Number.NaN };
    const badConsumer = { ...initialState(), consumers: { ...initialState().consumers, snail: Number.NaN } };
    const badHistory = { ...initialState(), doHistory: [initialState().do, Number.NaN] };
    for (const [label, bad] of [["do", badDo], ["consumer", badConsumer], ["doHistory", badHistory]] as const) {
      expect(() => tick(bad, quiet), `NaN in ${label} must be rejected`).toThrow();
    }
  });

  it("rejects fractional fixed-point state (R-51: integers only)", () => {
    const fractional = { ...initialState(), algae: 17.5 };
    expect(() => tick(fractional, quiet)).toThrow();
  });

  it("still accepts legal fractional-in-model-units inflows expressed in fixed point", () => {
    // 1.651 model units in fixed point is the canonical background inflow — an integer.
    const fine: Scenario = { runoffAt: () => 1651 };
    const s = tick(initialState(), fine);
    expectValidState(s.state, "small fixed-point inflow");
  });

  it("negative runoff cannot drive the pool negative (documented out-of-domain input)", () => {
    const drain: Scenario = { runoffAt: () => -5 * SCALE };
    let s = initialState();
    for (let t = 0; t < 60; t++) {
      s = tick(s, drain).state;
      expect(s.nutrients).toBeGreaterThanOrEqual(0);
      expectValidState(s, `negative runoff @t=${t}`);
    }
  });
});

describe("evidence events (§D-2: derived, never read back)", () => {
  it("events never feed back into the simulation", () => {
    const poisoned: EcosystemState = {
      ...initialState(),
      events: [{ rule: "R-99", kind: "garbage", value: Number.NaN }],
    };
    const a = tick(poisoned, quiet);
    const b = tick(initialState(), quiet);
    // The event array is non-authoritative: identical dynamics either way.
    expect(JSON.stringify({ ...a.state, events: [] })).toBe(JSON.stringify({ ...b.state, events: [] }));
    expect(JSON.stringify(a.flows)).toBe(JSON.stringify(b.flows));
  });

  it("caps the carried event history at 64", () => {
    const trace = run(60, canonicalScenario, 1);
    for (const { state } of trace) {
      expect(state.events.length, "the event window must never exceed 64").toBeLessThanOrEqual(64);
    }
  });

  it("the bloom-dieback onset event fires once per crash episode (R-01b)", () => {
    const trace = run(60, canonicalScenario, 1);
    const onsets = trace.flatMap((t) => t.state.events).filter((e) => e.rule === "R-01b" && e.kind === "bloom-dieback-onset");
    expect(onsets.length).toBeGreaterThanOrEqual(1);
    for (const { state } of trace) {
      const inWindow = state.events.filter((e) => e.rule === "R-01b" && e.kind === "bloom-dieback-onset").length;
      expect(inWindow, "an onset must not repeat while the crash is active").toBeLessThanOrEqual(1);
    }
  });
});

describe("the frozen per-tick accounting (§6.5)", () => {
  it("the consumer update is exactly births − deaths − starve − stress − predation on an unclamped tick", () => {
    const s = initialState();
    const r = tick(s, quiet);
    for (const sp of CONSUMER_ORDER) {
      const expected =
        s.consumers[sp] + r.flows.births[sp] - r.flows.deaths[sp] - r.flows.starve[sp] - r.flows.stress[sp] - r.flows.predation[sp];
      expect(r.state.consumers[sp], `${sp}: the single update pass must match the ledger`).toBe(expected);
    }
  });

  it("the producer and detritus updates match their ledger entries on an unclamped tick", () => {
    const s = initialState();
    const r = tick(s, quiet);
    expect(r.state.algae).toBe(s.algae + r.flows.algaeGrowth - r.flows.algaeDieback - r.flows.algaeSenescence - r.flows.grazedAlgae);
    expect(r.state.weeds).toBe(s.weeds + r.flows.weedGrowth - r.flows.weedSenescence);
    expect(r.state.detritus).toBe(s.detritus + r.flows.detritusInflow - r.flows.decomposition);
  });

  it("the matter identity holds across flow interventions (divert, buffer, aeration)", () => {
    let s = initialState();
    const trace: ReturnType<typeof run> = [];
    for (let t = 0; t < 40; t++) {
      if (t === 5) s = step(s, { kind: "applyIntervention", id: "divert-runoff" }, canonicalScenario);
      if (t === 12) s = step(s, { kind: "applyIntervention", id: "buffer-strip" }, canonicalScenario);
      if (t === 20) s = step(s, { kind: "applyIntervention", id: "aeration" }, canonicalScenario);
      const r = tick(s, canonicalScenario);
      trace.push(r);
      s = r.state;
      expectValidState(s, `flow interventions @t=${t}`);
    }
    expect(loopResidual(trace).worst).toBeLessThan(1e-9);
  });

  it("stock interventions are exact, bounded exogenous mass transfers", () => {
    // The grazer boost ADDS 20 index points from outside the pond and bluegill removal REMOVES
    // exactly half the stock: §6.5 applies them at the tick boundary, and the loop identity
    // (§5) is defined per tick of the kernel — the transfers live between ticks by design.
    const total = (x: EcosystemState) =>
      x.nutrients + x.algae + x.weeds + x.detritus + CONSUMER_ORDER.reduce((a, k) => a + x.consumers[k], 0);
    let s = initialState();
    for (let t = 0; t < 5; t++) s = tick(s, quiet).state;
    const before = total(s);
    const boosted = step(s, { kind: "applyIntervention", id: "grazer-boost" }, quiet);
    expect(total(boosted) - before, "the grazer boost must add exactly 20 index points").toBe(20 * SCALE);
    const halved = step(s, { kind: "applyIntervention", id: "bluegill-removal" }, quiet);
    expect(before - total(halved), "bluegill removal must remove exactly half the bluegill stock").toBe(s.consumers.bluegill - halved.consumers.bluegill);
    expect(halved.consumers.bluegill, "the remaining stock is the floor of half").toBe(Math.trunc(s.consumers.bluegill / 2));
    expectValidState(boosted, "boosted");
    expectValidState(halved, "halved");
  });
});

describe("presentation band words (§8, the thresholds the UI renders)", () => {
  it("band words flip at exactly 15 / 35 / 65", async () => {
    const { bandWord } = await import("@/presentation.js");
    expect(bandWord(14.9)).toBe("crashing");
    expect(bandWord(15)).toBe("strained");
    expect(bandWord(34.9)).toBe("strained");
    expect(bandWord(35)).toBe("stable");
    expect(bandWord(64.9)).toBe("stable");
    expect(bandWord(65)).toBe("thriving");
  });

  it("the DO stress note straddles 5 mg/L and the severe line at 2.5 mg/L", async () => {
    const { stressNote } = await import("@/presentation.js");
    expect(stressNote(5)).toBe("above the stress line");
    expect(stressNote(4.9)).toBe("below the 5 mg/L stress line");
    expect(stressNote(2.5)).toBe("below the 5 mg/L stress line");
    expect(stressNote(2.4)).toBe("severe — fish gulp at the surface");
  });
});
