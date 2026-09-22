# HANDOFF — finish the test-hardening pass (game-ecosystem-rescue)

Give this file to the next agent. Work happens **locally only**: no push, no PR, no GitHub
Actions, no workflow_dispatch. Local commits are allowed and expected.

## Where things stand (all verified green on this machine)

- Branch `game-317-er01-design-freeze` in `02-setnessconsulting/game-ecosystem-rescue/`.
- `npx vitest run tests/boundaries.test.ts tests/kernel.test.ts` → **67/67 pass**
  (50 new tests in `tests/boundaries.test.ts`, 17 pre-existing in `tests/kernel.test.ts`).
- Two minimal kernel fixes were made in `src/sim/kernel.ts` (see "Defects" below); the full
  `npm run verify` gate has **not** been re-run end-to-end yet — that is the first thing to do.

## What this pass changed

1. `src/sim/kernel.ts`
   - **Fix 1 (defect: input-state mutation).** `tick()` used to write R-41's `hungry` counters in
     place (`s.hungry[sp] += 1`), mutating the caller's state and breaking the kernel's own purity
     contract (TECHNICAL_DESIGN §D-2: every transition returns new state). Now a fresh
     `nextHungry` record is built and carried into the next state. Latent-only today because the
     increment branch is unreachable (`respired ≤ assimilated` always), but it becomes a real
     replay-corruption bug the moment R-41 is wired to a real threshold.
   - **Fix 2 (defect: silent NaN/∞ acceptance).** A new `assertValidInputs()` runs at the top of
     `tick()`: rejects NaN/∞/non-integer `runoffAt(tick)` and `backgroundInflow`, NaN/∞/fractional
     values anywhere in the state stocks (`nutrients`, `algae`, `weeds`, `detritus`, `do`,
     `clarity`, `tick`, `rngSeed`, every consumer stock, every `hungry` counter, every
     `doHistory` entry), and an empty `doHistory` (which would make the R-40 average NaN).
     Authority: TECHNICAL_DESIGN §D-2 "NaN/∞ rejected … no silent repair" and §D-6 fail-closed.
     Bounds are deliberately NOT re-checked (R-52's end-of-tick clamp is the designed mechanism).
2. `tests/boundaries.test.ts` — 50 new deterministic, offline tests: R-52 invariants from
   pathological starts (all-caps, all-zero, max detritus, 2,000-tick flood soak), extinction /
   carrying-cap / predator-collapse boundaries, pool starvation and saturation, DO floor/ceiling,
   exact R-40 threshold arithmetic at onset/severe ± one decimal (thresholds are stored at
   DO_SCALE=1000, so "one decimal" = ±1 tenth-of-mg/L unit), the full action surface (repeat
   interventions, latching flags, cap-clamped grazer boost, 40× bluegill removal → 0, unknown
   action rejection, advanceDays 0..7 including NaN/±Infinity), PRNG wraparound determinism,
   mid-trace replay, tick() input purity, R-50 noise confined to births (recomputed from the
   ledger) with bounded downstream inheritance (detritus/nutrients < 5 index, DO < 0.1 mg/L —
   legal paths: R-12 shed surplus → detritus, R-21 BOD burst → DO), fail-closed malformed
   scenario/state rejection, event evidence invariants, §6.5 ledger-exactness, and the
   presentation band words / DO stress-note boundaries (15/35/65, 5.0/2.5 mg/L).

## Remaining work (in order)

1. **Full gate:** `npm run verify` in the game directory. It runs typecheck, lint, all vitest
   tests, the boundary/no-random/build-base scripts, `vite build`, and the two Playwright suites
   (`test:smoke`, `test:a11y`). The Playwright suites need Chromium installed locally
   (`npx playwright install chromium`) and start a dev server; everything else is offline. If
   Playwright cannot run in your environment, run everything except it:
   `npm run typecheck && npm run lint && npm test && npm run verify:boundary && npm run verify:no-random && npm run verify:build-base && npm run build`
   and say so in the report. Known-good baseline before this pass: verify was green on this
   branch (commit 0b22224).
2. **Watch one thing in typecheck/lint:** `tests/boundaries.test.ts` imports `mul` from the
   kernel and uses a couple of `as` casts (e.g. `dead()` returns a consumers record). If ESLint or
   tsc complains, adjust the test file only — do not touch kernel code for this.
3. **Commit locally** (no push). Files changed: `src/sim/kernel.ts`,
   `tests/boundaries.test.ts` (new), plus this handoff file if you keep it. Suggested message:
   `Test hardening: kernel boundary/invariant suite + fail-closed input validation and state-purity fix`.
4. **Final report should include:** modules inspected (`src/sim/{kernel,fixed,params,types,index}.ts`,
   `src/presentation.ts`, `src/App.tsx`), coverage reviewed (the 3 existing test files), the
   defects + fixes above with the failing-first evidence, exact commands + results, remaining
   risks, changed files, `git status`, and the local commit SHA.

## Recorded issues (deliberately NOT fixed — owner decisions, do not "fix" silently)

- **F-5 clamp leak (documented in SCIENCE_MODEL §9.1).** An end-of-tick clamp is not
  mass-neutral; a scenario that pins the nutrient pool at its cap breaks the §5 matter identity
  (measured ~32 index/tick residual with a 40/tick forced runoff). The design says ER-03 must
  implement spill/reject at caps. `tests/boundaries.test.ts` has a test that **pins this recorded
  limitation** (`documents the F-5 clamp leak…`) — if it starts failing, someone implemented
  spill/reject and the test should be updated to assert the identity instead.
- **D-3.9 event-window conflict.** TECHNICAL_DESIGN §D-3.9 says event overflow beyond 64 is "a
  kernel error, not a silent truncation", but the kernel windows accumulated events with
  `.slice(-64)`. In practice the 64 window never fills (R-01b onset is the only event that
  accumulates, ≤1 per crash episode). Needs an owner decision: change the doc or the kernel.
- **D-8 rows with no mechanism yet:** "Repeated mission reset" (confirm-first reset exists only
  as a doc row) and "Double activation" (idempotent action dedupe is not implemented — `step()`
  re-applies `grazer-boost` mass each call; the App's React batching makes double-fire unlikely,
  but the contract row is unimplemented). Also the `dredge-detritus` intervention (SCIENCE_MODEL
  §10 menu) is absent from the v1 kernel vocabulary — v1 scope decision, listed here for the owner.
- **R-41 is unreachable by construction** (documented in SCIENCE_MODEL §6.3): `assimilated <
  maintenance` can never be true when maintenance is a share of assimilated intake. The hungry
  counters now mutate safely (Fix 1) but starvation still cannot fire. ER-04 must wire it to a
  real threshold or delete it.

## Environment notes

- Node 24, npm; repo root for all commands is `02-setnessconsulting/game-ecosystem-rescue/`.
- The mono-repo parent directory is a large workspace; always scope commands to the game dir.
- `tests/chain.test.ts` and `tests/settle.test.ts` are diagnostics that print reports and are
  slow (settle runs ~20×500 ticks); they are part of `npm test` and were green.
- Do not edit `docs/design/**` — it is the frozen authority. Do not bump
  `SIM_MODEL_VERSION`/`PARAM_SET_VERSION` (no rule-structure or parameter change was made).
