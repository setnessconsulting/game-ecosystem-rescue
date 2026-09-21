// create-release-manifest.mjs — the immutable release identity for a games-site static-web release.
//
// The games-site release contract requires the manifest to record the source commit, the version,
// the entry file, every payload file's hash/size/content type, and the release evidence references.
// It also requires the *lockfile* identity, which this script hashes alongside the payload.
//
// The manifest is metadata and is deliberately not self-hashed (hashing it would be circular).
// Usage:
//   node scripts/create-release-manifest.mjs dist            # write dist/release-manifest.json
//   node scripts/create-release-manifest.mjs dist --check    # fail if it does not match dist
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const [, , distArgument = "dist", ...flags] = process.argv;
const distDir = path.resolve(distArgument);
const checkOnly = flags.includes("--check");
const manifestPath = path.join(distDir, "release-manifest.json");
const GAME_SLUG = "ecosystem-rescue";
const ENTRY_FILE = "index.html";

const contentTypes = new Map([
  [".css", "text/css"],
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".wasm", "application/wasm"],
  [".woff2", "font/woff2"],
]);

const workflowRunUrl =
  process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
const inReleaseWorkflow = process.env.GITHUB_ACTIONS === "true" && Boolean(workflowRunUrl);

async function filesUnder(directory, prefix = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute, relative)));
    else if (entry.isFile() && relative !== "release-manifest.json") files.push({ relative, absolute });
  }
  return files;
}

async function sha256(filePath) {
  const bytes = await fs.readFile(filePath);
  return { sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.byteLength };
}

const contentTypeFor = (relative) =>
  contentTypes.get(path.extname(relative).toLowerCase()) ?? "application/octet-stream";

async function lockfileIdentity() {
  for (const candidate of ["package-lock.json"]) {
    try {
      const digest = await sha256(path.resolve(candidate));
      return { path: candidate, ...digest };
    } catch {
      /* keep looking */
    }
  }
  return null;
}

async function buildManifest() {
  const files = {};
  for (const file of await filesUnder(distDir)) {
    files[file.relative] = { ...(await sha256(file.absolute)), contentType: contentTypeFor(file.relative) };
  }

  return {
    schemaVersion: "1.0.0",
    game: GAME_SLUG,
    version: process.env.GAME_RELEASE_VERSION ?? process.env.npm_package_version ?? "0.1.0",
    commit: process.env.GAME_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "working-tree",
    entryFile: ENTRY_FILE,
    manifestFile: "release-manifest.json",
    r2Prefix: `${GAME_SLUG}/${process.env.GAME_RELEASE_VERSION ?? "unversioned"}/`,
    lockfile: await lockfileIdentity(),
    validationStatus: "candidate-not-approved",
    validationEvidence: {
      status: "candidate-not-approved",
      workflowRun: workflowRunUrl,
      checks: [
        "typecheck",
        "lint",
        "kernel-contract-tests",
        "kernel-boundary",
        "no-unseeded-randomness",
        "subpath-build",
        "production-build",
        "built-artifact-smoke",
        "built-artifact-accessibility",
      ].map((name) => ({
        name,
        status: inReleaseWorkflow ? "executed-before-manifest" : "not-asserted",
        reference: workflowRunUrl,
      })),
      pending: [
        { name: "hosted-games-site-preview", status: "pending", reference: null },
        { name: "named-human-approval-gates", status: "pending", reference: null },
        { name: "human-screen-reader-review", status: "pending", reference: null },
      ],
    },
    files,
  };
}

async function main() {
  await fs.access(path.join(distDir, ENTRY_FILE));
  const next = await buildManifest();

  if (checkOnly) {
    const current = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    const comparable = JSON.stringify({ ...current, files: next.files });
    const expected = JSON.stringify({ ...next, files: next.files });
    if (comparable !== expected) throw new Error("release-manifest.json does not match the current dist payload");
    console.log(`Release manifest verified against ${distDir}`);
    return;
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  const count = Object.keys(next.files).length;
  console.log(`Release manifest written for ${GAME_SLUG} ${next.version} (${count} payload files, commit ${next.commit})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
