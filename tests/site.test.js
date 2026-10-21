// Checks on the built site (projectplan.md §10): internal links, no third-party
// origins, and basic accessibility.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { build, listFiles, tempDir } from "./helpers.js";

let out;
let pages; // [{ path, html }]

before(() => {
  out = tempDir();
  build(out);
  pages = listFiles(out).filter((f) => f.endsWith(".html"))
    .map((path) => ({ path, html: readFileSync(join(out, path), "utf8") }));
});
after(() => rmSync(out, { recursive: true, force: true }));

const attrs = (html, name) => [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map((m) => m[1]);

test("every internal href and src resolves to a file in _site/", () => {
  const broken = [];
  for (const { path, html } of pages) {
    for (const ref of [...attrs(html, "href"), ...attrs(html, "src")]) {
      if (/^([a-z]+:|\/\/|#)/i.test(ref)) continue; // external, mailto:, or in-page
      const target = ref.split(/[?#]/)[0];
      const file = target.endsWith("/") ? `${target}index.html` : target;
      const resolved = file.startsWith("/") ? join(out, file) : join(out, path, "..", file);
      if (!existsSync(resolved)) broken.push(`${path}: ${ref}`);
    }
  }
  assert.deepEqual(broken, []);
});

test("no scripts, styles, fonts, or images from third-party origins", () => {
  const external = /^(https?:)?\/\//i;
  const offending = [];
  for (const { path, html } of pages) {
    for (const [tag] of html.matchAll(/<(script|img|source|iframe|link)\b[^>]*>/gi)) {
      const isLink = /^<link/i.test(tag);
      if (isLink && !/rel="(stylesheet|preload|modulepreload|icon|manifest)"/i.test(tag)) continue;
      const refs = [...attrs(tag, "src"), ...attrs(tag, "href"), ...attrs(tag, "srcset")];
      if (refs.some((r) => external.test(r.trim()))) offending.push(`${path}: ${tag}`);
    }
  }
  for (const path of listFiles(out).filter((f) => f.endsWith(".css"))) {
    for (const [, url] of readFileSync(join(out, path), "utf8").matchAll(/(?:url\(|@import\s+)["']?([^"')\s]+)/g)) {
      if (external.test(url)) offending.push(`${path}: ${url}`);
    }
  }
  assert.deepEqual(offending, []);
});

test("every page sets lang and has exactly one h1", () => {
  for (const { path, html } of pages) {
    assert.match(html, /<html lang="[a-z]{2}/, `${path}: missing lang`);
    assert.equal(html.match(/<h1[\s>]/g)?.length ?? 0, 1, `${path}: needs exactly one h1`);
  }
});

test("every img has an alt attribute", () => {
  for (const { path, html } of pages) {
    for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(tag, /\salt="/, `${path}: ${tag}`);
    }
  }
});

test.todo("contrast tokens meet WCAG AA (P2, once color tokens exist)");
test.todo("manifest round-trip with a throwaway key (P4)");
