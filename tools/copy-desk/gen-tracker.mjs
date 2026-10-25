// Builds the P6 Copy Desk page from the repo: baseline slots at BASE, remaining at HEAD.
// Run from anywhere: node tools/copy-desk/gen-tracker.mjs. Writes tools/copy-desk/copy-desk.html
// (git-ignored), which is published to https://claude.ai/artifact/WHLBgTAuCHPRjbUiCvAUyv.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO = resolve(import.meta.dirname, "../..");
const BASE = "58ba72e";
const GUARDS = new Set(["verify-fingerprint", "verify-allowed-signers"]); // fallbacks, not copy
const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8" });

const PAGES = {
  "src/index.njk": "Front page", "src/_includes/masthead.njk": "Front page",
  "src/about/index.md": "About", "src/resume/index.md": "Resume", "src/verify/index.md": "Verify",
  "src/404.njk": "404", "src/projects/index.njk": "Projects index", "src/research/index.njk": "Research index", "src/writing/index.njk": "Writing index",
  "README.md": "README (GitHub only)",
};
const pageFor = (f) => PAGES[f] ?? (f.startsWith("src/projects/") ? `Project: ${f.slice(13, -3)}`
  : f.startsWith("src/research/") ? `Research: ${f.slice(13, -3)}`
  : f.startsWith("src/writing/") ? `Writing: ${f.slice(12, -3)}` : f);
const URLS = { "src/index.njk": "/", "src/_includes/masthead.njk": "/", "src/about/index.md": "/about/",
  "src/resume/index.md": "/resume/", "src/verify/index.md": "/verify/", "src/404.njk": "/404",
  "src/projects/index.njk": "/projects/", "src/research/index.njk": "/research/", "src/writing/index.njk": "/writing/" };
const urlFor = (f) => URLS[f] ?? (f.startsWith("src/projects/") ? `/projects/${f.slice(13, -3)}/`
  : f.startsWith("src/research/") ? `/research/${f.slice(13, -3)}/`
  : f.startsWith("src/writing/") ? "/ and /writing/" : "");

function kindFor(name, field) {
  if (name.startsWith("meta-")) return "Meta description";
  if (name === "resume-pdf") return "File";
  if (name.startsWith("readme-")) return "README";
  if (name.startsWith("resume-")) return "Resume";
  if (field === "deck") return "Deck";
  if (field === "title") return "Title";
  if (field === "summary") return "Summary";
  if (field === "category") return "Category";
  if (["period", "role", "stack"].includes(field)) return "Fact";
  if (field === "blurb") return "Blurb";
  if (/^(home-positioning|home-standing)$/.test(name)) return "Front page line";
  if (name === "about-bio") return "Bio";
  if (name === "verify-explainer") return "Explainer";
  return "Project body";
}
const HINTS = {
  "Meta description": "About 150 characters. Shown in search results and link previews.",
  "File": "Commit the PDF at src/assets/media/michael-doyle-resume.pdf; the link appears on its own.",
  "README": "Shown on GitHub only; does not block deploy.",
  "Resume": "Sections get restructured to match your resume once you upload it.",
  "Deck": "Carry over verbatim from the v4 site.",
  "Title": "The project's name as it appears everywhere.",
  "Summary": "One or two sentences. Front page, projects index, and the fallback meta description.",
  "Category": "One word, e.g. World. Shown after the date.",
  "Fact": "Short fact in the project's Role / Period / Stack box.",
  "Blurb": "Short About text on the front page, above the contact line.",
  "Front page line": "On the first phone screen: the ten-second test.",
  "Bio": "The full About page.",
  "Explainer": "What verification proves and why it's here, above the commands.",
  "Project body": "One section of Problem · What I built · Stack · Result · Links.",
};

function slotsAt(rev) {
  let out;
  try { out = git("grep", "-n", "-E", "TODO-COPY\\([^){]*\\)", rev, "--", "src", "README.md"); } catch { return []; }
  const slots = [];
  for (const line of out.split("\n").filter(Boolean)) {
    const m = line.slice(rev.length + 1).match(/^([^:]+):(\d+):(.*)$/);
    const [, file, ln, text] = m;
    for (const [, name] of text.matchAll(/TODO-COPY\(([^){]*)\)/g)) {
      if (GUARDS.has(name)) continue;
      const field = text.match(/^\s*([a-z_]+):/)?.[1];
      slots.push({ name, file, line: Number(ln), field });
    }
  }
  return slots;
}

const atHead = slotsAt("HEAD");
const remaining = new Set(atHead.map((s) => s.name));
// Baseline slots, located where they live now when they've moved; plus slots added since.
const where = new Map(atHead.map((s) => [s.name, s]));
const baseNames = new Set(slotsAt(BASE).map((s) => s.name));
const base = [...slotsAt(BASE).map((s) => ({ ...(where.get(s.name) ?? s), rev: where.has(s.name) ? "HEAD" : BASE })),
  ...atHead.filter((s) => !baseNames.has(s.name)).map((s) => ({ ...s, rev: "HEAD" }))];
// File-backed slots stay in the template as a fallback; they're done once the file exists.
const FILES = { "resume-pdf": "src/assets/media/michael-doyle-resume.pdf",
  "radiohound-paper-pdf": "src/assets/media/pythonic-hdl-workflows-paper.pdf" };
for (const [name, path] of Object.entries(FILES)) {
  try { git("cat-file", "-e", `HEAD:${path}`); remaining.delete(name); } catch {}
}
const head = git("rev-parse", "--short", "HEAD").trim();
// Groups in the order a reader meets the site; README last.
const ORDER = ["Front page", "Research index", "Research: remote-attestation", "Research: radiohound",
  "Projects index", "Project: passagework", "Writing index"];
const rank = (page) => {
  const i = ORDER.indexOf(page);
  if (i !== -1) return i;
  if (page.startsWith("Project: ")) return 5;
  if (page.startsWith("Writing: ")) return 7;
  return { "About": 8, "Resume": 9, "Verify": 10, "404": 11 }[page] ?? 12;
};
const slots = base.map((s) => {
  // Section heading above a body slot, for context.
  let context = s.field ? `${s.field}:` : "";
  if (!s.field) {
    const lines = git("show", `${s.rev}:${s.file}`).split("\n").slice(0, s.line - 1).reverse();
    context = lines.find((l) => /^#{1,3} /.test(l))?.replace(/^#+ /, "") ?? "";
  }
  const kind = kindFor(s.name, s.field);
  const { rev, ...rest } = s;
  return { ...rest, kind, hint: HINTS[kind], context, page: pageFor(s.file), url: urlFor(s.file),
    blocks: s.file !== "README.md", done: !remaining.has(s.name) };
}).sort((a, b) => rank(a.page) - rank(b.page) || a.page.localeCompare(b.page) || a.line - b.line);

const font = readFileSync(`${REPO}/src/assets/fonts/doyle-serif-roman.woff2`).toString("base64");
const data = JSON.stringify({ slots, base: BASE, head, generated: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC" }).replace(/</g, "\\u003c");
const shell = readFileSync(new URL("tracker-shell.html", import.meta.url), "utf8");
writeFileSync(new URL("copy-desk.html", import.meta.url), shell.replace("/*FONT*/", font).replace("/*DATA*/null", data));
console.log(`${slots.length} slots, ${slots.filter((s) => s.done).length} done, head ${head}`);
