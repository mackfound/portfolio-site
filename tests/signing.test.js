// Signing pipeline (projectplan.md §9, §10): manifest → sign → verify with a
// throwaway ed25519 key made in a temp directory. The real key is never touched.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, build, listFiles, tempDir } from "./helpers.js";

const node = (...args) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
const verifyLocal = (site, signers) => spawnSync("sh", ["scripts/verify-local.sh", site, signers], { cwd: ROOT, encoding: "utf8" });

let keys;  // temp dir holding the throwaway key and its allowed_signers
let site;  // a signed build

function sign(dir, namespace = "mdoyle-site") {
  rmSync(join(dir, "manifest.txt.sig"), { force: true });
  execFileSync("ssh-keygen", ["-Y", "sign", "-f", join(keys, "key"), "-n", namespace, join(dir, "manifest.txt")], { stdio: "pipe" });
}

// A signed copy of the build that a test may tamper with.
function signedCopy() {
  const dir = tempDir();
  cpSync(site, dir, { recursive: true });
  return dir;
}

before(() => {
  assert.ok(spawnSync("ssh-keygen", ["-?"]).error === undefined, "ssh-keygen must be installed (OpenSSH 8.1+)");
  keys = tempDir();
  execFileSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", "test key", "-f", join(keys, "key")]);
  writeFileSync(join(keys, "allowed_signers"),
    `michael namespaces="mdoyle-site" ${readFileSync(join(keys, "key.pub"), "utf8")}`);
  site = tempDir();
  build(site);
  assert.equal(node("scripts/manifest.js", site).status, 0);
  sign(site);
});
after(() => {
  rmSync(keys, { recursive: true, force: true });
  rmSync(site, { recursive: true, force: true });
});

test("manifest follows the v1 format: header, source commit, bytewise-sorted paths", () => {
  const lines = readFileSync(join(site, "manifest.txt"), "utf8").split("\n");
  assert.equal(lines[0], "# mdoyle-site manifest v1");
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(lines[1], `# source ${head}`);
  assert.equal(lines.at(-1), "", "ends with LF");
  const entries = lines.slice(2, -1);
  const paths = entries.map((l) => l.split("  ")[1]);
  for (const l of entries) assert.match(l, /^[0-9a-f]{64} {2}\/\S+$/);
  assert.deepEqual(paths, [...paths].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b))));
  const served = listFiles(site).filter((f) => !f.startsWith("manifest.txt")).map((f) => `/${f}`);
  assert.deepEqual([...paths].sort(), served.sort(), "lists every served file except the manifest itself");
});

test("the same site always yields the same manifest", () => {
  const first = readFileSync(join(site, "manifest.txt"));
  assert.equal(node("scripts/manifest.js", site).status, 0);
  assert.ok(first.equals(readFileSync(join(site, "manifest.txt"))));
});

test("round trip: a signed manifest verifies against allowed_signers", () => {
  const result = verifyLocal(site, join(keys, "allowed_signers"));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr + result.stdout, /Good "mdoyle-site" signature for michael/);
});

test("changing one byte of the manifest breaks verification", () => {
  const dir = signedCopy();
  try {
    const file = join(dir, "manifest.txt");
    const bytes = readFileSync(file);
    bytes[bytes.length - 2] ^= 1;
    writeFileSync(file, bytes);
    assert.notEqual(verifyLocal(dir, join(keys, "allowed_signers")).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("changing one byte of a served file breaks verification", () => {
  const dir = signedCopy();
  try {
    appendFileSync(join(dir, "index.html"), " ");
    const result = verifyLocal(dir, join(keys, "allowed_signers"));
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /index\.html/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a signature made under another namespace does not verify", () => {
  const dir = signedCopy();
  try {
    sign(dir, "git");
    assert.notEqual(verifyLocal(dir, join(keys, "allowed_signers")).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the fingerprint in site.json belongs to the key in allowed_signers", () => {
  const line = readFileSync(join(ROOT, "allowed_signers"), "utf8").split("\n")
    .find((l) => l.trim() && !l.startsWith("#"));
  const { keyFingerprint } = JSON.parse(readFileSync(join(ROOT, "src/_data/site.json"), "utf8"));
  if (!line && !keyFingerprint) return; // before key setup (P5)
  assert.ok(line && keyFingerprint, "set both allowed_signers and site.json keyFingerprint, or neither");
  writeFileSync(join(keys, "repo.pub"), `${line.split(" ").slice(2).join(" ")}\n`);
  const actual = execFileSync("ssh-keygen", ["-lf", join(keys, "repo.pub")], { encoding: "utf8" }).split(" ")[1];
  assert.equal(actual.replace(/^SHA256:/, ""), keyFingerprint.replace(/^SHA256:/, ""));
});

test("verify-live passes against a Pages-like server and catches a changed file", () => {
  const ok = node("scripts/verify-live.js", "--local", site);
  assert.equal(ok.status, 0, ok.stderr);
  const dir = signedCopy();
  try {
    appendFileSync(join(dir, "writing/index.html"), " ");
    const bad = node("scripts/verify-live.js", "--local", dir);
    assert.notEqual(bad.status, 0);
    assert.match(bad.stderr, /\/writing\/index\.html: hash mismatch/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
