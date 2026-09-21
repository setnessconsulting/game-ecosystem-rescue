import { defineConfig } from "@playwright/test";

// The smoke suite runs against the BUILT app served from the versioned subpath the games-site uses,
// never the dev server: the acceptance criterion is that the production artifact loads from a
// non-root base with a clean console, and a dev server cannot testify to that.
const PORT = 4180;
const BASE_PATH = "/game-assets/ecosystem-rescue/ci/";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    headless: true,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/build-subpath.mjs && node scripts/serve-dist.mjs 4180 " + BASE_PATH,
    url: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
  },
});
