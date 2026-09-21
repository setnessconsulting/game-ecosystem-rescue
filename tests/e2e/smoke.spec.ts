// The production-artifact smoke test (ACCEPTANCE_CONTRACT §3.1): the built app must load from a
// non-root asset base path with a clean console. Every assertion here is about what ships — the
// built bundle, served from the versioned subpath the games-site uses.
import { expect, test } from "@playwright/test";

test.describe("built artifact served from a versioned subpath", () => {
  test("loads with no console errors, no failed requests and no page exceptions", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("requestfailed", (req) => failedRequests.push(`${req.url()} — ${req.failure()?.errorText ?? "failed"}`));
    page.on("response", (res) => {
      if (res.status() >= 400) failedRequests.push(`${res.url()} — HTTP ${res.status()}`);
    });

    await page.goto("./");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ecosystem Rescue");

    // React must have mounted (a blank root would still satisfy a 200 response).
    await expect(page.getByRole("heading", { name: /Day \d+/ })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
    expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
    expect(failedRequests, `failed requests: ${failedRequests.join(" | ")}`).toEqual([]);
  });

  test("loads every asset from the configured base, not the domain root", async ({ page }) => {
    const rootRelative: string[] = [];
    page.on("request", (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith("/assets/") || path.startsWith("/src/")) rootRelative.push(req.url());
    });

    await page.goto("./");
    await expect(page.getByRole("heading", { name: /Day \d+/ })).toBeVisible();

    expect(rootRelative, `domain-root asset requests: ${rootRelative.join(" | ")}`).toEqual([]);
  });

  test("advances the pond and keeps the matter loop balanced", async ({ page }) => {
    await page.goto("./");

    const dayHeading = page.getByRole("heading", { name: /^Day \d+$/ });
    await expect(dayHeading).toHaveText("Day 0");

    await page.getByRole("button", { name: "Advance 7 days" }).click();
    await expect(dayHeading).toHaveText("Day 7");

    // The kernel's own conservation check is printed in the footer: it must read as no imbalance.
    await expect(page.getByText(/Worst daily residual so far:/)).toBeVisible();
    await expect(page.getByTestId("loop-residual")).toHaveText("0.00e+0");
  });

  test("takes an intervention and reports it", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("button", { name: "Divert field runoff" }).click();
    await expect(page.getByText("runoff diverted: yes")).toBeVisible();
  });
});
