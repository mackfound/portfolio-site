// check-content — validates sections.json and the front matter of every
// collection entry (projectplan.md §6, §10). Front matter is read through
// Eleventy itself, so it is parsed exactly as the build parses it.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import Eleventy from "@11ty/eleventy";
import { validateEntry, validateSections } from "./lib/content-schema.js";

const sections = JSON.parse(readFileSync("src/_data/sections.json", "utf8"));
const folders = new Set(readdirSync("src", { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name));

const errors = validateSections(sections, folders);
const collections = [...new Set(sections.filter((s) => s.collection).map((s) => s.collection))];

// Each section folder sets its own layout and permalink in <name>.11tydata.*.
for (const name of collections) {
  if (!["js", "json"].some((ext) => existsSync(`src/${name}/${name}.11tydata.${ext}`))) {
    errors.push(`src/${name}/: missing ${name}.11tydata.js or .json (layout and permalink)`);
  }
}

let items = [];
const eleventy = new Eleventy(undefined, undefined, {
  quietMode: true,
  config(eleventyConfig) {
    eleventyConfig.addCollection("__checkContent", (api) => {
      items = api.getAll();
      return [];
    });
  },
});
await eleventy.toJSON();

let count = 0;
for (const name of collections) {
  for (const item of items.filter((i) => i.inputPath.startsWith(`./src/${name}/`) && i.inputPath.endsWith(".md"))) {
    const { data } = await item.template.getFrontMatterData();
    errors.push(...validateEntry({ path: item.inputPath.slice(2), collection: name, data }));
    count++;
  }
}

if (errors.length) {
  console.error(`check-content: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`check-content: sections.json and ${count} entries valid`);
