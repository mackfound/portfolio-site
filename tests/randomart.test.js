// Randomart on /verify/ (projectplan.md §3) must be what `ssh-keygen -lv` draws.
// Checked against a throwaway ed25519 key made in a temp directory; the real
// signing key is never touched (the site only uses its public fingerprint).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { randomart } from "../scripts/lib/randomart.js";
import { ROOT, build, tempDir } from "./helpers.js";

test("randomart matches ssh-keygen -lv for throwaway keys", () => {
  const dir = tempDir();
  try {
    for (let i = 0; i < 5; i++) {
      const key = join(dir, `key${i}`);
      execFileSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", "test key", "-f", key]);
      const [line, ...art] = execFileSync("ssh-keygen", ["-lv", "-f", `${key}.pub`], { encoding: "utf8" }).trim().split("\n");
      const fingerprint = line.split(" ")[1];
      assert.equal(randomart(fingerprint), art.join("\n"));
      assert.equal(randomart(fingerprint.replace(/=+$/, "")), art.join("\n"), "padding is optional");
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("/verify/ shows the randomart of the site's fingerprint, rendered at build time", () => {
  const out = tempDir();
  try {
    build(out);
    const html = readFileSync(join(out, "verify/index.html"), "utf8");
    const { keyFingerprint } = JSON.parse(readFileSync(join(ROOT, "src/_data/site.json"), "utf8"));
    const art = randomart(keyFingerprint).replace(/&/g, "&amp;");
    assert.ok(html.includes(`<pre aria-hidden="true">${art}</pre>`));
    assert.doesNotMatch(html, /<script/i, "no client JS on /verify/");
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
