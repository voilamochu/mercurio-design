# Repository Refactor Plan — Mercurio Design

**Date:** 2026-07-16
**Auditor:** OpenCode Repository Audit
**Scope:** Full repository analysis, no modifications made

---

## Executive Summary

### Current Repository Strengths

1. **Clear architectural vision.** `docs/architecture.md` defines a coherent design philosophy: source assets are immutable, generated assets are disposable, data is separate from presentation, and templates own layout.
2. **Working pipeline.** `compiler/build-card-model.js` → `compiler/build-cards.js` produces 81 rendered planet card SVGs from CSV source data, artwork, icons, and templates.
3. **Comprehensive card specification.** `docs/card-specification.md` and `docs/specifications/planet-card-rendering-rules.md` together define a thorough visual contract.
4. **Quality AI style guide.** `docs/ai-style-guide.md` (510 lines) provides detailed biome colour tables, camera angles, prompt templates, and naming conventions.
5. **Design token system.** `source/style/` contains semantic JSON tokens for colours, typography, spacing, and effects.
6. **All 9 planet types have V2 artwork.** V2 PNGs exist for every biome (cold, earth, forge, ice, jungle, ocean, proto, scrap, swamp).
7. **Resource icon library.** 8 resource icons (PNG) in `source/icons/resources/`.
8. **Small commit history.** 5 commits — low complexity, easy to refactor safely.

### Current Repository Weaknesses

1. **4 renderers where 1 is needed.** `render-svg.js` (obsolete PoC), `render-final-card.js` (single-card test), `render-preview.js` (HTML validation tool), `build-cards.js` (production). Massive code duplication across all four.
2. **Zombie file.** `compiler/render-svg.js` exists despite `RENDER_IMPL_REPORT.md` stating it was removed.
3. **Generated artifacts tracked in git.** 81 card SVGs, 2 JSON files, 3 preview files (~28 MB) all tracked. Architecture says these are "disposable."
4. **Conflicting Y coordinates.** `templates/cards/planet/slots.json` defines Y positions (250, 430, 610) that are never used. The renderers use hardcoded Y positions (592, 758, 925). The slot file is stale.
5. **Generated frame committed as template.** `compiler/generate-frame.js` writes `templates/cards/planet/frame.svg`, blurring the line between source and generated.
6. **V2 artwork naming inconsistency.** Some files use hyphens (`earth-v2.png`), others underscores (`forge_v2.png`). The renderer must try both patterns.
7. **Stale docs in compiler/.** `compiler/RENDER_IMPL_REPORT.md` is a historical document, not a compiler script.
8. **README.md references deleted directories.** Lists `fonts/`, `icons/`, `tmp/`, `references/` — all already deleted.
9. **V1 artwork still tracked.** 9 `*-v1.png` files alongside V2 versions. V2 is canonical.
10. **Docs mixed with source.** `source/style/README.md` and `source/artwork/cards/planet/backgrounds/README.md` are documentation files buried in asset directories.
11. **No npm build scripts.** `package.json` has no scripts — must run `node compiler/xxx.js` manually.
12. **Empty scaffolding sprawl.** 18 empty subdirectories across `data/`, `generators/`, `prompts/`, `illustrations/`, `scripts/`, `exports/`.
13. **Duplicate audits.** `docs/audits/cleanup-report.md` and `docs/audits/repository-hygiene-audit.md` overlap with this plan.
14. **render-preview.js validates position data the model no longer produces.** `build-card-model.js` does not emit `position.x`/`position.y`, but `render-preview.js` validates and requires it. This is a latent bug.

---

## Proposed Directory Structure

```
mercurio-design/
├── .gitignore
├── LICENSE              (populate or remove)
├── package.json         (add build scripts)
├── README.md            (fix stale path references)
├── source/
│   ├── csv/planets/     (4 CSV files — canonical data)
│   ├── artwork/
│   │   └── cards/
│   │       └── planet/
│   │           ├── backgrounds/ (deep-space-v1.png)
│   │           ├── planets/     (9 V2 PNGs only)
│   │           └── references/  (v1 reference sheet — keep)
│   ├── icons/
│   │   ├── planet-types/ (9 SVG icons)
│   │   └── resources/    (8 PNG icons)
│   └── style/            (4 JSON tokens + README)
├── templates/
│   └── cards/planet/     (resource-panel.svg, frame.svg*)
├── compiler/
│   ├── build-model.js    (CSV → planets.json)
│   └── build-cards.js    (planets.json → SVG cards)
├── docs/
│   ├── architecture.md
│   ├── card-specification.md
│   ├── ai-style-guide.md
│   ├── planets-card-rendering-rules.md
│   ├── render-implementation-report.md  (moved from compiler/)
│   ├── ROADMAP.md
│   └── refactor/
│       └── repository-refactor-plan.md  (this file)
├── generated/            (all — add to .gitignore)
│   ├── models/
│   ├── cards/
│   ├── preview/
│   ├── render-preview/
│   └── svg/
├── data/                 (keep empty scaffolding)
├── exports/              (keep empty scaffolding)
├── generators/           (keep empty scaffolding)
├── illustrations/        (keep empty scaffolding)
├── prompts/              (keep empty scaffolding)
├── scripts/              (keep empty scaffolding)
└── work/                 (keep empty scaffolding)
```

*`frame.svg` is generated and should be gitignored, but if kept for convenience it lives in `templates/`.

---

## File Actions

### Delete — Obsolete Compiler Scripts

| Current Path | Action | Reason |
|---|---|---|
| `compiler/render-svg.js` | Delete | Obsolete PoC renderer. Superseded by `build-cards.js`. Uses separate space background layer (abandoned design). Report claims it was already deleted. |
| `compiler/render-final-card.js` | Delete | Duplicate of `build-cards.js`. Renders only 1 card (Earth). 90% code duplication. |
| `compiler/render-preview.js` | Delete | HTML preview/validation tool. Validates position data that `build-card-model.js` no longer emits. Maintained separately from the renderer leads to drift. Validation logic should live in `build-model.js`. |
| `compiler/generate-frame.js` | Delete | Generates `frame.svg` which is a debug/reference artifact. `slots.json` is the canonical source. |

### Delete — Obsolete/Superseded Artifacts

| Current Path | Action | Reason |
|---|---|---|
| `source/artwork/cards/planet/planets/cold-v1.png` | Delete | Superseded by `cold-v2.png`. |
| `source/artwork/cards/planet/planets/earth-v1.png` | Delete | Superseded by `earth-v2.png`. |
| `source/artwork/cards/planet/planets/forge-v1.png` | Delete | Superseded by `forge-v2.png`. |
| `source/artwork/cards/planet/planets/ice-v1.png` | Delete | Superseded by `ice-v2.png`. |
| `source/artwork/cards/planet/planets/jungle-v1.png` | Delete | Superseded by `jungle-v2.png`. |
| `source/artwork/cards/planet/planets/ocean-v1.png` | Delete | Superseded by `ocean-v2.png`. |
| `source/artwork/cards/planet/planets/proto-v1.png` | Delete | Superseded by `proto-v2.png`. |
| `source/artwork/cards/planet/planets/scrap-v1.png` | Delete | Superseded by `scrap-v2.png`. |
| `source/artwork/cards/planet/planets/swamp-v1.png` | Delete | Superseded by `swamp-v2.png`. |

### Move — Misplaced Files

| Current Path | Action | Destination | Reason |
|---|---|---|---|
| `compiler/RENDER_IMPL_REPORT.md` | Move | `docs/render-implementation-report.md` | Historical implementation doc, not a compiler script. |

### Delete — Stale Documentation

| Current Path | Action | Reason |
|---|---|---|
| `docs/audits/cleanup-report.md` | Delete | Superseded by this plan. Historical record of a previous cleanup action. |
| `docs/audits/repository-hygiene-audit.md` | Delete | Superseded by this plan. First audit whose recommendations (some already executed) are now fully covered here. |

### Delete — Generated Artifacts (from git tracking; files stay on disk for now)

| Current Path | Action | Reason |
|---|---|---|
| `generated/cards/` (81 SVGs + index.json + contact-sheet.svg) | Remove from git, add to .gitignore | Regenerable build output. |
| `generated/design/resource-panel-preview.svg` | Remove from git, add to .gitignore | Regenerable build output. |
| `generated/models/planets.json` | Remove from git, add to .gitignore | Regenerable build output. |
| `generated/preview/index.html` | Remove from git, add to .gitignore | Regenerable build output. |
| `generated/render-preview/final-planet-card.svg` | Remove from git, add to .gitignore | Regenerable build output. |
| `generated/svg/debug/card-preview.svg` | Remove from git, add to .gitignore | Regenerable build output. |
| `templates/cards/planet/frame.svg` | Remove from git, add to .gitignore | Generated by `generate-frame.js`. Regenerable. |

### Rename — Compiler Scripts

| Current Path | Action | Destination | Reason |
|---|---|---|---|
| `compiler/build-card-model.js` | Rename | `compiler/build-model.js` | Shorter, consistent with `build-cards.js`. |
| `compiler/build-cards.js` | Rename (optional) | Keep as-is or rename to `build-cards.js` (already short) | Already clear. |

### Merge — Documentation

| Current Path | Action | Merge Into | Reason |
|---|---|---|---|
| `docs/specifications/planet-card-rendering-rules.md` | Merge | `docs/card-specification.md` | Overlapping content. The rendering rules are implementation-specific and should be a section within the main card spec. |
| `source/style/README.md` | Merge | Root `README.md` or `docs/architecture.md` | Documentation about design tokens should not be buried in `source/style/`. Explain token system in architecture doc. |
| `source/artwork/cards/planet/backgrounds/README.md` | Merge | Root `README.md` | Content describes background asset usage guidelines. Belongs in project docs, not in `source/artwork/`. |

### Keep — With Changes

| Current Path | Action | Reason |
|---|---|---|
| `README.md` | Edit | Remove references to deleted paths (`fonts/`, `icons/`, `tmp/`, `references/`). |
| `package.json` | Edit | Add `"scripts"` block with `build:model`, `build:cards`, `build:all` commands. |
| `.gitignore` | Edit | Add `generated/` entries. |
| `source/artwork/cards/planet/planets/*-v2.png` (9 files) | Standardize naming | Rename `forge_v2.png`, `ice_v2.png`, `jungle_v2.png`, `ocean_v2.png`, `proto_v2.png`, `scrap_v2.png`, `swamp_v2.png` to use hyphens (`forge-v2.png`, etc.). Then remove fallback logic from renderer. |

### Keep — Unchanged

| Path | Reason |
|---|---|
| `.gitignore` (keep with additions) | Active git configuration. |
| `package.json` (keep with edits) | Minimal Node declaration, needs build scripts. |
| `LICENSE` | Empty but placeholder for future license. |
| `README.md` (keep with edits) | Project overview, needs stale reference fixes. |
| `compiler/build-card-model.js` (keep, rename) | Core pipeline script. |
| `compiler/build-cards.js` (keep) | Core pipeline script. |
| `source/csv/planets/*.csv` (4 files) | Canonical source data. |
| `source/artwork/cards/planet/backgrounds/deep-space-v1.png` | Background artwork. |
| `source/artwork/cards/planet/planets/*-v2.png` (9 files) | Canonical planet artwork. |
| `source/artwork/cards/planet/references/planet-library-v1-sheet.png` | Historical reference sheet. |
| `source/icons/planet-types/*.svg` (9 files) | Planet type icons (may be used for future card types). |
| `source/icons/resources/*.png` (8 files) | Resource icons, actively used. |
| `source/style/colors.json` | Design tokens. |
| `source/style/typography.json` | Design tokens. |
| `source/style/spacing.json` | Design tokens. |
| `source/style/effects.json` | Design tokens. |
| `templates/cards/planet/resource-panel.svg` | Active template. |
| `templates/cards/planet/slots.json` | Slot definitions (needs Y-coordinate audit). |
| `docs/architecture.md` | Core architectural document. |
| `docs/card-specification.md` | Card specification. |
| `docs/ai-style-guide.md` | AI style guide. |
| `docs/specifications/planet-card-rendering-rules.md` | Keep until merged into card-specification.md. |
| `docs/ROADMAP.md` | Keep, should be updated to reflect current status. |

---

## Documentation Consolidation

### Remain (as-is)

| Document | Reason |
|---|---|
| `docs/architecture.md` | Core architectural vision. Keep unchanged. |
| `docs/card-specification.md` | Main card specification. Actively referenced. |
| `docs/ai-style-guide.md` | 510-line comprehensive AI style guide. Self-contained. |
| `docs/ROADMAP.md` | Project roadmap. Update checkboxes when phases complete. |
| `docs/render-implementation-report.md` | (moved from compiler/) Historical record. Low value but harmless. |
| `docs/refactor/repository-refactor-plan.md` | This file. |

### Merge

| Source | Target | Reason |
|---|---|---|
| `docs/specifications/planet-card-rendering-rules.md` | `docs/card-specification.md` | Both describe card layout. The rendering rules add per-cell coordinates, production chaining, and runtime overlay specs. Append as sections of card-specification.md. |
| `source/style/README.md` | `docs/architecture.md` or Root README | Design token documentation belongs in project docs, not in source data directory. |
| `source/artwork/cards/planet/backgrounds/README.md` | Root `README.md` | Background asset guidelines belong in project documentation. |

### Delete

| Document | Reason |
|---|---|
| `docs/audits/cleanup-report.md` | Historical record of one-time cleanup. Superseded by this plan. |
| `docs/audits/repository-hygiene-audit.md` | Previous audit. Superseded by this plan. |
| `compiler/RENDER_IMPL_REPORT.md` | Move to `docs/render-implementation-report.md` first, then keep. |

---

## Compiler Simplification

### Minimum Required Compiler Scripts

| Script | Input | Output | Description |
|---|---|---|---|
| `compiler/build-model.js` | `source/csv/planets/*.csv` | `generated/models/planets.json` | Parse CSV → validate → emit canonical model |
| `compiler/build-cards.js` | `generated/models/planets.json` + artwork + icons + templates | `generated/cards/planet_*.svg` | Compose full deck SVGs |

**Total: 2 scripts** (down from 6).

### Scripts to Delete

| Script | Lines | Why |
|---|---|---|
| `compiler/render-svg.js` | 250 | Obsolete PoC. Uses abandoned two-layer space-background design. Already claimed deleted by RENDER_IMPL_REPORT.md. |
| `compiler/render-final-card.js` | 180 | Single-card subset of `build-cards.js`. Only renders Earth. 90% code duplication. |
| `compiler/render-preview.js` | 419 | HTML preview tool. Validates position data the model no longer emits. Belongs as a feature in `build-cards.js` or `build-model.js` if at all. |
| `compiler/generate-frame.js` | 73 | Generates debug frame.svg. `slots.json` is the canonical source. Frame is for reference only. |

### Changes to Remaining Scripts

**`compiler/build-cards.js`** changes:
- Remove dependency on `frame.svg` (it is unused by the renderer already)
- Encapsulate shared constants (CARD_W, CARD_H, ROW_Y_PCT, ICON_SIZE, etc.) in a shared config module (optional — inline is acceptable for 2 scripts)
- Fix V2 artwork naming: try `{type}-v2.png` only (remove underscore fallback after renaming assets)

**`compiler/build-model.js`** (renamed from `build-card-model.js`):
- Keep unchanged functionally
- Consider adding position data back to the model if render-preview.js validation is valued

### npm Scripts to Add to `package.json`

```json
{
  "scripts": {
    "build:model": "node compiler/build-model.js",
    "build:cards": "node compiler/build-cards.js",
    "build:all": "npm run build:model && npm run build:cards",
    "build:frame": "node compiler/generate-frame.js"
  }
}
```

---

## Data Simplification

### Canonical (Keep as Source of Truth)

| Artifact | Path | Reason |
|---|---|---|
| Planet layout CSV | `source/csv/planets/Mercurio_planet_layout_v3.csv` | Source data |
| Planet resources CSV | `source/csv/planets/PlanetResources_v3.csv` | Source data |
| Planet types CSV | `source/csv/planets/PlanetType_v3.csv` | Source data |
| Planet benefits CSV | `source/csv/planets/PlanetBenefits_v3.csv` | Source data |
| Design tokens (JSON) | `source/style/colors.json`, `typography.json`, `spacing.json`, `effects.json` | Canonical design system |
| Resource icons (PNG) | `source/icons/resources/*.png` | Used by renderer |
| Planet type icons (SVG) | `source/icons/planet-types/*.svg` | May be used for future card types |
| V2 planet artwork | `source/artwork/cards/planet/planets/*-v2.png` (hyphenated) | Canonical artwork |
| Space background | `source/artwork/cards/planet/backgrounds/deep-space-v1.png` | Background asset |
| Resource panel template | `templates/cards/planet/resource-panel.svg` | SVG template |
| Slot definitions | `templates/cards/planet/slots.json` | Layout data |

### Generated/Disposable (Remove from git, add to .gitignore)

| Artifact | Path | Reason |
|---|---|---|
| Planet card models | `generated/models/planets.json` | Regenerable from CSV |
| Rendered card SVGs | `generated/cards/planet_*.svg` (81 files) | Regenerable |
| Card index | `generated/cards/index.json` | Regenerable |
| Contact sheet | `generated/cards/contact-sheet.svg` | Regenerable |
| Design preview | `generated/design/resource-panel-preview.svg` | Regenerable |
| HTML preview | `generated/preview/index.html` | Regenerable |
| Render preview SVG | `generated/render-preview/final-planet-card.svg` | Regenerable |
| Debug card SVG | `generated/svg/debug/card-preview.svg` | Obsolete format, regenerable |
| Debug frame SVG | `templates/cards/planet/frame.svg` | Regenerable from `slots.json` |

---

## Refactor Order

This ordered checklist minimizes merge conflicts and broken references.

### Phase 0: Preparation (no file deletions)

- [ ] 0.1 Verify working tree is clean: `git status`
- [ ] 0.2 Run current pipeline end-to-end: `node compiler/build-card-model.js && node compiler/build-cards.js`
- [ ] 0.3 Confirm 81 card SVGs in `generated/cards/`

### Phase 1: .gitignore and package.json (safe, no code changes)

- [ ] 1.1 Add `generated/` entries to `.gitignore`
- [ ] 1.2 Add `templates/cards/planet/frame.svg` to `.gitignore`
- [ ] 1.3 Add npm scripts to `package.json`
- [ ] 1.4 Commit: `"chore: add generated/ to gitignore, add npm scripts"`

### Phase 2: Remove generated artifacts from git (no code changes)

- [ ] 2.1 `git rm --cached generated/cards/planet_*.svg`
- [ ] 2.2 `git rm --cached generated/cards/index.json`
- [ ] 2.3 `git rm --cached generated/cards/contact-sheet.svg`
- [ ] 2.4 `git rm --cached generated/models/planets.json`
- [ ] 2.5 `git rm --cached generated/preview/index.html`
- [ ] 2.6 `git rm --cached generated/render-preview/final-planet-card.svg`
- [ ] 2.7 `git rm --cached generated/svg/debug/card-preview.svg`
- [ ] 2.8 `git rm --cached generated/design/resource-panel-preview.svg`
- [ ] 2.9 `git rm --cached templates/cards/planet/frame.svg`
- [ ] 2.10 Commit: `"chore: stop tracking generated artifacts"`

### Phase 3: Delete obsolete compiler scripts (no dependencies)

- [ ] 3.1 Delete `compiler/render-svg.js`
- [ ] 3.2 Delete `compiler/render-final-card.js`
- [ ] 3.3 Delete `compiler/render-preview.js`
- [ ] 3.4 Delete `compiler/generate-frame.js`
- [ ] 3.5 Move `compiler/RENDER_IMPL_REPORT.md` → `docs/render-implementation-report.md`
- [ ] 3.6 Commit: `"refactor: remove 4 obsolete compiler scripts, move report to docs"`

### Phase 4: Delete obsolete audits (safe, no dependencies)

- [ ] 4.1 Delete `docs/audits/cleanup-report.md`
- [ ] 4.2 Delete `docs/audits/repository-hygiene-audit.md`
- [ ] 4.3 Commit: `"chore: remove superseded audit reports"`

### Phase 5: Standardize V2 artwork naming (changes asset paths)

- [ ] 5.1 Rename `forge_v2.png` → `forge-v2.png`
- [ ] 5.2 Rename `ice_v2.png` → `ice-v2.png`
- [ ] 5.3 Rename `jungle_v2.png` → `jungle-v2.png`
- [ ] 5.4 Rename `ocean_v2.png` → `ocean-v2.png`
- [ ] 5.5 Rename `proto_v2.png` → `proto-v2.png`
- [ ] 5.6 Rename `scrap_v2.png` → `scrap-v2.png`
- [ ] 5.7 Rename `swamp_v2.png` → `swamp-v2.png`
- [ ] 5.8 Remove fallback underscore pattern from `build-cards.js` `findArtworkV2()`
- [ ] 5.9 Commit: `"refactor: standardize V2 artwork naming (hyphens)"`

### Phase 6: Delete V1 artwork (safe after Phase 5)

- [ ] 6.1 Delete `cold-v1.png`, `earth-v1.png`, `forge-v1.png`, `ice-v1.png`
- [ ] 6.2 Delete `jungle-v1.png`, `ocean-v1.png`, `proto-v1.png`, `scrap-v1.png`, `swamp-v1.png`
- [ ] 6.3 Commit: `"chore: remove V1 artwork (superseded by V2)"`

### Phase 7: Rename compiler script (changes import chain)

- [ ] 7.1 Rename `compiler/build-card-model.js` → `compiler/build-model.js`
- [ ] 7.2 Update `package.json` scripts to reference new name
- [ ] 7.3 Commit: `"refactor: rename build-card-model.js to build-model.js"`

### Phase 8: Fix README stale references

- [ ] 8.1 Remove references to deleted paths (`fonts/`, `icons/`, `tmp/`, `references/`)
- [ ] 8.2 Update directory tree to match actual structure
- [ ] 8.3 Commit: `"docs: fix README stale directory references"`

### Phase 9: Documentation consolidation (optional, lower priority)

- [ ] 9.1 Merge `planet-card-rendering-rules.md` into `card-specification.md`
- [ ] 9.2 Merge `source/style/README.md` content into `docs/architecture.md` or root README
- [ ] 9.3 Merge `backgrounds/README.md` content into root README
- [ ] 9.4 Update `docs/ROADMAP.md` checkboxes
- [ ] 9.5 Commit: `"docs: consolidate design docs"`

### Post-Phase: Verification

- [ ] V.1 Run `npm run build:all` (or equivalent)
- [ ] V.2 Verify 81 card SVGs regenerated in `generated/cards/`
- [ ] V.3 Verify `git status` shows no unexpected changes
- [ ] V.4 Verify `generated/` and `frame.svg` are not tracked
- [ ] V.5 Update this plan's status checkboxes

---

## Implementation Report

**Files to delete:** 18 (4 compiler scripts, 9 V1 artwork, 2 audits, 1 frame.svg, 2 docs duplicating source/style/README.md and backgrounds/README.md — though those last 2 are merge+delete, not pure delete)

**Files to move:** 1 (`RENDER_IMPL_REPORT.md`)

**Files to rename:** 1 (compiler script) + 7 (artwork PNGs)

**Files to edit:** 3 (`.gitignore`, `package.json`, `README.md`)

**Files to remove from git (keep on disk):** ~88 generated artifacts

**Files to remain unchanged:** ~25 source/template/doc files

**Empty scaffolding directories retained:** 18 (future use)

**Compiler scripts reduced:** 6 → 2

**Tracked generated artifacts eliminated:** ~88 files

**Estimated repository size reduction from git tracking:** ~28 MB (most from generated SVGs)

**Merge conflicts risk:** Low. The repo has 5 commits and no branches. Phases are independent. Phase 7 (rename build-card-model.js) is the only step that could break references, and only if a developer runs the old script name.
