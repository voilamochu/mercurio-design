# SVG Renderer Implementation Report

Version: 2.1 — Final Planet Card

## Summary
- `compiler/build-card-model.js`, `generated/models/planets.json`, CSV source files, planet artwork PNGs, resource icon PNGs
- `templates/cards/planet/slots.json`
- `source/style/*`, `source/icons/*`

---

## 1. Three-Layer Composition

The card is composed of exactly three layers:

| Layer | Content | Description |
|---|---|---|
| 1 | Planet Artwork | Single full-bleed raster image (744×1039 px), `xMidYMid slice`. The V2 artwork includes planet + surrounding space in one file. |
| — | Watermark Cover | Gradient overlay (`#080D1A`, sampled from artwork space tones) from transparent at y=520 to solid at bottom. Follows card's 32px corner radius. Sits on top of artwork, below dividers and icons. |
| 2 | Gameplay Dividers | Two horizontal lines (`#8F8575`, 3px stroke, 85% opacity) spanning x=36 to x=708. |
| 3 | Resource Icons | Embedded base64 PNG icons (80×80 px) at fixed Y row centers, X centered per cell rules. |

Layer ordering: artwork → watermark → dividers → icons.

---

## 2. Obsolete Rendering Removed

The following elements have been deleted entirely from the renderer:

- **Placeholder circles** — All `<circle>` elements around resource icons
- **Slot circles** — Input/output slot markers
- **Debug circles / hitbox visualization** — Coordinate and bounding-box markers
- **Resource outlines** — Stroke outlines around resources
- **Artwork placeholder rectangles** — Dashed artwork region rect
- **Frame placeholder elements** — Header circles (planet type, VP), footer rect, header divider
- **VP placeholders, planet type placeholders** — All text labels
- **Debug labels / composition guides** — Safe margin outlines, text labels
- **Space background layer** — No separate `deep-space-v1.png` background
- **Model Y positions** — No longer derive Y from CSV/model percentage coordinates

---

## 3. Vertical Composition (Renderer-Owned)

The renderer owns all Y positions. Fixed row centers:

| Row | % of Card Height | Y (px) |
|-----|------------------|--------|
| 1   | 57%              | 592    |
| 2   | 73%              | 758    |
| 3   | 89%              | 925    |

The gameplay area occupies the bottom ~50% of the card (y ≥ 520). These positions are constants, not derived from model data. The model data is used only for: which resources exist, which level/side they belong to, and how many per row.

---

## 4. Watermark Cover

A gradient-filled path provides a dark backing behind the gameplay information:

- **Color**: `#080D1A` — sampled from the earth-v2.png space-tones in the gameplay area (avg RGB(8,13,26))
- **Gradient**: transparent at y=520 → 0.65 opacity at 12% → 0.88 at 28% → 0.95 at 50% → 1.0 solid at bottom
- **Path**: follows card's bottom corner radius (`rx=32`) for clean integration
- **Function**: creates a readable base for icons without a hard visual cut

---

## 5. Gameplay Dividers

- **Two** horizontal lines only (between rows, not at row centers)
- Color: `#8F8575` (warm taupe-grey)
- Stroke: `3px` at `0.85` opacity — thicker, authoritative, printed-on-card feel
- Span: x=36 to x=708 (672px wide, inset 36px from each edge)
- Y positions: midpoints between adjacent row centers
  - Divider 1: (592+758)/2 = **675**
  - Divider 2: (758+925)/2 = **842**
- No vertical divider lines

---

## 6. Resource Icons

- Loaded from `source/icons/resources/{Resource}.png` as base64 data URIs
- Size: **80×80** pixels (unchanged from previous renderer)
- Y positions: fixed row centers (592, 758, 925)
- X positions: computed per centering rules:

| Count | Inputs (left cell) | Outputs (right cell) |
|-------|-------------------|---------------------|
| 1     | center at x=160   | center at x=584     |
| 2     | centers at x=110, 210 | centers at x=534, 634 |

- Cell centers are symmetric around the card centre (x=372): inputs at 160 (212px left), outputs at 584 (212px right)
- Two-icon pairs use ±50px offset from cell centre, creating 20px between icon edges

---

## 7. Earth Card (card_021_1) Layout

| Level | Inputs | Outputs |
|-------|--------|---------|
| L1 (y=592) | Grain — 1 icon at x=160 | Human×2 — pair at x=534, 634 |
| L2 (y=758) | Crate — 1 icon at x=160 | Human — 1 icon at x=584 |
| L3 (y=925) | — | Human — 1 icon at x=584 |

Total: 6 resource icons, 2 divider lines, 1 watermark path.

---

## 8. Planet Selection

- Selected: `card_021_1` (first Earth World)
- Artwork: `source/artwork/cards/planet/planets/earth-v2.png`
- V2 artwork filename mapped automatically: tries `{type}-v2.png` first, then `{type}_v2.png`

---

---

## 10. Remaining Known Limitations

- **Card frame border**: The SVG does not draw an outer rounded card border (`rx=32`). The watermark path respects the corner radius internally. A card frame border is expected as a runtime/compositing overlay.
- **Single card**: Renders one Earth card. Full deck rendering is left to the card compiler.
- **No text or level labels**: Design relies purely on icon positions and divider structure.
- **V2 artwork naming inconsistency**: Some planets use hyphens (`earth-v2.png`, `cold-v2.png`), others use underscores (`forge_v2.png`). The renderer tries both patterns.
- **Ownership footer**: Not rendered. Expected as a runtime overlay.
