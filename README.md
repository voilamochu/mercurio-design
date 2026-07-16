# Mercurio Design

Mercurio Design is the canonical visual asset pipeline for the Mercurio board game. This repository owns all source artwork, the design system (colours, typography, spacing, effects), the asset compiler that transforms CSV source data into structured card models, SVG templates for card frames, an AI prompt library for generating planet artwork, future export pipelines targeting print, Tabletop Simulator, and BoardGameArena, and all generated visual assets.

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
templates/      – SVG templates (cards, boards, player boards)
work/           – Design workspace
```

## Build Pipeline

```
CSV Source Data
  ↓
Canonical Card Model (compiler/build-card-model.js)
  ↓
SVG Card Generation (compiler/build-cards.js)
  ↓
Generated Card Deck (generated/cards/)
```

## Build

```bash
npm run build:model    # Parse CSV → planets.json
npm run build:cards    # planets.json + artwork + icons → SVG cards
npm run build:all      # Both steps
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
