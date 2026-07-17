# Mercurio Design

Mercurio Design is the canonical visual asset pipeline for the Mercurio board game. This repository owns all source artwork, the design system (colours, typography, spacing, effects), the asset compiler that transforms CSV source data into structured card models, and the export pipeline that produces production-ready BGA asset bundles.

This repository does **not** own gameplay implementation, the BoardGameArena frontend, runtime UI, game logic, or networking.

## Repository Structure

```
compiler/       – Build scripts (card model, card generation, export, SVG optimization)
docs/           – Architecture, specs, style guides, experiments, audit reports
exports/bga/    – BGA production export (81 SVGs, planets.json, manifest.json)
generated/      – Compiler outputs (models, cards, optimized assets)
illustrations/  – Illustration library (backgrounds, planets, etc.)
prompts/        – AI prompt library (planets, events, technologies)
scripts/        – Build, export, and import utilities (empty — reserved)
source/         – Source data (CSV), artwork, design tokens, icons
  archive/      – Archived original full-resolution artwork (planets, icons)
  artwork/      – Planet artwork, background assets, reference sheets
  csv/planets/  – Game data (PlanetResources, PlanetType)
  icons/        – Resource icons, planet type icons
  style/        – Design tokens (colors, typography, spacing, effects)
work/           – Design workspace (gitignored)
```

## Build Pipeline

```
Source Assets (CSV, artwork, icons)
  │
  ▼
build:model  (compiler/build-card-model.js)   — CSV → validated planets.json
  │
  ▼
build:cards  (compiler/build-cards.js)         — optimize PNGs → render 81 SVG cards
  │
  ▼
export:bga   (compiler/export-bga.js)          — SVGO → copy → manifest.json → validate
  │
  ▼
exports/bga  — production-ready BGA asset bundle
```

The pipeline is deterministic. Identical source assets always produce identical output.

## Production Workflow

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
npm run build:model    # Parse CSV → generated/models/planets.json
npm run build:cards    # Optimize PNGs + render 81 SVG cards
npm run export:bga     # SVGO → copy → manifest.json → exports/bga/
```

## Production Resolutions

- Planet artwork: 576 px wide (maintaining aspect ratio)
- Resource icons: 96 × 96 px
- Card SVG: 744 × 1039 px viewBox

## Key Locations

| What | Where |
|---|---|
| Original full-resolution artwork (archived) | `source/archive/planets/` |
| Original resource icons (archived) | `source/archive/icons/` |
| Source planet artwork (864×1216 px) | `source/artwork/cards/planet/planets/` |
| Source resource icons (352×384 px) | `source/icons/resources/` |
| Generated production artwork (576×811 px) | `generated/optimized-assets/artwork/` |
| Generated production icons (96×96 px) | `generated/optimized-assets/icons/` |
| Generated card SVGs | `generated/cards/` |
| BGA export bundle | `exports/bga/` |

## BGA Export Bundle

The `exports/bga/` directory is a self-contained production bundle:

```
exports/bga/
├── img/               – 81 planet card SVGs (card_001_1.svg … card_027_3.svg)
├── data/planets.json  – Canonical card model
└── manifest.json      – Production metadata (version, resolutions, statistics)
```

This directory is the only thing another repository (such as bga-mercurio) needs.

## Documentation

- [Architecture](docs/architecture.md)
- [Asset Pipeline](docs/asset-pipeline.md)
- [Roadmap](docs/ROADMAP.md)
- [Card Specification](docs/card-specification.md)
- [Planet Card Rendering Rules](docs/specifications/planet-card-rendering-rules.md)
- [AI Style Guide](docs/ai-style-guide.md)
- [Render Implementation Report](docs/render-implementation-report.md)
