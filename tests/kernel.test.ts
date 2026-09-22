// Kernel contract tests. These are ER-02/ER-03 acceptance evidence, not decoration: the matter
// identity and integer purity are the properties the whole evidence layer rests on, and a
// regression in either invalidates every trace the game has ever produced.
import { describe, expect, it } from "vitest";
import {
  CANONICAL_INITIAL,
  CONSUMER_ORDER,
  DO_SCALE,
  SCALE,
  canonicalScenario,
  initialState,
  loopResidual,
  run,
  step,
  tick,
} from "@/sim/index.js";
import type { Scenario } from "@/sim/index.js";

const quiet: Scenario = { runoffAt: () => 0 };

describe("kernel determinism (R-51, §D-2)", () => {
  it("produces byte-identical traces for the same seed, scenario and actions", () => {
    const a = JSON.stringify(run(60, canonicalScenario, 7));
    const b = JSON.stringify(run(60, canonicalScenario, 7));
    expect(a).toBe(b);
  });

  it("keeps every authoritative quantity an integer", () => {
    for (const { state } of run(60, canonicalScenario)) {
      for (const [key, value] of Object.entries(state)) {
        if (typeof value === "number") {
          expect(Number.isInteger(value), `${key} = ${value} is not an integer`).toBe(true);
        }
      }
    }
  });

  it("starts from the frozen canonical pond", () => {
    const s = initialState();
    expect(s.nutrients).toBe(CANONICAL_INITIAL.nutrients);
    expect(s.algae).toBe(CANONICAL_INITIAL.algae);
    expect(s.detritus).toBe(CANONICAL_INITIAL.detritus);
    expect(s.do).toBe(CANONICAL_INITIAL.do);
    expect(s.tick).toBe(0);
  });
});

describe("matter loop identity (§5, the MS-LS2-3 anchor)", () => {
  it("holds exactly on the canonical disrupted run", () => {
    const { worst, worstTick } = loopResidual(run(60, canonicalScenario));
    expect(worst, `worst residual at tick ${worstTick}`).toBeLessThan(1e-9);
  });

  it("holds exactly on an undisturbed run", () => {
    const { worst } = loopResidual(run(60, quiet));
    expect(worst).toBeLessThan(1e-9);
  });

  it("holds when an intervention changes the inflow mid-run", () => {
    let state = initialState();
    const trace = [{ state, flows: tick(state, canonicalScenario).flows }];
    for (let t = 0; t < 60; t++) {
      if (t === 5) state = step(state, { kind: "applyIntervention", id: "divert-runoff" }, canonicalScenario);
      const r = tick(state, canonicalScenario);
      trace.push(r);
      state = r.state;
    }
    const { worst } = loopResidual(trace.slice(1));
    expect(worst).toBeLessThan(1e-9);
  });
});

describe("the pond community (§4, §11-1)", () => {
  it("keeps all seven organism groups alive on an undisturbed pond", () => {
    const trace = run(60, quiet);
    for (const species of CONSUMER_ORDER) {
      const final = trace[trace.length - 1]!.state.consumers[species] / SCALE;
      expect(final, `${species} did not survive sixty undisturbed ticks`).toBeGreaterThan(1);
    }
    const finalAlgae = trace[trace.length - 1]!.state.algae / SCALE;
    const finalWeeds = trace[trace.length - 1]!.state.weeds / SCALE;
    expect(finalAlgae).toBeGreaterThan(1);
    expect(finalWeeds).toBeGreaterThan(1);
  });

  it("keeps the undisturbed pond near its own starting state (no drift-collapse)", () => {
    const trace = run(60, quiet);
    const first = trace[0]!.state;
    const last = trace[trace.length - 1]!.state;
    for (const k of ["nutrients", "algae", "weeds", "detritus"] as const) {
      expect(Math.abs(last[k] - first[k]) / SCALE, `${k} drifted`).toBeLessThan(12);
    }
    for (const species of CONSUMER_ORDER) {
      const drift = Math.abs(last.consumers[species] - first.consumers[species]) / SCALE;
      expect(drift, `${species} drifted`).toBeLessThan(20);
    }
  });

  it("gives the bloom a cause: runoff raises the pool, then the algae", () => {
    const trace = run(30, canonicalScenario);
    const peakNutrients = Math.max(...trace.map((t) => t.state.nutrients)) / SCALE;
    const peakAlgae = Math.max(...trace.map((t) => t.state.algae)) / SCALE;
    expect(peakNutrients).toBeGreaterThan(CANONICAL_INITIAL.nutrients / SCALE);
    expect(peakAlgae).toBeGreaterThan(CANONICAL_INITIAL.algae / SCALE);
  });

  it("shows the chain's direction: a bloom costs clarity and the waterweeds", () => {
    const trace = run(40, canonicalScenario);
    const clarityStart = trace[0]!.state.clarity;
    const weedsStart = trace[0]!.state.weeds;
    const clarityWorst = Math.min(...trace.map((t) => t.state.clarity));
    const weedsWorst = Math.min(...trace.map((t) => t.state.weeds));
    expect(clarityWorst).toBeLessThan(clarityStart);
    expect(weedsWorst).toBeLessThanOrEqual(weedsStart);
  });
});

describe("interventions and failure handling (§10, §D-2)", () => {
  it("cuts runoff to zero when it is diverted (R-31)", () => {
    const divertedState = step(initialState(), { kind: "applyIntervention", id: "divert-runoff" });
    const r = tick(divertedState, canonicalScenario);
    expect(r.flows.runoff).toBe(0);
  });

  it("leaves more runoff when the buffer strip is planted than when it is diverted", () => {
    const buffered = step(initialState(), { kind: "applyIntervention", id: "buffer-strip" });
    const diverted = step(initialState(), { kind: "applyIntervention", id: "divert-runoff" });
    const rb = tick(buffered, canonicalScenario).flows.runoff;
    const rd = tick(diverted, canonicalScenario).flows.runoff;
    expect(rd).toBe(0);
    expect(rb).toBeGreaterThan(0);
  });

  it("adds water fleas and halves the bluegill when those interventions are used (R-31)", () => {
    const before = initialState();
    const boosted = step(before, { kind: "applyIntervention", id: "grazer-boost" });
    expect(boosted.consumers.flea).toBeGreaterThan(before.consumers.flea);
    expect(tick(boosted, quiet).flows.removed.flea).toBeGreaterThan(tick(before, quiet).flows.removed.flea);

    const removed = step(before, { kind: "applyIntervention", id: "bluegill-removal" });
    expect(removed.consumers.bluegill).toBeLessThan(before.consumers.bluegill);
    expect(tick(removed, quiet).flows.predation.flea).toBeLessThan(tick(before, quiet).flows.predation.flea);
  });

  it("rejects an out-of-range advance and an unknown action (fail-closed)", () => {
    expect(() => step(initialState(), { kind: "advanceDays", days: 8 })).toThrow();
    expect(() => step(initialState(), { kind: "advanceDays", days: -1 })).toThrow();
    // @ts-expect-error — deliberately invalid action for the fail-closed test
    expect(() => step(initialState(), { kind: "teleport" })).toThrow();
  });

  it("keeps DO inside its physical range over a long soak", () => {
    for (const { state } of run(2000, canonicalScenario)) {
      expect(state.do).toBeGreaterThanOrEqual(0);
      expect(state.do).toBeLessThanOrEqual(15 * DO_SCALE);
    }
  });

  // The tests above are invariants: bounds and conservation. Neither of them noticed that dissolved
  // oxygen read 0.0 mg/L after a week of mild loading, because 0.0 is inside the bounds and the
  // matter loop was still exact. These two tests check the physics instead — an undisturbed pond
  // holds its oxygen, and a heavy detritus load pulls it down — which is the behaviour the mission
  // depends on and the class of bug the bounds cannot see.
  it("holds dissolved oxygen in a healthy range on an undisturbed pond", () => {
    for (const { state } of run(60, quiet)) {
      const mgPerL = state.do / DO_SCALE;
      expect(mgPerL, `DO fell to ${mgPerL.toFixed(2)} with no runoff at all`).toBeGreaterThan(6.0);
      expect(mgPerL).toBeLessThan(15);
    }
  });

  it("lets oxygen fall when a heavy detritus load is decomposing", () => {
    // A full pond's worth of detritus (index 100) is a bloom the size of the pond dying at once: the
    // demand has to visibly bite into the oxygen rather than being rounded away by the scale.
    const loaded = { ...initialState(), detritus: 100 * SCALE };
    let s = loaded;
    for (let i = 0; i < 10; i++) s = tick(s, quiet).state;
    expect(s.do / DO_SCALE).toBeLessThan(loaded.do / DO_SCALE);
  });
});
