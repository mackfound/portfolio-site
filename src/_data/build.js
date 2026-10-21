// Source commit for the footer attestation line. Never a timestamp (projectplan.md §10).
import { execSync } from "node:child_process";

export default function () {
  let sha = "";
  try {
    sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {}
  return { sha: sha.slice(0, 7), fullSha: sha };
}
