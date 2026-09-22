// Settle the pristine pond in the KERNEL's own arithmetic and report it.
//
// This exists because the pristine state is not a number anyone chooses: §9 says it is solved, and
// it has to be solved with the same integer rounding and the same seeded birth noise the game runs
// with. A state settled in floating point (as the evidence harness does) is a different point and
// visibly drifts once the kernel takes over — measured: the algae moved 17 index points in sixty
// ticks before this existed. The watershed inflow from the harness is already the right order, so
// the kernel simply runs on from there until its own fixed point is reached.
//
// Run it with:  npx vitest run tests/settle.test.ts
// The output is the CANONICAL_INITIAL block for src/sim/params.ts.
import { describe, expect, it } from "vitest";
import { SCALE, initialState, run, type EcosystemState } from "@/sim/index.js";

const QUIET = { runoffAt: () => 0 } as const;
const FEATURES = ["nutrients", "algae", "weeds", "flea", "mayfly", "snail", "bluegill", "dragonfly", "detritus"] as const;

const read = (s: EcosystemState): Record<string, number> => ({
  nutrients: s.nutrients / SCALE,
  algae: s.algae / SCALE,
  weeds: s.weeds / SCALE,
  detritus: s.detritus / SCALE,
  do: s.do / SCALE * 1,
  flea: s.consumers.flea / SCALE,
  mayfly: s.consumers.mayfly / SCALE,
  snail: s.consumers.snail / SCALE,
  bluegill: s.consumers.bluegill / SCALE,
  dragonfly: s.consumers.dragonfly / SCALE,
});

describe("pristine pond settle (kernel arithmetic)", () => {
  it("stays at the frozen fixed point, and reports the state a fresh settle reaches", () => {
    // A fresh settle from the frozen state, first, so the values can be pasted back when the
    // parameters are re-tuned — that is the whole point of this file.
    let s = initialState();
    for (let i = 0; i < 20; i++) s = run(500, QUIET)[500]!.state;
    const settled = read(s);
    console.log("\n=== CANONICAL_INITIAL (kernel-settled) ===");
    for (const k of [...FEATURES, "do"]) console.log(`  ${k}: s(${settled[k]!.toFixed(3)}),`);

    // Stationarity of the FROZEN state: §11-1 in its strict form. The threshold is not zero because
    // R-50 puts ±2% noise on births, so a living community wanders a few index points — what must
    // not happen is a trend, and a trend shows up as a drift far larger than this.
    const first = read(initialState());
    const after = read(run(60, QUIET)[60]!.state);
    const frozenDrift = Object.keys(first).map((k) => ({ k, d: Math.abs(after[k]! - first[k]!) })).sort((a, b) => b.d - a.d);
    console.log("frozen-state 60-tick drift:", frozenDrift.slice(0, 5).map((x) => `${x.k} ${x.d.toFixed(2)}`).join(", "));
    expect(frozenDrift[0]!.d, `the frozen state drifts (${frozenDrift[0]!.k})`).toBeLessThan(12);
  }, 180_000);
});
