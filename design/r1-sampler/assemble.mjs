// Assembles the R1 sampler page: inlines the site's fonts into sampler.src.html.
// Output: design/r1-sampler/out/vol-v-directions.html (git-ignored), published with the two
// audio files at https://claude.ai/artifact/Kuz8evYrFzCLi26KVwRJL7.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dirname, fonts = join(here, "../../src/assets/fonts");
const b64 = (f) => readFileSync(join(fonts, f)).toString("base64");
const html = readFileSync(join(here, "sampler.src.html"), "utf8")
  .replace("%%ROMAN%%", b64("doyle-serif-roman.woff2"))
  .replace("%%ITALIC%%", b64("source-serif-4-latin-400-italic.woff2"));
mkdirSync(join(here, "out"), { recursive: true });
writeFileSync(join(here, "out/vol-v-directions.html"), html);
console.log("wrote design/r1-sampler/out/vol-v-directions.html");
