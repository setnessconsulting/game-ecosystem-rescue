# UX_USER_FLOW.md — Ecosystem Rescue

| | |
| --- | --- |
| Status | **FROZEN v1.0 (GAME-317 / ER-01)** — ER-05/06/08/09 implement this flow; visual design authority from ER-DESIGN onward (TECH_STACK_ADR ADR-13) |
| Science semantics | [SCIENCE_MODEL.md](SCIENCE_MODEL.md) · Mission loop | [GDD.md](GDD.md) §3 |
| A11y normative baselines | WCAG 2.2 AA target; GAME-316 accessibility contract |

## 1. End-to-end learner flow (frozen 20-step contract)

| # | Step | Key rules |
| --- | --- | --- |
| 1 | **Launch** | Title card → mission select (v1: single Pond Crisis collection). Loads within cold-start budget (PERFORMANCE_BUDGETS §3). Keyboard/tab order starts here. |
| 2 | **Mission briefing** | Field-notes style: situation, available tools, mission criteria (multidimensional, visible from the start). "Begin observation" is the only gate. |
| 3 | **Observe pond** | Habitat canvas + Habitat Data panel; no actions required; notebook pinning available. |
| 4 | **Inspect organism** | Card via click/tap/keyboard/AX node; role, connections, band/trend, sensitivity note. |
| 5 | **Inspect food web** | SVG web + table alternative; typed links (incl. decomposes); filter by link type. |
| 6 | **Inspect trends** | Charts + tables + one-line summaries per quantity; DO shows 5.0 mg/L stress line. |
| 7 | **Collect/select evidence** | Pin/cite facts (auto-captured); notebook = evidence shelf. |
| 8 | **State bounded hypothesis** | Scenario chips + optional ≤200-char nuance; distractor hypothesis present (M-3). |
| 9 | **Make prediction** | Direction + magnitude band + lag window per quantity (1–4 items). Stored verbatim. |
| 10 | **Select intervention** | Card menu w/ mechanism + cost/speed/reversibility + science note. |
| 11 | **Commit intervention** | Explicit confirm; idempotent (double-activation safe); drag equivalents exist for any drag-style placement. |
| 12 | **Run simulation ticks** | +1d / +7d / auto-run ≤60d; pause/stop always visible; kernel time only (no wall clock). |
| 13 | **Inspect outcome** | Same observation tools; "what changed" digest referencing the prediction items. |
| 14 | **Compare prediction** | Confirmed / partially confirmed / not confirmed per item + explaining evidence. No penalty. |
| 15 | **Classify evidence** | supports / refutes / uncertain per cited item for the active hypothesis (available only after ≥2 evidence items compared — M-3 guard). |
| 16 | **Revise hypothesis/intervention** | Always available; framed as good science; revision history retained in notebook. |
| 17 | **Conclude mission** | Conclusion builder: hypothesis + ≥3 cited evidence + comparison result → short paragraph. |
| 18 | **Summary** | Outcome vs criteria bands (multidimensional); model-behavior highlight (lag literacy); no score. |
| 19 | **Replay / new scenario** | Variant cards + "same pond, new conditions"; seeds surface as science framing ("a different day on the same pond"), never as lottery. |
| 20 | **Exit / return** | Return to mission select; active session restore rules per §5. |

## 2. Screen inventory (v1)

1. **Title / mission select** — collection art, accessible list of missions, settings entry.
2. **Briefing** — narrative + criteria + tools overview.
3. **Habitat workspace** — the game: header (mission, day counter, time controls), canvas, Habitat Data panel with tabs (Organisms / Food Web / Trends / Hypothesis / Evidence / Interventions), notebook rail.
4. **Conclusion & summary** — builder then debrief.
5. **Settings** (modal) — motion, audio, text-size helper note.
6. **Fatal / degraded shells** — boot failure, content failure, storage notice (§10).

## 3. Observation details

### 3.5 Lag-literacy language (frozen cross-reference)

Wherever the UI explains delayed effects (trend annotations, prediction-compare explanations, model-behavior highlights), it uses the frozen sentence family anchored in SCIENCE_MODEL §2: *"Each day the pond answers the last few days' conditions"* — extended as "the algae of day 12 become the oxygen stress of day 20." No UI text may describe a cause and its downstream effect as simultaneous.

- **Habitat canvas** is *optional to navigate* — the entire loop is completable from the Habitat Data panel (canvas adds spatial context and game feel, never exclusive information). Canvas has a keyboard-reachable equivalent for every interactable organism (focus list synced with canvas selection).
- **Organism cards** show: learner name + scientific-class note, role, "eats / eaten by / affected by" lists, current band + trend arrow + "for N days", DO sensitivity line, and a "what this represents" note (M-9 honesty).
- **Food web**: nodes include decomposers and abiotic factors (nutrients, light, DO); link types: eats/grazes, decomposes, shades, stresses (low DO). Selecting a link shows its learner-facing rule sentence ("Algae block light that waterweeds need").
- **Trends**: every quantity gets chart + table + summary sentence; time window selector (7/30/60 days); annotation markers for committed interventions and disruption events (crucial for lag literacy, M-2).

## 4. Time & run controls

- Controls: **+1 day**, **+7 days**, **Run** (auto-advance with per-day visual pacing), **Pause**, **Reset** (confirm-first). All keyboard reachable in header.
- Auto-run paces ~2 days/sec visually; the kernel receives the same explicit `advanceDays` calls either way (no fast-forward state divergence).
- While running: commit controls are disabled (prevents mid-tick ambiguity); evidence pinning stays available (observations of running system allowed).
- A running session paused by tab-switch resumes paused (kernel never advances on its own).

## 5. Session restore (refresh mid-mission)

- On boot with a valid `ecr-session-v1`: **Restore? Resume mission / Start fresh** (explicit choice, default highlighted = resume). Restore reconstructs canonical state via kernel (replay of committed actions, verified against stored state — TECHNICAL_DESIGN §D-7/D-3).
- Version mismatch or integrity failure → discard silently-recovered data honestly: "Saved session was out of date and couldn't be restored" → fresh start (never a corrupted-looking half state).

## 6. Onboarding specifics

- M1 embeds stage callouts (Observe → Hypothesize → …) as non-modal coach marks; each has "Got it" and is fully skippable ("Skip coaching" in settings + per-callout close).
- First-time hints ladder active (GDD §5); hint entry point is a persistent "I'm stuck" affordance, not a quiz gate.
- Nothing essential is conveyed only by coach marks — the flow contract in §1 is the source of truth.

## 7. Settings

| Setting | Values | Persistence | Notes |
| --- | --- | --- | --- |
| Reduced motion | Follow system / Always reduce / Full motion | session | Affects canvas ambience, particles, transitions; text state always full |
| Audio | Off (default) / On + volume | session | Mute-first; no audio-only info |
| Text size helper | link to browser-zoom guidance | — | Game supports 200% zoom reflow natively |

## 8. Announcements (aria-live vocabulary, frozen)

- Time: "Advanced to day 14." / "Run paused at day 21."
- Outcome: "Water fleas dropped to strained." / "Dissolved oxygen is now above the stress line."
- Commit: "Runoff diversion applied." (after idempotency check)
- Prediction compare: "Two predictions confirmed, one not confirmed."
- Errors: assertive, plain-language, next-step-first ("Saved session couldn't be restored. Starting fresh.")
- **Never announced:** decorative animation states; band words already visible in text get no duplicate chatter (announcement = state change summary, not every tick).

## 9. Accessibility interaction contract (frozen acceptance-oriented)

| Requirement | Contract |
| --- | --- |
| Keyboard complete | Every action reachable & operable by keyboard; logical tab order; no traps except intentional modals (Esc closes; focus returns to invoker) |
| Focus visibility | Always-visible focus indicator (≥3:1 against adjacent colors) |
| Non-drag equivalents | Any drag operation (polish-pass placements) has menu/keyboard path from day one |
| No hover-only | Tooltips duplicated in cards/panels; nothing appears on hover only |
| Non-color state | Bands = word + icon + position (thriving/stable/strained/crashing); trend = arrow + word |
| Screen readers | All science data in semantic DOM (cards/tables/lists); charts have `<title>/<desc>` + tables + summaries; canvas has a text-equivalent organism list; live regions per §8 |
| Touch | ≥44×44 px targets; no precision-drag requirements; large hit areas on canvas organisms |
| Zoom/reflow | 200% zoom: no loss of content or function; 360 px portrait: single-column reflow, no horizontal scroll of the page |
| Landscape phones | Canvas + panel stack vertically; both remain reachable without scrolling traps |
| Reduced motion | §7 setting + `prefers-reduced-motion`; static frame + text equivalence |
| Audio independence | No information by audio alone; visual captions for audio cues when audio on |
| Modals/panels | Focus trapped + labeled; Esc closes; background inert |
| Time limits | None (no timers anywhere) |

**Automated vs human evidence boundary:** axe + Playwright cover structure/labels/contrast/keyboard reachability on all routes/states; **manual review (human) covers NVDA/VoiceOver/JAWS flow, comprehension of summaries, and cognitive accessibility** — automation cannot substitute (ACCEPTANCE_CONTRACT §6; ER-14 human device/SR playtest gate).

## 10. Error, edge, and failure states (learner-facing view of TECHNICAL_DESIGN §D-8)

| Situation | Learner sees | Recovers by |
| --- | --- | --- |
| Storage unavailable | One-time notice: "Saving is off in this browser — your run won't survive a refresh." Continue | Dismiss; memory mode |
| Quota exceeded | Same notice class as above | Same |
| Refresh mid-mission | Restore dialog (§5) | Resume / Start fresh |
| Malformed scenario content | Fatal shell: "This mission's data is damaged." + Retry + Return | Retry (re-fetch), exit |
| Unsupported version | Fatal shell: "This build is older than the mission data." + Return | Exit to menu |
| Asset load failure (art/sound) | Degraded banner: "Some visuals couldn't load — your data and controls are unaffected." | Continue in semantic mode |
| WebGL failure | Same as degraded + canvas hidden | Full play continues in data panel |
| Renderer runtime error | Same as degraded + auto-recover attempt (one) | Continue; second failure ⇒ stays degraded |
| Network loss during first load | "Couldn't load the game files — check connection." Retry / Exit | Retry; cached partial assets listed honestly |
| Network loss after load | Nothing (no runtime network) | n/a |
| Background/resume | Paused run + "Paused" indicator | Resume manually |
| Double activation | Visible "Already applied" acknowledgment | no-op |
| Repeated reset | Confirm-first: "Reset to the beginning of this mission?" | Confirm/cancel |
| Fatal exception | Fatal shell: safe description + "Copy diagnostic details" (curated, learner-safe) + Restart + Exit | Restart; details for bug reports |
| **Standing rule** | Failures never fabricate results, never corrupt state, never show stack traces | — |

## 11. Responsive layout contract (frozen breakpoints)

| Layout | Arrangement |
| --- | --- |
| Desktop ≥1024 px | Canvas + side panel (panel resizable? no — fixed two-pane; panel tabs) |
| Tablet 640–1023 px | Canvas top, panel below (tabs persist) |
| Phone portrait 360–639 px | Single column: header, canvas (16:9, optional-collapse), panel tabs; run controls sticky |
| Phone landscape | Same as portrait stacking (canvas smaller); no horizontal page scroll |
| 200% zoom | Reflow per phone-portrait rules (content-based, not pixel-based) |

Canvas collapse control is explicit ("Hide view / Show view") — semantic panel is always the information authority.
