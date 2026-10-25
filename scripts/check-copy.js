// check-copy — lists every remaining TODO-COPY slot (projectplan.md §7). A slot
// remains if it renders in _site/. Slots in src/ that don't render (template
// fallbacks for a missing file or key) are listed but don't count. Warns by
// default; `--strict` (used by deploy.sh) fails if any slot remains or there is
// no _site/ to scan. Duplicate slot names in src/ always fail.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const strict = process.argv.includes("--strict");
const SLOT = /TODO-COPY\(([^)]*)\)/g;
const TEXT = /\.(md|njk|html|json|js|xml|txt|css)$/;

function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (TEXT.test(entry.name)) yield path;
  }
}

// Slot name → list of "file:line" in src/. Names built from template variables
// (containing "{{") are counted in _site/ only.
const inSrc = new Map();
for (const path of files("src")) {
  readFileSync(path, "utf8").split("\n").forEach((line, i) => {
    for (const [, name] of line.matchAll(SLOT)) {
      if (name.includes("{{")) continue;
      if (!inSrc.has(name)) inSrc.set(name, []);
      inSrc.get(name).push(`${path}:${i + 1}`);
    }
  });
}

const inSite = new Set();
if (existsSync("_site")) {
  for (const path of files("_site")) {
    for (const [, name] of readFileSync(path, "utf8").matchAll(SLOT)) inSite.add(name);
  }
}

const built = existsSync("_site");
const duplicates = [...inSrc].filter(([, where]) => where.length > 1);
// Without a build, every slot in src/ might render, so all of them count.
const remaining = [...new Set([...(built ? [] : inSrc.keys()), ...inSite])].sort();
const fallbacks = built ? [...inSrc.keys()].filter((name) => !inSite.has(name)).sort() : [];

for (const name of remaining) {
  const where = inSrc.get(name)?.[0] ?? "(rendered in _site/)";
  console.log(`  ${name}  ${where}`);
}
for (const name of fallbacks) {
  console.log(`  ${name}  ${inSrc.get(name)[0]}  (fallback, not rendered)`);
}
for (const [name, where] of duplicates) {
  console.error(`check-copy: slot "${name}" is used more than once: ${where.join(", ")}`);
}

const verdict = `check-copy: ${remaining.length} slot(s) remaining${built ? "" : " (no _site/ to scan)"}`;
if (duplicates.length || (strict && (remaining.length || !built))) {
  console.error(verdict);
  process.exit(1);
}
console.log(remaining.length ? `${verdict} — warning only; deploy will refuse` : verdict);
