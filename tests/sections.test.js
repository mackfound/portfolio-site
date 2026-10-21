// P1 gate (projectplan.md §11): a new section is one folder plus one
// sections.json line. Also covers draft handling. Runs on a scratch copy.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build, scratchRepo, tempDir } from "./helpers.js";

let repo;
before(() => {
  repo = scratchRepo();
  // The folder: its data file and two entries.
  mkdirSync(join(repo, "src/talks"));
  writeFileSync(join(repo, "src/talks/talks.11tydata.json"), '{ "layout": "base.njk", "permalink": "/talks/{{ page.fileSlug }}/" }\n');
  writeFileSync(join(repo, "src/talks/first-talk.md"), "---\ntitle: Fixture talk one\ndate: 2026-02-01\n---\n# Fixture talk one\n");
  writeFileSync(join(repo, "src/talks/second-talk.md"), "---\ntitle: Fixture talk two\ndate: 2026-03-01\n---\n# Fixture talk two\n");
  // The one config line.
  const path = join(repo, "src/_data/sections.json");
  const lines = readFileSync(path, "utf8").split("\n");
  lines.splice(lines.findIndex((l) => l.includes('"about"')), 0,
    '  { "id": "talks", "label": "Talks", "collection": "talks", "limit": 1, "show": true },');
  writeFileSync(path, lines.join("\n"));
});
after(() => rmSync(repo, { recursive: true, force: true }));

test("a section added by folder + one sections.json line renders end to end", () => {
  const out = tempDir();
  try {
    build(out, { cwd: repo });
    const home = readFileSync(join(out, "index.html"), "utf8");
    assert.match(home, /<section id="talks"/);
    assert.match(home, /Fixture talk two/, "newest entry is on the front page");
    assert.doesNotMatch(home, /Fixture talk one/, "limit: 1 is honored");
    assert.ok(home.indexOf('id="talks"') < home.indexOf('id="about"'), "configured order is honored");
    assert.ok(existsSync(join(out, "talks/first-talk/index.html")), "entry pages are built");
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("check-content accepts the new section", () => {
  execFileSync(process.execPath, ["scripts/check-content.js"], { cwd: repo, stdio: "pipe" });
});

test("serve-mode builds preview drafts and highlight slots; others drop drafts", () => {
  writeFileSync(join(repo, "src/notes/draft-note.md"),
    "---\ntitle: Fixture draft\ndate: 2026-04-01\nsummary: Fixture\ndraft: true\n---\nTODO-COPY(fixture-slot)\n");
  const out = tempDir();
  const preview = tempDir();
  try {
    build(out, { cwd: repo });
    assert.ok(!existsSync(join(out, "notes/draft-note/index.html")), "deployable build drops drafts");
    build(preview, { cwd: repo, runMode: "serve" });
    assert.ok(existsSync(join(preview, "notes/draft-note/index.html")), "serve build previews drafts");
    assert.match(readFileSync(join(preview, "notes/draft-note/index.html"), "utf8"),
      /<mark class="todo-copy">TODO-COPY\(fixture-slot\)<\/mark>/, "serve build highlights slots");
  } finally {
    rmSync(join(repo, "src/notes/draft-note.md"));
    rmSync(out, { recursive: true, force: true });
    rmSync(preview, { recursive: true, force: true });
  }
});
