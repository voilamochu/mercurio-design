#!/usr/bin/env python3
"""Export per-glyph advance metrics from the embedded WOFF2 fonts.

The card generators need real glyph advance widths to wrap and auto-fit text
inside fixed-size boxes. Browsers render the embedded WOFF2 fonts; to match
that rendering exactly, metrics are extracted from the same source/fonts/*.woff2
files.

Run (dev machine only, needs `pip install fonttools brotli`):

    python3 compiler/export-font-metrics.py

Writes generated/models/font-metrics.json consumed by the Node generators.
Regenerate when source/fonts/*.woff2 change; commit the updated JSON.
"""

import json
import os
import sys

from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "source", "fonts")
OUT = os.path.join(ROOT, "generated", "models", "font-metrics.json")

# family key used by the generators -> woff2 file
FONTS = {
    "Inter-Regular": "Inter-Regular.woff2",
    "Inter-Italic": "Inter-Italic.woff2",
    "Exo2-SemiBold": "Exo2-SemiBold.woff2",
}


def main():
    result = {}
    for key, filename in FONTS.items():
        path = os.path.join(FONT_DIR, filename)
        if not os.path.exists(path):
            print("WARNING: missing font {}, skipping".format(path))
            continue
        font = TTFont(path)
        upm = font["head"].unitsPerEm
        hmtx = font["hmtx"].metrics
        cmap = font.getBestCmap()
        # advance per glyph id (units)
        advances = [hmtx[g][0] for g in font.getGlyphOrder()]
        # codepoint -> glyph id
        glyph_ids = {name: i for i, name in enumerate(font.getGlyphOrder())}
        cm = {str(cp): glyph_ids[name] for cp, name in cmap.items() if name in glyph_ids}
        result[key] = {
            "unitsPerEm": upm,
            "advances": advances,
            "cmap": cm,
            "source": filename,
        }
        print("  {}: {} glyphs, {} cmap entries".format(key, len(advances), len(cm)))

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(result, fh, separators=(",", ":"))
    print("wrote", OUT)


if __name__ == "__main__":
    sys.exit(main())
