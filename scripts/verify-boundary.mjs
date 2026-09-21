// verify-boundary.mjs — ER-02 acceptance: `src/sim/**` imports none of DOM, Phaser, React,
// storage, network or clock APIs (ACCEPTANCE_CONTRACT §3.1, TECHNICAL_DESIGN §D-2).
//
// The kernel is the game's ecological authority and it must stay replayable: anything that reads
// the world outside its own state (a clock, a canvas, a fetch, a storage key) makes a trace
// unreproducible, and that is the one property the whole evidence layer rests on.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) files.push(full);
  }
}
walk("src/sim");

const forbidden = [
  [/from\s+["']phaser/i, "Phaser import"],
  [/from\s+["']react/i, "React import"],
  [/from\s+["']@\/(?!sim)/, "non-kernel internal import"],
  [/\bdocument\b/, "document"],
  [/\bwindow\b/, "window"],
  [/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/, "storage"],
  [/\bfetch\s*\(|XMLHttpRequest/, "network"],
  [/\bDate\b|\bperformance\s*\./, "clock"],
  [/\bMath\.random\b/, "unseeded randomness"],
  [/\bconsole\s*\./, "console output from the kernel"],
];

const violations = [];
for (const file of files) {
  const contents = readFileSync(file, "utf8");
  // Strip line comments so the rule can be discussed in the kernel without tripping itself.
  const code = contents.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "");
  for (const [pattern, label] of forbidden) {
    if (pattern.test(code)) violations.push(`${file}: ${label} (${pattern})`);
  }
}

if (files.length === 0) {
  console.error("Kernel boundary check found no source files under src/sim — that is a failure, not a pass.");
  process.exitCode = 1;
} else if (violations.length > 0) {
  console.error("Kernel boundary violations:");
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Kernel boundary verification passed: ${files.length} source files under src/sim`);
}
