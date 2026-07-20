# Technology Card Renderer

## Artwork lifecycle

```
Artist
    ↓
domain-collage.png         ← reference/import asset (source/artwork/technology/)
overlay-collage.png
    │
    ▼
npm run bootstrap:tech-artwork   ← one-time import (safe — refuses to overwrite)
    │
    ▼
domains/*.png              ← CANONICAL SOURCE ARTWORK (hand-editable)
overlays/*.png               Never overwritten by any normal build.
    │
    ├── npm run build:tech-cards
    │       ▼
    │   generated/cards-tech/tech_*.svg
    │
    └── npm run generate:tech-preview
            ▼
        generated/cards-tech/preview/artwork/tech_*.png
```

## Ownership rules

| Path | Role | Modified by |
|---|---|---|
| `source/artwork/technology/domain-collage.png` | Reference import asset | Artist only |
| `source/artwork/technology/overlay-collage.png` | Reference import asset | Artist only |
| `source/artwork/technology/domains/*.png` | **Canonical source artwork** | Artist or `bootstrap:tech-artwork --force` |
| `source/artwork/technology/overlays/*.png` | **Canonical source artwork** | Artist or `bootstrap:tech-artwork --force` |
| `generated/cards-tech/*.svg` | Build output | `build:tech-cards` |
| `generated/cards-tech/preview/` | Build output | `generate:tech-preview` |

`build:tech-cards` and `generate:tech-preview` are **read-only** consumers.
They never write to `source/artwork/technology/`.

`bootstrap:tech-artwork` is a **one-time import tool**. It refuses to overwrite
existing domain/overlay PNGs unless `--force` is passed.

## Renderer pipeline

```
source/data/technologies.json          (canonical — Step 1, hand-authored)
        │  npm run build:tech-model
        ▼
generated/models/technologies.json     (renderer model — Step 2)
        │
source/data/technology-artwork-map.json  (domain + overlay per technology id)
        │
        ├── npm run build:tech-cards
        │       ▼
        │   generated/cards-tech/tech_*.svg   (40 SVGs — Sharp-composed artwork embedded)
        │
        └── npm run generate:tech-preview
                ▼
            generated/cards-tech/preview/artwork/tech_*.png   (40 artwork previews)
```

The renderer reads **only** `generated/models/technologies.json` and the artwork map
`source/data/technology-artwork-map.json`. It does not read the canonical file, the
reference project, or any gameplay repository code.

Command: `npm run build:tech-cards`.

## Layout regions

Card canvas: `744 × 1039` (same base dimensions as the planet pipeline). Regions, top to
bottom, all derived from `compiler/lib/technology/layout.js`:

```
┌─────────────────────────────────────────────┐  ← outer frame (rounded rect, stroke)
│ ┌─────────────────────────────────────────┐ │
│ │            ARTWORK WINDOW                │ │  grey placeholder rect
│ │          "artwork: unassigned"           │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ TITLE BAR     name ............ [ II ]   │ │  name + roman level badge (top-right)
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │  ── PROJECT BOX (Project cards only)
│ │ Project: <name>                          │ │
│ │ <projectDescription>                     │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ RULES BOX     <description>              │ │  technology description
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ FOOTER         <displayType>             │ │  technology type
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- **outer frame** — rounded rectangle border around the whole card.
- **artwork window** — composed procedurally from domain + overlay artwork inside a
  rounded-rect clipping mask (see "Artwork pipeline" below). Falls back to a grey
  placeholder when the mapped asset file is missing.
- **title bar** — technology `name` on the left, roman numeral level badge on the right.
- **project box** — rendered only when `type === "Project"`; shows `projectName` + `projectDescription`.
- **rules box** — the technology `description`.
- **footer** — the `displayType` (Project / Passive / Active / Endgame).

Copies and runtime information are intentionally excluded.

## Module responsibilities

`compiler/split-tech-artwork.js` — one-time bootstrap. Splits the reference collages
into individual tile PNGs. Safe by default (refuses to overwrite existing tiles).
Run via `npm run bootstrap:tech-artwork`. Only executed when explicitly requested;
never part of any normal build pipeline.

`compiler/build-tech-cards.js` — orchestrator. Loads the model, iterates technologies,
computes dynamic rule/footer Y positions, calls `renderArtwork` (async), writes one SVG
per technology, and validates exactly 40 well-formed, uniquely-named SVGs.

`compiler/lib/technology/`
- `layout.js` — all reusable layout constants (card size, margins, region rects, fonts, frame colors).
- `frame.js` — renders the outer frame rectangle.
- `sharp-artwork-compositor.js` — Sharp-based artwork renderer. Loads domain + overlay PNGs, composites them with colour grading, lighting, overlay blend modes, and vignette. Returns a composed PNG buffer. Single source of truth for all artwork generation.
- `artwork-compositor.js` — thin SVG wrapper around `sharp-artwork-compositor.js`. Calls the Sharp compositor, receives the composed PNG, embeds it as a base64 `<image>` inside the artwork-window `<clipPath>`. No SVG-level compositing logic.
- `title.js` — renders the title bar + roman level (integrated, right-aligned); also exports `escapeXml` and `fontAttr`.
- `project.js` — renders the conditional project box.
- `rules.js` — renders the rules text box (word-wrapped).
- `flavor.js` — renders the always-present flavor text region.
- `footer.js` — renders the footer type bar.
- `svg.js` — wraps a body string into a complete `<svg>` document with `<metadata>` and `<defs>`.

Each module has a single small responsibility so future artwork composition requires
minimal changes.

## Artwork pipeline

Artwork is composed via Sharp and embedded as a single base64 PNG.
`compiler/lib/technology/sharp-artwork-compositor.js` is the single source of truth
for all artwork generation. The renderer (`build-tech-cards.js`) supplies the artwork-window
rectangle and the per-technology `domain` / `overlay` from the mapping file.

### Artwork mapping

`source/data/technology-artwork-map.json` is the single source of truth that maps every
technology `id` to a `domain` (one of 8 domain illustrations) and an `overlay` (one of 5
overlay motifs). The renderer **never** hardcodes these assignments.

Asset locations (files supplied separately, dropped in by the art pipeline):

```
source/artwork/technology/domains/<domain>.png    (8 illustrations)
source/artwork/technology/overlays/<overlay>.png  (5 motifs)
```

A missing asset file is not fatal: the compositor falls back to a grey placeholder labelled
with the missing domain id, and the renderer prints a warning. This keeps all 40 cards
renderable while art is still being produced.

### Compositor pipeline

All composition happens in `sharp-artwork-compositor.js` using Sharp's image processing
pipeline. The composition is minimal — no colour grading, lighting, glow, or masking:

```
Step 1  Domain artwork    resized to artwork window (fit: cover, lanczos3)
Step 2  Overlay artwork   resized to same dimensions (fit: cover, lanczos3)
Step 3  Composite         overlay blended over domain (overlay mode, ~12% opacity)
```

#### ART_CONFIG fields

- `blendMode` — overlay blend mode (`overlay`)
- `overlayOpacity` — overlay opacity (0.12)

### Overlay placement

The overlay covers the full artwork window at the same position and size as the
domain. No scaling, rotation, anchor, or position offsets are applied. The overlay
extends edge-to-edge and is cropped by the artwork clipping rectangle.

### SVG embedding

`artwork-compositor.js` is a thin wrapper that calls the Sharp compositor, receives the
composed PNG, and embeds it into SVG:

```xml
<g clip-path="url(#artclip-xxx)">
  <image href="data:image/png;base64,..." width="696" height="420" preserveAspectRatio="xMidYMid slice" />
</g>
```

The SVG renderer no longer performs any pixel-level compositing. All blend modes, masks,
gradients, lighting, and vignette effects are handled by Sharp at the raster level.

### Preview generation

`compiler/generate-tech-preview.js` calls `composeArtwork()` directly and writes the
resulting PNG to `generated/cards-tech/preview/artwork/`. The preview artwork is the
exact same buffer embedded in the SVG card — guaranteed pixel-identical.

### Future extension points

- **Per-card overrides** — add per-technology transform overrides in the mapping file and
  have the compositor read them.
- **Real assets** — drop the domain/overlay PNGs into the paths above; no code change needed.
- **Vignette/gradient tuning** — `GRADIENT_OPACITY` and `VIGNETTE_OPACITY` constants.

## SVG requirements

Pure SVG. Artwork is embedded as a single base64 PNG `<image>` inside a clipping group; all
other regions use rounded rectangles and text. No external runtime assets, no gradients on
the card frame, no flavor generation.

## Validation

The renderer aborts on failure if:
- the renderer model is missing (run `build:tech-model` first),
- the artwork map is missing,
- any technology `id` lacks a mapping entry,
- the technology count is not exactly 40,
- a duplicate output filename is produced,
- any generated SVG is not well-formed (single `<svg>`…`</svg>` root),
- fewer than 40 SVGs are written.

Missing domain/overlay **asset files** do not abort — they fall back to the grey
placeholder and are reported as warnings, so the full set of 40 cards always renders.

### Determinism

Running `npm run build:tech-cards` twice produces identical SVG output. The Sharp
compositor uses deterministic settings (lanczos3 kernel, PNG compression level 9,
no random seeds).

### Self-contained SVG invariant

Every generated technology card SVG is a **fully standalone distributable asset**.

| Property | Status |
|---|---|
| Self-contained | ✓ All dependencies embedded |
| Deterministic | ✓ Byte-identical across builds |
| Portable | ✓ Renders identically on any machine |
| Offline-capable | ✓ Zero network requests required |
| Artwork embedded | ✓ Base64 PNG via Sharp compositor |
| Fonts embedded | ✓ Base64 WOFF2 @font-face rules |

**No external dependencies.** Each SVG contains everything needed to render:

- **Fonts**: `Exo2-SemiBold.woff2`, `Inter-Regular.woff2`, `Inter-Italic.woff2` are
  loaded from `source/fonts/`, base64-encoded, and injected as `@font-face` rules
  in a `<style>` block inside `<defs>`.
- **Artwork**: composited domain + overlay PNG is base64-encoded and embedded via
  `<image href="data:image/png;base64,...">`.
- **Validation**: The build rejects any SVG containing `href="` (outside `data:`),
  `url(http`, `@import`, or `<link` — ensuring zero external resource references.

The font embedding module lives at `compiler/lib/svg/font-embed.js` and caches
fonts across the 40-card build for deterministic, single-read-per-font behaviour.

### Preview verification

Preview artwork is generated by calling the same `composeArtwork()` function that
produces the embedded SVG artwork. The preview PNGs in
`generated/cards-tech/preview/artwork/` are byte-identical to the artwork embedded
in the SVGs.

### Single compositor

`sharp-artwork-compositor.js` is the only module that performs pixel-level artwork
composition. `artwork-compositor.js` is a thin SVG wrapper with no compositing logic.
