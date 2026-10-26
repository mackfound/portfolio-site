# Builds the site icons from the masthead's "M" in Doyle Serif (wght 500), as outlines on
# a newsprint tile with a press-red full stop:
#   src/assets/icons/favicon.svg         opsz 12: sturdier strokes for 16-32 px tabs
#   scripts/fonts/apple-touch-icon.svg   opsz 60: the masthead's display cut, full bleed
#     (iOS rounds the corners). It is the source for src/assets/icons/apple-touch-icon.png,
#     rasterized at 180 x 180 (e.g. a headless Chrome screenshot of the SVG at that size).
# Same tools as build-fonts.sh: fonttools==4.55.3 and brotli==1.1.0.
#   python3 scripts/fonts/build-favicon.py
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

def icon(opsz, radius, path):
    font = instantiateVariableFont(TTFont("src/assets/fonts/doyle-serif-roman.woff2"), {"wght": 500, "opsz": opsz})
    glyphs = font.getGlyphSet()
    name = font.getBestCmap()[ord("M")]
    bounds = BoundsPen(glyphs); glyphs[name].draw(bounds)
    x0, y0, x1, y1 = bounds.bounds
    # Tile 64 x 64: the M's cap height spans 32 units; the M and its full stop sit centered.
    scale = 32 / (y1 - y0)
    dot_r, gap = 4.5, 2.5
    left = (64 - ((x1 - x0) * scale + gap + 2 * dot_r)) / 2
    baseline = 48
    pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, left - x0 * scale, baseline + y0 * scale)))
    dot_cx = left + (x1 - x0) * scale + gap + dot_r
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        f'<rect width="64" height="64"{f" rx=\"{radius}\"" if radius else ""} fill="#f3f2ee"/>'
        f'<path d="{pen.getCommands()}" fill="#121212"/>'
        f'<circle cx="{dot_cx:.2f}" cy="{baseline - dot_r:.2f}" r="{dot_r}" fill="#c8102e"/>'
        "</svg>\n"
    )
    open(path, "w").write(svg)
    print("wrote", path)

icon(12, 10, "src/assets/icons/favicon.svg")
icon(60, 0, "scripts/fonts/apple-touch-icon.svg")
