# Mercurio Design

Mercurio Design is the canonical visual asset pipeline for the Mercurio board game. This repository owns all source artwork, the design system (colours, typography, spacing, effects), the asset compiler that transforms CSV source data into structured card models, SVG templates for card frames, an AI prompt library for generating planet artwork, future export pipelines targeting print, Tabletop Simulator, and BoardGameArena, and all generated visual assets.

This repository does **not** own gameplay implementation, the BoardGameArena frontend, runtime UI, game logic, or networking.

## Repository Structure

```
compiler/       – Build scripts (card model, frame generation, preview)
data/           – Structured game data (boards, cards, icons, styles)
docs/           – Architecture, specs, style guides, roadmap
exports/        – Target platform outputs (BGA, print, TTS)
fonts/          – Font assets
generated/      – Compiler outputs (models, previews)
generators/     – Asset generators (boards, cards, sprites)
icons/          – Rendered icon assets (PNG, SVG, WebP)
illustrations/  – Illustration library (backgrounds, planets, etc.)
prompts/        – AI prompt library (planets, events, technologies)
references/     – Reference materials
scripts/        – Build, export, and import utilities
source/         – Source data (CSV), artwork, style tokens, AI prompts
templates/      – SVG templates (cards, boards, player boards)
tmp/            – Working directory
work/           – Design workspace
```

## Build Pipeline

```
CSV Source Data
  ↓
Canonical Card Model (compiler/build-card-model.js)
  ↓
Layer 1: Planet Artwork (source/artwork/cards/planet/planets/)
  +
Layer 2: Information Panel (templates/cards/planet/resource-panel.svg)
  +
Layer 3: Gameplay Elements (programmatic)
  ↓
SVG Composition (templates/, compiler/generate-frame.js)
  ↓
Asset Export
```

## Getting Started

This repository is under active development. The compiler scripts run on Node.js. Source artwork is stored as PNG. Design tokens live as JSON in `source/style/`. Refer to the documentation below for detailed guidance.

## Documentation

- [Architecture](docs/architecture.md)
- [Roadmap](docs/ROADMAP.md)
- [Card Specification](docs/card-specification.md)
- [AI Style Guide](docs/ai-style-guide.md)
