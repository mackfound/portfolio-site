// check-content rules (projectplan.md §6), tested on fixtures rather than live content.
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEntry, validateLead, validateSections } from "../scripts/lib/content-schema.js";

const research = {
  title: "T", status: "current", order: 1, period: "P", role: "R",
  stack: ["S"], summary: "S", detail: "high-level", pi_signoff: false,
};
const entry = (data, collection = "research") => validateEntry({ path: "x.md", collection, data });

test("high-level research without sign-off is valid", () => {
  assert.deepEqual(entry(research), []);
});

test("deep research without PI sign-off fails", () => {
  assert.match(entry({ ...research, detail: "deep" }).join(), /requires pi_signoff: true/);
});

test("deep research with PI sign-off is valid", () => {
  assert.deepEqual(entry({ ...research, detail: "deep", pi_signoff: true }), []);
});

test("research must state its detail level and sign-off", () => {
  const { detail, pi_signoff, ...bare } = research;
  assert.match(entry(bare).join(), /missing required field "detail"/);
  assert.match(entry(bare).join(), /missing required field "pi_signoff"/);
});

test("project entries reject research-only fields and unknown fields", () => {
  const { detail, pi_signoff, ...project } = research;
  assert.deepEqual(entry(project, "projects"), []);
  assert.match(entry({ ...project, pi_signoff: true }, "projects").join(), /unknown field "pi_signoff"/);
  assert.match(entry({ ...project, sumary: "typo" }, "projects").join(), /unknown field "sumary"/);
});

test("at most one entry, across collections, is the lead", () => {
  const e = (path, lead) => ({ path, data: lead === undefined ? {} : { lead } });
  assert.deepEqual(validateLead([e("a.md", true), e("b.md", false), e("c.md")]), []);
  assert.match(validateLead([e("projects/a.md", true), e("research/b.md", true)]).join(), /only one entry may set lead: true.*projects\/a\.md.*research\/b\.md/);
});

test("writing needs a real date and URL", () => {
  const errors = validateEntry({ path: "w.md", collection: "writing", data: {
    title: "T", outlet: "O", date: "2026-01-13", url: "wsj.com", category: "C", deck: "D",
  } });
  assert.match(errors.join(), /"date" must be date/);
  assert.match(errors.join(), /"url" must be url/);
});

test("sections.json rules", () => {
  const folders = new Set(["projects"]);
  assert.deepEqual(validateSections([
    { id: "projects", label: "Projects", collection: "projects", limit: 3, show: true },
    { id: "about", label: "About", page: "/about/", show: true },
  ], folders), []);
  const bad = validateSections([
    { id: "a", label: "A", collection: "missing", show: true },
    { id: "a", label: "A", page: "/a/", collection: "projects", limit: 1, show: true },
  ], folders).join("\n");
  assert.match(bad, /needs "limit"/);
  assert.match(bad, /no folder src\/missing\//);
  assert.match(bad, /duplicate id/);
  assert.match(bad, /exactly one of "collection" or "page"/);
});
