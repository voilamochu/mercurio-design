# Mercurio Design — Asset Pipeline

**Version:** 2.0
**Status:** Canonical

---

## Pipeline Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. BOOTSTRAP (one-time only)                                       │
│  ─────────────────────────────                                       │
│  bootstrap:tech-artwork   Split collages → domain/overlay tiles     │
│                           (safe by default, --force to overwrite)    │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. ASSET GENERATION                                                │
│  ────────────────────────                                            │
│  build:model            CSV → generated/models/planets.json         │
│  build:cards            Optimize PNGs → render 81 planet card SVGs  │
│  build:tech-model       technologies.json → generated/models/       │
│  build:tech-cards       Render 40 technology card SVGs              │
│  build:resource-icons   Optimize + export 11 resource icon PNGs     │
│                                                                     │
│  These commands NEVER:                                              │
│  • Copy files into another repository                               │
│  • Optimize assets                                                  │
│  • Split artwork                                                    │
│  • Modify source artwork                                            │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. OPTIMIZATION (placeholders — to be implemented)                 │
│  ─────────────────────────────────────────────                      │
│  optimize:planet        SVGO optimization for planet card SVGs      │
│  optimize:tech          SVGO optimization for technology card SVGs  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. DEPLOYMENT                                                      │
│  ──────────────                                                     │
│  export:planet-bga        Copy + manifest → exports/bga/            │
│  export:tech-bga          Copy tech SVGs + data → exports/bga/      │
│  export:resource-icons-bga  Copy resource icon PNGs → exports/bga/  │
│                                                                     │
│  These commands NEVER:                                              │
│  • Rebuild assets                                                   │
│  • Optimize assets                                                  │
│  • Modify source artwork                                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Pipeline Overview (Planet Cards)

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

### Card Resource Icons — `source/icons/resources/`

Eight PNG icons (Algae, Crate, Electronics, Grain, Human, Ore, Robot, Water) at 352×384 px. These are resized to 96×96 px during the asset optimization stage and embedded as base64 data URIs into card SVGs at build time. Icons are the only gameplay-communicating visual element on a card; artwork communicates theme only.

*Original full-resolution masters are archived at `source/archive/icons/`.*

### Standalone Resource Icons — `source/artwork/resources/`

Eleven PNG icons (`grain.png`, `water.png`, `algae.png`, `ore.png`, `robot.png`, `electronics.png`, `crate.png`, `power.png`, `science.png`, `population.png`, `influence.png`) — the complete resource icon set as standalone export assets.

These are the **canonical source assets** for the resource icon pipeline. They are never modified by any build. The manifest at `source/data/resource-icons.json` is the single source of truth — the exporter consumes only this manifest and never scans directories.

Unlike the card resource icons (which are optimized and embedded into card SVGs), these icons are exported as standalone PNGs for direct use by the BGA client. They undergo metadata stripping and deterministic compression but are never resized or recolored.

The canonical PNGs are generated by `bootstrap:resource-icons` from two bootstrap collages:

| Collage | Location | Source Icons |
|---|---|---|
| `ResourceIcons.png` | `source/artwork/icons/` | Archival — not consumed by the pipeline |
| `ResourceIcons_2.png` | `source/artwork/resources/` | `science`, `power`, `influence` |

Both collages are bootstrap assets only. The build and release pipelines consume only the generated canonical PNGs and never the collages directly.

| Resource | File | Role |
|---|---|---|
| Grain | `grain.png` | Basic food resource |
| Water | `water.png` | Basic liquid resource |
| Algae | `algae.png` | Organic resource |
| Ore | `ore.png` | Mineral resource |
| Robot | `robot.png` | Automated labor |
| Electronics | `electronics.png` | Advanced component |
| Crate | `crate.png` | Manufactured goods |
| Power | `power.png` | Energy resource |
| Science | `science.png` | Research output |
| Population | `population.png` | Workforce |
| Influence | `influence.png` | Political capital |

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

The repository contains layered pipeline scripts divided into four stages:

| Stage | Scripts | Responsibility |
|---|---|---|
| Bootstrap | `compiler/split-tech-artwork.js` | One-time artwork import |
| Generation | `compiler/build-*.js` | Produce validated models and rendered SVGs |
| Optimization | `compiler/optimize-*.js` | (Placeholder) SVGO and asset optimisation |
| Deployment | `compiler/export-*.js` | Copy + manifest into target repository |

Each script has exactly one input, one output, and one responsibility. There is no build system, no task runner, no configuration file to learn. The pipeline is transparent: you can open either script and understand exactly what it does in under a minute.

Future pipeline stages should follow the same pattern: each stage reads the canonical model (or the output of the previous stage), transforms it, and writes a new artifact. No stage should perform work that belongs to another stage.

This philosophy makes the pipeline:

- **Easy to debug.** When output is wrong, the responsible stage is unambiguous.
- **Easy to extend.** A new export target is a new script that reads the model, not a modification to an existing script.
- **Easy to parallelise.** Stages are independent and can be run or skipped independently.
- **Resistant to bit rot.** Simple scripts with no dependency graph have fewer ways to break.

---

## 8. Build Commands

### Quick Reference

| Command | Purpose |
|---|---|
| `bootstrap:tech-artwork` | One-time split of technology collages into domain/overlay tiles |
| `build` | Generate all artwork assets (model + cards for planets, technology, and contracts) |
| `build:assets` | Generate all visual assets (planet cards + tech cards + resource icons) |
| `build:model` | CSV → `generated/models/planets.json` |
| `build:cards` | Optimize PNGs → render 81 planet card SVGs |
| `build:tech-model` | `technologies.json` → `generated/models/technologies.json` |
| `build:tech-cards` | Render 40 technology card SVGs |
| `build:resource-icons` | Optimize + export 11 resource icon PNGs |
| `optimize:planet` | (Placeholder) Optimize planet card SVGs |
| `optimize:tech` | (Placeholder) Optimize technology card SVGs |
| `deploy` | Run all export commands |
| `export:planet-bga` | SVGO → copy → manifest → `exports/bga/` |
| `export:tech-bga` | Copy technology SVGs + data to BGA export |
| `export:resource-icons-bga` | Copy resource icon PNGs to BGA export |
| `release` | Full pipeline: build → optimize → deploy |

### Primary Commands

**Build — generate all game data assets (no deployment, no optimization):**
```bash
npm run build
```
Executes: `build:model` → `build:cards` → `build:tech-model` → `build:tech-cards` → `build:contract-model`

**Build Assets — generate all visual assets (no deployment, no optimization):**
```bash
npm run build:assets
```
Executes: `build:cards` → `build:tech-cards` → `build:resource-icons`

This is the recommended command after changing any artwork, icons, or card templates.

**Release — full pipeline before committing:**
```bash
npm run release
```
Executes: `build` → `build:resource-icons` → `optimize:planet` → `optimize:tech` → `deploy`

**Deploy — copy generated assets to target repository (no rebuild, no optimization):**
```bash
npm run deploy
```
Executes: `export:planet-bga` → `export:tech-bga` → `export:resource-icons-bga`

### Individual Stages

```bash
npm run build:model              # CSV → generated/models/planets.json
npm run build:cards              # Optimize PNGs + render 81 planet card SVGs
npm run build:tech-model         # technologies.json → generated/models/technologies.json
npm run build:tech-cards         # Render 40 technology card SVGs
npm run build:resource-icons     # Optimize + export 11 resource icon PNGs
npm run export:planet-bga        # Copy planet SVGs + data → exports/bga/
npm run export:tech-bga          # Copy tech SVGs + data → exports/bga/
npm run export:resource-icons-bga # Copy resource icon PNGs → exports/bga/
```

For development, run `npm run build:assets` after any change to artwork, icons, or card templates.

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

## 10. Resource Icons Pipeline

### Ownership

| Path | Role | Modified by |
|---|---|---|
| `source/artwork/resources/ResourceIcons_2.png` | Bootstrap collage (3 icons) | Artist only |
| `source/artwork/resources/*.png` | **Canonical source artwork** | Bootstrap or artist |
| `source/data/resource-icons.json` | **Canonical manifest** | Developer when adding/removing icons |
| `generated/bga/img/*.png` | Build output (disposable) | `build:resource-icons` |
| `exports/bga/img/*.png` | BGA export | `export:resource-icons-bga` |

### Pipeline Diagram

```
Bootstrap collages                    Source icons (legacy)
  ResourceIcons_2.png                   source/icons/resources/
  (science, power, influence)           (8 PascalCase PNGs)
       │                                      │
       ▼  bootstrap:resource-icons            ▼
       │  (compiler/bootstrap-resource-icons.js)
       ▼
source/artwork/resources/*.png         ← CANONICAL SOURCE (11 PNGs)
source/data/resource-icons.json        ← CANONICAL MANIFEST
    │
    ▼  npm run build:resource-icons  (compiler/export-resource-icons.js)
    │
generated/bga/img/*.png               ← optimized PNGs (disposable)
    │
    ▼  npm run export:resource-icons-bga  (compiler/export-resource-icons-bga.js)
    │
exports/bga/img/*.png                 ← BGA-ready (alongside card SVGs)
```

### Pipeline Script — `compiler/export-resource-icons.js`

Responsibilities:

1. **Read** `source/data/resource-icons.json` manifest
2. **Validate** every asset exists, no duplicate ids, no duplicate filenames, no orphaned PNGs, no invalid ids
3. **Optimize** each PNG using deterministic Sharp settings (metadata stripping, `compressionLevel: 9`, `palette: true`, `effort: 10`, `adaptiveFiltering: true`)
4. **Write** output to `generated/bga/img/` preserving filenames

Rules the pipeline enforces:

- No resizing — source dimensions are preserved exactly
- No recoloring — pixel data is never modified
- No directory scanning — the manifest is the sole source of truth
- Fail fast on any validation error with a clear message

### BGA Export — `compiler/export-resource-icons-bga.js`

Copies optimized PNGs from `generated/bga/img/` to `exports/bga/img/` (flat, alongside planet and technology card SVGs) and updates `manifest.json` with resource icon metadata.

### Validation Guarantees

| Check | Mechanism |
|---|---|
| Manifest exists | Fails fast if `source/data/resource-icons.json` missing |
| Exactly 11 icons | Validates `resources.length === 11` |
| Every manifest entry exported | Post-export check: all manifest files present in output |
| No orphan PNGs | Rejects source files not in manifest |
| Duplicate ids | Detects and rejects |
| Duplicate filenames | Detects and rejects |
| Invalid ids | Must be lowercase alphanumeric starting with a letter |
| Missing source files | Detects and rejects before any optimization |
| Deterministic output | Fixed Sharp settings produce byte-identical output across runs |
| Source unchanged | Pipeline is read-only on `source/artwork/resources/` |

### Future Extension

To add a new resource icon:

1. Add the artwork to a bootstrap collage in `source/artwork/resources/` (or add individual source PNGs)
2. Update `compiler/bootstrap-resource-icons.js` with the new icon's extraction coordinates or source mapping
3. Add an entry to `source/data/resource-icons.json`
4. Update `EXPECTED_COUNT` in both `compiler/export-resource-icons.js` and `compiler/export-resource-icons-bga.js`
5. Run `npm run bootstrap:resource-icons` to import the new icon
6. Run `npm run build:resource-icons` to verify

### Asset Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   ASSET PIPELINE (three tracks)                   │
│                                                                   │
│  Planet Cards          Technology Cards        Resource Icons     │
│  ─────────────         ───────────────         ──────────────     │
│                        │                        │                 │
│  source/csv/           source/data/             source/data/      │
│   planets/              technologies.json        resource-        │
│                        │                        icons.json       │
│  source/artwork/       source/artwork/          source/artwork/   │
│   cards/planet/         technology/              resources/       │
│   planets/               domains/                (11 PNGs)       │
│   (9 PNGs)              overlays/                                 │
│                        (8+5 PNGs)                                 │
│  source/icons/                                                      │
│   resources/                                                       │
│   (8 PNGs)                                                         │
│                        │                        │                 │
│  ┌──────────────────┐  ┌──────────────────┐    ┌───────────────┐  │
│  │ build:model      │  │ build:tech-model  │    │ build:        │  │
│  │ build:cards      │  │ build:tech-cards  │    │ resource-icons│  │
│  └────────┬─────────┘  └────────┬─────────┘    └───────┬───────┘  │
│           │                     │                       │          │
│  generated/cards/      generated/cards-tech/    generated/bga/     │
│  (81 SVGs)             (40 SVGs)               img/               │
│                                                  (flat PNGs)      │
│           │                     │                       │          │
│           └─────────┬───────────┘                       │          │
│                     │                                   │          │
│                     ▼                                   ▼          │
│           ┌─────────────────────┐              ┌───────────────┐   │
│           │ export:planet-bga   │              │ export:       │   │
│           │ export:tech-bga     │              │ resource-icons│   │
│           └─────────┬───────────┘              │ -bga          │   │
│                     │                          └───────┬───────┘   │
│                     │                                   │          │
│                     ▼                                   ▼          │
│           ┌──────────────────────────────────────────────────────┐  │
│           │              exports/bga/                              │  │
│           │                                                        │  │
│           │  img/  (planet SVGs + tech SVGs + resource PNGs)       │  │
│           │  data/planets.json, data/technologies.json              │  │
│           │  manifest.json                                          │  │
│           └────────────────────────────────────────────────────────┘  │
│                                    │                                  │
│                                    ▼                                  │
│                          bga-mercurio (sync)                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Comparison with Card Pipelines

| Aspect | Planet Cards | Technology Cards | Resource Icons |
|---|---|---|---|
| Source data | CSV files | `technologies.json` | `resource-icons.json` |
| Source artwork | 9 planet PNGs | 13 domain/overlay PNGs | 11 icon PNGs |
| Generation | SVG render | SVG render | PNG optimization only |
| Output format | SVGs (744×1039) | SVGs (744×1039) | PNGs (source resolution) |
| Optimization | SVGO | SVGO | Sharp PNG compression |
| BGA export | `export:planet-bga` | `export:tech-bga` | `export:resource-icons-bga` |
| BGA export dir | `exports/bga/img/` | `exports/bga/img/` | `exports/bga/img/` |

## 11. Compatibility

This document describes the pipeline as of pipeline version 2.0. The schema of `planets.json` is versioned via the `schema` field. Future pipeline revisions should bump this version when making backwards-incompatible changes to the model schema.

### Migration from v1.0

The v1.0 `npm run build` included deployment (`export:bga`). In v2.0:

- `npm run build` is now generation-only (model + cards for both planets and technology)
- `npm run release` is the new full-pipeline command (build → optimize → deploy)
- `npm run deploy` handles all exports without rebuilding or optimizing
- `export:bga` is renamed to `export:planet-bga`
- `export:tech-bga` is a new placeholder for technology deployment
