import { defineConfig } from "@playwright/test";

// Accessibility runs against the same built, subpath-served artifact as the smoke suite, so a
// finding is a finding about what ships. Two viewports are exercised because they are different
// requirements: 360 px is the phone layout, and 320 CSS px is WCAG 2.2 SC 1.4.10's reflow bar
// (no two-dimensional scrolling at 320 CSS px = 400 % zoom on a 1280 px viewport), which the
// design package claims and therefore has to be able to test.
const PORT = 4181;
const BASE_PATH = "/game-assets/ecosystem-rescue/ci/";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/accessibility.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    headless: true,
    viewport: { width: 360, height: 800 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/build-subpath.mjs && node scripts/serve-dist.mjs 4181 " + BASE_PATH,
    url: `http://127.0.0.1:${PORT}${BASE_PATH}`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
  },
});
