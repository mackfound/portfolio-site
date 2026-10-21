// Shared helpers: build the site (or a scratch copy of the repo) into a temp dir.
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

export const ROOT = resolve(import.meta.dirname, "..");
const ELEVENTY = join(ROOT, "node_modules", ".bin", "eleventy");

export function tempDir() {
  return mkdtempSync(join(tmpdir(), "mdoyle-site-"));
}

// Builds `cwd` (the repo by default) into `output`. `runMode: "serve"` builds
// exactly as `npm run serve` would, without starting the server. Eleventy's API
// ignores an output path when the config sets one, so that mode builds into
// cwd's own _site/ (use it on a scratch repo) and copies it out.
export function build(output, { cwd = ROOT, runMode = "build" } = {}) {
  if (runMode === "build") {
    execFileSync(ELEVENTY, ["--quiet", `--output=${output}`], { cwd, stdio: "pipe" });
    return;
  }
  const script = "import Eleventy from '@11ty/eleventy';"
    + "await new Eleventy(undefined, undefined, { quietMode: true, runMode: process.argv[1] }).write();";
  execFileSync(process.execPath, ["--input-type=module", "-e", script, runMode], { cwd, stdio: "pipe" });
  cpSync(join(cwd, "_site"), output, { recursive: true });
  rmSync(join(cwd, "_site"), { recursive: true, force: true });
}

// A throwaway copy of the repo that tests may edit; node_modules is linked, not copied.
export function scratchRepo() {
  const dir = tempDir();
  const skip = new Set(["node_modules", ".git", "_site", ".determinism"]);
  cpSync(ROOT, dir, { recursive: true, filter: (src) => !skip.has(relative(ROOT, src).split("/")[0]) });
  symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"));
  return dir;
}

// Every file under `dir`, as paths relative to it.
export function listFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)))
    .sort();
}
