// Kernel state, actions and the flow ledger (TECHNICAL_DESIGN §D-2, SCIENCE_MODEL §5/§6.5).
//
// The state is plain data: integers only, no class instances, no functions, so it can be frozen,
// serialized, hashed and replayed exactly. A trace is a list of these plus the actions that made
// them, which is what makes the evidence layer auditable after the fact.
import type { SCALE, DO_SCALE } from "./fixed.js";
import type { ConsumerKey } from "./params.js";

/** The stocks every consumer carries: its abundance, hunger counter and stress flag. */
export type ConsumerStocks = Record<ConsumerKey, number>;
export type ConsumerCounters = Record<ConsumerKey, number>;

/** Every authoritative stock. Values are integers: indices × SCALE, DO × SCALE. */
export type EcosystemState = {
  readonly tick: number;
  /** R-30 dissolved nutrient pool (index × SCALE). */
  readonly nutrients: number;
  /** R-01 bloom-forming algae (index × SCALE). */
  readonly algae: number;
  /** R-02 rooted waterweeds (index × SCALE). */
  readonly weeds: number;
  /** R-10/R-11/R-12 the five consumer species (index × SCALE each). */
  readonly consumers: ConsumerStocks;
  /** R-41 consecutive hungry ticks per consumer (internal bookkeeping, not learner-visible). */
  readonly hungry: ConsumerCounters;
  /** R-20 detritus (index × SCALE) — internal, not learner-visible in v1. */
  readonly detritus: number;
  /** R-23 dissolved oxygen, mg/L × SCALE. */
  readonly do: number;
  /** R-03 derived clarity, 0–100 index × SCALE. Derived, carried for the trace and the UI. */
  readonly clarity: number;
  /** R-40 running DO history; its 2-tick mean drives the stress term. */
  readonly doHistory: readonly number[];
  /** R-01b whether the bloom is currently shedding, so the onset event fires once. */
  readonly crashActive: boolean;
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
  readonly organism?: string;
  readonly value: number;
};

/** Every flow computed this tick, in one place, so the matter loop can be audited (§5). */
export type FlowLedger = {
  readonly runoff: number;
  readonly inflow: number;
  readonly algaeGrowth: number;
  readonly algaeDieback: number;
  readonly algaeSenescence: number;
  readonly weedGrowth: number;
  readonly weedSenescence: number;
  readonly grazedAlgae: number;
  readonly removed: ConsumerStocks;
  readonly predation: ConsumerStocks;
  readonly births: ConsumerStocks;
  readonly deaths: ConsumerStocks;
  readonly starve: ConsumerStocks;
  readonly stress: ConsumerStocks;
  readonly respired: number;
  readonly shed: number;
  readonly egestion: number;
  readonly deadMass: number;
  readonly exportLoss: number;
  readonly detritusInflow: number;
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

/** The v1 intervention vocabulary (SCIENCE_MODEL §10). */
export type InterventionId =
  | "divert-runoff"
  | "buffer-strip"
  | "aeration"
  | "grazer-boost"
  | "bluegill-removal";

/** Scenario-owned flags that interventions flip (R-31). */
export type ScenarioFlags = {
  readonly runoffDiverted: boolean;
  readonly bufferStrip: boolean;
  readonly aerated: boolean;
};

export type { SCALE, DO_SCALE, ConsumerKey };
