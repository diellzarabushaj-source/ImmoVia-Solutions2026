import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.join(__dirname, "dist", "index.html");
const BASE = "/studio";

if (!fs.existsSync(INDEX)) {
  console.error("patch-dist: dist/index.html not found — run sanity build first");
  process.exit(1);
}

let html = fs.readFileSync(INDEX, "utf-8");

html = html
  .replace(/<script[^>]*sanity-cdn\.[a-z]+\/bridge\.js[^>]*><\/script>\s*/g, "")
  .replace(/\bhref="\/static\//g, `href="${BASE}/static/`)
  .replace(/\bsrc="\/static\//g, `src="${BASE}/static/`);

fs.writeFileSync(INDEX, html, "utf-8");
console.log("patch-dist: bridge.js removed, base paths fixed →", INDEX);
