// edition.js (projectplan.md §3): No. N moves only when content changes.
// Runs in a scratch copy of the repo.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { scratchRepo } from "./helpers.js";

let repo;
const run = () => execFileSync(process.execPath, ["scripts/edition.js"], { cwd: repo, encoding: "utf8" });
const edition = () => JSON.parse(readFileSync(join(repo, "src/_data/edition.json"), "utf8"));

before(() => { repo = scratchRepo(); });
after(() => rmSync(repo, { recursive: true, force: true }));

test("edition bumps on content changes only", () => {
  const start = edition().number;

  run();
  const first = edition();
  assert.ok(first.number === start || first.number === start + 1);
  assert.match(first.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(first.contentHash, /^[0-9a-f]{64}$/);

  assert.match(run(), /unchanged/);
  assert.equal(edition().number, first.number, "a rerun with no change keeps the number");

  appendFileSync(join(repo, "src/assets/css/site.css"), "\n/* not content */\n");
  appendFileSync(join(repo, "src/_includes/base.njk"), "\n");
  run();
  assert.equal(edition().number, first.number, "templates and styles are not content");

  appendFileSync(join(repo, "src/writing/no-easy-path-upward.md"), "\n");
  run();
  assert.equal(edition().number, first.number + 1, "a content edit bumps the number");

  appendFileSync(join(repo, "src/_data/sections.json"), "\n");
  run();
  assert.equal(edition().number, first.number + 2, "sections.json counts as content");
});
