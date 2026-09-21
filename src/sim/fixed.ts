// Fixed-point arithmetic (SCIENCE_MODEL R-51, TECHNICAL_DESIGN §D-3).
//
// Every authoritative quantity is an integer. Indices use SCALE = 1000; dissolved oxygen uses
// DO_SCALE = 10 (one decimal, the only learner-visible decimal). No floats ever enter state, so a
// trace is byte-identical across engines and replays do not drift.
//
// Magnitudes: stocks are ≤ 100 → ≤ 100_000 scaled. A product of two scaled values is ≤ 10^10, far
// inside the exact-integer range of a JS number (2^53), so `mul` never loses precision.
export const SCALE = 1000;
export const DO_SCALE = 10;

/** Largest index / stock value, in model units. */
export const INDEX_MAX = 100;
/** Dissolved oxygen ceiling, mg/L (R-52). */
export const DO_MAX = 15;

/** Multiply two scaled values, keeping the scale (floor toward zero, per R-51). */
export function mul(a: number, b: number): number {
  return Math.trunc((a * b) / SCALE);
}

/** Divide two scaled values, keeping the scale (floor toward zero). Zero denominator yields zero. */
export function div(a: number, b: number): number {
  return b === 0 ? 0 : Math.trunc((a * SCALE) / b);
}

/** Scale an integer model value into fixed point. */
export function fromInt(v: number): number {
  return v * SCALE;
}

/** Model units as a float — for display and tests only, never for state. */
export function toFloat(v: number): number {
  return v / SCALE;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** DO helpers: DO is stored at DO_SCALE, so converting needs its own pair. */
export function doFromTenths(tenths: number): number {
  return tenths * DO_SCALE;
}
export function doToFloat(v: number): number {
  return v / DO_SCALE;
}
