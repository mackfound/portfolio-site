// Serve-mode build (copy slots highlighted) into the directory given as the first argument.
// Then: node tools/preview/relink.mjs <dir> <short-sha>, and publish <dir>/index.html as an
// artifact with every other file in `files`. Preview: https://claude.ai/artifact/6sP9zuxfNuWyGU81JHcAwA
import { build, scratchRepo } from "../../tests/helpers.js";
const repo = scratchRepo();
build(process.argv[2], { cwd: repo, runMode: "serve" });
console.log("built from", repo);
