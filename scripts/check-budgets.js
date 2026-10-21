// check-budgets — page-weight budgets and the always-flag list (projectplan.md §8).
// Budgets are review triggers: a failure means "stop and ask Michael", never
// "shrink the feature". Approved overrides live in budget-exceptions.json.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { brotliCompressSync } from "node:zlib";

const KB = 1024;
const BUDGETS = { js: 10 * KB, fonts: 120 * KB, css: 20 * KB, html: 50 * KB };
const SITE_WIDE = new Set(["fonts", "css"]);
const WARN_AT = 0.9;

// Exceptions: { path, budget, limit: "15 KB", reason, approved: "YYYY-MM-DD" }.
// Site-wide budgets (fonts, css) use path "*".
const exceptions = JSON.parse(readFileSync("budget-exceptions.json", "utf8"));
const problems = [];
const warnings = [];
for (const [i, e] of exceptions.entries()) {
  const ok = e && BUDGETS[e.budget] !== undefined && typeof e.path === "string"
    && /^\d+(\.\d+)?\s*KB$/.test(e.limit ?? "") && typeof e.reason === "string" && e.reason
    && /^\d{4}-\d{2}-\d{2}$/.test(e.approved ?? "");
  if (!ok) problems.push(`budget-exceptions.json[${i}] is malformed`);
}
function limitFor(budget, path) {
  const e = exceptions.find((x) => x.budget === budget && x.path === path);
  return e ? parseFloat(e.limit) * KB : BUDGETS[budget];
}
const fmt = (bytes) => `${(bytes / KB).toFixed(1)} KB`;
function measure(budget, path, bytes) {
  const limit = limitFor(budget, path);
  const line = `${budget} ${path}: ${fmt(bytes)} of ${fmt(limit)}`;
  if (bytes > limit) problems.push(`over budget — ${line}`);
  else if (bytes >= limit * WARN_AT) warnings.push(`approaching — ${line}`);
  return line;
}
const br = (data) => brotliCompressSync(data).length;

const out = mkdtempSync(join(tmpdir(), "mdoyle-budgets-"));
try {
  execFileSync("npx", ["@11ty/eleventy", "--quiet", `--output=${out}`], { stdio: "pipe" });
  const files = readdirSync(out, { recursive: true }).map(String)
    .filter((f) => statSync(join(out, f)).isFile()).sort();
  const lines = [];

  lines.push(measure("fonts", "*", files.filter((f) => f.endsWith(".woff2"))
    .reduce((sum, f) => sum + statSync(join(out, f)).size, 0)));
  lines.push(measure("css", "*", files.filter((f) => f.endsWith(".css"))
    .reduce((sum, f) => sum + br(readFileSync(join(out, f))), 0)));

  for (const f of files.filter((f) => f.endsWith(".html"))) {
    const html = readFileSync(join(out, f), "utf8");
    const path = "/" + f.replace(/(^|\/)index\.html$/, "$1");
    measure("html", path, br(html));

    // JavaScript: none by default. Any script is a review flag unless approved.
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    let jsBytes = 0;
    for (const [, attrs, body] of scripts) {
      const src = attrs.match(/\ssrc="([^"]*)"/)?.[1];
      if (src && /^(https?:)?\/\//i.test(src)) problems.push(`flag — third-party script on ${path}: ${src}`);
      else if (src) jsBytes += br(readFileSync(join(out, src.replace(/^\//, ""))));
      else jsBytes += br(body);
      const code = src && !/^(https?:)?\/\//i.test(src) ? readFileSync(join(out, src.replace(/^\//, "")), "utf8") : body;
      if (/["']scroll["']|onscroll|IntersectionObserver/.test(code)) problems.push(`flag — scroll-driven script on ${path}`);
      if (!/\s(defer|async)\b|type="module"/.test(attrs)) problems.push(`flag — render-blocking script on ${path}`);
    }
    if (scripts.length) {
      const line = measure("js", path, jsBytes);
      if (!exceptions.some((e) => e.budget === "js" && e.path === path)) {
        problems.push(`flag — page ships JavaScript without an approved exception: ${line}`);
      }
    }
    if (/\son[a-z]+="/i.test(html)) problems.push(`flag — inline event handler on ${path}`);
    for (const [tag] of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)) {
      if (/href="(https?:)?\/\//i.test(tag)) problems.push(`flag — third-party stylesheet on ${path}: ${tag}`);
    }
  }

  for (const l of lines) console.log(`  ${l}`);
  for (const w of warnings) console.warn(`  ${w}`);
  if (problems.length) {
    console.error("check-budgets: review needed (projectplan.md §8)");
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-budgets: within budget, no flags${warnings.length ? ` (${warnings.length} approaching)` : ""}`);
} finally {
  rmSync(out, { recursive: true, force: true });
}
