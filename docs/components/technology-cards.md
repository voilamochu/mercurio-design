# Technology Card System

## Architecture Overview

The Technology Card system renders 40 unique technology cards as self-contained SVG files.
Each SVG embeds all required assets (fonts, artwork) as base64 data URIs — zero external
dependencies at render time.

```
source/data/                          — canonical data
source/artwork/technology/            — source artwork collages + tiles
source/fonts/                         — WOFF2 font files
    ↓
compiler/                             — build scripts and libraries
    ↓
generated/models/technologies.json    — renderer model (derived)
generated/optimized-tech-assets/      — resized domain/overlay PNGs
generated/cards-tech/tech_*.svg       — 40 final card SVGs (post-SVGO)
```

## Folder Structure

```
compiler/
    build-tech-model.js                  # Model derivation (source data → renderer model)
    build-tech-cards.js                  # Card rendering orchestrator
    optimize-tech.js                     # Tech SVG optimization wrapper
    optimize-svg.mjs                     # Shared SVGO runner
    split-tech-artwork.js                # Bootstrap: collage → tile PNGs
    export-tech-bga.js                   # BGA export (stub — not implemented)
    lib/
        svg/font-embed.js                # WOFF2 → base64 @font-face CSS
        technology/
            layout.js                    # All card dimensions, positions, fonts, colors
            frame.js                     # Outer frame rectangle renderer
            title.js                     # Title bar + roman level badge
            project.js                   # Project info box (Project-type cards only)
            rules.js                     # Rules text box (word-wrapped)
            flavor.js                    # Flavor text line
            sharp-artwork-compositor.js  # Sharp-based PNG compositor (domain + overlay)
            artwork-compositor.js        # SVG wrapper around compositor (clipPath + image)
            svg.js                       # SVG document wrapper (defs, metadata, fonts)
            optimize-tech-assets.js      # Domain/overlay PNG optimizer
            footer.js                    # Footer type bar (UNUSED — dead code)
    experiments/
        experiment-tech-artwork-resolution.js   # Artwork resolution investigation
        generate-tech-preview.js                 # Standalone artwork preview PNG generator

source/
    data/
        technologies.json                # Canonical technology data (hand-authored)
        technology-artwork-map.json      # Domain/overlay assignment per tech id
    artwork/technology/
        tech_domain.png                  # Domain collage (bootstrap input)
        tech_domain_old.png              # Previous version (archived reference)
        tech_overlay.png                 # Overlay collage (bootstrap input)
        domains/                         # 8 individual domain PNGs (bootstrap output)
        overlays/                        # 5 individual overlay PNGs (bootstrap output)
    fonts/
        Exo2-SemiBold.woff2
        Exo2-Bold.woff2
        Inter-Regular.woff2
        Inter-Italic.woff2
        Inter-Medium.woff2

generated/
    models/technologies.json             # Renderer model (build output)
    optimized-tech-assets/
        domains/                         # Resized domain PNGs (8)
        overlays/                        # Resized overlay PNGs (5)
    cards-tech/
        tech_000.svg .. tech_039.svg     # 40 final cards (SVGO-optimized)
        preview/artwork/                 # PNG previews (generate-tech-preview output)

docs/
    technology-renderer.md              # Renderer pipeline documentation
    technology-model.md                 # Model derivation documentation
    technology-data-model.md            # Canonical data format documentation
    experiments/
        technology-artwork-resolution.md  # Artwork resolution experiment report
    components/
        technology-cards.md             # THIS FILE — system overview

scripts/
    gen-technologies.cjs                # One-time data generation from reference repo
    validate-technologies.cjs           # Schema validation for technologies.json
```

## Ownership

| Path | Owner | Description |
|---|---|---|
| `compiler/build-tech-model.js` | Renderer engineer | Model derivation from canonical data |
| `compiler/build-tech-cards.js` | Renderer engineer | Card SVG generation orchestrator |
| `compiler/lib/technology/` | Renderer engineer | Layout, frame, title, rules, flavor, artwork, SVG modules |
| `compiler/lib/svg/font-embed.js` | Renderer engineer | Font embedding subsystem |
| `compiler/split-tech-artwork.js` | Renderer engineer | Bootstrap artwork import tool |
| `compiler/experiments/` | Any contributor | One-off investigations and preview utilities |
| `source/data/technologies.json` | Game designer | Canonical card data (hand-edited) |
| `source/data/technology-artwork-map.json` | Art director | Domain/overlay assignments |
| `source/artwork/technology/domains/` | Artist | 8 domain illustrations |
| `source/artwork/technology/overlays/` | Artist | 5 overlay motifs |
| `source/fonts/` | Art director | Brand fonts |
| `generated/` | Build | All build output; never hand-edited |

## Artwork Lifecycle

```
Artist creates domain-collage.png and overlay-collage.png
    ↓
npm run bootstrap:tech-artwork
    ↓
source/artwork/technology/domains/*.png      ← canonical source (8 files)
source/artwork/technology/overlays/*.png     ← canonical source (5 files)
    ↓
npm run build:tech-cards  (calls optimizeTechAssets internally)
    ↓
generated/optimized-tech-assets/domains/    ← resized to ARTWORK_RENDER_WIDTH × HEIGHT
generated/optimized-tech-assets/overlays/
```

The bootstrap script (`compiler/split-tech-artwork.js`) splits a grid collage into
individual tile PNGs. It refuses to overwrite existing tiles unless `--force` is passed.

## Bootstrap Lifecycle

Bootstrap is a one-time import step. It is never part of any normal build.

```bash
# Initial import (refuses to overwrite existing files):
npm run bootstrap:tech-artwork

# Re-import (overwrites existing tiles):
npm run bootstrap:tech-artwork -- --force
```

The script accepts the following input files (in order of preference per job):
- Domain collage: `domain-collage.png` or `tech_domain.png`
- Overlay collage: `overlay-collage.png` or `tech_overlay.png`

## Build Lifecycle

```bash
# Full production build:
npm run build                    # build:model + build:cards + build:tech-model + build:tech-cards

# Or step by step:
npm run build:tech-model         # Derive renderer model from canonical data
npm run build:tech-cards         # Render 40 card SVGs (includes asset optimization + SVGO)
```

The build pipeline:
1. `build:tech-model` — reads `source/data/technologies.json`, validates, derives renderer
   model (adds `assetId`, `romanLevel`, `frameStyle`, `frameColor`, etc.), writes
   `generated/models/technologies.json`.
2. `build:tech-cards` — reads the model and artwork map, optimizes domain/overlay PNGs,
   composes artwork via Sharp, renders card SVGs, embeds fonts, runs SVGO.

## Optimization Pipeline

Two layers of optimization occur during `build:tech-cards`:

**Layer 1 — Asset optimization (Sharp):**
- Domain PNGs are resized to ARTWORK_RENDER_WIDTH × ARTWORK_RENDER_HEIGHT (384×320)
  with lanczos3 kernel, flattened, PNG compressed at level 9 with effort 10.
- Overlay PNGs are resized identically, flattened, PNG compressed.
- Output: `generated/optimized-tech-assets/domains/` and `overlays/`

**Layer 2 — SVG optimization (SVGO):**
- After all 40 SVGs are rendered, `optimize-svg.mjs` runs SVGO on every file in
  `generated/cards-tech/`.
- Configuration: `svgo.config.mjs` (multipass, removes metadata/comments/dimensions,
  minifies styles, collapses groups, merges paths, etc.).

## Rendering Pipeline

```
technologies.json  ──→ build-tech-model ──→ generated/models/technologies.json
                                                  │
technology-artwork-map.json  ─────────────────────┤
                                                  ▼
                                          build-tech-cards
                                                  │
                                    ┌─────────────┴──────────────┐
                                    ▼                            ▼
                    generated/cards-tech/          generated/optimized-tech-assets/
                    tech_000.svg .. 39              domains/ + overlays/
                                    │
                                    ▼ (SVGO)
                    generated/cards-tech/
                    (post-SVGO, same path)
```

### Artwork Composition

All artwork is composed server-side by Sharp (`sharp-artwork-compositor.js`):

```
Domain PNG  ──resize(384×320, lanczos3, cover)──┐
                                                  ├── composite(overlay blend, 12% opacity) ── PNG buffer
Overlay PNG ──resize(384×320, lanczos3, cover)──┘
```

The composed PNG is base64-encoded and embedded as an `<image>` inside a clipped group:

```xml
<g clip-path="url(#artclip-tech_000)">
  <image href="data:image/png;base64,..." width="696" height="580"
         preserveAspectRatio="xMidYMid slice"/>
</g>
```

The SVG wrapper (`artwork-compositor.js`) handles the clip-path definition and image
embedding. It contains zero pixel-level compositing logic.

### Card Layout

Card dimensions: **744 × 1039 px** (matching planet card canvas).

All layout constants derive from `compiler/lib/technology/layout.js`:

```
┌─ outer frame (rounded rect, 16px stroke) ──────────────────┐
│ ┌─ title bar ─────────────────────────────────── [ III ] ─┐ │
│ │  Technology Name                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ artwork window (696×580) ──────────────────────────────┐ │
│ │  [composed domain + overlay via Sharp, clipped]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ project box (Project cards only) ──────────────────────┐ │
│ │  Project: Frontier Initiative                            │ │
│ │  Build a Resort Complex on a cold or tundra world...    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ rules box ─────────────────────────────────────────────┐ │
│ │  Gain 1 reputation for each level 3 technology you...  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                flavor text line                             │
└─────────────────────────────────────────────────────────────┘
```

### Frame Colors by Type

| Type | Color | Hex |
|---|---|---|
| Project | Gold | `#b9852f` |
| Passive | Blue | `#3a6ea5` |
| Active | Green | `#2e8b57` |
| Endgame | Purple | `#6a3aa5` |

## Self-Contained SVG Strategy

Every generated SVG is a fully standalone distributable asset:

| Property | Status |
|---|---|
| Self-contained | ✓ All dependencies embedded as data URIs |
| Deterministic | ✓ Byte-identical across builds |
| Portable | ✓ Same rendering on any SVG engine |
| Offline-capable | ✓ Zero network requests |
| Artwork embedded | ✓ Base64 PNG (Sharp-composited) |
| Fonts embedded | ✓ Base64 WOFF2 @font-face |

Validation in `build-tech-cards.js` rejects any SVG containing:
- `href="` without `data:` scheme
- `url(http` external references
- `@import` statements
- `<link` elements

## Embedded Font Strategy

Font embedding lives in `compiler/lib/svg/font-embed.js`.

Three font faces are embedded as base64 WOFF2 data URIs in `<style>` blocks within `<defs>`:

| Family | Weight | Style | File |
|---|---|---|---|
| Exo 2 | 600–700 | normal | Exo2-SemiBold.woff2 |
| Inter | 400–500 | normal | Inter-Regular.woff2 |
| Inter | 400 | italic | Inter-Italic.woff2 |

A fifth font file (`Exo2-Bold.woff2`, `Inter-Medium.woff2`) exists in `source/fonts/` but
is not currently embedded. Add to `FONT_FACES` array in `font-embed.js` to include.

Font CSS is cached after first generation for deterministic, single-read-per-build
behaviour.

## Commands

| Command | Script | Description |
|---|---|---|
| `npm run bootstrap:tech-artwork` | `compiler/split-tech-artwork.js` | Split collage → tiles (safe: no overwrite) |
| `npm run build:tech-model` | `compiler/build-tech-model.js` | Derive renderer model from canonical data |
| `npm run build:tech-cards` | `compiler/build-tech-cards.js` | Render 40 SVGs + optimize assets + SVGO |
| `npm run optimize:tech` | `compiler/optimize-tech.js` | Re-run SVGO on existing tech SVGs |
| `npm run export:tech-bga` | `compiler/export-tech-bga.js` | BGA export (stub — not implemented) |
| `npm run generate:tech-preview` | `compiler/experiments/generate-tech-preview.js` | Generate PNG artwork previews |

## Extension Points

### Adding a new technology card
1. Add entry to `source/data/technologies.json`
2. Add artwork mapping in `source/data/technology-artwork-map.json`
3. Provide domain/overlay artwork PNGs (or use existing)
4. Run `npm run build`

### Adding a new domain illustration
1. Drop new PNG into `source/artwork/technology/domains/`
2. Reference by filename (without extension) in `technology-artwork-map.json`

### Adding a new overlay motif
1. Drop new PNG into `source/artwork/technology/overlays/`
2. Reference by filename (without extension) in `technology-artwork-map.json`

### Changing card layout
- Edit layout constants in `compiler/lib/technology/layout.js`

### Changing artwork composition
- Edit composition parameters (`blendMode`, `overlayOpacity`) in
  `compiler/lib/technology/sharp-artwork-compositor.js`

### Adding a new embedded font
- Add `.woff2` file to `source/fonts/`
- Add entry to `FONT_FACES` array in `compiler/lib/svg/font-embed.js`

### Changing SVG optimization
- Edit `svgo.config.mjs`

## Future Improvements

- **Per-card artwork overrides** — allow per-technology transform overrides in artwork map
- **Real assets** — domain/overlay PNGs are ready; drop in final artwork at higher resolution
- **Artwork resolution tuning** — experiments show 512×427 is viable (13% SVG reduction).
  See `compiler/experiments/experiment-tech-artwork-resolution.js` and
  `docs/experiments/technology-artwork-resolution.md`.
- **BGA export** — `compiler/export-tech-bga.js` is a stub; implement when format is decided.
- **Tech card contact sheet** — add contact-sheet generation to build for visual review.
- **Footer module** — `compiler/lib/technology/footer.js` is currently unused dead code.
  Integrate into the card layout if a type footer is desired.
