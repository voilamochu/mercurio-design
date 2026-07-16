# Mercurio Design

Mercurio Design is the canonical visual asset pipeline for the Mercurio board game. This repository owns all source artwork, the design system (colours, typography, spacing, effects), the asset compiler that transforms CSV source data into structured card models, an AI prompt library for generating planet artwork, export pipelines targeting BoardGameArena, and all generated visual assets.

This repository does **not** own gameplay implementation, the BoardGameArena frontend, runtime UI, game logic, or networking.

## Repository Structure

```
compiler/       – Build scripts (card model, card generation)
data/           – Structured game data (boards, cards, icons, styles)
docs/           – Architecture, specs, style guides, roadmap
exports/        – Target platform outputs (BGA, print, TTS)
generated/      – Compiler outputs (models, cards, previews)
generators/     – Asset generators (boards, cards, sprites)
illustrations/  – Illustration library (backgrounds, planets, etc.)
prompts/        – AI prompt library (planets, events, technologies)
scripts/        – Build, export, and import utilities
source/         – Source data (CSV), artwork, style tokens, icons
templates/      – Template assets (slots.json)
work/           – Design workspace
```

## Build Pipeline

```
Source Assets (CSV, artwork, icons, templates)
  ↓
build-card-model (compiler/build-card-model.js) — CSV → validated JSON model
  ↓
build-cards     (compiler/build-cards.js)       — model + artwork + icons → SVG cards
  ↓
export-bga      (compiler/export-bga.js)        — copy SVGs + generate manifest
  ↓
exports/bga     — ready for BGA Studio import
```

## Build

```bash
npm run build:model    # Parse CSV → planets.json
npm run build:cards    # planets.json + artwork + icons → SVG cards
npm run build:all      # model + cards
npm run export:bga     # cards → exports/bga
```

## Getting Started

This repository is under active development. The compiler scripts run on Node.js. Source artwork is stored as PNG. Design tokens live as JSON in `source/style/`. Refer to the documentation below for detailed guidance.

## Documentation

- [Architecture](docs/architecture.md)
- [Asset Pipeline](docs/asset-pipeline.md)
- [Roadmap](docs/ROADMAP.md)
- [Card Specification](docs/card-specification.md)
- [Planet Card Rendering Rules](docs/specifications/planet-card-rendering-rules.md)
- [AI Style Guide](docs/ai-style-guide.md)
- [Render Implementation Report](docs/render-implementation-report.md)
