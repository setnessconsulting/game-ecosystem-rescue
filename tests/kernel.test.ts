// Kernel contract tests. These are ER-02/ER-03 acceptance evidence, not decoration: the matter
// identity and integer purity are the properties the whole evidence layer rests on, and a
// regression in either invalidates every trace the game has ever produced.
import { describe, expect, it } from "vitest";
import {
  CANONICAL_INITIAL,
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

describe("rule directions (SCIENCE_MODEL §11 sanity tests, core slice)", () => {
  it("raises the pool and then the bloom when runoff arrives", () => {
    const trace = run(30, canonicalScenario);
    const peakNutrients = Math.max(...trace.map((t) => t.state.nutrients)) / SCALE;
    const peakAlgae = Math.max(...trace.map((t) => t.state.algae)) / SCALE;
    expect(peakNutrients).toBeGreaterThan(CANONICAL_INITIAL.nutrients / SCALE);
    expect(peakAlgae).toBeGreaterThan(CANONICAL_INITIAL.algae / SCALE);
  });

  it("loses clarity as the bloom grows (R-03)", () => {
    const trace = run(30, canonicalScenario);
    const first = trace[0]!.state.clarity;
    const darkest = Math.min(...trace.map((t) => t.state.clarity));
    expect(darkest).toBeLessThan(first);
  });

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
});
