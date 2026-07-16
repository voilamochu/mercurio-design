# Mercurio Card Specification

Version: 1.0

---

# 1. Purpose

This document defines the canonical specification for all card types in Mercurio.

It describes **what information a card contains**, **where that information is presented**, and **the design principles governing card composition**.

It intentionally avoids implementation details.

It is independent of:

- HTML
- React
- SVG
- PNG
- BGA
- Scratch

Every renderer, template and export target should conform to this specification.

---

# 2. Design Goals

Every Mercurio card should satisfy the following goals.

## Readability First

A player should understand the purpose of a card within one second.

Information hierarchy always takes precedence over decorative artwork.

---

## Functional Consistency

The same gameplay element must always appear in the same location.

Examples:

- Planet identity is always communicated through artwork.
- Resource inputs always appear on the left within the information panel.
- Resource outputs always appear on the right.
- Inputs always appear on the left side.
- Outputs always appear on the right side.

Players should build spatial memory over repeated plays.

---

## Artwork Supports Gameplay

Artwork exists to reinforce theme.

Artwork must never reduce readability.

Artwork should occupy dedicated regions of the card and should never compete with gameplay information.

---

## Modular Composition

Cards are assembled from reusable components.

Examples:

- Frame
- Planet Artwork (raster, includes space)
- Information Panel (SVG)
- Gameplay Elements (programmatic)
- Status overlays
- Ownership strip

No component should depend on another component's implementation.

---

## Deterministic Rendering

The same card definition should always generate identical visual assets.

Rendering should be deterministic.

No manual editing of generated cards is permitted.

---

# 3. Card Anatomy

A production planet card consists of exactly three visual layers.

```
+------------------------------------------------+
|                                                  |
|  Layer 1:  Planet Artwork                        |
|            (raster, includes surrounding space)  |
|                                                  |
|                                                  |
|                                                  |
|                                                  |
|--------------------------------------------------|
|  Layer 2:  Information Panel (SVG)              |
|            ┌──────────────┬──────────────────┐  |
|            │  Input Cell  │  Output Cell      │  |
|            │  Icons (L3)  │  Icons (L3)       │  |
|            ├──────────────┼──────────────────┤  |
|            │  Input Cell  │  Output Cell      │  |
|            │  Icons (L3)  │  Icons (L3)       │  |
|            ├──────────────┼──────────────────┤  |
|            │  Input Cell  │  Output Cell      │  |
|            │  Icons (L3)  │  Icons (L3)       │  |
|            └──────────────┴──────────────────┘  |
+------------------------------------------------+
```

Not every card type uses every layer. However, planet cards should follow this three-layer structure.

---

# 4. Common Card Elements

## Frame

Purpose

Defines the card boundary.

Rules

- Fixed dimensions
- Shared corner radius
- Shared border style
- Shared shadow treatment

---

## Background

Purpose

Provides atmosphere.

Rules

- Static
- Shared between related cards
- May include textures
- Must not contain gameplay information

---

## Artwork

Purpose

Provides thematic identity and communicates planet type.

Rules

- Single raster image that includes both the planet and surrounding space
- No separate space background layer
- One artwork per planet type (shared across cards of the same type)
- May be AI-generated
- Determined by card type



Artwork should represent categories rather than individual cards wherever possible.

---

## Header

Purpose

Contains identifying information.

Examples

- Technology Type
- Contract Faction
- Event Category

Header contents vary by card type.

Planet cards do not use a header. Planet identity is communicated through the artwork layer.

---

## Gameplay Region

Purpose

Displays gameplay information.

Only gameplay information belongs here.

On planet cards, the gameplay region is the information panel (Layer 2) populated with programmatic gameplay elements (Layer 3).

Examples

- Resources
- Costs
- Benefits
- Requirements
- Production
- Effects

---

## Footer

Purpose

Contains persistent metadata.

Examples

- Ownership strip
- Expansion symbol
- Set identifier

---

## Overlays

Purpose

Display temporary gameplay state.

Examples

- Available
- Used
- Selected
- Disabled
- Unsatisfied
- Pirate target
- Sale target

Overlays are runtime elements.

They should never be baked into exported assets.

---

# 5. Planet Card Specification

Planet cards use a three-layer composition.

## Layer 1 — Planet Artwork

A single raster image that includes both the planet and its surrounding illustrated space. There is no separate space background layer. Artwork is determined by planet type; multiple cards of the same type share the same artwork.

Examples

- Ice World
- Ocean World
- Forge World
- Jungle World

Location: `source/artwork/cards/planet/planets/{type}-v2.png`

---

## Layer 2 — Information Panel

A reusable SVG panel occupying roughly the lower 40–45 % of the card. Provides:

- Panel background
- Row separators
- Column separator
- Rounded lower corners
- Gameplay surface (cells for resource icons)

Contains NO gameplay data, resource icons, or text.

Location: `templates/cards/planet/resource-panel.svg`

---

## Layer 3 — Gameplay Elements

Rendered programmatically into the cells defined by the information panel. Includes:

- Resource icons — centered within each cell
- Future overlays (if any)

---

## Inputs

Displayed in the left column of the information panel.

Rules

- Grouped by production level
- Ordered vertically (Level I → II → III)
- Fixed cell locations
- Always use canonical resource icons

---

## Outputs

Displayed in the right column of the information panel.

Rules

- Grouped by production level
- Ordered vertically (Level I → II → III)
- Fixed cell locations
- Always use canonical resource icons

---

## Ownership Strip

Displayed along the bottom edge of the card, below the information panel.

Colour determined by owning player.

Not exported as part of production assets.

Applied at runtime.

---

# 6. Runtime Overlays

The following elements exist only during gameplay.

They are not part of exported artwork.

Examples

- Tick
- Cross
- Glow
- Hover
- Selection
- Distribution
- Sale target
- Pirate target
- Animation

Runtime overlays should be composited by the consuming application.

---

# 7. Rendering Order

Planet cards should be composed using the following three-layer order.

1. Planet Artwork — single raster including planet and surrounding space
2. Information Panel — reusable SVG panel with cell grid
3. Gameplay Elements — resource icons and future overlays, rendered programmatically

Runtime overlays (ownership bar, status badges, selection glow) are composited on top by the consuming application. They must never be baked into exported assets.

Layers must remain independent.

---

# 8. Scaling

Cards should scale proportionally.

Scaling must never alter:

- relative positioning
- icon ordering
- typography hierarchy

All dimensions should derive from the template.

---

# 9. Accessibility

Colour must never be the sole method of conveying gameplay information.

Gameplay icons should remain recognisable in grayscale.

Typography should maintain sufficient contrast over artwork.

---

# 10. Future Extensions

This specification is intentionally generic.

Additional card types should extend this specification rather than replacing it.

Examples

- Technology Cards
- Contract Cards
- Event Cards
- Governor Cards
- Goal Cards

New card types should reuse as many existing regions and components as possible.

---

This document defines the visual contract for Mercurio cards.

Templates, renderers, exporters and consuming applications should conform to this specification.
