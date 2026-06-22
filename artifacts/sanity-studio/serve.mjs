import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = parseInt(process.env.PORT ?? "20291", 10);
const BASE = "/studio";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

// Patch index.html once at startup:
// 1. Remove bridge.js (CDN script that loads a second React instance in Replit)
// 2. Add /studio prefix to absolute /static/... paths so Replit's path-based
//    proxy correctly routes asset requests to this server (port 20291).
//    Without the prefix, /static/foo.js is routed to the immovia frontend.
const INDEX_PATH = path.join(DIST, "index.html");
let indexHtml = "";
if (fs.existsSync(INDEX_PATH)) {
  indexHtml = fs
    .readFileSync(INDEX_PATH, "utf-8")
    // Remove bridge.js script injected by sanity runtime
    .replace(
      /<script[^>]*sanity-cdn\.[a-z]+\/bridge\.js[^>]*><\/script>\s*/g,
      ""
    )
    // Fix href="/static/... → href="/studio/static/...
    .replace(/\bhref="\/static\//g, `href="${BASE}/static/`)
    // Fix src="/static/... → src="/studio/static/...
    .replace(/\bsrc="\/static\//g, `src="${BASE}/static/`);

  console.log("index.html patched: bridge.js removed, base paths fixed");
} else {
  console.error(
    `ERROR: ${INDEX_PATH} not found. Run 'pnpm --filter @workspace/sanity-studio run build' first.`
  );
}

const server = http.createServer((req, res) => {
  let url = req.url ?? "/";
  const reqUrl = url;

  // Strip base prefix so we can look up files in dist/
  if (url.startsWith(BASE)) {
    url = url.slice(BASE.length) || "/";
  }

  // Remove query strings
  const pathname = url.split("?")[0];
  const filePath = path.join(DIST, pathname);
  console.log(`${req.method} ${reqUrl} → dist${pathname}`);

  const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;

  if (stat && !stat.isDirectory()) {
    // Regular static file
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      // Long-lived cache for hashed assets, no-cache for index.html
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback: serve bridge-stripped, base-fixed index.html
    if (!indexHtml) {
      res.writeHead(503);
      res.end("Studio not built yet — run pnpm run build first.");
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    res.end(indexHtml);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Sanity Studio at http://0.0.0.0:${PORT}${BASE}/`);
});
