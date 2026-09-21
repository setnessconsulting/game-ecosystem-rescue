// Kernel state, actions and the flow ledger (TECHNICAL_DESIGN §D-2, SCIENCE_MODEL §5/§6.5).
//
// The state is plain data: integers only, no class instances, no functions, so it can be frozen,
// serialized, hashed and replayed exactly. A trace is a list of these plus the actions that made
// them, which is what makes the evidence layer auditable after the fact.
import type { SCALE, DO_SCALE } from "./fixed.js";

/** Every authoritative stock. Values are integers: indices × SCALE, DO × DO_SCALE. */
export type EcosystemState = {
  readonly tick: number;
  /** R-30 dissolved nutrient pool (index × SCALE). */
  readonly nutrients: number;
  /** R-01 bloom-forming algae (index × SCALE). */
  readonly algae: number;
  /** R-20 detritus (index × SCALE) — internal, not learner-visible in v1. */
  readonly detritus: number;
  /** R-23 dissolved oxygen, mg/L × DO_SCALE. */
  readonly do: number;
  /** R-03 derived clarity, 0–100 index × SCALE. Derived, carried for the trace and the UI. */
  readonly clarity: number;
  /** R-40 2-tick DO running average, mg/L × DO_SCALE. Derived, carried for the same reason. */
  readonly doAverage: number;
  readonly doHistory: readonly number[];
  /**
   * R-31 intervention flags. They live in the state, not the scenario, so a replay is
   * self-contained: (scenarioId, seed, actions) must be enough to reproduce a trace exactly.
   */
  readonly flags: ScenarioFlags;
  /** PRNG state — the kernel's only stochasticity (R-50), carried so a replay resumes exactly. */
  readonly rngSeed: number;
  /** Rules that fired this tick, for the evidence layer. Derived, never read back by a rule. */
  readonly events: readonly SimEvent[];
};

/** An evidence-layer annotation. Non-authoritative by construction (§D-2 line 41). */
export type SimEvent = {
  readonly rule: string;
  readonly kind: string;
  readonly value: number;
};

/** Every flow computed this tick, in one place, so the matter loop can be audited (§5). */
export type FlowLedger = {
  readonly runoff: number;
  readonly inflow: number;
  readonly algaeGrowth: number;
  readonly algaeDieback: number;
  readonly algaeSenescence: number;
  readonly decomposition: number;
  readonly mineralized: number;
  readonly buried: number;
  readonly nutrientSinkLoss: number;
  readonly o2Produced: number;
  readonly o2Demand: number;
  readonly o2Reaeration: number;
  readonly o2Respiration: number;
};

/** The result of one tick: the new state and the ledger that produced it. */
export type TickResult = {
  readonly state: EcosystemState;
  readonly flows: FlowLedger;
};

/** Actions the player can take (TECHNICAL_DESIGN §D-2). Additive; unknown actions are rejected. */
export type SimAction =
  | { readonly kind: "advanceDays"; readonly days: number }
  | { readonly kind: "applyIntervention"; readonly id: InterventionId }
  | { readonly kind: "noop" };

/** The frozen v1 intervention vocabulary (SCIENCE_MODEL §10). */
export type InterventionId = "divert-runoff" | "buffer-strip" | "aeration";

/** Scenario-owned flags that interventions flip (R-31). */
export type ScenarioFlags = {
  readonly runoffDiverted: boolean;
  readonly bufferStrip: boolean;
  readonly aerated: boolean;
};

export type { SCALE, DO_SCALE };
