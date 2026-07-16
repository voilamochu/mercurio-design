# Final Consistency Report — v1.0

**Date:** 2026-07-16
**Scope:** Repository-wide documentation and artifact alignment prior to v1.0 tagging.

---

## Changes Made

### 1. Artwork Mapping Fix — `compiler/build-card-model.js`

Updated all 9 `TYPE_ARTWORK` identifiers from `*-v1` to `*-v2`:

| Type | Before | After |
|------|--------|-------|
| Cold | `cold-v1` | `cold-v2` |
| Earth | `earth-v1` | `earth-v2` |
| Forge | `forge-v1` | `forge-v2` |
| Ice | `ice-v1` | `ice-v2` |
| Jungle | `jungle-v1` | `jungle-v2` |
| Ocean | `ocean-v1` | `ocean-v2` |
| Proto | `proto-v1` | `proto-v2` |
| Scrap | `scrap-v1` | `scrap-v2` |
| Swamp | `swamp-v1` | `swamp-v2` |

**Regenerated** `generated/models/planets.json` — all 81 planet entries now reference `*-v2` artwork. Verified via `build:all` (81 cards rendered, validation PASSED).

### 2. Documentation — Renderer Owns Layout

Updated 4 documentation files to reflect that the renderer owns layout (not templates):

| File | Changes |
|------|---------|
| `docs/architecture.md` | Renamed "Templates own layout" section to "Renderer owns layout"; updated description to say "changing the renderer regenerates every card" |
| `docs/asset-pipeline.md` | Removed `resource-panel.svg` from template table; changed "Templates own layout" to "The renderer owns layout"; removed "Layout coordinates" from renderer does-not-own list; expanded "Renderers Own Composition" to "Renderer Owns Composition and Layout" with explicit statement that renderer hardcodes layout constants |
| `docs/card-specification.md` | Changed Layer 2 location from `templates/cards/planet/resource-panel.svg` to "defined by the renderer"; changed "All dimensions should derive from the template" to "All dimensions are defined by the renderer" |
| `docs/specifications/planet-card-rendering-rules.md` | Updated all references from `resource-panel.svg` to `compiler/build-cards.js` as the source of layout; updated cell position table to match actual renderer constants (Y=592/758/925, X=160/584); updated Information Panel Responsibilities section to describe the actual watermark/dividers implementation |

### 3. Obsolete Artifacts Removed

| File | Status | Reason |
|------|--------|--------|
| `templates/cards/planet/resource-panel.svg` | **Deleted** | Unused by any compiler script. The renderer (`build-cards.js`) hardcodes all layout constants. This was dead code. |
| `templates/cards/planet/frame.svg` | **Deleted** | Unused by any compiler script. Debug/reference artifact with placeholder labels and dashed guide rects. Already gitignored. |

Updated `.gitignore` to comment out the `frame.svg` entry (file no longer exists).

### 4. README Updated

- Added complete pipeline: `Source Assets → build-card-model → build-cards → export-bga → exports/bga`
- Updated build commands section with `export:bga` script
- Removed references to "SVG templates for card frames" from description
- Updated `templates/` directory description to "Template assets (slots.json)"

### 5. Render Implementation Report Cleaned

`docs/render-implementation-report.md`:
- Removed `Files Added` / `Files Modified` / `Files Removed` sections referencing deleted files (`render-final-card.js`, `final-planet-card.svg`, `RENDER_IMPL_REPORT.md`)
- Removed reference to `generated/render-preview/final-planet-card.svg`

### 6. ROADMAP Updated

`docs/ROADMAP.md`:
- Marked all Phase 1 and Phase 2 items as complete
- Added compiler integration and BGA export pipeline to completed items
- Replaced incomplete "..." sections with structured future entries

### 7. New Artifact

`docs/release/final-consistency-report.md` — this document.

---

## Verification

- `npm run build:all` — 81 cards rendered, validation PASSED
- No `*-v1` artwork identifiers remain in `generated/models/planets.json`
- All 4 architecture documents consistently state: the renderer owns layout
- No compiler script references `resource-panel.svg` or `frame.svg`
- No deleted files are referenced in active documentation

## Confirmation

The repository documentation now accurately describes the implemented architecture.

---

## Post-Report Changes (Production Asset Finalization)

After this report was written, the following additional changes were made:

| Date | Change | Details |
|---|---|---|
| 2026-07-16 | Production resolutions adopted | Planet artwork: 576 px, Resource icons: 96 px |
| 2026-07-16 | Original artwork archived | `source/archive/planets/`, `source/archive/icons/` |
| 2026-07-16 | optimize-assets.js updated | Resize target changed from 744×1039 to 576 px width |
| 2026-07-16 | build-cards.js consolidated | Now runs `optimize:assets` internally |
| 2026-07-16 | export-bga.js consolidated | Now runs `optimize:svg` internally, generates `manifest.json` |
| 2026-07-16 | Pipeline scripts reduced | From 5 to 3 (`build:model`, `build:cards`, `export:bga`) |
| 2026-07-16 | Empty scaffolding removed | `exports/print/`, `exports/tts/`, `data/`, `templates/` |
| 2026-07-16 | Obsolete files removed | `slots.json`, `source/style/README.md`, `backgrounds/README.md`, `refactor-plan.md` |
| 2026-07-16 | Documentation refreshed | README, architecture.md, asset-pipeline.md, render-implementation-report.md |

The repository is now internally consistent and ready for Version 1.0.
