#!/bin/sh
# Rebuilds src/assets/fonts/ from Fontsource's Latin subsets of Source Serif 4
# (projectplan.md §3; option B approved at the P2 font-budget stop).
#   roman:  variable, wght cut to 400–500, full opsz (8–60), renamed per the OFL
#           Reserved Font Name clause because instancing modifies the font
#   italic: Fontsource's static 400 italic, unmodified
# Dev-only tooling, not a site dependency: needs npm and Python with
# fonttools==4.55.3 and brotli==1.1.0 (e.g. in a throwaway venv on PATH).
set -eu

root="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
out="$root/src/assets/fonts"

cd "$work"
npm pack --silent @fontsource-variable/source-serif-4@5.3.1 @fontsource/source-serif-4@5.3.1 >/dev/null
mkdir var static
tar xzf fontsource-variable-source-serif-4-5.3.1.tgz -C var
tar xzf fontsource-source-serif-4-5.3.1.tgz -C static

fonttools varLib.instancer var/package/files/source-serif-4-latin-opsz-normal.woff2 \
  wght=400:500 -o roman.ttf -q

python3 - "$work/roman.ttf" "$out/doyle-serif-roman.woff2" <<'PY'
import sys
from fontTools.ttLib import TTFont
font = TTFont(sys.argv[1], recalcTimestamp=False)
font["head"].modified = font["head"].created  # no build time in the file
names = font["name"]
for record in names.names:
    if record.nameID in (1, 3, 4, 6, 16, 25):
        old = record.toUnicode()
        record.string = old.replace("Source Serif 4", "Doyle Serif").replace("SourceSerif4", "DoyleSerif")
names.setName("Doyle Serif is a modified version of Source Serif 4 (Adobe), "
              "instanced to wght 400-500 and subset to Latin.", 10, 3, 1, 0x409)
font.flavor = "woff2"
font.save(sys.argv[2])
PY

cp static/package/files/source-serif-4-latin-400-italic.woff2 "$out/source-serif-4-latin-400-italic.woff2"
# OFL text with the copyright line taken from the font itself (Fontsource's
# LICENSE file names its packager, not Adobe).
python3 - static/package/files/source-serif-4-latin-400-italic.woff2 static/package/LICENSE "$out/OFL.txt" <<'PY'
import sys
from fontTools.ttLib import TTFont
copyright = TTFont(sys.argv[1])["name"].getDebugName(0)
body = open(sys.argv[2]).read().split("\n\n", 1)[1]
open(sys.argv[3], "w").write(copyright + "\n\n" + body)
PY
ls -l "$out"
