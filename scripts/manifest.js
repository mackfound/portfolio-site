// manifest — hashes every served file in the site directory into manifest.txt
// (projectplan.md §9, "Manifest format"). Paths sort bytewise; LF endings; UTF-8.
//
//   node scripts/manifest.js [dir]          write <dir>/manifest.txt (dir defaults to _site)
//   node scripts/manifest.js --check [dir]  recompute and compare to <dir>/manifest.txt
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Not served, or the manifest itself.
const EXCLUDED = new Set(["/manifest.txt", "/manifest.txt.sig", "/_headers", "/_redirects"]);

function entries(dir) {
  return readdirSync(dir, { recursive: true }).map(String)
    .filter((f) => statSync(join(dir, f)).isFile())
    .map((f) => "/" + f.split("\\").join("/"))
    .filter((path) => !EXCLUDED.has(path))
    .sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)))
    .map((path) => `${createHash("sha256").update(readFileSync(join(dir, path))).digest("hex")}  ${path}`);
}

const args = process.argv.slice(2);
const check = args.includes("--check");
const dir = args.find((a) => !a.startsWith("--")) ?? "_site";
const file = join(dir, "manifest.txt");

if (check) {
  const recorded = readFileSync(file, "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
  const actual = entries(dir);
  const differ = [
    ...recorded.filter((l) => !actual.includes(l)).map((l) => `  in manifest, not on disk: ${l}`),
    ...actual.filter((l) => !recorded.includes(l)).map((l) => `  on disk, not in manifest: ${l}`),
  ];
  if (differ.length) {
    console.error(`manifest: ${dir}/ does not match ${file}`);
    for (const d of differ) console.error(d);
    process.exit(1);
  }
  console.log(`manifest: ${actual.length} files match ${file}`);
} else {
  const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const lines = ["# mdoyle-site manifest v1", `# source ${source}`, ...entries(dir)];
  writeFileSync(file, `${lines.join("\n")}\n`);
  console.log(`manifest: ${lines.length - 2} files, source ${source.slice(0, 7)}`);
}
