// Smoke test for the P0 harness: the site builds and the front page sets `lang`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("build produces a front page with lang set", () => {
  const out = mkdtempSync(join(tmpdir(), "mdoyle-site-"));
  try {
    execSync(`npx @11ty/eleventy --quiet --output="${out}"`, { stdio: "pipe" });
    const html = readFileSync(join(out, "index.html"), "utf8");
    assert.match(html, /<html lang="en">/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
