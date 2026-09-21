// build-subpath.mjs — build the app the way the games-site serves it: from a versioned subpath.
// A script rather than an inline env var so the same command works on Windows and Linux, and so
// the browser smoke tests exercise the *built* artifact rather than the dev server.
import { resolve } from "node:path";
import { build } from "vite";

export const SUBPATH_BASE = process.env.GAME_ASSET_BASE ?? "/game-assets/ecosystem-rescue/ci/";

await build({ configFile: resolve("vite.config.ts"), base: SUBPATH_BASE });
console.log(`Subpath build complete at base ${SUBPATH_BASE}`);
