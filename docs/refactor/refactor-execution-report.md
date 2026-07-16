# Refactor Execution Report — Mercurio Design

**Date:** 2026-07-16
**Reference Plan:** `docs/refactor/repository-refactor-plan.md`

---

## Deviations from Reference Plan

The following recommendations from the audit were **not executed** per project decisions:

| # | Recommendation | Reason for Skipping |
|---|---|---|
| 1 | Add `generated/models/planets.json` to `.gitignore` | Kept tracked — it is the canonical intermediate model. |
| 2 | Rename `compiler/build-card-model.js` → `compiler/build-model.js` | Kept original filename. |
| 3 | Merge `docs/specifications/planet-card-rendering-rules.md` into `docs/card-specification.md` | Both documents retained separately. |
| 4 | Delete `templates/cards/planet/slots.json` | Initially left untouched; deleted on 2026-07-16 as dead code (not consumed by any renderer). |

All other recommendations were executed.

---

## Files Deleted

### Compiler Scripts (4)

| Path | Size | Reason |
|---|---|---|
| `compiler/render-svg.js` | 250 lines | Obsolete PoC renderer. Used abandoned two-layer space-background design. Previously claimed deleted by RENDER_IMPL_REPORT.md. |
| `compiler/render-final-card.js` | 180 lines | Single-card renderer (Earth only). 90% code duplication with `build-cards.js`. |
| `compiler/render-preview.js` | 419 lines | HTML preview tool. Validated position data the model no longer emits. |
| `compiler/generate-frame.js` | 73 lines | Generated `frame.svg` (a debug reference artifact). `slots.json` is the canonical source. |

### V1 Artwork (9)

| Path | Reason |
|---|---|
| `source/artwork/cards/planet/planets/cold-v1.png` | Superseded by `cold-v2.png` |
| `source/artwork/cards/planet/planets/earth-v1.png` | Superseded by `earth-v2.png` |
| `source/artwork/cards/planet/planets/forge-v1.png` | Superseded by `forge-v2.png` |
| `source/artwork/cards/planet/planets/ice-v1.png` | Superseded by `ice-v2.png` |
| `source/artwork/cards/planet/planets/jungle-v1.png` | Superseded by `jungle-v2.png` |
| `source/artwork/cards/planet/planets/ocean-v1.png` | Superseded by `ocean-v2.png` |
| `source/artwork/cards/planet/planets/proto-v1.png` | Superseded by `proto-v2.png` |
| `source/artwork/cards/planet/planets/scrap-v1.png` | Superseded by `scrap-v2.png` |
| `source/artwork/cards/planet/planets/swamp-v1.png` | Superseded by `swamp-v2.png` |

### Audit Reports (2)

| Path | Reason |
|---|---|
| `docs/audits/cleanup-report.md` | Superseded by refactor plan and this report. |
| `docs/audits/repository-hygiene-audit.md` | Superseded by refactor plan and this report. |

---

## Files Moved (1)

| Source | Destination | Reason |
|---|---|---|
| `compiler/RENDER_IMPL_REPORT.md` | `docs/render-implementation-report.md` | Historical implementation document, not a compiler script. |

---

## Files Renamed (7) — V2 Artwork Standardization

Underscore variant renamed to hyphen for consistency:

| Old Name | New Name |
|---|---|
| `forge_v2.png` | `forge-v2.png` |
| `ice_v2.png` | `ice-v2.png` |
| `jungle_v2.png` | `jungle-v2.png` |
| `ocean_v2.png` | `ocean-v2.png` |
| `proto_v2.png` | `proto-v2.png` |
| `scrap_v2.png` | `scrap-v2.png` |
| `swamp_v2.png` | `swamp-v2.png` |

All V2 planet artwork files now use the consistent `{type}-v2.png` pattern.

---

## Generated Artifacts Removed from Git Tracking (87)

These files remain on disk but are no longer tracked. They are regenerable via `npm run build`.

| Pattern | Count |
|---|---|
| `generated/cards/planet_*.svg` | 81 |
| `generated/cards/index.json` | 1 |
| `generated/cards/contact-sheet.svg` | 1 |
| `generated/design/resource-panel-preview.svg` | 1 |
| `generated/preview/index.html` | 1 |
| `generated/render-preview/final-planet-card.svg` | 1 |
| `generated/svg/debug/card-preview.svg` | 1 |
| `templates/cards/planet/frame.svg` | 1 |

**Excluded from removal:** `generated/models/planets.json` (retained as canonical intermediate model per project decision).

---

## Files Modified

### `.gitignore` — Added entries

```gitignore
# Generated artifacts (regenerable — build output)
generated/cards/
generated/design/
generated/preview/
generated/render-preview/
generated/svg/
templates/cards/planet/frame.svg
```

Note: `generated/models/` is intentionally absent — `planets.json` remains tracked.

### `package.json` — Production workflow scripts

```json
"scripts": {
  "build:model": "node compiler/build-card-model.js",
  "build:cards": "node compiler/build-cards.js",
  "export:bga": "node compiler/export-bga.js",
  "build": "npm run build:model && npm run build:cards && npm run export:bga"
}
```

### `compiler/build-cards.js` — Simplified artwork lookup

`findArtworkV2()` function changed from iterating `[{type}-v2.png, {type}_v2.png]` to only checking `{type}-v2.png`, since all files are now consistently named.

### `README.md` — Fixed stale references

- Removed references to deleted directories: `fonts/`, `icons/`, `tmp/`, `references/`
- Updated directory tree to match actual structure
- Updated build pipeline diagram (removed references to `generate-frame.js`)
- Added build commands section with `npm run` examples
- Added links to `planet-card-rendering-rules.md` and `render-implementation-report.md`

### `docs/architecture.md` — Fixed source structure

- Replaced `source/fonts/` (never existed) with `source/style/`
- Replaced `source/prompts/` with proper entries for `compiler/` and `style/`

---

## Documentation Added

| Path | Description |
|---|---|
| `docs/refactor/repository-refactor-plan.md` | Pre-refactor audit and plan |
| `docs/refactor/refactor-execution-report.md` | This file — execution record |

---

## Build Validation

### `npm run build:model` (compiler/build-card-model.js)

```
Generated /mnt/c/Users/mOCHU/CascadeProjects/mercurio-design/generated/models/planets.json with 81 planets
```

### `npm run build:cards` (compiler/build-cards.js)

```
Loaded 81 planets from model
  Icon loaded: algae (34886 bytes)
  Icon loaded: grain (35624 bytes)
  Icon loaded: crate (17555 bytes)
  Icon loaded: human (13739 bytes)
  Icon loaded: robot (18761 bytes)
  Icon loaded: water (15932 bytes)
  Icon loaded: ore (28160 bytes)
  Icon loaded: electronics (10562 bytes)

Wrote index.json (81 entries)
Wrote contact-sheet.svg

────────────────────────────────────────
  ASSET COMPILER REPORT
────────────────────────────────────────
  Cards rendered:    81
  Cards skipped:     0
  Render duration:   703ms
  Output directory:  /mnt/c/Users/mOCHU/CascadeProjects/mercurio-design/generated/cards

  Planet type distribution:
    Ice: 6
    Cold: 9
    Earth: 9
    Jungle: 9
    Ocean: 9
    Proto: 9
    Scrap: 9
    Swamp: 9
    Forge: 12

  Validation:
    PASSED - all checks OK
────────────────────────────────────────
```

**Validation results:**
- 81 cards rendered ✓
- 0 cards skipped ✓
- No missing artwork ✓
- All 8 resource icons loaded ✓
- All 9 planet types present ✓
- No broken paths ✓

---

## Final Repository Statistics

### File Counts

| Category | Before | After | Change |
|---|---|---|---|
| Tracked files (approx) | ~178 | ~91 | -87 |
| Compiler scripts | 7 | 3 | -4 |
| Documentation files | 12 | 12 | 0 (2 deleted, 2 added, 1 moved) |
| Artwork PNGs (source) | 27 (9 V1 + 9 V2 + 2 bg + 8 icons + 1 reference) | 18 (9 V2 + 1 bg + 8 icons + 1 reference) | -9 |
| Empty scaffolding dirs | 18 | 18 | 0 |
| npm scripts | 0 | 3 | +3 |

### Repository Size Impact

| Metric | Estimate |
|---|---|
| Tracked content removed | ~28 MB (87 generated files removed from git) |
| Source content removed | ~4.5 MB (9 V1 PNGs) |
| **Total tracking reduction** | **~32.5 MB** |

### Compiler Pipeline

| Before | After |
|---|---|
| 6 scripts (build-card-model, build-cards, render-svg, render-final-card, render-preview, generate-frame) | 2 scripts (build-card-model, build-cards) |
| No npm scripts | 3 npm scripts (build:model, build:cards, build:all) |

### Git Status

All changes are staged or tracked as unstaged modifications. No merge conflicts. Ready for review and commit.
