// Presentation helpers. These turn kernel state into language, and they are deliberately the only
// place that does — so the mispronunciation guardrails of SCIENCE_MODEL §8 live in one file that a
// reviewer can read: no health score, no false precision, band words instead of raw judgement.
import { DO_SCALE, SCALE, type EcosystemState } from "@/sim/index.js";

/** §8 M-9: indices are shown as band words, never as counts, and never with decimals. */
export function bandWord(index: number): string {
  if (index >= 65) return "thriving";
  if (index >= 35) return "stable";
  if (index >= 15) return "strained";
  return "crashing";
}

/** S4/S7: 5 mg/L is the published stress line for warm-water life; say it in those terms. */
export function stressNote(dissolvedOxygen: number): string {
  if (dissolvedOxygen < 2.5) return "severe — fish gulp at the surface";
  if (dissolvedOxygen < 5) return "below the 5 mg/L stress line";
  return "above the stress line";
}

/** One sentence of plain language about the pond, derived only from state. */
export function describe(state: EcosystemState): string {
  const algae = state.algae / SCALE;
  const clarity = state.clarity / SCALE;
  const nutrients = state.nutrients / SCALE;
  const doValue = state.do / DO_SCALE;
  const mayfly = state.consumers.mayfly / SCALE;
  const flea = state.consumers.flea / SCALE;

  if (nutrients > 55 && algae > 40) {
    return "Fertiliser from the fields has fed the algae. The water is turning green and less light reaches the weeds.";
  }
  if (clarity < 35) {
    return "The bloom is thick enough to shade the water. Whatever lives below now sees very little light.";
  }
  if (doValue < 5) {
    return "Decomposing algae are using up the oxygen. Below 5 mg/L the animals that need the most begin to suffer first.";
  }
  if (mayfly < 20) {
    return "The mayflies have thinned out — they are the first to feel low oxygen, which is why they are watched closely.";
  }
  if (flea < 20) {
    return "The water fleas are scarce, so the algae have one less grazer holding them back.";
  }
  if (algae < 20) {
    return "The water is clear and the algae are sparse — a quiet, low-nutrient pond.";
  }
  return "The pond is holding steady: the algae grow, the grazers eat, and the day's surplus settles to the bottom.";
}
