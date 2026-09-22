// Characterise the canonical chain in the KERNEL's own arithmetic.
//
// This is the diagnostic the calibration actually needs: the harness works in floating point, the
// game runs in integers with seeded noise, and the only trace that matters is this one. It prints
// the shape of the chain — when the bloom peaks, how dark the water gets, how far the oxygen falls,
// whether the mayflies and fish follow — so a parameter change can be judged by what it does to the
// mission rather than by whether a number moved.
import { describe, it } from "vitest";
import { DO_SCALE, SCALE, initialState, run, type EcosystemState } from "@/sim/index.js";

const CONSUMER_KEYS = ["flea", "mayfly", "snail", "bluegill", "dragonfly"] as const;
const CANONICAL = { runoffAt: (t: number) => (t < 10 ? 9 * SCALE : 0) };
const QUIET = { runoffAt: () => 0 } as const;

const inMg = (v: number) => v / DO_SCALE;
const inIndex = (v: number) => v / SCALE;
const first = (h: readonly ReturnType<typeof run>[number][], pick: (s: EcosystemState) => number, test: (v: number) => boolean) =>
  h.find((x) => test(pick(x.state)))?.state.tick ?? null;

describe("canonical chain shape (kernel arithmetic)", () => {
  it("reports where the bloom, clarity, oxygen and animals go", () => {
    const trace = run(60, CANONICAL);
    const q = run(60, QUIET);
    const last = trace[trace.length - 1]!.state;
    const pristine = q[q.length - 1]!.state;

    const peakN = Math.max(...trace.map((x) => inIndex(x.state.nutrients)));
    const peakAlgae = Math.max(...trace.map((x) => inIndex(x.state.algae)));
    const minClarity = Math.min(...trace.map((x) => inIndex(x.state.clarity)));
    const minDo = Math.min(...trace.map((x) => inMg(x.state.do)));
    const peakDetritus = Math.max(...trace.map((x) => inIndex(x.state.detritus)));
    const minMayfly = Math.min(...trace.map((x) => inIndex(x.state.consumers.mayfly)));
    const minBluegill = Math.min(...trace.map((x) => inIndex(x.state.consumers.bluegill)));
    const minFlea = Math.min(...trace.map((x) => inIndex(x.state.consumers.flea)));

    const day = (pick: (s: EcosystemState) => number, test: (v: number) => boolean) => first(trace, pick, test);

    console.log("\n=== canonical chain (kernel) ===");
    console.log(`  pristine: nutrients ${inIndex(pristine.nutrients).toFixed(1)}  algae ${inIndex(pristine.algae).toFixed(1)}  DO ${inMg(pristine.do).toFixed(2)}  detritus ${inIndex(pristine.detritus).toFixed(1)}`);
    console.log(`  peak nutrients ${peakN.toFixed(1)}   peak algae ${peakAlgae.toFixed(1)} (day ${day((s) => inIndex(s.algae), (v) => v >= 75)})`);
    console.log(`  min clarity ${minClarity.toFixed(0)} (day ${day((s) => inIndex(s.clarity), (v) => v < 30)})   peak detritus ${peakDetritus.toFixed(1)}`);
    console.log(`  min DO ${minDo.toFixed(2)} (day ${day((s) => inMg(s.do), (v) => v < 5)})   final DO ${inMg(last.do).toFixed(2)}`);
    console.log(`  min mayfly ${minMayfly.toFixed(1)} (day ${day((s) => inIndex(s.consumers.mayfly), (v) => v < 20)})   min bluegill ${minBluegill.toFixed(1)} (day ${day((s) => inIndex(s.consumers.bluegill), (v) => v < 0.8 * inIndex(pristine.consumers.bluegill))})   min flea ${minFlea.toFixed(1)}`);
    for (const k of CONSUMER_KEYS) {
      const start = inIndex(initialState().consumers[k]);
      const end = inIndex(last.consumers[k]);
      console.log(`    ${k.padEnd(10)} ${start.toFixed(1)} -> ${end.toFixed(1)}  (${(((end - start) / start) * 100).toFixed(0)}%)`);
    }
  }, 60_000);
});
