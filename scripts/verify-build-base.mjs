// verify-build-base.mjs — ER-02 acceptance: the built app loads from a non-root asset base path
// (ACCEPTANCE_CONTRACT §3.1), i.e. the games-site release shape `<slug>/<version>/` works and
// nothing in the bundle assumes it is served from the domain root.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "vite";

const base = process.env.GAME_ASSET_BASE ?? "/game-assets/ecosystem-rescue/ci/";
await build({ configFile: resolve("vite.config.ts"), base });

const indexPath = resolve("dist", "index.html");
if (!existsSync(indexPath)) throw new Error("Subpath build did not produce dist/index.html");

const html = readFileSync(indexPath, "utf8");
if (base !== "./" && !html.includes(base)) {
  throw new Error(`Subpath build did not retain the configured asset base (${base})`);
}
if (/["'(=]\/(?:assets|src)\//.test(html)) {
  throw new Error("Subpath build contains a domain-root asset reference");
}

console.log(`Static base verification passed: ${base}`);
