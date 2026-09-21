// The evidence chart. ADR-5 says native SVG with a table and a text equivalent, no charting
// library: the accessibility requirement is the reason the chart exists, so the table is not a
// fallback bolted on afterwards — it is the same data, rendered twice, from one source.
import { DO_SCALE, SCALE, type TickResult } from "@/sim/index.js";

const WIDTH = 640;
const HEIGHT = 200;
const PAD = 28;
/** The published stress line (S4/S7), drawn so the learner can see the crossing. */
const DO_STRESS_LINE = 5;

type Series = { label: string; colour: string; valueAt: (t: TickResult) => number; max: number };

const series: Series[] = [
  { label: "Algae (relative abundance)", colour: "#3f7d20", valueAt: (t) => t.state.algae / SCALE, max: 100 },
  { label: "Nutrient index", colour: "#b07d1a", valueAt: (t) => t.state.nutrients / SCALE, max: 100 },
  {
    label: "Dissolved oxygen (mg/L)",
    colour: "#2a6f9e",
    valueAt: (t) => t.state.do / DO_SCALE,
    max: 9,
  },
];

export function Chart({ trace }: { trace: TickResult[] }) {
  const days = trace.length - 1;
  const x = (i: number) => (days === 0 ? PAD : PAD + (i / days) * (WIDTH - PAD * 2));
  const y = (value: number, max: number) => HEIGHT - PAD - (Math.min(value, max) / max) * (HEIGHT - PAD * 2);

  return (
    <section aria-labelledby="chart-heading">
      <h2 id="chart-heading">What the pond has done so far</h2>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby="chart-title chart-desc"
        style={{ width: "100%", height: "auto", background: "#f7f6f1", borderRadius: 6 }}
      >
        <title id="chart-title">Algae, nutrients and dissolved oxygen over {days} days</title>
        <desc id="chart-desc">
          {`A line per measure from day 0 to day ${days}. ` +
            series
              .map((s) => {
                const last = trace[trace.length - 1]!;
                return `${s.label} now ${s.valueAt(last).toFixed(1)}`;
              })
              .join("; ")}
          . A dashed line marks the 5 mg/L oxygen stress line.
        </desc>

        <line x1={PAD} y1={HEIGHT - PAD} x2={WIDTH - PAD} y2={HEIGHT - PAD} stroke="#8a8778" strokeWidth={1} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={HEIGHT - PAD} stroke="#8a8778" strokeWidth={1} />

        <line
          x1={PAD}
          y1={y(DO_STRESS_LINE, 9)}
          x2={WIDTH - PAD}
          y2={y(DO_STRESS_LINE, 9)}
          stroke="#a33"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <text x={WIDTH - PAD} y={y(DO_STRESS_LINE, 9) - 4} textAnchor="end" fontSize={10} fill="#a33">
          5 mg/L oxygen stress line
        </text>

        {series.map((s) => (
          <polyline
            key={s.label}
            fill="none"
            stroke={s.colour}
            strokeWidth={2}
            points={trace.map((t, i) => `${x(i)},${y(s.valueAt(t), s.max)}`).join(" ")}
          />
        ))}
      </svg>

      {/* A data table is the one thing SC 1.4.10 exempts from reflow: it needs two dimensions to
          stay readable. So the TABLE may scroll inside its own box; the page may not. */}
      <div className="table-scroll">
        <table>
          <caption>Daily values behind the chart</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              {series.map((s) => (
                <th scope="col" key={s.label}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trace
              .map((t, i) => ({ t, i }))
              .filter(({ i }) => i % Math.max(1, Math.floor(trace.length / 12)) === 0 || i === trace.length - 1)
              .map(({ t }) => (
                <tr key={t.state.tick}>
                  <th scope="row">{t.state.tick}</th>
                  {series.map((s) => (
                    <td key={s.label}>{s.valueAt(t).toFixed(1)}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
