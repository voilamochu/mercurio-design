# Planet Card Backgrounds

**Status: OBSOLETE for planet cards**

Version: 1.0

---

## Purpose

This directory previously contained the canonical deep-space background artwork used when composing Mercurio planet cards.

**The separate space background layer is no longer part of the canonical planet card composition.** Planet artwork is now a single raster image that includes both the planet and its surrounding space. See `source/artwork/cards/planet/planets/` for the current artwork assets.

---

## Current Assets

| Asset | Status | Notes |
|-------|--------|-------|
| deep-space-v1.png | Archived | No longer used in planet card composition |

---

## Historical Usage

In the previous design, backgrounds occupied the lowest visual layer in the composition stack:

```
Space Background  (obsolete — now part of planet artwork)
↓
Planet Artwork    (now includes background)
↓
Frame
↓
Gameplay Elements
↓
Runtime Overlays
```

The current three-layer composition is:

```
Layer 1: Planet Artwork (raster, planet + space in one image)
Layer 2: Information Panel (SVG template)
Layer 3: Gameplay Elements (programmatic)
```

---

## Remaining Uses

The deep-space-v1.png asset may still be used for non-planet card types (events, technologies, contracts) that require a separate space background. Refer to the AI Style Guide (§4) for details.

---

## Naming Convention (Legacy)

```
deep-space-v1.png
deep-space-v2.png
deep-space-dark-v1.png
deep-space-nebula-v1.png
```

Future variants for non-planet card types should follow the same convention.

