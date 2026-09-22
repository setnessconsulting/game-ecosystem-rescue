// The walking skeleton: advance the canonical disruption and show what the pond does, in words and
// in a chart a screen reader can read. It exists so the release path, the kernel boundary and the
// evidence layer can be exercised end to end before the content work begins.
//
// Everything on screen is derived from kernel state. Nothing here computes ecology: if a number is
// not in `EcosystemState` or the flow ledger, the UI does not invent it (§D-4 ownership rules).
import { useMemo, useState } from "react";
import {
  DO_SCALE,
  PARAM_SET_VERSION,
  SCALE,
  SIM_MODEL_VERSION,
  loopResidual,
  run,
  step,
  tick,
  type ConsumerKey,
  type EcosystemState,
  type InterventionId,
  type Scenario,
  type TickResult,
} from "@/sim/index.js";
import { Chart } from "./Chart.js";
import { bandWord, describe, stressNote } from "./presentation.js";

const canonical: Scenario = { runoffAt: (t) => (t < 10 ? 9 * SCALE : 0) };

/** The organism roster (§4) with the DO each one starts to suffer at (R-40's onsets). */
const ORGANISMS: { key: ConsumerKey; label: string; role: string; threshold: number }[] = [
  { key: "flea", label: "Water fleas", role: "filter-feeding grazer", threshold: 4.0 },
  { key: "mayfly", label: "Mayflies", role: "sensitive scraper — first to suffer", threshold: 5.5 },
  { key: "snail", label: "Snails", role: "tolerant grazer", threshold: 2.0 },
  { key: "bluegill", label: "Bluegill", role: "fish, eats the grazers", threshold: 5.0 },
  { key: "dragonfly", label: "Dragonfly nymphs", role: "invertebrate predator", threshold: 4.0 },
];

export default function App() {
  // Day 0 is the pristine pond: the player has not advanced anything yet.
  const [trace, setTrace] = useState<TickResult[]>(() => run(0, canonical));

  const state: EcosystemState = trace[trace.length - 1]!.state;
  const residual = useMemo(() => loopResidual(trace), [trace]);

  function advance(days: number) {
    setTrace((current) => {
      let s = current[current.length - 1]!.state;
      const next = [...current];
      for (let i = 0; i < days; i++) {
        const r = tick(s, canonical);
        next.push(r);
        s = r.state;
      }
      return next;
    });
  }

  function intervene(id: InterventionId) {
    setTrace((current) => {
      const last = current[current.length - 1]!;
      const s = step(last.state, { kind: "applyIntervention", id }, canonical);
      return [...current, { state: s, flows: last.flows }];
    });
  }

  const algae = state.algae / SCALE;
  const nutrients = state.nutrients / SCALE;
  const clarity = state.clarity / SCALE;
  const doValue = state.do / DO_SCALE;

  return (
    <main>
      <header>
        <h1>Ecosystem Rescue — Pond Crisis</h1>
        <p className="version">
          model <code>{SIM_MODEL_VERSION}</code> · parameters <code>{PARAM_SET_VERSION}</code> (provisional)
        </p>
      </header>

      <section aria-labelledby="state-heading">
        <h2 id="state-heading">Day {state.tick}</h2>
        <dl className="readout">
          <div>
            <dt>Nutrient index (0–100)</dt>
            <dd>
              {nutrients.toFixed(0)} <span className="note">{bandWord(nutrients)}</span>
            </dd>
          </div>
          <div>
            <dt>Algae (relative abundance)</dt>
            <dd>
              {algae.toFixed(0)} <span className="note">{bandWord(algae)}</span>
            </dd>
          </div>
          <div>
            <dt>Water clarity (index 0–100)</dt>
            <dd>
              {clarity.toFixed(0)} <span className="note">{bandWord(clarity)}</span>
            </dd>
          </div>
          <div>
            <dt>Dissolved oxygen (mg/L)</dt>
            <dd>
              {doValue.toFixed(1)} <span className="note">{stressNote(doValue)}</span>
            </dd>
          </div>
        </dl>
        <p className="prose">{describe(state)}</p>

        <h3>Who is in the pond</h3>
        <p className="note">
          Each value is a relative abundance against the pond&apos;s own undisturbed state. The band word is the
          judgement; the number is the index behind it.
        </p>
        <ul className="organisms" data-testid="organisms">
          {ORGANISMS.map(({ key, label, role, threshold }) => {
            const value = state.consumers[key] / SCALE;
            const stressed = doValue < threshold;
            return (
              <li key={key} data-organism={key} className={stressed ? "stressed" : undefined}>
                <span className="name">{label}</span>
                <span className="role">{role}</span>
                <span className="value">
                  {value.toFixed(0)} <span className="note">{bandWord(value)}</span>
                </span>
                {stressed ? <span className="flag">needs oxygen above {threshold.toFixed(1)} mg/L</span> : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="controls-heading">
        <h2 id="controls-heading">Advance the pond</h2>
        <div className="controls">
          <button type="button" onClick={() => advance(1)}>
            Advance 1 day
          </button>
          <button type="button" onClick={() => advance(7)}>
            Advance 7 days
          </button>
          <button type="button" onClick={() => intervene("divert-runoff")}>
            Divert field runoff
          </button>
          <button type="button" onClick={() => intervene("buffer-strip")}>
            Plant a shoreline buffer
          </button>
          <button type="button" onClick={() => intervene("aeration")}>
            Aerate the pond
          </button>
          <button type="button" onClick={() => intervene("grazer-boost")}>
            Add water fleas
          </button>
          <button type="button" onClick={() => intervene("bluegill-removal")}>
            Move some bluegill
          </button>
        </div>
        <ul className="flags">
          <li>runoff diverted: {yesNo(state.flags.runoffDiverted)}</li>
          <li>buffer strip planted: {yesNo(state.flags.bufferStrip)}</li>
          <li>aeration running: {yesNo(state.flags.aerated)}</li>
        </ul>
      </section>

      <Chart trace={trace} />

      <footer>
        <p className="prose">
          <strong>Matter-loop check.</strong> The pond&apos;s nutrients, algae and detritus must balance every
          day — nothing appears from nowhere and nothing vanishes silently. Worst daily residual so far:{" "}
          <strong data-testid="loop-residual">{residual.worst.toExponential(2)}</strong>
          {residual.worstTick === null ? "" : ` (day ${residual.worstTick})`}.
        </p>
        <p className="note">
          This build runs the producer, cycling and oxygen rules. The consumer rules are withheld until the
          calibration finding that keeps their species alive is resolved — see <code>SCIENCE_MODEL.md</code>{" "}
          §9.1.
        </p>
      </footer>
    </main>
  );
}

function yesNo(value: boolean): string {
  return value ? "yes" : "not yet";
}
