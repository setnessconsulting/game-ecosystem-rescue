// The kernel's public surface. Nothing outside src/sim/ may reach past this file, which is what
// keeps the boundary check meaningful: if a rule or a constant is not exported here, the UI cannot
// depend on it.
export {
  SIM_MODEL_VERSION,
  PARAM_SET_VERSION,
  CANONICAL_INITIAL,
  CONSUMER_ORDER,
  producers,
  consumers,
  cycling,
  oxygen,
  scenario,
} from "./params.js";
export type { ConsumerKey } from "./params.js";
export { SCALE, DO_SCALE, INDEX_MAX, DO_MAX, mul, div, clamp } from "./fixed.js";
export { initialState, tick, step, run, loopResidual, clarityOf, canonicalScenario } from "./kernel.js";
export type { Scenario } from "./kernel.js";
export type {
  EcosystemState,
  ConsumerStocks,
  FlowLedger,
  TickResult,
  SimAction,
  SimEvent,
  InterventionId,
  ScenarioFlags,
} from "./types.js";
