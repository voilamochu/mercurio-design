# SVG Asset Optimization Pipeline — Investigation Report

**Date:** 2026-07-20
**Status:** Investigation only — no production files modified
**Scope:** Planet cards, Technology cards, and all future Mercurio assets

---

## Table of Contents

1. [Current Pipeline](#1-current-pipeline)
2. [SVG Size Breakdown](#2-svg-size-breakdown)
3. [Artwork Optimization](#3-artwork-optimization)
4. [SVG Optimization (SVGO)](#4-svg-optimization-svgo)
5. [Sharp Best Practices](#5-sharp-best-practices)
6. [Image Resolution Study](#6-image-resolution-study)
7. [Optimization Order](#7-optimization-order)
8. [Determinism](#8-determinism)
9. [Reusable Architecture](#9-reusable-architecture)
10. [Future Assets](#10-future-assets)
11. [Expected Savings](#11-expected-savings)
12. [Recommended Implementation Plan](#12-recommended-implementation-plan)

---

## 1. Current Pipeline

### Planet Card Pipeline (81 cards)

```
source/csv/planets/
  PlanetResources_v3.csv
  PlanetType_v3.csv
         │
         ▼  npm run build:model
  compiler/build-card-model.js
    • Reads CSV, validates resource names & planet types
    • Emits structured JSON with resolved planet types
         │
         ▼
  generated/models/planets.json           ← canonical model (tracked in git)
         │
  source/artwork/cards/planet/planets/    ← 9 PNGs at 864×1216 px
  source/icons/resources/                 ← 8 PNGs at 352×384 px
         │
         ▼  (internal call from build-cards.js)
  compiler/optimize-assets.js
    • Sharp: artwork → resize to 576px width, lanczos3, PNG compressionLevel 9
    • Sharp: icons → trim + resize to 96×96, lanczos3, PNG palette=true, compressionLevel 9
         │
         ▼
  generated/optimized-assets/artwork/     ← resized PNGs
  generated/optimized-assets/icons/       ← resized + palette PNGs
         │
         ▼  npm run build:cards
  compiler/build-cards.js
    • Loads planets.json
    • For each planet:
        - Reads resized artwork PNG → base64 data URI
        - Reads resource icons → base64 data URIs
        - Renders 3-layer SVG: artwork <image> (full-bleed, slice) +
          resource panel (semi-transparent overlay) +
          icon <image> elements with filter(#icon-enhance)
    • Emits 81 SVGs + contact-sheet.svg + index.json
         │
         ▼
  generated/cards/card_NNN_M.svg          ← 81 raw SVGs
         │
         ▼  npm run export:bga  (internal)
  compiler/optimize-svg.mjs
    • Reads generated/cards/card_*.svg
    • Applies SVGO (multipass, 21 plugins per svgo.config.mjs)
    • Writes optimized SVGs in place
         │
         ▼
  compiler/export-bga.js
    • Copies SVGs → exports/bga/img/
    • Copies planets.json → exports/bga/data/
    • Writes manifest.json with size statistics
    • Validates: 81 SVGs, artwork embedded, filenames match model
         │
         ▼
  exports/bga/                             ← BGA-ready bundle
```

### Technology Card Pipeline (40 cards)

```
source/artwork/technology/
  domain-collage.png                      ← one-time bootstrap source
  overlay-collage.png                     ← one-time bootstrap source
         │
         ▼  npm run bootstrap:tech-artwork  (one-time)
  compiler/split-tech-artwork.js
    • Sharp: extract individual tiles from collages
    • Writes to canonical source directories
         │
         ▼
  source/artwork/technology/domains/*.png  ← 8 tiles (canonical, hand-editable)
  source/artwork/technology/overlays/*.png ← 5 tiles (canonical, hand-editable)
         │
  source/data/technologies.json            ← hand-authored (40 techs)
  source/data/technology-artwork-map.json  ← maps tech_id → domain + overlay
         │
         ▼  npm run build:tech-model
  compiler/build-tech-model.js
         │
         ▼
  generated/models/technologies.json       ← canonical tech model (tracked)
         │
         ▼  npm run build:tech-cards
  compiler/build-tech-cards.js
    • For each technology:
        - Sharp compositor: load domain PNG + overlay PNG
        - Resize both to ARTWORK_WINDOW (696×580), lanczos3
        - Composite overlay on domain: blend=overlay, opacity=0.12
        - Convert composited PNG → base64 data URI
        - Generate SVG: frame + title + artwork + project-box (if project) +
          rules-box + flavor-text
        - Wrap in SVG document with base64-embedded WOFF2 fonts
    • Emits 40 self-contained SVGs to generated/cards-tech/
         │
         ▼
  generated/cards-tech/tech_NNN.svg        ← raw SVGs (no SVGO pass!)
```

### Key observations

- **PNG artifacts are not shared.** Planet pipeline uses pre-optimized PNG files; tech pipeline composites fresh each run.
- **Tech cards lack SVGO.** The SVGO pass (`optimize-svg.mjs`) only targets `generated/cards/` (planet cards). Tech SVGs are written once with no post-processing.
- **Font embedding is cached.** `font-embed.js` caches the generated CSS string, but recalculates on `stat.size:stat.mtimeMs` — safe but unnecessary in a deterministic build.
- **Tech artwork is not pre-optimized.** Domain and overlay PNGs are used at native tile size, resized only at composite time. There is no `optimize-assets.js` equivalent for tech artwork.

---

## 2. SVG Size Breakdown

### Planet Card (current production: ~800 KB at 576px artwork)

| Component | Size (KB) | % of Total | Notes |
|-----------|-----------|------------|-------|
| Embedded artwork PNG (base64) | ~750 | ~93% | Artwork resized to 576×811, PNG level 9, no palette |
| Embedded icon PNGs (base64) | ~45–65 | ~6–8% | 5–8 icons at 96×96, palette PNG, level 9 |
| SVG markup + metadata | ~2.5 | ~0.3% | `<svg>`, `<defs>`, `<filter>`, `<rect>`, `<image>`, `<g>` |
| Whitespace + indentation | ~1.5 | ~0.2% | 2-space indent in hand-written SVG templates |
| Filter definitions | ~0.3 | ~0.04% | `#icon-enhance` filter (saturate + contrast) |
| **Total** | **~800** | **100%** | |

### Technology Card (estimated: ~200–400 KB)

| Component | Size (KB) | % of Total | Notes |
|-----------|-----------|------------|-------|
| Embedded composited artwork PNG (base64) | ~150–350 | ~85–90% | 696×580 composite, PNG level 9, no palette |
| Embedded WOFF2 fonts (base64) | ~30–40 | ~10–15% | 3 font faces (Exo 2 SemiBold, Inter Regular, Inter Italic) |
| SVG markup + metadata | ~4–6 | ~2% | frame, title, project-box, rules, flavor, clipPath, defs |
| Whitespace + indentation | ~2–3 | ~1% | 2-space indent across 5–6 component modules |
| **Total** | **~200–400** | **100%** | |

### Biggest offenders

1. **Embedded artwork PNG** — 93% of planet card size, 85–90% of tech card size. This is the single lever with the greatest impact.
2. **Embedded icon PNGs** — 6–8% of planet card size. Palette optimization already in use; further gains require resolution reduction.
3. **Embedded fonts** — 10–15% of tech card size. Only relevant for tech cards (planet cards use no custom fonts).
4. **SVG markup** — negligible (~0.3%). Not worth optimization effort beyond what SVGO already provides.

---

## 3. Artwork Optimization

### 3.1 Resize Before Embedding

| Technique | Expected Saving | Quality Impact | Difficulty |
|-----------|----------------|----------------|------------|
| Reduce artwork width from 576 → 480 | ~30% reduction in PNG size | Minor on 744px canvas at 1x; noticeable at 2x | Trivial (one constant change) |
| Reduce artwork width from 576 → 384 | ~55% reduction in PNG size | Visible softness on large monitors | Trivial (one constant change) |
| 576 → 480 with retina @2x (768 → 640) | ~30% with preserved retina quality | None at 1x, slightly softer at 2x | Low |

**Current oversampling:** Source art is 864 px; production pipeline downsamples to 576 px. The SVG canvas is 744 px. At 576 px the artwork is displayed at 744 px (upscaled 1.29×). This means we are *already* embedding a smaller image than the display canvas. Further reduction exacerbates this upscale.

**Recommendation:** Determine the *actual* on-screen display size of the artwork image element (not the SVG canvas). In planet cards, the artwork `<image>` spans the full 744×1039 canvas with `preserveAspectRatio="xMidYMid slice"` — so the source is always cropped. The visible area is at most 744×1039, meaning artwork never needs to exceed ~900 px on the long edge. Current 576×811 is already undersized for 1x; for 2x retina we would want ~1488×2078 or higher.

The empirical experiment data (from `docs/experiments/image-resolution.md`) shows:
- 864 px baseline: 1.33 MB avg
- 576 px (A3): 809 KB avg (-40.6%)
- Subjectively, at 576 px artwork is visibly soft (1.29× upscale + lossy compression)

### 3.2 PNG Compression

| Technique | Expected Saving | Quality Impact | Difficulty |
|-----------|----------------|----------------|------------|
| `compressionLevel: 9` (already in use) | Baseline (already applied) | None | Already done |
| Maximum deflate (zlib wrapper) | 0% beyond level 9 | None | Already done |
| PNG filter strategy (heuristic vs. all) | 0–3% | None | Low (single Sharp option) |

**Sharp's current PNG defaults with `compressionLevel: 9` are already near-optimal** for lossless PNG compression. The remaining headroom is in quantization and palette reduction, not deflate tuning.

### 3.3 Indexed PNG / Palette Reduction

| Technique | Expected Saving | Quality Impact | Difficulty |
|-----------|----------------|----------------|------------|
| palette=false → palette=true (artwork) | 40–60% on artwork PNG size | Potentially severe banding in gradients (space backgrounds) | Low |
| 256-color palette (8-bit) | 50–70% on artwork PNG size | Banding in sky/space gradients | Low |
| 128-color palette | 55–75% on artwork PNG size | Noticeable banding | Low |
| 64-color palette | 60–80% on artwork PNG size | Aggressive banding, posterization | Low |
| Adaptive palette (quantize) | 50–70% with controlled quality | Depends on colour count | Medium |

**Critical distinction:** Planet artwork contains continuous-tone space backgrounds with subtle gradients. Palettizing these causes visible banding. Icons, by contrast, are flat-design vector-like graphics with limited colour counts — which is why `palette: true` already works well for them.

**Recommendation for artwork:** Palette reduction is risky for space scenes. If attempted, use `sharp.pipeline({ colours: 128 })` with `effort` and test visually. More promising: reduce resolution (which reduces PNG size linearly) before attempting quantization.

### 3.4 Colour Quantization

| Technique | Expected Saving | Quality Impact | Difficulty |
|-----------|----------------|----------------|------------|
| Sharp built-in quantize (colours: 256) | 50–60% | Banding in gradients | Medium |
| pngquant (external) | 60–70% | Better banding control than Sharp | High (new dep) |
| Posterize (reduce bit depth) | ~25% per channel bit dropped | Severe for <6 bit | Low |

**Sharp's quantize** uses the two-stage approach (median cut + floyd-steinberg dithering). Quality is acceptable for flat art, poor for gradients.

**Recommendation:** Do not quantize space/planet artwork. If the engine is ever swapped or the art style changes to flat illustration, revisit.

### 3.5 Dithering Options

| Technique | Expected Saving | Quality Impact | Difficulty |
|-----------|----------------|----------------|------------|
| Floyd-Steinberg (Sharp default) | None (saving from quantization) | Reduces banding artifacts | Low (automatic with quantize) |
| No dithering | 0% | Floyd-Steinberg noise visible in smooth areas | Trivial |

**Recommendation:** If quantization is applied, Floyd-Steinberg dithering should be used. Without quantization, dithering is irrelevant.

### 3.6 Metadata Stripping

| Technique | Expected Saving | Quality Impact | Difficulty |
|-----------|----------------|----------------|------------|
| `sharp().withMetadata(false)` | 0–100 bytes (negligible) | None | Trivial |
| Strip sRGB chunk | 0% (removes colour profile, dangerous) | Can cause colour shift | Trivial |

**Recommendation:** Always call `.withMetadata()` without arguments to strip all non-essential metadata. Do NOT strip colour profiles unless you verify they are not needed.

### 3.7 Alpha / Transparency Optimization

| Technique | Expected Saving | Quality Impact | Difficulty |
|-----------|----------------|----------------|------------|
| Remove alpha channel (if fully opaque) | ~5–15% on PNG size | None for artwork (full-bleed, no alpha) | Low |
| Preserve alpha (needed for overlays) | Baseline | Required for overlay compositing | Already done |

**Recommendation:** Planet artwork is full-bleed with no transparency — remove alpha channel. Tech composited artwork is also fully opaque (domain fills the frame) — remove alpha. Icons need alpha (they are rendered on textured backgrounds).

### 3.8 Summary: Recommended Artwork Settings

| Setting | Planet Artwork | Icons | Tech Composite |
|---------|---------------|-------|----------------|
| Resolution | 576×811 (current) or 480×676 | 96×96 (current) | 696×580 (current) |
| `compressionLevel` | 9 | 9 | 9 |
| `palette` | false (current) | true (current) | false |
| `colours` | n/a | auto (256 max) | n/a |
| `alpha` | remove (flatten) | preserve | remove (flatten) |
| `metadata` | strip all | strip all | strip all |
| `effort` | 10 (max) | 10 (max) | 10 (max) |

**Note:** `effort` (Sharp v0.33+) controls PNG compression effort (1–10, higher = smaller). Current Sharp is ^0.35.3, so effort is available. This is a free saving — zero quality impact.

---

## 4. SVG Optimization (SVGO)

### 4.1 Current Configuration (`svgo.config.mjs`)

```js
plugins: [
  'removeDoctype', 'removeXMLProcInst', 'removeComments', 'removeMetadata',
  'removeEditorsNSData', 'cleanupAttrs', 'mergeStyles', 'inlineStyles',
  'minifyStyles', 'removeUselessDefs', 'cleanupNumericValues',
  'convertPathData', 'sortAttrs', 'removeEmptyAttrs',
  'removeEmptyContainers', 'mergePaths', 'removeUnusedNS',
  'sortDefsChildren', 'removeTitle', 'removeDesc',
]
```

**Missing but applicable:**

| Plugin | Effect | Savings | Risk |
|--------|--------|---------|------|
| `removeDimensions` | Remove `width`/`height` from `<svg>`, keep `viewBox` | ~30 bytes per SVG | Safe — `viewBox` is sufficient for scaling |
| `removeViewBox` | Do NOT use — breaks rendering | — | Dangerous |
| `cleanupIds` | Shorten IDs, prefix collision-proof | ~5–15 bytes per SVG with clipPath | Safe if prefix is unique per file |
| `removeOffCanvasPaths` | Remove clipped/invisible path segments | 0% (no vector clipping) | Safe |
| `removeHiddenElems` | Remove `display:none` elements | 0% (no hidden elements) | Safe |
| `collapseGroups` | Merge single-child `<g>` into parent | 10–50 bytes per SVG | Safe — no transforms on groups |
| `convertShapeToPath` | Convert `<rect>`, `<circle>` to `<path>` | 0–10 bytes | Safe but negligible for our simple rects |
| `removeEmptyText` | Remove empty `<text>` elements | 0% (no empty text) | Safe |
| `reusePaths` | Deduplicate identical paths | 0% (no repeated paths) | Complex |
| `cleanupNumericValues` (already in use) | Round/trim numeric values | 0.5–2% on total | Already enabled |

### 4.2 Recommended SVGO Configuration

```js
export default {
  multipass: true,
  js2svg: {
    indent: 2,
    pretty: false,           // strip all unnecessary whitespace
    finalNewline: true,      // POSIX convention
  },
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',         // removes <metadata> tags
    'removeEditorsNSData',
    'removeDimensions',       // ADD — viewBox alone is sufficient
    'cleanupAttrs',
    'mergeStyles',
    'inlineStyles',
    'minifyStyles',
    'removeUselessDefs',
    'cleanupNumericValues',   // already enabled
    'cleanupIds',             // ADD — shorten IDs
    'collapseGroups',         // ADD — merge single-child groups
    'convertPathData',
    'sortAttrs',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'mergePaths',
    'removeUnusedNS',
    'sortDefsChildren',
    'removeTitle',
    'removeDesc',
  ],
};
```

### 4.3 Estimated SVGO Savings on Current SVGs

| SVG Type | Before SVGO | After SVGO (current) | After SVGO (recommended) |
|----------|-------------|---------------------|--------------------------|
| Planet card | ~809 KB | ~809 KB (negligible) | ~808.9 KB (negligible) |
| Tech card | ~200–400 KB | No SVGO pass | ~199.5–399.5 KB (~0.1%) |

**SVGO savings are negligible** for these SVGs because the vast majority of bytes are base64-encoded PNG data, which SVGO cannot reduce. SVGO's value is in:
- Consistency (deterministic structure)
- Removing metadata that could leak system info
- Minifying the XML wrapper for marginally faster parsing

---

## 5. Sharp Best Practices

### 5.1 Sharp Version

Current: `^0.35.3` (released late 2024). This is a modern version with full support for:
- `heif` (HEIC/AVIF)
- `effort` parameter for PNG
- `quantise` with optional dithering
- `tile` output
- `composite` with 16 blend modes

### 5.2 Recommended PNG Settings

```js
sharp(input)
  .withMetadata()             // preserve nothing; strip all metadata
  .resize(width, height, {
    fit: 'cover',             // or 'contain' for icons
    kernel: 'lanczos3',       // highest quality downscale
    withoutEnlargement: true,  // never upscale
  })
  .png({
    compressionLevel: 9,      // maximum compression
    palette: false,           // false for artwork, true for icons
    colours: 256,             // only used when palette: true
    effort: 10,               // max zlib compression effort (Sharp 0.33+)
    adaptiveFiltering: true,  // let Sharp choose best PNG filter per row
    progressive: false,       // no interlacing (not needed for embedded images)
  })
  .toBuffer();
```

### 5.3 Parameter Explanation

| Parameter | Recommended | Why |
|-----------|-------------|-----|
| `compressionLevel: 9` | 9 (already set) | Maximum lossless compression. Only affects deflate; no quality loss. |
| `palette: false` (artwork) | false | Palette reduces size but introduces banding in continuous tones. |
| `palette: true` (icons) | true | Icons are flat-colour; palette PNG is 50–80% smaller with no visible quality loss. |
| `colours: 256` | 256 (max) | Maximum palette colours. Lower values save more but risk quality. |
| `effort: 10` | 10 | Controls zlib compression search (1–10). 10 is slowest but smallest. Free saving over default (which varies by Sharp version). |
| `adaptiveFiltering: true` | true | Let Sharp evaluate all PNG filter heuristics per row. Usually best for photographic content. Default in modern Sharp. |
| `progressive: false` | false | Progressive PNG enables partial decode during download. For embedded images, it adds ~5–15% overhead with zero benefit. |
| `.withMetadata()` | no args | Strips all metadata (EXIF, ICC, XMP). Required for determinism. |

### 5.4 Composite (for tech artwork)

```js
sharp(domainResized)
  .composite([{
    input: overlayResized,
    blend: 'overlay',
    opacity: 0.12,
  }])
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
```

**Current settings are already correct.** Consider adding `withoutEnlargement: true` to the resize calls to prevent accidental upscaling if source art is smaller than requested dimensions.

---

## 6. Image Resolution Study

### 6.1 Actual Artwork Window Dimensions

| Card Type | SVG Canvas | Artwork Display Area | Notes |
|-----------|-----------|---------------------|-------|
| Planet card | 744×1039 | 744×1039 (full-bleed, slice) | Artwork is always cropped, covering entire card |
| Technology card | 744×1039 | 696×580 (ARTWORK_WINDOW) | Artwork is inside the clipped artwork window |

### 6.2 Current Resolutions

| Asset | Source (px) | Embedded (px) | Display (px) | Oversampling Factor |
|-------|-------------|---------------|--------------|-------------------|
| Planet artwork | 864×1216 | 576×811 | 744×1039 | 0.77× (undersampled) |
| Tech domain tile | varies (from collage) | varies → resized to 696×580 | 696×580 | 1.0× (exact) |
| Tech overlay tile | varies (from collage) | varies → resized to 696×580 | 696×580 | 1.0× (exact) |
| Resource icons | 352×384 | 96×96 | 96×96 (in 744px canvas) | 1.0× (exact at 1x) |

### 6.3 Recommended Oversampling

For print-quality assets displayed on high-DPI (retina) screens, a 2× oversampling factor is standard:

| Asset | 1x Display | 2x (Retina) Recommendation | Suggested Embedded Resolution |
|-------|-----------|---------------------------|------------------------------|
| Planet artwork | 744×1039 | 1488×2078 | 744×1039 (1x) or 1488×2078 (2x) |
| Tech artwork | 696×580 | 1392×1160 | 696×580 (1x) or 1392×1160 (2x) |
| Resource icons | 96×96 | 192×192 | 96×96 (1x) or 192×192 (2x) |

**Tension:** 2× oversampling quadruples file size. For BGA (web-only), 1× is usually acceptable — the SVG viewBox handles small-detail scaling. For print, 2× or higher is needed.

**Recommendation for this project:**
- **Keep current 1× resolution** for BGA delivery. The game renders on screen, not in print.
- If retina support is needed, embed at 1.5× (1116×1558 for planets) as a compromise.
- **Do not undersample below display resolution.** Current 576 px for a 744 px display means artwork is upscaled 29%, causing visible softness. Either embed at the display size (744 px wide) or accept softness.

### 6.4 Scaling Order

**Scale after composition, before base64 encoding.** This ensures:
1. All blend operations happen at full source resolution (preserving detail)
2. The final resize to embed resolution is the last pixel operation
3. Base64 encoding is applied to the smallest possible buffer

**Current tech pipeline does this correctly** (domain + overlay → composite → resize). Planet pipeline resizes before base64 encoding correctly.

---

## 7. Optimization Order

### Correct Optimization Pipeline

```
Source Artwork
    ↓
 1. COMPOSE (if multi-layer, e.g. domain + overlay)
    • Perform all blend operations at full resolution
    • Lossless intermediary — do not compress yet
    ↓
 2. RESIZE to embed resolution
    • lanczos3 kernel
    • withoutEnlargement: true
    ↓
 3. CONVERT colour (if needed)
    • sRGB ensure for consistent rendering
    ↓
 4. PALETTE / QUANTIZE (if applicable)
    • For flat-colour art only
    • Floyd-Steinberg dithering if palette is aggressive
    ↓
 5. COMPRESS
    • compressionLevel: 9
    • effort: 10
    • adaptiveFiltering: true
    ↓
 6. STRIP METADATA
    • Remove EXIF, ICC, XMP, text chunks
    • Ensures determinism
    ↓
 7. base64 ENCODE
    • Convert final PNGBuffer to base64 string
    ↓
 8. EMBED in SVG
    • data:image/png;base64,<data>
    ↓
 9. SVG POST-PROCESS (SVGO)
    • Strip metadata, comments, unused defs
    • minify XML
    • collapse groups
    • cleanup IDs
    • multipass for optimal results
    ↓
Final SVG
```

### Why This Order

| Step | Reason |
|------|--------|
| Compose before resize | Preserves blend precision at highest available resolution |
| Resize before quantize | Fewer pixels = faster quantization, smaller palette |
| Quantize before compress | Palette PNG compresses better than RGBA |
| Compress before metadata strip | Metadata strip does not affect compression decisions |
| Metadata strip before base64 | Smaller input → shorter base64 string |
| base64 before embed | SVG template is text; data URI is text |
| SVGO last | Operates on final text; can minify around the data URI |

---

## 8. Determinism

### 8.1 Deterministic Steps

| Step | Deterministic? | Notes |
|------|---------------|-------|
| Sharp resize (lanczos3, same input buffer) | Yes | Bit-exact for same input dimensions |
| PNG compression level 9 | Yes | Same input → same output with fixed settings |
| PNG palette generation | Yes | Same seed, same colour table |
| PNG effort=10 | Yes | Full search is deterministic |
| base64 encoding | Yes | Buffer → string is trivially deterministic |
| SVGO with fixed config | Yes | Deterministic if input is identical and multipass reaches fixed point |
| Font embedding | Yes (if font file unchanged) | Cached by stat, but output is same for same input |

### 8.2 Sources of Nondeterminism

| Source | Impact | Mitigation |
|--------|--------|------------|
| `new Date().toISOString()` in manifest.json | Manifest changes per build | Acceptable (manifest is metadata, not asset content) |
| `fs.statSync().mtimeMs` in font-embed cache key | Could differ if filesystem timestamps change | Output is same regardless (stat is only used for cache key) |
| SVGO multipass reaching different fixed points | Very rare with deterministic input | Use same SVGO version across builds |
| Floating-point arithmetic across platforms | Integer coords in our code; minimal risk | Use `Math.round()` (already done) |

### 8.3 Ensuring Byte-Identical SVGs

1. **Pin Sharp version** — major.minor changes can alter PNG output. Current `^0.35.3` already uses caret range; consider exact version.
2. **Pin SVGO version** — `^4.0.2` should be exact. SVGO 5.x will change output.
3. **Freeze Node.js version** — buffer allocations, base64 encoding, and locale settings differ across Node versions.
4. **Remove timestamp from manifest** (optional) — or accept it as the only non-deterministic file.
5. **Always strip all metadata** from PNGs and SVGs — prevents filesystem timestamps, tool versions, or environment variables from leaking into output.
6. **Use `.withMetadata()` with no args** — removes all non-pixel data from PNG buffers.

### 8.4 Current Nondeterminism in Pipeline

- `export-bga.js` writes `generatedAt: new Date().toISOString()` into `manifest.json`. This file changes every build. This is acceptable — it is not an asset file. If absolute determinism is required, remove the timestamp.
- `font-embed.js` caches by `stat.size:stat.mtimeMs`. The cache key includes mtime, but the output is the same regardless — the cache is just a performance optimization. If mtime differs on CI, the cache miss produces identical output.
- SVGO multipass is deterministic for the same input. No issues.

---

## 9. Reusable Architecture

### 9.1 Proposed Module Structure

```
compiler/
  lib/
    optimize/
      artwork-compositor.js       ← composes multi-layer artwork (currently in technology/)
      artwork-optimizer.js        ← Sharp-based PNG resize/quantize/compress
      svg-optimizer.mjs           ← SVGO wrapper (currently optimize-svg.mjs)
      asset-pipeline.js           ← orchestrates the full pipeline for any asset type
```

### 9.2 Module Responsibilities

#### `artwork-compositor.js`

**Purpose:** Composite multiple raster layers into a single PNG.

**Current location:** `compiler/lib/technology/sharp-artwork-compositor.js`

**Proposed interface:**
```js
async function composeArtwork(layers, outputWidth, outputHeight, options)
  // layers: [{ buffer, blendMode?, opacity? }]
  // options: { kernel, withoutEnlargement }
  // Returns: Buffer (PNG)
```

**Refactoring notes:**
- Currently hardcoded to domain+overlay with 12% opacity
- Should accept an array of layers with per-layer blend modes
- Technology-specific defaults can call this with tech defaults
- Planet cards (single layer) would pass one layer with no blend

#### `artwork-optimizer.js`

**Purpose:** Take a PNG buffer and produce the smallest acceptable version.

**Proposed interface:**
```js
async function optimizeArtwork(buffer, options)
  // options: { width, height, fit, palette, colours, effort, compressionLevel, stripMetadata, alpha }
  // Returns: Buffer (optimized PNG)
```

**This does not exist yet as a standalone module.** It is currently inlined in `optimize-assets.js` (planet) and `sharp-artwork-compositor.js` (tech). Both repeat the same Sharp pipeline patterns.

#### `svg-optimizer.mjs`

**Purpose:** Post-process SVG string with SVGO.

**Current location:** `compiler/optimize-svg.mjs`

**Proposed interface:**
```js
async function optimizeSvg(svgString, config)
  // config: SVGO config object (default from svgo.config.mjs)
  // Returns: { data: string, info: { savedBytes, elapsedMs } }
```

**Refactoring notes:**
- Currently reads files from disk and writes in place
- Should accept a string and return a string (pure function)
- File I/O should be caller's responsibility

#### `asset-pipeline.js`

**Purpose:** Orchestrate the pipeline for any asset type.

**Proposed interface:**
```js
async function runAssetPipeline(assetType, model, artworkResolver, iconResolver)
  // assetType: 'planet' | 'technology' | 'contract' | 'governor' | ...
  // model: the canonical model JSON
  // artworkResolver: (entry) => artwork buffers
  // iconResolver: (entry) => icon buffers
  // Emits: SVGs
```

**This is the big architectural change.** Rather than having `build-cards.js` and `build-tech-cards.js` each with their own rendering loop, a shared pipeline would:
1. Load the model
2. Resolve artwork references via the resolver
3. Optimize all artwork (reuse `artwork-optimizer.js`)
4. Call a renderer callback to produce SVG strings
5. Post-process all SVGs with `svg-optimizer.mjs`
6. Write output with validation

### 9.3 Integration with Existing Code

The existing scripts become thin wrappers:

```js
// compiler/build-cards.js → wrapper
const pipeline = require('./lib/optimize/asset-pipeline');
const renderPlanetCard = require('./lib/renderers/planet-card');

pipeline.run({
  model: 'generated/models/planets.json',
  artworkSource: 'source/artwork/cards/planet/planets/',
  iconSource: 'source/icons/resources/',
  renderer: renderPlanetCard,
  outputDir: 'generated/cards/',
  svgo: true,
});
```

### 9.4 Shared Rendering Primitives

Several SVG components are already reusable:
- `frame.js` — colored/framed rects (used for tech frames, reusable for contracts)
- `title.js` — title bar with name + level (usable for any named card)
- `svg.js` — document wrapper with font embedding

---

## 10. Future Assets

### 10.1 Applicability Matrix

| Asset | Artwork Composition | Artwork Optimization | SVG Template | SVGO | Pipeline Reusable? |
|-------|--------------------|--------------------|-------------|------|-------------------|
| Planet cards | Single-layer (current) | Yes (current) | Custom | Yes (current) | **Yes** — blueprint for pipeline |
| Technology cards | Multi-layer blend (current) | Missing | Custom (existing) | Missing | **Yes** — needs SVGO pass |
| Contract cards | Single-layer or multi-layer | Yes | New template needed | Yes | **Yes** — new renderer only |
| Governor tiles | Single-layer artwork | Yes | New template needed | Yes | **Yes** — new renderer only |
| Goal tiles | Text-only (no artwork) | n/a | New template needed | Yes | **Yes** — simplest case |
| Player boards | Multi-panel composite | Yes | New template needed | Yes | **Partial** — board uses unique layout |
| Research Nexus | Multi-layer (likely) | Yes | New template needed | Yes | **Yes** — similar to technology |
| Orbital Exchange | Multi-layer (likely) | Yes | New template needed | Yes | **Yes** — similar to technology |
| Game board | Large format + tiles | Yes | New template needed | Yes | **Partial** — fundamentally different scale |

### 10.2 Exceptions and Caveats

1. **Game board** — the board is fundamentally different in scale and composition. It will likely use a tile-map approach rather than a single SVG card. The artwork optimization pipeline still applies (for tile renderings), but the SVG pipeline does not.

2. **Player boards** — if player boards use a sprite-sheet or multi-tile layout, the single-SVG approach may not fit. The artwork compositor and optimizer still apply.

3. **Goal tiles** — if goal tiles are text-only with no artwork, the artwork optimization steps can be skipped entirely.

4. **Font embedding** — all future text-based cards should share the same `font-embed.js` module. Currently only technology cards embed fonts; planet cards use system fonts. Text-heavy future assets should either embed fonts or accept system font rendering.

### 10.3 Recommended Shared Modules

Every future asset type should reuse:

| Module | Used By | Notes |
|--------|---------|-------|
| `artwork-optimizer.js` | All raster-in-SVG assets | Resize + compress + strip metadata |
| `svg-optimizer.mjs` | All SVG output | SVGO post-processing |
| `font-embed.js` | All text-heavy SVGs | Base64 WOFF2 embedding |
| `frame.js` | Any bordered component | Parameterized rect + stroke + fill |
| `title.js` | Any named component | Title bar with name + level badge |
| `svg.js` | Any SVG document | Wrapper with viewBox + defs |

---

## 11. Expected Savings

### 11.1 Planet Card (current: ~800 KB)

| Stage | Cumulative Size | Saving vs Current | Notes |
|-------|----------------|-------------------|-------|
| Current production (576px, no palette, level 9) | 809 KB | — | Baseline from experiment data |
| + effort=10, adaptiveFiltering, strip metadata | ~790 KB | ~2% | Free (no quality impact) |
| + palette on artwork (256-colour) | ~450 KB | ~44% | Risk of banding in backgrounds* |
| + reduce artwork to 480px | ~600 KB | ~26% | Visible softness at 2x |
| + reduce artwork to 576px (already current) | ~790 KB | — | Already at this point |
| + flatten alpha channel | ~750 KB | ~7% | Free (artwork is already opaque) |
| + SVGO recommended config | ~750 KB | ~0.1% | Marginal |
| **Realistic achievable (safe, no quality loss)** | **~750 KB** | **~7%** | effort=10 + metadata strip + alpha flatten |
| **Aggressive (with quality trade-offs)** | **~400–450 KB** | **~44–50%** | palette + resolution reduction |

*Palette risk is real. The space backgrounds in planet artwork contain continuous gradients. Palettizing would produce banding. Only consider if artwork style is updated to flat illustration.

### 11.2 Technology Card (current: ~200–400 KB)

| Stage | Cumulative Size | Saving vs Current | Notes |
|-------|----------------|-------------------|-------|
| Current (696×580 composite, level 9, no palette) | ~300 KB | — | Rough estimate |
| + effort=10, adaptiveFiltering, strip metadata | ~290 KB | ~3% | Free |
| + flatten alpha channel | ~270 KB | ~10% | Free (composite is opaque) |
| + SVGO pass | ~270 KB | ~0.1% | Marginal but should be done |
| + reduce artwork window to 580×484 (0.83×) | ~220 KB | ~27% | Noticeable softness |
| + palette on artwork (256-colour) | ~150 KB | ~50% | Risk of banding |
| **Realistic achievable (safe, no quality loss)** | **~270 KB** | **~10%** | effort + metadata + alpha + SVGO |
| **Aggressive (with quality trade-offs)** | **~150 KB** | **~50%** | palette + resolution reduction |

### 11.3 Icon Impact (per card)

Icons already use palette PNG at 96×96. Savings from effort=10 and metadata stripping might reduce icon contribution from ~52 KB to ~48 KB — a ~8% improvement per card.

### 11.4 Full Deck Savings

| Scenario | Per Planet Card | 81 Planet Cards | Per Tech Card | 40 Tech Cards | Total Deck |
|----------|----------------|----------------|---------------|---------------|------------|
| Current | ~809 KB | ~64 MB | ~300 KB | ~12 MB | ~76 MB |
| Safe optimization | ~750 KB | ~59 MB | ~270 KB | ~10.5 MB | ~69.5 MB |
| Aggressive optimization | ~450 KB | ~35.6 MB | ~150 KB | ~5.9 MB | ~41.5 MB |
| **Best case (safe only)** | **−7%** | **−7%** | **−10%** | **−10%** | **−8.5%** |
| **Best case (aggressive)** | **−44%** | **−44%** | **−50%** | **−50%** | **−45%** |

### 11.5 Honest Assessment

The embedded base64 PNG dominates all sizes. Real optimization requires either:
1. **Reducing pixel count** (lower resolution) — visible quality trade-off
2. **Quantizing colours** (palette PNG) — visible quality trade-off for gradients
3. **Changing the image format** — switching to JPEG (lossy, worse for line art) or AVIF (not universally supported in SVG `<image>`)

**The largest safe saving (7–10%) comes from effort=10, metadata stripping, and alpha flattening.** Everything beyond that requires visual quality trade-offs that only the design team can evaluate.

---

## 12. Recommended Implementation Plan

### Phase 1: Quick Wins (Safe, No Quality Impact)

**Purpose:** Capture free savings — effort=10, metadata stripping, alpha flattening, SVGO for tech cards.

**Expected benefit:** ~7% on planet cards, ~10% on tech cards.

**Risk:** None. These settings are universally safe.

**Effort:** Small (1–2 days).

**Files to modify:**
- `compiler/optimize-assets.js` — add `effort: 10`, `withMetadata()`, flatten alpha for artwork
- `compiler/lib/technology/sharp-artwork-compositor.js` — add `effort: 10`, `withMetadata()`
- `compiler/optimize-svg.mjs` — extend to also process `generated/cards-tech/`
- `svgo.config.mjs` — add `removeDimensions`, `cleanupIds`, `collapseGroups`

### Phase 2: Resolution Tuning

**Purpose:** Experimentally determine optimal artwork resolution (the balance between size and quality).

**Expected benefit:** Up to 26% from resolution reduction (if accepted).

**Risk:** Medium — must be visually validated by designer across all 9 planet types.

**Effort:** Medium (3–5 days including visual review).

**Action:**
- Extend `compiler/experiments/experiment-image-resolution.js` to also generate contact sheets
- Run resolution sweep: 744 (display-native), 660, 576 (current), 480, 384
- Designer reviews contact sheet blind
- Set `ARTWORK_SIZE` in `optimize-assets.js` and layout.js once consensus reached

### Phase 3: Palette Investigation

**Purpose:** Determine if palette reduction is viable for artwork.

**Expected benefit:** Up to 50% reduction (but only acceptable if quality holds).

**Risk:** High — banding may be unacceptable for space backgrounds.

**Effort:** Medium (2–3 days for experiment + review).

**Action:**
- Add palette experiment script or extend existing experiment
- Compare 256-colour, 128-colour, and 64-colour with Floyd-Steinberg dithering
- Generate contact sheets for side-by-side comparison
- Designer decides whether to apply

### Phase 4: Reusable Architecture

**Purpose:** Extract shared optimization modules from current ad-hoc code.

**Expected benefit:** Reduces duplication, makes all future assets automatically optimized.

**Risk:** Low — refactoring existing tested code.

**Effort:** Medium (3–5 days).

**Action:**
- Create `compiler/lib/optimize/artwork-optimizer.js`
- Create `compiler/lib/optimize/artwork-compositor.js` (extract from technology/)
- Create `compiler/lib/optimize/svg-optimizer.mjs` (pure function wrapper)
- Update `compiler/lib/svg/font-embed.js` to be a pure function (no cache by mtime)
- Refactor `build-cards.js` to use shared modules
- Refactor `build-tech-cards.js` to use shared modules
- No behaviour change — just extraction

### Phase 5: Validation and Regression Tests

**Purpose:** Ensure that optimization does not break visual output.

**Expected benefit:** Confidence in the pipeline; catch regressions early.

**Risk:** None (testing only).

**Effort:** Small (1–2 days).

**Action:**
- Add visual regression test: render a card before and after optimization, compare pixel output
- Add assertion: all SVGs are valid XML, self-contained, deterministic
- Add size budget tests: warn if SVG exceeds N KB
- Document the pipeline in `docs/asset-pipeline.md`

### Phase 6: Future Asset Rollout

**Purpose:** Apply the same pipeline to contract cards, governor tiles, goal tiles, etc.

**Expected benefit:** Consistent optimization across all assets.

**Risk:** Low — pipeline is already tested and shared.

**Effort:** Varies by asset type (1–3 days per new asset).

**Action:**
- For each new asset type:
  1. Create renderer module following the card template pattern
  2. Wire into `asset-pipeline.js`
  3. Generate sample output
  4. Validate with SVGO
  5. Add to `npm run build` if applicable

---

## Appendix A: Key File Reference

| File | Purpose |
|------|---------|
| `compiler/optimize-assets.js` | Current planet artwork PNG optimizer |
| `compiler/optimize-svg.mjs` | Current SVGO wrapper (planet cards only) |
| `svgo.config.mjs` | Current SVGO configuration |
| `compiler/lib/technology/sharp-artwork-compositor.js` | Current tech artwork compositor + optimizer |
| `compiler/lib/technology/artwork-compositor.js` | Current tech artwork → SVG wrapper |
| `compiler/lib/technology/svg.js` | Current tech SVG document wrapper |
| `compiler/lib/svg/font-embed.js` | Current font embedding module |
| `compiler/lib/technology/layout.js` | Current tech card layout constants (includes ARTWORK_WINDOW) |
| `compiler/experiments/experiment-image-resolution.js` | Existing resolution experiment |
| `compiler/experiments/experiment-icon-resolution.js` | Existing icon resolution experiment |
| `docs/experiments/image-resolution.md` | Existing experiment report |
| `docs/experiments/icon-resolution.md` | Existing experiment report |
| `docs/asset-pipeline.md` | Existing pipeline documentation |

## Appendix B: Key Data Points from Experiments

| Profile | Artwork Width (px) | Icon Size (px) | Avg SVG Size | vs Baseline |
|---------|-------------------|----------------|-------------|-------------|
| baseline | 864 | 96 | 1.33 MB | — |
| A1 | 768 | 96 | 1.30 MB | −1.9% |
| A2 | 640 | 96 | 977.9 KB | −28.2% |
| A3 | 576 | 96 | 809.0 KB | −40.6% |
| C1 | 640 | 128 | 1005.5 KB | −26.2% |
| I1 | 576 | 256 | 988.6 KB | −12.2% (vs 352 baseline) |
| I2 | 576 | 192 | 904.1 KB | −19.7% |
| I3 | 576 | 128 | 836.6 KB | −25.7% |
| I4 | 576 | 96 | 809.0 KB | −28.1% |

**Key insight:** Artwork width reduction (A3 at 576px) saves ~40% with a 1.29× upscale penalty. Icon resolution reduction (I4 at 96px) saves ~28% with the icons displayed at full 96px (no scaling). The current pipeline already uses both 576px artwork and 96px icons — these experiments confirm the production settings are at the aggressive end of the spectrum.

---

*This investigation was conducted on 2026-07-20. No production files, assets, or renderer code were modified. All recommendations should be validated by the design team before implementation.*
