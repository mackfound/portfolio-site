// The public allowed_signers line shown on /verify/: the first non-comment line of
// the repo's allowed_signers file, or "" until Michael adds the key (P5).
import { readFileSync } from "node:fs";

export default function () {
  const line = readFileSync("allowed_signers", "utf8").split("\n")
    .map((l) => l.trim()).find((l) => l && !l.startsWith("#"));
  return { allowedSigners: line ?? "" };
}
