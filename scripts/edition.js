// edition — bumps No. N when content changes (projectplan.md §3, "Edition numbering").
// Content is every Markdown and JSON file under the collection folders named in
// sections.json, plus sections.json itself. Each file's path and bytes go into
// one SHA-256; if that differs from edition.json's contentHash, the number goes
// up by one and the date becomes today (local time). Prints the result.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const EDITION = "src/_data/edition.json";
const SECTIONS = "src/_data/sections.json";

const sections = JSON.parse(readFileSync(SECTIONS, "utf8"));
const folders = [...new Set(sections.filter((s) => s.collection).map((s) => `src/${s.collection}`))];

const files = [SECTIONS, ...folders.flatMap((dir) =>
  readdirSync(dir, { recursive: true }).map(String)
    .filter((f) => /\.(md|json)$/.test(f))
    .map((f) => join(dir, f)))]
  .sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));

const hash = createHash("sha256");
for (const file of files) {
  hash.update(file).update("\0").update(readFileSync(file)).update("\0");
}
const contentHash = hash.digest("hex");

const edition = JSON.parse(readFileSync(EDITION, "utf8"));
if (edition.contentHash === contentHash) {
  console.log(`edition: unchanged (No. ${edition.number})`);
} else {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const next = {
    number: edition.number + 1,
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  };
  writeFileSync(EDITION, `{ "number": ${next.number}, "date": "${next.date}", "contentHash": "${contentHash}" }\n`);
  console.log(`edition: No. ${next.number} (${next.date})`);
}
