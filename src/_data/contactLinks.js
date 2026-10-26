// Contact line items from site.json: email first, then profile links. Empty values
// are skipped, so the line renders only what Michael has filled in. The address is
// written as HTML character references (`html: true`): browsers show and follow it
// as normal, but naive scrapers matching "name@domain" in the source don't see one.
// It's done at build time, so the page stays signed and needs no JavaScript.
import { readFileSync } from "node:fs";

const LABELS = { github: "GitHub", linkedin: "LinkedIn" };
const encode = (s) => [...s].map((c) => `&#${c.codePointAt(0)};`).join("");

export default function () {
  const site = JSON.parse(readFileSync("src/_data/site.json", "utf8"));
  const items = [];
  if (site.email) items.push({ href: `mailto:${encode(site.email)}`, label: encode(site.email), html: true });
  for (const [name, href] of Object.entries(site.links ?? {})) {
    if (href) items.push({ href, label: LABELS[name] ?? name[0].toUpperCase() + name.slice(1) });
  }
  return items;
}
