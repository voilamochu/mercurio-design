# Mercurio — AI Style Guide

Version 1.0

---

## Table of Contents

1. [Overall Vision](#1-overall-vision)
2. [Visual Style](#2-visual-style)
3. [Planet Artwork](#3-planet-artwork)
4. [Space Backgrounds](#4-space-backgrounds)
5. [Board Artwork](#5-board-artwork)
6. [Card Frames](#6-card-frames)
7. [Layering Strategy](#7-layering-strategy)
8. [Prompt Engineering Guidelines](#8-prompt-engineering-guidelines)
9. [Asset Resolution](#9-asset-resolution)
10. [Future Expansion](#10-future-expansion)

---

## 1. Overall Vision

### 1.1 Optimistic Hard Sci-Fi

Mercurio depicts a galaxy where engineering, biology, and information have converged. The tone is aspirational but grounded. Technology looks functional, not magical. Structures obey plausible physics. Space is cold, vast, and beautiful, but never hostile or horror-adjacent. Humans are present, small in scale, but thriving.

This is not cyberpunk. There is no decay, no grime, no dystopia. Every world is inhabited, worked, and valued.

### 1.2 Premium Modern Board Game

Every asset should communicate quality at arm's length. Artwork must hold up at card size (63 × 88 mm) and at board size (600 × 900 mm). Details should reward close inspection but never clutter gameplay information. The visual language competes with the top shelf of the modern board game market — references include the production polish of *Wingspan*, *Terraforming Mars: Ares Expedition*, and *Everdell*.

### 1.3 Information-First

Artwork occupies a dedicated region and never overlaps gameplay elements. Players identify cards by iconography and layout before artwork. Artwork reinforces theme; it does not carry mechanical information. A colourblind player should lose zero gameplay functionality. A player who cannot see the artwork at all should still be able to play.

### 1.4 Illustration Supports Gameplay

Artwork exists to differentiate categories (planet types, technologies, factions) at a glance. Within a category, artwork should feel coherent. A player looking at a hand of cards should immediately recognise which cards share a planet type before reading a single icon.

---

## 2. Visual Style

### 2.1 Illustration Style

Digital painting with a clean, rendered finish. The style sits between concept art and production illustration: detailed enough to feel real, clean enough to read at card size.

- **Hard surfaces** (hulls, domes, platforms): precise edges, crisp highlights, metallic sheen.
- **Organic forms** (terrain, flora, atmospherics): softer edges, atmospheric perspective, painted falloffs.
- **Atmospherics** (clouds, haze, aurorae, rings): semi-transparent layers, gradient brushes, colour-bleed from planetary bodies.
- **Structures** (habitats, mines, antennas, ship silhouettes): blocky, functional, scale-indicating. Never ornate or gothic.

Flat vector illustration is acceptable for UI elements only. All artwork illustrations must be raster-based with depth.

### 2.2 Rendering Quality

- Rendering should simulate volumetric light, surface reflection, and ambient occlusion where possible.
- Shadows should be coloured (never pure black).
- Specular highlights should be present on metallic and wet surfaces.
- Depth of field is acceptable for atmosphere, but the focal plane must contain the primary subject.
- No obvious tiling, visible seams, or hard cropping of procedural outputs.

### 2.3 Lighting

Light sources should be diegetic and physically plausible:

| Context | Primary Light Source | Secondary |
|---|---|---|
| Surface of planet | Local star (harsh or soft depending on atmosphere) | Reflected light from rings or nearby gas giant |
| Deep space / void | Distant nebula glow or companion star | Ship/structure running lights |
| Nebula / stellar nursery | Diffuse ambient from surrounding gas | Hard star-points in field |
| Gas giant high atmosphere | Local star filtered through upper cloud | Internal storm discharge glow |

Avoid:
- Three-point studio lighting on astronomical scenes.
- Lighting that implies a light source with no visible origin.
- Hard rim lighting that does not match the primary light angle.

### 2.4 Colour Philosophy

Colour is driven by planet type, not by arbitrary palette assignment. Each biome has a dominant hue family and supporting accents determined by its physical composition.

| Planet Category | Dominant Hue | Accent Hues | Rationale |
|---|---|---|---|
| Swamp | Deep green, teal | Amber, bioluminescent cyan | Dense organic life, methane haze |
| Scrap | Rust, ochre, industrial grey | Hot orange, warning yellow | Exposed machinery, oxidized metals |
| Proto | Magenta, violet, grey-pink | Cyan, white | Young planet, volcanic UV glow |
| Ocean | Ultramarine, cerulean | White, foam green | Deep water, ice caps, starlight reflection |
| Jungle | Emerald, lime | Gold, deep purple | Dense canopy, shadowed undergrowth |
| Cold | Ice blue, steel grey | Pale orange, white | Frozen surface, low-angle star |
| Earth | Green-brown, sky blue | White, soft yellow | Temperate, familiar, agricultural |
| Ice | Cyan-white, periwinkle | Deep blue, aurora green | Cryovolcanic, crystalline |
| Forge | Crimson, charcoal | Lava orange, ember yellow | Active volcanism, molten surface |

Colour should never be used as the sole differentiator between gameplay states. All gameplay-essential information is carried by iconography and typography.

### 2.5 Contrast

Artwork should maintain a mid-contrast range overall, with high-contrast focal points reserved for the primary subject (habitat, starport, terrain feature). The sky or space background should recede in contrast.

Minimum luminance contrast between artwork and overlaid gameplay elements (icons, text) is enforced by templates and is not the artwork's responsibility. However, artwork should avoid large uniform bright areas in regions where white text or icons will be overlaid.

### 2.6 Saturation

Saturation should be naturalistic for the depicted biome. No biome should appear desaturated or grey unless that is physically characteristic (e.g. Scrap, Cold).

| Category | Saturation Level | Notes |
|---|---|---|
| Swamp, Jungle, Ocean | Moderate to high | Organic biomes carry colour |
| Forge, Proto | High | Volcanic and young surfaces are vivid |
| Cold, Ice, Scrap | Low to moderate | Physical palettes are more subdued |
| Earth | Moderate | Familiar, not hyper-saturated |

Avoid overcranking saturation to the point of neon. If an output resembles a fantasy game, reduce saturation.

### 2.7 Texture

Surface texture is essential for readability at board-game scale. Every planetary surface should imply physical composition:

- **Rocky/Icy**: cracks, facets, crater rims, frost veining.
- **Organic**: canopy layering, water surface ripples, atmospheric haze bands.
- **Industrial**: panel lines, rivet indications, exhaust staining, grid patterns.
- **Volcanic**: flow channels, cooling cracks, ash settling, glow bleed from fissures.

Textures should be painted, never applied as generic image overlays or filter effects.

---

## 3. Planet Artwork

### 3.1 Camera Angle

The camera is always in low orbit, looking down at a 15–30 degree angle from the horizontal plane. This is the establishing shot — close enough to see terrain and structures, far enough to recognise the planet type.

- Never a direct top-down orthographic view (that is the map view, not the card view).
- Never a wide establishing shot from orbit showing the full planetary sphere (that is the board view).
- Never a ground-level first-person view.

The angle should feel like a descent trajectory or a habitat window view.

### 3.2 Framing

Artwork is rendered into a fixed aspect ratio matching the card artwork region. The composition must work at 672 × 820 px (the planet card artwork region).

- **Horizon line**: always present, approximately 20–35 % from the bottom of the artwork region. Never centred.
- **Foreground**: terrain, structures, or atmospheric phenomenon that establish scale. Approximately the bottom third of the image.
- **Midground**: primary subject — the most distinct terrain or installation. This is the visual anchor.
- **Background**: sky, atmospheric perspective, ring systems, moons, or star field. Approximately the top third.

The primary subject (structure, terrain formation, or colony) should occupy the centre 40–60 % of the frame. Never dead-centre. Offset slightly to the left or right for visual balance.

### 3.3 Scale

Structures and terrain must communicate scale intuitively:

- **Human-scale elements** (domes, antennas, landing pads): 1–5 pixels wide at card resolution. Present as bright points or silhouette details.
- **Habitat clusters**: visible as grouped geometric forms. Not readable as individual buildings.
- **Geographic features** (craters, canyons, mountain ranges): fill the midground.

The viewer should sense that humans (or their machines) are present even if individual figures are too small to resolve.

### 3.4 Atmosphere

Atmosphere is a composited layer, not a post-process filter:

- Surface haze near the horizon — colour-matched to the biome.
- Light scattering around the star direction.
- Soft glow on the lit edges of terrain.
- Cloud layers (where applicable) should sit between foreground and background.

Never apply a uniform fog or vignette to the entire image. Atmosphere should respect depth.

### 3.5 Consistency Rules

1. **A planet type is a biome, not a single image.** Variation is expected within a biome, but the dominant hue family, lighting mood, and terrain signature must remain recognisable.
2. **No cross-biome borrowing.** A Swamp planet must never borrow Forge colour accents. A Cold planet must never show Jungle flora.
3. **Structures should be stylistically consistent across all cards.** A dome on a Swamp planet should look like it was built by the same civilisation as a dome on an Ice planet. Colour and wear may differ, but form language does not.
4. **Space background is part of the artwork.** Planet artwork is a single composite raster that includes the planet, its atmosphere, and surrounding space. Star fields, nebulae, and atmospheric effects are painted directly into the artwork, not composited from a separate background layer.

---

## 4. Space Backgrounds

Space backgrounds serve as the backdrop for cards without planetary artwork (events, technologies) and for the game board.

Planet cards no longer use a separate space background layer. The planet artwork (Layer 1) includes both the planet and its surrounding space as a single raster image.

### 4.1 Composition

- Star field with variable density: sparse near the centre, denser toward the edges.
- One large celestial element (nebula, gas giant, ringed planet, distant galaxy) occupying no more than 30 % of the frame.
- Star colours: predominantly cool white and faint blue. Occasional warm orange stars (K-type, M-type) for visual variety. Never green or purple stars.
- No hard edges on nebulae. Soft, semi-transparent painted layers.

### 4.2 Palette

- Base: near-black with a very slight hue shift toward the dominant accent
- Nebula colours: deep violet-blue, dust orange, teal (one per background, never all three)
- Stars: white, faint blue-white, occasional warm white
- No fully saturated nebula colours

### 4.3 Repetition Rules

A single space background asset may be reused across multiple cards of the same category. Each category (Technology, Event, Contract) should have exactly one distinct space background. A total of 4–6 unique space backgrounds is sufficient for the entire game.

Planet cards do not use a separate space background. The planet artwork asset includes its own background as part of the single raster image.

---

## 5. Board Artwork

The game board depicts a star sector from a high-altitude perspective — higher than card artwork, lower than a galactic map.

### 5.1 Visual Language

- Top-down oblique angle (approximately 45 degrees).
- Nebula regions and dust lanes as underlays.
- Planetary bodies rendered at system-map scale: small spheres with atmospheric glow, not surface details.
- Trade route lines as subtle luminous paths.
- Sector boundaries indicated by faint grid lines or waypoint nodes.
- Colour palette: desaturated overall to keep card and token pop. Deep navy base, violet nebula accents, warm star-points.

### 5.2 Resolution Requirement

The board asset must render cleanly at 600 × 900 mm print resolution (300 DPI: 7087 × 10630 px). This is the highest-resolution asset in the game. Generation should target 8K (7680 × 11520 px) master and downscale.

### 5.3 No Gameplay Information

The board artwork contains no text, no icons, no mechanical information. All sector labels, icons, and tokens are applied as digital overlays at runtime or as physical components.

---

## 6. Card Frames

Card frames are SVG templates, not generated artwork. They define the boundary, header region, slot positions, and footer.

### 6.1 Frame Rules

- Corner radius: 32 px (at 744 × 1039 px master size).
- Border: 2 px solid line, neutral dark grey (#333333).
- Header divider: 1 px horizontal line across the full width.
- Header background: transparent (artwork extends behind the header).
- Footer: solid dark bar, 12 px height, full width.

### 6.2 No Frame Artwork

Frames are structural guides. They do not contain decorative flourishes, gradients, metallic borders, or ornamental corners. Information density is already high enough that decorative frames reduce readability.

### 6.3 Category Differentiation

Card categories are differentiated by colour accents applied at the template level, not by unique frame artwork:

- Planet cards: no accent, neutral frame.
- Technology cards: blue accent strip on the left edge.
- Contract cards: amber accent strip on the left edge.
- Event cards: red accent strip on the left edge.
- Governor cards: purple accent strip on the left edge.

These accent strips are drawn by the template compiler, not by AI generation.

---

## 7. Layering Strategy

A production planet card is composed of exactly three visual layers. The following stack defines the compositing order from bottom to top.

```
Layer 1:  Planet Artwork
          Single raster image including planet and surrounding space.
          One artwork per planet type.
          Location: source/artwork/cards/planet/planets/
          ─────────────────
Layer 2:  Information Panel
          Reusable SVG panel occupying the lower 40–45 % of the card.
          Provides panel background, row/column separators, rounded
          lower corners, and gameplay surface. No gameplay data.
           Location: rendered programmatically by compiler/build-cards.js
          ─────────────────
Layer 3:  Gameplay Elements
          Resource icons and future overlays, rendered programmatically.
          Centred within the cells defined by the information panel.
```

Runtime overlays (ownership bar, status badges, selection glow) are composited on top by the consuming application. They are not part of the canonical three-layer composition and must never be baked into exported assets.

### 7.1 Layer Ownership

| Layer | Source | Generated By | Mutable at Runtime |
|---|---|---|---|
| Planet Artwork | AI-generated raster | Asset pipeline | No |
| Information Panel | SVG template | Template compiler | No |
| Gameplay Elements | Icon library + code | Rendering engine | No |
| Overlays | Code | Rendering engine | Yes |

### 7.2 Independence Rules

- No layer should depend on the pixel content of any layer below it.
- The Information Panel must not assume specific artwork colours or composition.
- The Planet Artwork layer must cover the full card area (space background is embedded in the artwork).
- Runtime overlays must not be baked into exported card assets.
- Planet Artwork assets are interchangeable as long as they conform to the card dimensions.

---

## 8. Prompt Engineering Guidelines

### 8.1 Reusable Prompt Template

```
Optimistic hard sci-fi board game illustration.
Low orbit view of a {BIOME} planet, 20-degree descent angle.
{TERRAIN_DESCRIPTION}
{STRUCTURE_DESCRIPTION}
{ATMOSPHERE_DESCRIPTION}
Digital painting, volumetric lighting, physically plausible materials,
clean rendered finish, detailed surface texture, cinematic composition.
{COLOUR_DIRECTION}
--ar {ASPECT_RATIO} --style raw --stylize {STYLIZE_VALUE}
```

### 8.2 Reusable Negative Prompt

```
wide shot of entire planet sphere, top-down view, ground-level perspective,
fantasy style, gothic architecture, dark atmosphere, horror,
dystopian, post-apocalyptic, zombie, alien, cartoon, cel-shaded,
anime, sketch, line art, watercolour, oil painting, impressionist,
abstract, minimalist, greyscale, sepia, neon, glowing outlines,
halftone, pixel art, isometric, orthographic, fisheye, lens flare,
oversaturated, bloom, vignette, vignette filter, dated watermark,
text, signature, logo, frame, border, grid, crosshair, UI element
```

### 8.3 Consistency Rules

1. **Same prompt structure, different biome attributes.** Only the biome-specific fill-in segments change between generations. The framing, angle, and quality descriptors remain identical.
2. **Same negative prompt for every generation.** Do not add or remove negative terms per biome. Consistent negatives produce consistent output quality.
3. **Same aspect ratio for every card artwork generation.** Always use the artwork region aspect ratio (672:820 ≈ 0.82) defined by the renderer.
4. **Validate every output against the biome colour table** (see §2.4). Reject any output whose dominant hue does not match the target biome.
5. **Validate horizon position.** The horizon must fall between 20 % and 35 % from the bottom edge. Reject outputs where the horizon is centred, missing, or extreme.

### 8.4 Seed Strategy

Where the model supports seed values:

1. Assign a fixed seed range per planet type (e.g. Swamp: 1000–1999, Scrap: 2000–2999, etc.).
2. Within a planet type, vary the seed for each card copy (e.g. Swamp card 001: seed 1001, card 002: seed 1002, card 003: seed 1003).
3. Record the seed, prompt, and output hash together in the asset manifest.
4. If a seed produces an invalid output (wrong biome, bad composition, artefacts), skip that seed and increment by 1 until a valid output is produced. Log the skipped seed.

**Do not rely on seed determinism for consistency.** Seeds are a reproducibility aid, not a style control. The prompt template and negative prompt are the primary consistency mechanisms.

### 8.5 Variation Strategy

Within a biome, introduce controlled variation through:

- **Terrain composition:** crater field vs. canyon network vs. flat tundra vs. mountain ridge.
- **Structure type:** dome cluster vs. antenna array vs. landing platform vs. mining excavation.
- **Atmospheric condition:** clear vs. thin haze vs. storm front vs. aurora.
- **Time-of-day proxy:** high star vs. low star (affects shadow length and warmth).

Each card within a biome should differ in at least two of these dimensions while sharing the biome's dominant hue, lighting mood, and terrain signature.

### 8.6 Naming Conventions

Generated artwork assets follow this naming pattern:

```
{card-type}_{biome}_{variant}_{seed}.webp
```

Examples:

```
planet_swamp_001_1001.webp
planet_swamp_002_1002.webp
planet_ocean_010_4001.webp
tech_background_001.webp
event_background_001.webp
```

| Segment | Values |
|---|---|
| `card-type` | `planet`, `tech`, `contract`, `event`, `governor`, `board` |
| `biome` | `swamp`, `scrap`, `proto`, `ocean`, `jungle`, `cold`, `earth`, `ice`, `forge` |
| `variant` | Zero-packed card number (001–027) for planets, or `background` for non-planet categories |
| `seed` | The seed value used for generation |

Board artwork uses the name `board_sector_001.webp` (single asset, no biome prefix).

---

## 9. Asset Resolution

### 9.1 Master Generation Resolution

Generate all raster artwork at **2048 × 2500 px**. This is the master resolution for card artwork.

Rationale:
- Sufficient for 300 DPI print at 63 × 88 mm (standard card size).
- Sufficient for digital display at any reasonable zoom level.
- Low enough to keep generation times and file sizes manageable.
- Allows lossless downscale to all target resolutions.

Board artwork is an exception: generate at **7680 × 11520 px** (8K).

### 9.2 Export Resolutions

| Usage | Width | Height | Format | Source |
|---|---|---|---|---|
| Print master (card) | 2048 | 2500 | PNG (lossless) | AI master |
| Digital display (card) | 744 | 1039 | WEBP (90 % quality) | Downscaled from master |
| Thumbnail (card) | 372 | 520 | WEBP (80 % quality) | Downscaled from master |
| Board print master | 7680 | 11520 | PNG (lossless) | AI master |
| Board digital display | 1920 | 2880 | WEBP (90 % quality) | Downscaled from board master |
| Icons | 64 | 64 | SVG / WEBP | Vector source or downscaled |

### 9.3 Format Usage

| Format | When to Use | When Not to Use |
|---|---|---|
| **SVG** | Frames, icons, hitbox overlays, typography, board grid lines | Artwork, backgrounds, photographs, gradients too complex for vector |
| **PNG** | Print masters, assets requiring lossless compression | Delivery to web (use WEBP instead) |
| **WEBP** | Digital display assets, thumbnails, runtime assets | Print (unsupported by most print workflows) |

SVG is the primary interchange format for all non-artwork card components. The asset compiler reads SVG templates and emits SVG frames. Raster artwork is composited into the final card by the rendering engine.

---

## 10. Future Expansion

### 10.1 Technology Cards

Technology cards use the same card anatomy (see [Card Specification](card-specification.md)) but replace the planet artwork region with a technology-themed illustration:

- **Subject**: a device, machine, or scientific apparatus isolated against a space background.
- **Framing**: close-up on the device. Not a landscape.
- **Lighting**: studio-style with a single hard light source. The device is the hero.
- **Background**: the neutral space background for the Technology category (see §4.3).
- **Colour**: cool palette (blue-violet dominant). Device material should appear metallic or translucent.

### 10.2 Contract Cards

Contract cards depict faction-aligned scenes:

- **Subject**: a faction representative, trade vessel, or outpost.
- **Framing**: mid-shot. A vessel or structure against a planet or space backdrop.
- **Lighting**: warm, with amber/gold accents for the trade faction.
- **Background**: the neutral space background for the Contract category.
- **Colour**: warm palette (amber-orange dominant).

### 10.3 Event Cards

Event cards depict transient phenomena:

- **Subject**: an astronomical event, disaster, or discovery (supernova, asteroid impact, solar flare, alien signal).
- **Framing**: wide. The event fills most of the artwork region.
- **Lighting**: dramatic. The event is the primary light source.
- **Background**: the neutral space background for the Event category.
- **Colour**: variable by event type. Red for disasters, cyan for discoveries, white for neutral.

### 10.4 Governor Cards

Governor cards depict characters:

- **Subject**: a single human or humanoid figure in a space suit or faction uniform.
- **Framing**: waist-up portrait. The figure occupies the lower two-thirds of the artwork region. The upper third shows a space background.
- **Lighting**: Rembrandt-style portrait lighting. One strong key light, one weak fill.
- **Background**: the neutral space background for the Governor category.
- **Colour**: neutral with faction-coloured accents on the uniform.

### 10.5 Boards and Player Mats

- **Player mats**: clean, information-dense layouts. Artwork is limited to a small thematic illustration in a corner. The remainder is iconography, track layouts, and typography. SVG composition, not AI-generated.
- **Game board**: see §5. A single large AI-generated space sector illustration with overlay grids and labels applied in SVG.

### 10.6 Expansion Integration

When new content is added via expansions:

1. New biome types may be added to the planet type table following the same colour philosophy (dominant hue + accent hues).
2. Existing biome artwork rules apply unchanged. Do not create variant styles per expansion.
3. New card categories (e.g. "Relic Cards") should define a new biome or subject type and a dedicated space background.

---

## Appendix A: Quick Reference

| Concern | Rule |
|---|---|
| Artwork resolution (master) | 2048 × 2500 px |
| Board resolution (master) | 7680 × 11520 px |
| Card size (renderer) | 744 × 1039 px |
| Artwork region | 672 × 820 px |
| Format (artwork) | WEBP for digital, PNG for print |
| Format (all else) | SVG |
| Camera angle | Low orbit, 15–30° descent |
| Horizon position | 20–35 % from bottom |
| Planet types | 9 (Swamp, Scrap, Proto, Ocean, Jungle, Cold, Earth, Ice, Forge) |
| Max unique backgrounds | 6 |
| Style | Optimistic hard sci-fi, digital painting, clean rendered finish |
| Mood | Aspirational, functional, beautiful |
| Colour rule | Driven by biome, never arbitrary |
| Consistency rule | Same prompt structure, same negative prompt, same aspect ratio |

---

*This document governs all AI-generated visual assets for Mercurio. Prompts, seeds, and outputs should be validated against these rules before entering the asset pipeline.*
