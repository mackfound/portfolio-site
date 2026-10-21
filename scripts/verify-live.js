// verify-live — fetches every manifest path from the live site and compares the
// decoded body's SHA-256 to the manifest (projectplan.md §9, step 8). Also checks
// that the live manifest.txt and manifest.txt.sig match the local ones.
//
//   node scripts/verify-live.js                 against site.url (https://mdoyle.dev)
//   node scripts/verify-live.js --base URL      against another origin
//   node scripts/verify-live.js --local _site   against a local Pages-like server (dry run)
//
// /x/index.html is fetched as /x/ and /index.html as /; redirects are followed.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { startPagesServer } from "./lib/pages-server.js";

const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const localDir = option("--local");
const dir = localDir ?? "_site";

let base = option("--base") ?? JSON.parse(readFileSync("src/_data/site.json", "utf8")).url;
let server;
if (localDir) {
  server = await startPagesServer(localDir);
  base = server.url;
}

const manifest = readFileSync(join(dir, "manifest.txt"), "utf8").split("\n")
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => { const [hash, path] = line.split("  "); return { hash, path }; });

const urlFor = (path) => path.replace(/(^|\/)index\.html$/, "$1");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function fetchBytes(path) {
  const res = await fetch(base + path, { redirect: "follow" });
  return { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) };
}

const problems = [];
async function checkEntry({ hash, path }) {
  try {
    const { status, bytes } = await fetchBytes(urlFor(path));
    // Pages may answer the 404 page itself with status 404; its bytes still count.
    if (status !== 200 && !(path === "/404.html" && status === 404)) problems.push(`${path}: HTTP ${status}`);
    else if (sha256(bytes) !== hash) problems.push(`${path}: hash mismatch`);
  } catch (error) {
    problems.push(`${path}: ${error.message}`);
  }
}

// A few requests at a time.
const queue = [...manifest];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) await checkEntry(queue.shift());
}));

for (const file of ["manifest.txt", "manifest.txt.sig"]) {
  try {
    const { status, bytes } = await fetchBytes(`/${file}`);
    if (status !== 200 || !bytes.equals(readFileSync(join(dir, file)))) problems.push(`/${file}: differs from local copy`);
  } catch (error) {
    problems.push(`/${file}: ${error.message}`);
  }
}

await server?.close();

if (problems.length) {
  console.error(`verify-live: ${problems.length} problem(s) at ${base}`);
  for (const p of problems.sort()) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`verify-live: ${manifest.length} files and the signed manifest match at ${base}`);
