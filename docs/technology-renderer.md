# Technology Card Renderer

## Renderer pipeline

```
source/data/technologies.json          (canonical — Step 1, hand-authored)
        │  npm run build:tech-model
        ▼
generated/models/technologies.json     (renderer model — Step 2)
        │  npm run build:tech-cards
        ▼
generated/cards-tech/tech_000.svg ... tech_039.svg   (Step 3 — this task)
```

The renderer reads **only** `generated/models/technologies.json`. It does not read the
canonical file, the reference project, or any gameplay repository code.

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
- **artwork window** — grey rounded rectangle placeholder; shows `artwork: unassigned`.
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
- `layout.js` — all reusable layout constants (card size, margins, region rects).
- `frame.js` — renders the outer frame rectangle.
- `artwork.js` — renders the placeholder artwork window (future artwork insertion point).
- `title.js` — renders the title bar + roman level badge; also exports `escapeXml`.
- `project.js` — renders the conditional project box.
- `rules.js` — renders the rules text box.
- `footer.js` — renders the footer type bar.
- `svg.js` — wraps a body string into a complete `<svg>` document with `<metadata>`.

Each module has a single small responsibility so future artwork composition requires
minimal changes.

## Future artwork insertion point

Artwork is injected only in `compiler/lib/technology/artwork.js` (`renderArtworkWindow`).
Today it draws a grey placeholder and the text `artwork: unassigned`, driven by the model's
`artworkDomain` / `artworkOverlay` / `artworkVariant` fields (currently `"unassigned"` /
`"placeholder"`). To add real artwork later, replace the placeholder rect with an `<image>`
or composed group sourced from those model fields — no other module needs to change.

## SVG requirements

Pure SVG primitives only: rounded rectangles and text. No embedded PNG, no external assets,
no gradients, no artwork yet. Cards render entirely from primitives.

## Validation

The renderer aborts on failure if:
- the renderer model is missing (run `build:tech-model` first),
- the technology count is not exactly 40,
- a duplicate output filename is produced,
- any generated SVG is not well-formed (single `<svg>`…`</svg>` root),
- fewer than 40 SVGs are written.
