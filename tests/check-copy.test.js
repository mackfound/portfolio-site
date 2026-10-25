// check-copy (projectplan.md §7): deploy refuses while a slot renders, but a
// template fallback that doesn't render (the file or key it stands in for
// exists) doesn't block it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, tempDir } from "./helpers.js";

// A scratch dir holding `files` (path → contents), checked with check-copy.
function checkCopy(files, ...args) {
  const dir = tempDir();
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  const result = spawnSync(process.execPath, [join(ROOT, "scripts/check-copy.js"), ...args], { cwd: dir, encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  return result;
}

const fallback = "{% if assets.pdf %}[PDF](/a.pdf){% else %}TODO-COPY(page-pdf){% endif %}\n";

test("a fallback slot that doesn't render passes --strict", () => {
  const result = checkCopy({ "src/page.md": fallback, "_site/page/index.html": "<a href=\"/a.pdf\">PDF</a>" }, "--strict");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /page-pdf .*\(fallback, not rendered\)/);
  assert.match(result.stdout, /0 slot\(s\) remaining/);
});

test("a slot that renders fails --strict", () => {
  const result = checkCopy({ "src/page.md": fallback, "_site/page/index.html": "<p>TODO-COPY(page-pdf)</p>" }, "--strict");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /1 slot\(s\) remaining/);
});

test("--strict fails with no _site/ to scan", () => {
  const result = checkCopy({ "src/page.md": "Done.\n" }, "--strict");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no _site\/ to scan/);
});

test("without --strict, a rendered slot only warns", () => {
  const result = checkCopy({ "src/page.md": "TODO-COPY(page-body)\n", "_site/index.html": "TODO-COPY(page-body)" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /warning only/);
});

test("a duplicate slot name always fails", () => {
  const result = checkCopy({ "src/a.md": "TODO-COPY(same)\n", "src/b.md": "TODO-COPY(same)\n", "_site/index.html": "" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /used more than once/);
});
