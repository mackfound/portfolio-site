// Rewrites root-absolute links in a built copy of the site to relative ones,
// so it works as a multi-file artifact. Scratch copy only.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, posix } from "node:path";
const [root, sha] = process.argv.slice(2);
const walk = (d) => readdirSync(d).flatMap((f) => statSync(join(d, f)).isDirectory() ? walk(join(d, f)).map((x) => `${f}/${x}`) : [f]);
const files = walk(root);
const missing = new Set();
const rel = (fromFile, url) => {
  const [path, hash = ""] = url.split(/(?=#)/);
  let target = path.slice(1);
  if (target === "" || target.endsWith("/")) target += "index.html";
  if (!existsSync(join(root, target))) missing.add(`${url} (from ${fromFile})`);
  const r = posix.relative(posix.dirname(fromFile), target) || posix.basename(target);
  return r + hash;
};
const banner = `<div style="font:12px/1.4 system-ui,sans-serif;background:var(--ink);color:var(--paper);padding:6px 1rem;margin:0 calc(-1 * var(--gutter));">Preview, not deployed · build ${sha} · <mark class="todo-copy">yellow</mark> = copy still missing</div>`;
for (const f of files) {
  if (f.endsWith(".html")) {
    let s = readFileSync(join(root, f), "utf8");
    s = s.replace(/\b(href|src|data-[a-z0-9-]+)="(\/(?!\/)[^"]*)"/g, (_, a, u) => `${a}="${rel(f, u)}"`);
    s = s.replace(/(<body[^>]*>)/, `$1${banner}`);
    writeFileSync(join(root, f), s);
  } else if (f.endsWith(".css")) {
    let s = readFileSync(join(root, f), "utf8");
    s = s.replace(/url\("(\/[^"]+)"\)/g, (_, u) => `url("${rel(f, u)}")`);
    writeFileSync(join(root, f), s);
  }
}
console.log(missing.size ? "unresolved:\n" + [...missing].join("\n") : "all internal links resolve");
