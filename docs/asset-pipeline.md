# Mercurio Design — Asset Pipeline

**Version:** 1.0
**Status:** Canonical

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      SOURCE ASSETS                              │
│                                                                 │
│  CSV Data     Artwork (864×1216)     Resource Icons (352×384)   │
│  (game data)  (9 PNGs)               (8 PNGs)                   │
│                                                                 │
│  Design Tokens  (colors.json, typography.json, spacing.json,    │
│                   effects.json)                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  compiler/build-card-model.js                    │
│                                                                 │
│  Reads:  PlanetResources_v3.csv + PlanetType_v3.csv             │
│  Validates:  resource names, planet types, card IDs             │
│  Emits:  structured, validated card model                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               generated/models/planets.json                      │
│                                                                 │
│  Canonical intermediate model. 81 planet entries.               │
│  Each entry:  id, planetType, inputs[], outputs[]               │
│                                                                 │
│  This is the single source of truth that every renderer         │
│  consumes.  No renderer ever parses CSV directly.               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              compiler/optimize-assets.js (internal)              │
│                                                                 │
│  Reads:  source artwork (864×1216) + source icons (352×384)     │
│  Resizes:  artwork → 576×811, icons → 96×96 (high-quality)     │
│  Emits:  generated/optimized-assets/ (PNGs)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   compiler/build-cards.js                        │
│                                                                 │
│  Reads:  planets.json + optimized artwork + optimized icons     │
│  Composes:  3-layer card (artwork → panel → icons)              │
│  Emits:  81 individual card SVGs + contact sheet + index        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     generated/cards/                             │
│                                                                 │
│  card_001_1.svg  ...  card_027_3.svg  (81 cards)               │
│  index.json                     — card index for consumers      │
│  contact-sheet.svg              — 9×9 visual grid of all cards  │
│                                                                 │
│  Every file in this directory is disposable.                    │
│  Delete them all, run  npm run build:cards , and they           │
│  reappear identically.                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              compiler/optimize-svg.mjs (internal)                │
│                                                                 │
│  Reads:  generated/cards/card_*.svg                             │
│  Optimizes:  SVGO multi-pass (remove metadata, minify, etc.)    │
│  Rewrites:  optimized SVGs in place                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      compiler/export-bga.js                      │
│                                                                  │
│  Reads:  generated/cards/card_*.svg + planets.json              │
│  Copies:  SVGs → exports/bga/img/                              │
│  Copies:  planets.json → exports/bga/data/                      │
│  Generates:  manifest.json (version, resolutions, statistics)   │
│  Validates:  81 SVGs, artwork embedded, filenames match model   │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         exports/bga/                              │
│                                                                  │
│  img/card_001_1.svg  ...  card_027_3.svg                       │
│  data/planets.json                                               │
│  manifest.json                                                   │
│                                                                  │
│  Ready for BGA Studio import.                                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BGA Studio                               │
│                                                                  │
│  Final consumer. Imports exports/bga/ assets into the            │
│  Board Game Arena project repository.                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Source Assets

Source assets are manually curated, version-controlled, and immutable. They are the legal inputs to the pipeline. No generated file is ever used as input to a later pipeline stage.

### CSV Data — `source/csv/planets/`

Two CSV files are consumed by the pipeline to define the 81 planet cards:

| File | Content | Pipeline Stage |
|---|---|---|
| `PlanetResources_v3.csv` | Per-card input and output resources at each production level (L1, L2, L3) | `build:model` |
| `PlanetType_v3.csv` | Maps each card filename to a planet type (Swamp, Scrap, Proto, etc.) | `build:model` |

Two additional CSV files (`PlanetBenefits_v3.csv`, `Mercurio_planet_layout_v3.csv`) are present in the source directory for future use but are not yet consumed by the pipeline.

CSV is the interchange format because it is human-editable in spreadsheets, diffable in version control, and language-agnostic. Game designers modify CSVs directly; they never touch code.

### Artwork — `source/artwork/cards/planet/planets/`

One V2 PNG per planet type (9 files: `cold-v2.png`, `earth-v2.png`, ..., `swamp-v2.png`). Each is a single raster image at 864×1216 px containing both the planet and its surrounding space. Multiple cards of the same type share the same artwork.

*Original full-resolution masters are archived at `source/archive/planets/`.*

The space background — `source/artwork/cards/planet/backgrounds/deep-space-v1.png` — is a compositional fallback and may be reused by future card types.

### Resource Icons — `source/icons/resources/`

Eight PNG icons (Algae, Crate, Electronics, Grain, Human, Ore, Robot, Water) at 352×384 px. These are resized to 96×96 px during the asset optimization stage and embedded as base64 data URIs into card SVGs at build time. Icons are the only gameplay-communicating visual element on a card; artwork communicates theme only.

*Original full-resolution masters are archived at `source/archive/icons/`.*

### Planet Type Icons — `source/icons/planet-types/`

Nine SVG icons, one per planet type. Currently reserved for future card layouts (technology cards, contract cards) that require a compact planet-type indicator.

### Design Tokens — `source/style/`

Four JSON files form the design system:

| File | Tokens |
|---|---|
| `colors.json` | Semantic colour values |
| `typography.json` | Font families, sizes, weights |
| `spacing.json` | Radii, margins, grid, icon sizes |
| `effects.json` | Shadows, strokes, opacity, glow |

Tokens are renderer-agnostic. The same `colors.json` can drive SVG output, a web UI, a BGA interface, or a print layout.

---

## 2. Canonical Model — `generated/models/planets.json`

### Why It Exists

CSV is the authoring format, but it is not a good consumption format. Every renderer would need to reimplement CSV parsing, resource-name resolution, type mapping, and validation. The canonical model solves this:

- **Normalisation.** Resource names like `"Crate"` and `"Crats"` (typo) are caught at model-build time, not at render time.
- **Validation.** Every card ID, planet type, and resource reference is checked before any renderer runs.
- **Stability.** Renderers depend on a stable JSON schema (`planets[].id`, `.planetType.id`, `.inputs[].resource.displayName`, etc.), not on CSV column names that may shift.
- **Performance.** JSON parsing is faster than CSV parsing. The model is loaded once and held in memory.
- **Single source of truth.** Every downstream consumer — SVG renderer, HTML preview, future export targets — reads the same file.

### Schema (simplified)

```json
{
  "schema": "v1",
  "planetCount": 81,
  "planets": [
    {
      "id": "card_001",
      "planetType": {
        "id": "swamp",
        "displayName": "Swamp",
        "artwork": "swamp-v2",
        "background": "deep-space-v1"
      },
      "inputs": [
        { "resource": { "id": "algae", "displayName": "Algae" }, "level": 1 }
      ],
      "outputs": [
        { "resource": { "id": "crate", "displayName": "Crate" }, "level": 1 }
      ]
    }
  ]
}
```

The model is tracked in git. It is the canonical intermediate artifact — not disposable, but still regenerable.

---

## 3. Renderer — `compiler/build-cards.js`

### Responsibilities

| Responsibility | Detail |
|---|---|
| Load the model | Read `generated/models/planets.json` |
| Resolve artwork | Map `planetType.id` to the correct `{type}-v2.png` file |
| Embed icons | Load resource PNGs, convert to base64 data URIs |
| Compose layers | Stack artwork → information panel → resource icons per the three-layer card specification |
| Emit SVGs | Write one SVG per planet card, plus `index.json` and `contact-sheet.svg` |
| Validate | Verify icon count, artwork presence, and expected card distribution |

### Ownership

The renderer owns:

- **Composition.** How layers stack, where elements are positioned on the canvas.
- **Typography.** Font choices, sizes, alignment (future).
- **SVG generation.** The XML structure of the output files.
- **Validation.** Ensuring every card has the correct number of icons and all referenced assets exist.

The renderer does **not** own:

- **Game data.** Inputs, outputs, types, names — all come from the model.
- **Artwork.** Artwork is selected by type, not defined by the renderer.
- **Icons.** Icons are sourced from the icon library, not generated by the renderer.

### What Makes a Good Renderer

A renderer should be replaceable. If the project switches from SVG to a different output format (WEBP, PDF, BGA sprites), a new renderer should be able to consume the same model and emit different output. The model is the contract.

---

## 4. Generated Assets — `generated/cards/`

### Files

| File | Contents |
|---|---|---|
| `card_001_1.svg` ... `card_027_3.svg` | 81 individual full-size planet card SVGs (744×1039 px) |
| `index.json` | Card index mapping IDs to planet types |
| `contact-sheet.svg` | 9×9 grid contact sheet showing all 81 cards as thumbnails |

### Disposability

Every file in `generated/` is a build artifact. They are:

- **Never edited by hand.** If a card SVG is wrong, you fix the source assets and rebuild.
- **Never committed to version control.** The `.gitignore` excludes them.
- **Identical on every build.** Given the same source assets and compiler version, the output is deterministic.

The only exception is `generated/models/planets.json`, which is tracked in git as the canonical intermediate model.

---

## 5. Design Principles

### Source Assets Are Immutable

CSV files, artwork PNGs, icons, SVG templates, and design tokens are manually curated and version-controlled. They change through deliberate commits, never through pipeline output.

### Generated Assets Are Disposable

Anything in `generated/` can be deleted and rebuilt with zero information loss. The pipeline is the source of truth for generated output.

### Gameplay Data Is Separate from Presentation

CSV files define what a card does (resources, costs, benefits). Templates define where elements appear on the card. Artwork defines how the card looks. These layers never cross. A designer can change a template without touching game data, and vice versa.

### Renderer Owns Composition and Layout

The renderer decides how to compose the final visual. It resolves artwork paths, embeds icons, and positions elements. No source asset contains layout logic. The renderer hardcodes all layout constants (row positions, margins, icon offsets), making it the single source of truth for card composition.

### Models Own Semantics

The canonical model (`planets.json`) transforms raw CSV rows into structured, validated, semantically named data. Every downstream consumer reads the model, never the CSV.

### Artwork Owns Flavour

Artwork communicates planet type and atmosphere. It never carries gameplay information. A colourblind player loses zero functionality if the artwork layer is removed entirely.

---

## 6. Adding New Planet Cards

### Workflow

1. **Edit the CSV source files** in `source/csv/planets/`:
   - Add the new card filename to `PlanetResources_v3.csv` with its input and output resources per production level.
   - Add the card to `PlanetType_v3.csv` to assign it a planet type.
   - Add benefit and layout data to the remaining CSV files.

2. **Ensure the planet type has artwork.** If the type already exists (one of the 9 known types), artwork is already present. For a new type, add a `{type}-v2.png` to `source/artwork/cards/planet/planets/` and register it in `TYPE_ARTWORK` in `build-card-model.js`.

3. **Regenerate the model:**
   ```bash
   npm run build:model
   ```
   This produces a new `generated/models/planets.json` with validation. Fix any validation errors before proceeding.

4. **Regenerate the cards:**
   ```bash
   npm run build:cards
   ```
   This produces 81 (or more) card SVGs in `generated/cards/`.

5. **Verify:**
   - The new cards are present in the output directory.
   - The contact sheet shows them in the correct position.
   - The index includes them.

### What Does NOT Need to Change

- The renderer (`build-cards.js`) does not need modification for new cards within an existing planet type. It reads the model dynamically.
- The renderer (`build-cards.js`) is the source of truth for card layout. Layout changes are made in the renderer, not in templates.
- The design tokens do not change unless new visual properties are introduced.

---

## 7. Repository Philosophy

The repository contains three core pipeline scripts:

- `compiler/build-card-model.js` — CSV → model
- `compiler/build-cards.js` — optimize assets + model → SVGs
- `compiler/export-bga.js` — SVGO + export + manifest + validation

This minimalism is deliberate. Each script has exactly one input, one output, and one responsibility. There is no build system, no task runner, no configuration file to learn. The pipeline is transparent: you can open either script and understand exactly what it does in under a minute.

Future pipeline stages (board generation, WEBP export, BGA packaging, sprite-sheet creation) should follow the same pattern: each stage reads the canonical model (or the output of the previous stage), transforms it, and writes a new artifact. No stage should perform work that belongs to another stage.

This philosophy makes the pipeline:

- **Easy to debug.** When output is wrong, the responsible stage is unambiguous.
- **Easy to extend.** A new export target is a new script that reads `planets.json`, not a modification to an existing script.
- **Easy to parallelise.** Stages are independent and can be run or skipped independently.
- **Resistant to bit rot.** Simple scripts with no dependency graph have fewer ways to break.

---

## 8. Build Commands

The canonical build command runs the full pipeline:

```bash
npm run build
```

This executes: `build:model` → `build:cards` → `export:bga`.

After `npm run build` completes successfully:

- A BGA export bundle is generated at `exports/bga/`
- Runtime assets are written to `exports/bga/img/` — 81 SVGs (`card_001_1.svg` … `card_027_3.svg`)
- The runtime layout is flat (no `img/planets/` subdirectory)
- `exports/bga/manifest.json` contains production metadata

Individual pipeline steps (for reference):

```bash
npm run build:model    # CSV → generated/models/planets.json
npm run build:cards    # optimize PNGs + render 81 SVGs
npm run export:bga     # SVGO → copy → manifest → exports/bga/
```

For development, run `npm run build` after any change to CSV data, artwork, or icons.

---

## 9. Technology Artwork

Technology cards use collage source art that is split into individual tile PNGs.
The tile PNGs are now the **canonical source artwork** and are hand-editable.
They are never overwritten by any normal build.

### Ownership model

| Path | Role | Modified by |
|---|---|---|
| `source/artwork/technology/domain-collage.png` | Reference import asset | Artist only |
| `source/artwork/technology/overlay-collage.png` | Reference import asset | Artist only |
| `source/artwork/technology/domains/*.png` | **Canonical source artwork** | Artist or `bootstrap:tech-artwork --force` |
| `source/artwork/technology/overlays/*.png` | **Canonical source artwork** | Artist or `bootstrap:tech-artwork --force` |

### Lifecycle

```
Artist
    ↓
domain-collage.png
overlay-collage.png

    │  npm run bootstrap:tech-artwork   (one-time import)
    ▼

domains/*.png              ← CANONICAL SOURCE — hand-editable
overlays/*.png               Never overwritten during normal builds.

    │  npm run build:tech-cards   (read-only consumer)
    ▼

generated/cards-tech/*.svg
```

### Reference collages — `source/artwork/technology/`

- `domain-collage.png` (also accepted: `tech_domain.png`) — 4 columns × 2 rows (8 domain tiles)
- `overlay-collage.png` (also accepted: `tech_overlay.png`) — 5 columns × 1 row (5 overlay tiles)

The collages are hand-authored and version-controlled. They serve as the reference
source for the one-time bootstrap. They are never modified by the pipeline.

### Bootstrap — `compiler/split-tech-artwork.js`

`npm run bootstrap:tech-artwork` reads each collage, computes tile size from the image
dimensions (`tileWidth = width / columns`, `tileHeight = height / rows` — no hardcoded
coordinates), crops every tile row-major (left-to-right, top-to-bottom), and writes
named PNGs. Colours and transparency are preserved; tiles are cropped, never resized.

**Safe by default:** if any destination tile already exists, the bootstrap refuses to
overwrite it and prints:

```
Artwork already exists. Refusing to overwrite canonical source artwork.
Use: npm run bootstrap:tech-artwork -- --force
if you intentionally want to regenerate everything.
```

Pass `--force` to overwrite all tiles.

The script fails with a clear error if a collage is missing, if the dimensions are not
divisible by the grid, or if an output directory cannot be written.

### Canonical tile PNGs

`source/artwork/technology/domains/` (8 PNGs):

```
exploration.png  energy.png       infrastructure.png  computation.png
biosphere.png    civilization.png commerce.png        transcendence.png
```

`source/artwork/technology/overlays/` (5 PNGs):

```
construction.png  optimization.png  conversion.png  expansion.png  mastery.png
```

These tiles are the **canonical source artwork**. They can be hand-edited in place.
Re-running `npm run bootstrap:tech-artwork -- --force` regenerates them from the collages.

The technology renderer (`build-tech-cards`) is a **read-only consumer**. It never
writes to these directories.

---

## 10. Compatibility

This document describes the pipeline as of pipeline version 1.0. The schema of `planets.json` is versioned via the `schema` field. Future pipeline revisions should bump this version when making backwards-incompatible changes to the model schema.
