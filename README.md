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

## Pipeline

The pipeline is organized into four layers:

| Layer | Commands | Purpose |
|---|---|---|
| Bootstrap | `bootstrap:tech-artwork` | One-time split of technology collages |
| Generation | `build:model` `build:cards` `build:tech-model` `build:tech-cards` | Generate all artwork assets |
| Optimization | `optimize:planet` `optimize:tech` | (Placeholder) Optimize generated SVGs |
| Deployment | `export:planet-bga` `export:tech-bga` | Copy assets into target repository |

The pipeline is deterministic. Identical source assets always produce identical output.

## Workflow

**Build — generate all assets (no deployment):**
```bash
npm run build
```
Executes: `build:model` → `build:cards` → `build:tech-model` → `build:tech-cards`

**Release — full pipeline before committing:**
```bash
npm run release
```
Executes: `build` → `optimize:planet` → `optimize:tech` → `deploy`

**Deploy — copy generated assets (no rebuild, no optimization):**
```bash
npm run deploy
```
Executes: `export:planet-bga` → `export:tech-bga`

### Individual Steps

```bash
npm run build:model          # CSV → generated/models/planets.json
npm run build:cards          # Optimize PNGs + render 81 planet card SVGs
npm run build:tech-model     # technologies.json → generated/models/technologies.json
npm run build:tech-cards     # Render 40 technology card SVGs
npm run export:planet-bga    # SVGO → copy → manifest → exports/bga/
npm run export:tech-bga      # (Not yet implemented)
```

After a successful deployment, `exports/bga/` contains:

- `img/` — 81 planet card SVGs (`card_001_1.svg` … `card_027_3.svg`)
- `data/planets.json` — Canonical card model
- `manifest.json` — Production metadata

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
