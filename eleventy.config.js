// Eleventy config for M. Doyle, Vol. V. See projectplan.md.

import { readFileSync } from "node:fs";
import rssPlugin from "@11ty/eleventy-plugin-rss";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

// Projects sort by `order`; everything else newest first. Slug breaks ties so
// output never depends on file system order.
function compareEntries(a, b) {
  const ao = a.data.order, bo = b.data.order;
  if (typeof ao === "number" && typeof bo === "number" && ao !== bo) return ao - bo;
  const ad = a.data.date instanceof Date ? a.data.date.getTime() : 0;
  const bd = b.data.date instanceof Date ? b.data.date.getTime() : 0;
  if (ad !== bd) return bd - ad;
  return a.page.fileSlug < b.page.fileSlug ? -1 : a.page.fileSlug > b.page.fileSlug ? 1 : 0;
}

export default function (eleventyConfig) {
  const sections = JSON.parse(readFileSync("src/_data/sections.json", "utf8"));
  const serving = () => process.env.ELEVENTY_RUN_MODE === "serve";

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPlugin(rssPlugin);

  // Every collection named in sections.json is the Markdown in src/<collection>/.
  // Adding a section needs no line here (projectplan.md §6).
  for (const name of new Set(sections.filter((s) => s.collection).map((s) => s.collection))) {
    eleventyConfig.addCollection(name, (api) =>
      api.getFilteredByGlob(`src/${name}/*.md`).sort(compareEntries));
  }

  // `draft: true` is previewed by `npm run serve` and dropped from every other build.
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (data.draft && !serving()) return false;
  });

  // Entries for one sections.json entry: filter, then limit (all when no limit).
  eleventyConfig.addFilter("sectionEntries", (collections, section) => {
    let entries = collections[section.collection] ?? [];
    for (const [key, value] of Object.entries(section.filter ?? {})) {
      entries = entries.filter((entry) => entry.data[key] === value);
    }
    return entries.slice(0, section.limit);
  });

  eleventyConfig.addFilter("pageByUrl", (pages, url) => pages.find((p) => p.url === url));

  // Where a collection section's full list lives: /<collection>/ when that index
  // page exists, at the section's own group when the index holds several sections.
  eleventyConfig.addFilter("sectionIndexUrl", (section, pages) => {
    const url = `/${section.collection}/`;
    if (!section.collection || !pages.some((p) => p.url === url)) return null;
    return section.id === section.collection ? url : `${url}#${section.id}`;
  });

  // Dates are formatted by hand in UTC so output never depends on the build machine.
  // Accepts a Date (front matter) or a "YYYY-MM-DD" string (edition.json).
  const utc = (date) => (date instanceof Date ? date : new Date(`${date}T00:00:00Z`));
  eleventyConfig.addFilter("isoDate", (date) => utc(date).toISOString().slice(0, 10));
  eleventyConfig.addFilter("displayDate", (date) => {
    const d = utc(date);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  });

  // Feed <updated>: the newest entry, else the edition date, else the epoch.
  // Never the build time, which the RSS plugin's own helper falls back to.
  eleventyConfig.addFilter("feedUpdated", (entries, editionDate) => {
    const newest = Math.max(...entries.map((e) => e.data.date.getTime()));
    const date = entries.length ? new Date(newest) : editionDate ? utc(editionDate) : new Date(0);
    return date.toISOString().replace(".000Z", "Z");
  });

  // Local preview highlights remaining copy slots in the body (projectplan.md §7).
  // Run mode is only known once the build starts, so check it per page.
  eleventyConfig.addTransform("highlight-todo-copy", function (content) {
    if (!serving() || !(this.page.outputPath || "").endsWith(".html")) return content;
    const body = content.indexOf("<body");
    if (body === -1) return content;
    const marked = content.slice(body).split(/(<[^>]*>)/).map((part) =>
      part.startsWith("<") ? part
        : part.replace(/TODO-COPY\([^)]*\)/g, (slot) => `<mark class="todo-copy">${slot}</mark>`));
    return content.slice(0, body) + marked.join("");
  });
}

export const config = {
  dir: {
    input: "src",
    output: "_site",
    includes: "_includes",
    data: "_data",
  },
  templateFormats: ["njk", "md"],
  markdownTemplateEngine: "njk",
  htmlTemplateEngine: "njk",
};
