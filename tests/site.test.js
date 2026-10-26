// Checks on the built site (projectplan.md §10): internal links, no third-party
// origins, and basic accessibility.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ROOT, build, listFiles, tempDir } from "./helpers.js";

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

test("every launch page is built (projectplan.md §13)", () => {
  const entries = (dir) => readdirSync(join(ROOT, "src", dir))
    .filter((f) => f.endsWith(".md")).map((f) => `${dir}/${f.slice(0, -3)}/index.html`);
  const expected = ["index.html", "research/index.html", ...entries("research"),
    "projects/index.html", ...entries("projects"), "writing/index.html",
    "about/index.html", "resume/index.html", "verify/index.html", "404.html", "notes/feed.xml"];
  assert.deepEqual(expected.filter((f) => !existsSync(join(out, f))), []);
});

test("research and projects are separate pages, each listing only its own entries", () => {
  const html = (p) => pages.find((page) => page.path === p).html;
  const links = (p, dir) => new Set([...html(p).matchAll(new RegExp(`href="/${dir}/([a-z0-9-]+)/"`, "g"))].map((m) => m[1]));
  for (const [own, other] of [["research", "projects"], ["projects", "research"]]) {
    const listed = links(`${own}/index.html`, own);
    const expected = readdirSync(join(ROOT, "src", own)).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
    assert.deepEqual([...listed].sort(), expected.sort(), `/${own}/ lists every ${own} entry`);
    assert.equal(links(`${own}/index.html`, other).size, 0, `/${own}/ lists no ${other} entries`);
  }
  assert.match(html("index.html"), /<nav class="index-strip"[^>]*>\s*<a href="\/projects\/">Projects<\/a> · <a href="\/research\/">Research<\/a>/);
});

test("the notes feed is dated from content or the edition, never the build time", () => {
  const feed = readFileSync(join(out, "notes/feed.xml"), "utf8");
  const edition = JSON.parse(readFileSync(join(ROOT, "src/_data/edition.json"), "utf8"));
  assert.match(feed, /^<\?xml version="1.0" encoding="utf-8"\?>\n<feed xmlns="http:\/\/www.w3.org\/2005\/Atom">/);
  const updated = feed.match(/<updated>([^<]+)<\/updated>/)[1];
  assert.equal(updated, edition.date ? `${edition.date}T00:00:00Z` : "1970-01-01T00:00:00Z");
});

test("nothing links the notes feed while the notes section is hidden", () => {
  const sections = JSON.parse(readFileSync(join(ROOT, "src/_data/sections.json"), "utf8"));
  if (sections.find((s) => s.id === "notes")?.show) return;
  for (const { path, html } of pages) assert.doesNotMatch(html, /notes\/feed\.xml/, path);
});

test("every page has a meta and Open Graph description", () => {
  for (const { path, html } of pages) {
    for (const attr of ['name="description"', 'property="og:description"']) {
      assert.match(html, new RegExp(`<meta ${attr} content="[^"]+">`), `${path}: empty ${attr}`);
    }
  }
});

test("every img has an alt attribute", () => {
  for (const { path, html } of pages) {
    for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(tag, /\salt="/, `${path}: ${tag}`);
    }
  }
});

// Color tokens from site.css: light on :root, dark in the prefers-color-scheme block.
function tokens(css, block) {
  return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("text and link tokens meet WCAG AA (4.5:1) on paper in both themes", () => {
  const css = readFileSync(join(out, "assets/css/site.css"), "utf8");
  const light = tokens(css, css.match(/:root\s*\{[^}]*\}/)[0]);
  const dark = { ...light, ...tokens(css, css.match(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{[^}]*\}/)[0]) };
  for (const [theme, t] of [["light", light], ["dark", dark]]) {
    for (const fg of ["ink", "ink-muted", "accent"]) {
      const ratio = contrast(t[fg], t.paper);
      assert.ok(ratio >= 4.5, `${theme}: --${fg} on --paper is ${ratio.toFixed(2)}:1`);
    }
  }
});

// Motion and JS (projectplan.md §2): only the front page (dateline tick) and the
// Passagework page (working figure) ship scripts, and both work without them.
test("only the front page and the Passagework page ship scripts", () => {
  const withScripts = pages.filter(({ html }) => /<script\b/i.test(html)).map(({ path }) => path).sort();
  assert.deepEqual(withScripts, ["index.html", "projects/passagework/index.html"]);
});

test("the dateline holds its final values in the HTML, and the tick respects reduced motion", () => {
  const home = pages.find((p) => p.path === "index.html").html;
  const edition = JSON.parse(readFileSync(join(ROOT, "src/_data/edition.json"), "utf8"));
  assert.match(home, new RegExp(`No\\. <span data-tick>${edition.number}</span>`));
  if (edition.contentHash) assert.ok(home.includes(`<span data-tick>${edition.contentHash.slice(0, 16)}</span>`));
  assert.match(home, /<script type="module">\s*if \(!matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\)/);
  const css = readFileSync(join(out, "assets/css/site.css"), "utf8");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{ transition: none !important; animation: none !important; \}/);
});

test("the Passagework figure works without JS: static waveform, controls hidden, audio not preloaded", () => {
  const html = pages.find((p) => p.path === "projects/passagework/index.html").html;
  assert.match(html, /<div class="fig__stage"><svg class="fig__wave"[^>]*><path d="M0 /);
  assert.match(html, /<div class="fig__bar" hidden>/);
  assert.doesNotMatch(html, /<audio\b|<source\b/, "audio loads only on Play");
  assert.match(html, /<script type="module" src="\/assets\/js\/passagework-figure\.js"><\/script>/);
});

// Clicking through (projectplan.md §3): every entry page leads to the next, and
// the chain visits every project and research entry before wrapping around.
test("entry pages chain through every entry with a Next link", () => {
  const entries = pages.map((p) => p.path).filter((p) => /^(projects|research)\/[^/]+\/index\.html$/.test(p)).sort();
  const next = (path) => pages.find((p) => p.path === path).html
    .match(/<nav class="continue"[^>]*>[\s\S]*?<a href="\/([^"]+)\/"/)?.[1] + "/index.html";
  const seen = new Set();
  let at = "projects/passagework/index.html";
  while (!seen.has(at)) { seen.add(at); at = next(at); assert.ok(entries.includes(at), `Next from a page leads to ${at}`); }
  assert.deepEqual([...seen].sort(), entries);
});

test("page transitions are CSS only and off under reduced motion", () => {
  const css = readFileSync(join(out, "assets/css/site.css"), "utf8");
  assert.match(css, /@view-transition \{ navigation: auto; \}/);
  const reduce = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reduce, /::view-transition-group\(\*\), ::view-transition-old\(\*\), ::view-transition-new\(\*\) \{ animation: none !important; \}/);
});

test("the front page's lead figure is a static picture linking to its entry", () => {
  const home = pages.find((p) => p.path === "index.html").html;
  assert.match(home, /<a class="lead__fig" href="\/projects\/passagework\/" tabindex="-1" aria-hidden="true"><svg class="fig__wave"/);
  assert.doesNotMatch(pages.find((p) => p.path === "projects/index.html").html, /lead__fig/, "front page only");
});
