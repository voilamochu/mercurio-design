# Mercurio Design Tokens

## Purpose

This directory defines the canonical design tokens for the Mercurio Design
System. Tokens are the atomic values — colors, type, space, and effects —
from which every component and layout is built.

The token set is intentionally small. Each token has a single, clear purpose.
There is no duplication. Every value is a single source of truth.

## Renderer Agnostic

Tokens describe **what** to render, not **how** to render it. The same
`colors.json` can drive SVG output, a web app, a BGA interface, or a print
layout. Platform-specific mappings belong in a consuming layer, never here.

## File Overview

| File | Contents |
|------|----------|
| `colors.json` | Semantic color tokens (no raw colour names) |
| `typography.json` | Font families, sizes, weights, line heights |
| `spacing.json` | Radii, margins, paddings, grid, icon sizes |
| `effects.json` | Shadows, strokes, opacity, dash patterns, glow, corner smoothing |

## Naming Convention

All tokens use **dot-separated semantic paths** grouped by component or
concept. The general form is:

```
<domain>.<component>.<property>
```

Examples:

- `frame.background.primary` — the primary background of a frame
- `text.secondary` — secondary body text
- `resource.slot.active` — an active resource slot
- `shadow.low` — a low-elevation shadow preset

### Rules

1.  **Never use raw colour names** (`blue`, `grey`, `red`) as tokens.
    Instead, describe what the colour does (`frame.border.primary`,
    `status.error`).
2.  **Group by domain.** Colour tokens live in `colors.json`, spacing
    in `spacing.json`, etc.
3.  **No duplicates.** If two tokens have the same numeric value they
    still express different intents (`border.thin` vs `stroke.thin`).
4.  **Values are renderer-agnostic.** Sizes are unitless numbers. Font
    families are generic stacks. Colours are hex.

## How Tokens Should Be Used

Consuming code **reads** tokens by their full key path. For example:

- A frame renderer reads `frame.background.primary` for the fill colour.
- A header component reads `header.height` for its vertical size.
- A debug overlay reads `debug.guide` for guide-line colour.

No consumer should ever hard-code a value that exists as a token. If you
find yourself typing a hex code or a pixel value, stop and check whether
a token already covers it — and if not, consider adding one.

## Future Expansion

### Versioning

Token files carry a `$schema` field. Bump the version when making
backwards-incompatible changes (renaming or removing a token).

### Adding Tokens

1.  Add the token to the correct file.
2.  Keep the naming convention.
3.  Ensure no duplicate values exist for the same semantic intent.
4.  Update this README if you add a new file or category.

### Possible Future Categories

- **Motion** — easing curves, duration presets (when a renderer
  supports animation).
- **Breakpoints** — viewport width thresholds for responsive layouts.
- **Z-Index** — elevation layering for overlapping elements.
- **Media** — icon and illustration size presets beyond the current
  `icon.*` tokens.

Do not add any category before at least one renderer needs it.
