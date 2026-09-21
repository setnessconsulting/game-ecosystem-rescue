// serve-dist.mjs — a zero-dependency static server for the subpath build.
//
// The games-site serves the game from an immutable versioned prefix, so the smoke tests must load
// it the same way: this serves dist/ under that prefix and 404s everything else, which is what
// catches an asset reference that assumed the domain root. Usage:
//   node scripts/serve-dist.mjs [port] [prefix]
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.argv[2] ?? 4180);
const prefix = process.argv[3] ?? "/game-assets/ecosystem-rescue/ci";
const root = resolve("dist");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  if (!url.pathname.startsWith(prefix)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end(`not found (serving under ${prefix})`);
    return;
  }

  let rel = url.pathname.slice(prefix.length);
  if (rel === "" || rel === "/") rel = "/index.html";
  const target = join(root, normalize(rel).replace(/^([/\\])+/, ""));

  if (!target.startsWith(root) || !existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
    return;
  }

  res.writeHead(200, {
    "content-type": TYPES[extname(target)] ?? "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
  });
  res.end(readFileSync(target));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving dist/ at http://127.0.0.1:${port}${prefix}/`);
});
