# Technology Card Renderer

## Renderer pipeline

```
source/data/technologies.json          (canonical — Step 1, hand-authored)
        │  npm run build:tech-model
        ▼
generated/models/technologies.json     (renderer model — Step 2)
        │
source/data/technology-artwork-map.json  (domain + overlay per technology id)
        │  npm run build:tech-cards
        ▼
generated/cards-tech/tech_000.svg ... tech_039.svg   (Step 4 — artwork composition)
```

The renderer reads **only** `generated/models/technologies.json` and the artwork map
`source/data/technology-artwork-map.json`. It does not read the canonical file, the
reference project, or any gameplay repository code.

Command: `npm run build:tech-cards`.

## Layout regions

Card canvas: `744 × 1039` (same base dimensions as the planet pipeline). Regions, top to
bottom, all derived from `compiler/lib/technology/layout.js`:

```
┌─────────────────────────────────────────────┐  ← outer frame (rounded rect, stroke)
│ ┌─────────────────────────────────────────┐ │
│ │            ARTWORK WINDOW                │ │  grey placeholder rect
│ │          "artwork: unassigned"           │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ TITLE BAR     name ............ [ II ]   │ │  name + roman level badge (top-right)
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │  ── PROJECT BOX (Project cards only)
│ │ Project: <name>                          │ │
│ │ <projectDescription>                     │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ RULES BOX     <description>              │ │  technology description
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ FOOTER         <displayType>             │ │  technology type
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- **outer frame** — rounded rectangle border around the whole card.
- **artwork window** — composed procedurally from domain + overlay artwork inside a
  rounded-rect clipping mask (see "Artwork pipeline" below). Falls back to a grey
  placeholder when the mapped asset file is missing.
- **title bar** — technology `name` on the left, roman numeral level badge on the right.
- **project box** — rendered only when `type === "Project"`; shows `projectName` + `projectDescription`.
- **rules box** — the technology `description`.
- **footer** — the `displayType` (Project / Passive / Active / Endgame).

Copies and runtime information are intentionally excluded.

## Module responsibilities

`compiler/build-tech-cards.js` — orchestrator. Loads the model, iterates technologies,
computes dynamic rule/footer Y positions, writes one SVG per technology, and validates
exactly 40 well-formed, uniquely-named SVGs.

`compiler/lib/technology/`
- `layout.js` — all reusable layout constants (card size, margins, region rects, fonts, frame colors).
- `frame.js` — renders the outer frame rectangle.
- `artwork.js` — legacy placeholder artwork renderer (superseded by the compositor; retained for reference).
- `artwork-compositor.js` — loads domain + overlay PNGs as base64, builds clip/gradient/vignette defs, and composes the artwork layers. No layout logic.
- `title.js` — renders the title bar + roman level (integrated, right-aligned); also exports `escapeXml` and `fontAttr`.
- `project.js` — renders the conditional project box.
- `rules.js` — renders the rules text box (word-wrapped).
- `flavor.js` — renders the always-present flavor text region.
- `footer.js` — renders the footer type bar.
- `svg.js` — wraps a body string into a complete `<svg>` document with `<metadata>` and `<defs>`.

Each module has a single small responsibility so future artwork composition requires
minimal changes.

## Artwork pipeline

Artwork is composed, not merely embedded. `compiler/lib/technology/artwork-compositor.js`
does the composition; the renderer (`build-tech-cards.js`) supplies the artwork-window
rectangle and the per-technology `domain` / `overlay` from the mapping file.

### Artwork mapping

`source/data/technology-artwork-map.json` is the single source of truth that maps every
technology `id` to a `domain` (one of 8 domain illustrations) and an `overlay` (one of 5
overlay motifs). The renderer **never** hardcodes these assignments.

Asset locations (files supplied separately, dropped in by the art pipeline):

```
source/artwork/technology/domains/<domain>.png    (8 illustrations)
source/artwork/technology/overlays/<overlay>.png  (5 motifs)
```

A missing asset file is not fatal: the compositor falls back to a grey placeholder labelled
with the missing domain id, and the renderer prints a warning. This keeps all 40 cards
renderable while art is still being produced.

### Layer order

Inside a rounded-rect `<clipPath>` matching the artwork window:

```
Layer 1  Domain artwork          (full-bleed, xMidYMid slice)
Layer 2  Soft dark gradient       (linear, ~28% opacity, bottom-weighted)
Layer 3  Overlay artwork          (scaled / rotated / anchored, ~15–25% opacity)
Layer 4  Subtle vignette          (radial gradient, ~16% opacity, reduced strength)
```

SVG blend modes (`mix-blend-mode`) are used for the overlay and glow, not normal alpha.

### Renderer v2 — multi-pass artwork compositor

`artwork-compositor.js` (Renderer v2) replaces the flat paste with a 7-pass pipeline, all
inside the artwork-window clip:

```
Pass 1  Domain artwork          (full-bleed, xMidYMid slice)
Pass 2  Colour grading          (subtle saturate-down + warm shadows / cool highlights)
Pass 3  Lighting pass           (soft radial light behind overlay, gaussian-blurred, screen)
Pass 4  Overlay mask            (SVG mask; radial white→transparent, ~75% visible, no hard edges)
Pass 5  Overlay render          (masked, opacity ~18–28%, blend mode, rotation + anchor kept)
Pass 6  Overlay glow            (blurred overlay duplicate, screen blend, low opacity)
Pass 7  Global vignette         (reduced strength)
```

All tuning lives in a single `ART_CONFIG` object at the top of the compositor — adjust only
those constants to retune the renderer. `OVERLAY_PRESETS` keeps per-overlay `scale` /
`rotation` / `anchor`; `overlayOpacity` comes from `ART_CONFIG` unless a preset overrides it.

#### ART_CONFIG fields

- `blendMode` — overlay blend (`soft-light`, `screen`, `lighten`, …)
- `overlayOpacity` — overlay opacity (0.18–0.28)
- `overlayGlowOpacity` — glow opacity
- `overlayGlowBlur` — glow gaussian blur radius
- `lightingOpacity` — radial light opacity
- `lightingRadius` — light radius (fraction of window)
- `lightingBlur` — light gaussian blur radius
- `overlayMaskRadius` — visible fraction of overlay (~0.75)
- `overlayMaskFeather` — edge feather fraction
- `vignetteOpacity` — global vignette (reduced vs v1)
- `colourGradeStrength` — colour-grade intensity
- `gradientOpacity` — bottom-weighted dark gradient

### Overlay placement

Overlays never stretch across the full window. Each overlay is transformed by configurable
constants in the compositor:

- `scale` — size relative to the window (e.g. 0.45–0.8)
- `rotation` — degrees
- `anchor` — point within the window (`center`, `top-left`, `top-right`, `bottom-left`, `bottom-right`, `top`, `bottom`)
- `opacity` — 0.15–0.25
- `crop` — reserved hook (currently `null`)

Per-overlay presets live in `OVERLAY_PRESETS`; `OVERLAY_DEFAULTS` provides the base. Future
cards may override individual overlays by extending the preset table — no renderer change
required.

### Future extension points

- **Blend modes** — swap normal alpha for `mix-blend-mode` on the overlay/domain layers.
- **Per-card overrides** — add per-technology transform overrides in the mapping file and
  have the compositor read them.
- **Real assets** — drop the domain/overlay PNGs into the paths above; no code change needed.
- **Vignette/gradient tuning** — `GRADIENT_OPACITY` and `VIGNETTE_OPACITY` constants.

## SVG requirements

Pure SVG. Artwork is embedded as base64 PNG `<image>` elements inside a clipping group; all
other regions use rounded rectangles and text. No external runtime assets, no gradients on
the card frame, no flavor generation.

## Validation

The renderer aborts on failure if:
- the renderer model is missing (run `build:tech-model` first),
- the artwork map is missing,
- any technology `id` lacks a mapping entry,
- the technology count is not exactly 40,
- a duplicate output filename is produced,
- any generated SVG is not well-formed (single `<svg>`…`</svg>` root),
- fewer than 40 SVGs are written.

Missing domain/overlay **asset files** do not abort — they fall back to the grey
placeholder and are reported as warnings, so the full set of 40 cards always renders.
