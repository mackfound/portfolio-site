// Contact line items from site.json: email first, then profile links. Empty values
// are skipped, so the line renders only what Michael has filled in.
import { readFileSync } from "node:fs";

const LABELS = { github: "GitHub", linkedin: "LinkedIn" };

export default function () {
  const site = JSON.parse(readFileSync("src/_data/site.json", "utf8"));
  const items = [];
  if (site.email) items.push({ href: `mailto:${site.email}`, label: site.email });
  for (const [name, href] of Object.entries(site.links ?? {})) {
    if (href) items.push({ href, label: LABELS[name] ?? name[0].toUpperCase() + name.slice(1) });
  }
  return items;
}
