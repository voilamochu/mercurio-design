# Lab Asset Pipeline

## Overview

The Lab is a generated artwork asset representing a 7-level Laboratory progression track for the Mercurio Design player board. It is generated entirely as SVG — no PNG output, no hand-drawn artwork, no AI-generated content.

```
Canonical source icons + Design tokens
        ↓
Data-driven level definitions
        ↓
Renderer (compiler/lib/lab/renderer.js)
        ↓
Generated SVG   →   generated/lab/lab.svg
        ↓
BGA Export      →   exports/bga/img/lab.svg
```

## Pipeline Architecture

| Stage | Script | Input | Output |
|---|---|---|---|
| Level definitions | — | `source/data/lab-stages.json` | Canonical level model |
| Design tokens | — | `source/style/{colors,effects,spacing}.json` | Semantic visual tokens |
| Canonical icons | — | `source/artwork/resources/*.png` | Resource icons (population, algae, electronics, robot, science) |
| Renderer | `build:lab` | level data + tokens + icons | `generated/lab/lab.svg` |
| Export | `build:lab` | generated SVG | `exports/bga/img/lab.svg` |

## File Structure

```
compiler/
├── build-lab.js              ← Entry point: renders SVG, exports to BGA
└── lib/
    └── lab/
        └── renderer.js       ← SVG rendering engine

source/
├── data/
│   └── lab-stages.json       ← Data-driven level definitions (7 levels)
└── style/
    ├── colors.json            ← Design tokens consumed by renderer
    ├── effects.json
    └── spacing.json

generated/
└── lab/
    └── lab.svg               ← Build output (disposable)

exports/
└── bga/
    └── img/
        └── lab.svg           ← BGA-ready SVG

templates/
└── lab/                      ← Reserved for future template overrides
```

## Data-Driven Design

The level model at `source/data/lab-stages.json` defines input and output icons per level:

```json
{
  "canvas": { "width": 960, "height": 580 },
  "rowHeight": 70,
  "iconSize": 34,
  "levels": [
    {
      "inputs": [],
      "outputs": ["tech-slot", "tech-slot", "science", "science", "science"]
    },
    {
      "inputs": ["population", "algae"],
      "outputs": ["tech-slot", "science", "science"]
    }
  ]
}
```

### Icon Types

| Icon ID | Source | Description |
|---|---|---|
| `population` | Canonical PNG | Workforce resource |
| `algae` | Canonical PNG | Organic resource |
| `electronics` | Canonical PNG | Advanced component |
| `robot` | Canonical PNG | Automated labor |
| `science` | Canonical PNG | Research output |
| `tech-slot` | Inline SVG | Technology card slot |
| `vp` | Inline SVG | Victory point star |

Canonical resource icons are loaded from `source/artwork/resources/` and embedded as base64 data URIs. Tech-slot and VP icons are generated as inline SVG paths.

## Layout

The renderer produces a clean euro-game grid with 7 rows:

```
 ○
 │  ──────   →   ◻ ◻ ◆ ◆ ◆
 ○
 │  👤 🟢    →   ◻ ◆ ◆
 ○
 │  💻       →   ◻ ◆ ★
 ○
 │  👤 🟢    →   ◻ ◆ ◆ ★
 ○
 │  🤖       →   ◻ ◆ ★
 ○
 │  👤 🤖    →   ◻ ◆ ★ ★
 ○
 │  💻       →   ◻ ◻ ★ ★ ★
```

- **Left track**: Connected dots showing progression (blue → cyan)
- **Inputs column**: Resource icons, spaced evenly. Empty inputs show a dash
- **Divider**: Vertical line with small arrow
- **Outputs column**: Icons spaced evenly
- **Row backgrounds**: Alternating subtle warm tones
- **Row separators**: Hairline lines

## Visual Design

- Dark warm background (#14110E) for board-game feel
- Muted gold/brass styling for borders and dividers
- Clean icon spacing with consistent padding
- No text labels (no "Laboratory" title, no level numbers)
- Subtle alternating row backgrounds for readability
- Readable at BGA scale (960×580 canvas, 34px icons, 70px row height)

## Build Commands

```bash
npm run build:lab            # Generate lab.svg
npm run build:assets         # Includes build:lab in the asset pipeline
npm run release              # Full pipeline including build:lab
```

## Pipeline Integration

| Command | Hook | What runs |
|---|---|---|
| `build:lab` | Standalone | `node compiler/build-lab.js` |
| `build:assets` | After contract cards | `... && npm run build:lab && ...` |
| `release` | After resource icons, before deploy | `... && npm run build:lab && ...` |

## Determinism

- SVG output depends only on level data, design tokens, and canonical icon PNGs
- No timestamps or random values in output
- Idempotent: same input always produces identical output

## Future-Proofing

The data-driven architecture supports:
- Adding/removing levels by editing `lab-stages.json`
- Changing resource requirements per level (edit the `inputs`/`outputs` arrays)
- Adding new custom SVG icon types (extend the renderer's `renderIcon` function)
- Creating variant lab tracks (different JSON files, same renderer)
- The `templates/lab/` directory is reserved for future template overrides
