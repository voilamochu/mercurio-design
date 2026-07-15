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

- VP is always top-right.
- Planet Type is always top-left.
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
- Background
- Artwork
- Header
- Icons
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

Every card is composed from a set of visual regions.

```
+------------------------------------------------+

 Header

 Planet Type                     VP

--------------------------------------------------

 Artwork

--------------------------------------------------

 Gameplay Area

 Inputs                Outputs

--------------------------------------------------

 Footer

 Ownership Strip

+------------------------------------------------+
```

Not every card type uses every region.

However, every card should follow this overall structure whenever applicable.

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

Provides thematic identity.

Rules

- Occupies dedicated artwork region
- Uses clipping mask
- May be AI-generated
- Determined by card type

Artwork should represent categories rather than individual cards wherever possible.

---

## Header

Purpose

Contains identifying information.

Examples

- Planet Type
- Technology Type
- Contract Faction
- Event Category

Header contents vary by card type.

---

## Gameplay Region

Purpose

Displays gameplay information.

Only gameplay information belongs here.

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

Planet cards use the following layout.

## Header

Contains

- Planet Type Icon
- Victory Points

---

## Artwork

Represents the planet type.

Artwork is determined by the planet category rather than the individual card.

Examples

- Ice World
- Ocean World
- Forge World
- Jungle World

Multiple cards may share the same artwork.

---

## Inputs

Displayed on the left.

Rules

- Grouped by production level
- Ordered vertically
- Fixed slot locations
- Always use canonical resource icons

---

## Outputs

Displayed on the right.

Rules

- Grouped by production level
- Ordered vertically
- Fixed slot locations
- Always use canonical resource icons

---

## Ownership Strip

Displayed along the bottom edge.

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

Cards should be composed using the following layer order.

1. Background
2. Frame
3. Artwork
4. Header
5. Gameplay Area
6. Footer
7. Runtime Overlays

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
