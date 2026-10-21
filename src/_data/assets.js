// Assets the templates link to only once the file exists, so a missing file
// shows as a copy slot (which blocks deploy) instead of a broken link.
import { existsSync } from "node:fs";

export default function () {
  return {
    resumePdf: existsSync("src/assets/media/michael-doyle-resume.pdf"),
  };
}
