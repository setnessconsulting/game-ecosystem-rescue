// verify-no-random.mjs — ER-02 acceptance: no `Math.random()` anywhere in authoritative code
// (ACCEPTANCE_CONTRACT §3.1). Stochasticity is allowed only through the kernel-owned seeded PRNG
// (SCIENCE_MODEL R-50), so an unseeded call anywhere in src/ is a determinism defect, not a style
// preference. Deliberately covers all of src/, not just the kernel: the UI must not invent
// randomness that the trace cannot reproduce either.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) files.push(full);
  }
}
walk("src");

const violations = [];
for (const file of files) {
  const contents = readFileSync(file, "utf8");
  const code = contents.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "");
  if (/\bMath\.random\b/.test(code)) violations.push(file);
}

if (violations.length > 0) {
  console.error("Math.random() found in authoritative code paths:");
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`No unseeded randomness in ${files.length} source files`);
}
