# SVG Renderer Implementation Report

## Summary of Changes

### Files Modified
- `compiler/render-svg.js` — Rewritten rendering engine
- `generated/svg/debug/card-preview.svg` — Regenerated output

### Files Not Modified (as instructed)
- `compiler/build-card-model.js`, `generated/models/planets.json`, CSV files, planet artwork PNGs

---

## 1. Planet Artwork Size & Position

**Before:** Full-width artwork at (36, 92), 672×820 pixels occupying the entire card body.

**After:** Decorative artwork in the upper-right corner at (430, 100), 260×260 pixels — approximately 12% of the original area. Uses `preserveAspectRatio="xMidYMid meet"` to show the full circular planet without cropping. The transparent-background planet PNGs (418×418, RGBA) are already tightly cropped, so no further cropping was needed.

---

## 2. Resource Icon Source

**Before:** Inline SVG icons loaded from `source/icons/resources/{resource}.svg` (40×40 viewBox).

**After:** PNG icons loaded from `source/icons/resources/{Resource}.png` (512×512 each, transparent background), embedded in the SVG as base64 data URIs via `fs.readFileSync` + `toString('base64')`. A resource-ID-to-filename lookup table maps lowercase resource IDs (e.g., `algae`) to mixed-case PNG filenames (e.g., `Algae.png`).

---

## 3. Resource Icon Size

**Before:** 40×40 pixels (barely visible on the card).

**After:** 80×80 pixels — 4× the area, making resource icons the dominant gameplay element.

---

## 4. Resource Layout

**Before:** Icons positioned at percentage-based coordinates (from `Mercurio_planet_layout_v3.csv`) mapped to the artwork bounding box. Three rows at y≈250, y≈430, y≈610.

**After:** Icons placed on a fixed grid independent of the CSV positions:

| Row | Y Center | Input X positions | Output X positions |
|-----|----------|-------------------|-------------------|
| L1  | 480      | 120, 224          | 470, 574          |
| L2  | 660      | 120, 224          | 470, 574          |
| L3  | 840      | 120, 224          | 470, 574          |

- Spacing: 104px per icon slot (80px icon + 24px gap)
- Rows are evenly spaced at 180px intervals
- First row (L1) begins below the planet artwork (artwork bottom at y=360, row top at y=440)
- Inputs are on the left, outputs on the right
- Horizontal ordering within each level is preserved

---

## 5. Visual Hierarchy

The card now communicates in this order:

1. **Planet Type Icon** — top-left header (unchanged)
2. **Planet Artwork** — decorative vignette in upper-right
3. **Resource Icons** — large, dominant three-row grid answering: "What does this planet consume and produce?"

## Layout Constants

All new layout is controlled by a single `LAYOUT` object in `render-svg.js:30-36`:

```js
const LAYOUT = {
  planetArtwork: { x: 430, y: 100, size: 260 },
  resourceIconSize: 80,
  resourceGap: 24,
  inputStartX: 120,
  outputStartX: 470,
  rowY: [480, 660, 840],
};
```
