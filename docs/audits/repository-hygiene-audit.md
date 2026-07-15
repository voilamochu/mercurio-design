# Repository Hygiene Audit

**Date:** 2026-07-15
**Scope:** Full repository analysis
**Methodology:** Manual review of every file and directory
**Action:** Analysis only — no modifications made

---

## Classification by File

### Root Level

#### `.gitignore`
**Classification:** KEEP
**Reason:** Active git configuration covering node_modules, build outputs, OS artifacts, IDE files, and environment files.
**Confidence:** High

#### `package.json`
**Classification:** KEEP
**Reason:** Minimal but necessary Node.js project declaration (`"type": "commonjs"`). Referenced by compiler scripts.
**Confidence:** High

#### `README.md`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). No project description, setup instructions, or any meaningful content.
**Confidence:** High

#### `LICENSE`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). No license text. Either populate with a real license or remove.
**Confidence:** High

---

### `docs/`

#### `docs/architecture.md`
**Classification:** KEEP
**Reason:** 346-line canonical document describing the project vision, repository structure, build pipeline, and design philosophy. Actively referenced as the source of truth.
**Confidence:** High

#### `docs/ai-style-guide.md`
**Classification:** KEEP
**Reason:** 505-line comprehensive style guide for AI-generated artwork. Defines planet types, camera angles, layering strategy, prompt templates, and resolution standards. Actively used.
**Confidence:** High

#### `docs/card-specification.md`
**Classification:** KEEP
**Reason:** 400-line detailed card specification covering anatomy, rendering order, accessibility, and layout rules. Actively referenced.
**Confidence:** High

#### `docs/specifications/planet-card-rendering-rules.md`
**Classification:** KEEP
**Reason:** 280-line document covering resource placement, hitbox model, production levels, VP rendering, status overlays, and ownership colours. Supplements `card-specification.md` with implementation-specific rules.
**Confidence:** High

#### `docs/ROADMAP.md`
**Classification:** KEEP
**Reason:** Roadmap tracking phases 0–4 with checkboxes. Provides project planning context. Contains actionable unchecked items (planet artwork library, frame v2, first production card, compiler integration).
**Confidence:** High

#### `docs/art-direction.md`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). Never populated. Content domain is covered by `docs/ai-style-guide.md` and `docs/architecture.md`.
**Confidence:** High

#### `docs/asset-compiler.md`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). Never populated. Compiler architecture is described in `docs/architecture.md` and implemented in `compiler/`.
**Confidence:** High

#### `docs/asset-pipeline.md`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). Never populated. Pipeline is described in `docs/architecture.md` (Canonical Build Pipeline section).
**Confidence:** High

#### `docs/color-palette.md`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). Never populated. Actual colour tokens live in `source/style/colors.json`.
**Confidence:** High

#### `docs/icon-guidelines.md`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). Never populated. No icon assets currently exist in the repository.
**Confidence:** High

#### `docs/visual-language.md`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). Never populated. Visual language is defined in `docs/ai-style-guide.md` and `docs/architecture.md`.
**Confidence:** High

---

### `compiler/`

#### `compiler/build-card-model.js`
**Classification:** KEEP
**Reason:** Active compiler script (241 lines). Reads CSV source data, validates, and generates `generated/models/planets.json`. Core pipeline component.
**Confidence:** High

#### `compiler/generate-frame.js`
**Classification:** KEEP
**Reason:** Active compiler script (73 lines). Reads `slots.json`, generates `frame.svg`. Core pipeline component.
**Confidence:** High

#### `compiler/render-preview.js`
**Classification:** KEEP
**Reason:** Active compiler script (419 lines). Reads `planets.json`, generates HTML preview with validation and stats. Core tooling component.
**Confidence:** High

#### `compiler/input/`
**Classification:** MOVE (or DELETE)
**Reason:** Empty directory. Appears to be intended for compiler input files, but actual input comes from `source/csv/` and `templates/`. No content ever placed here.
**Confidence:** Medium

#### `compiler/output/`
**Classification:** MOVE (or DELETE)
**Reason:** Empty directory. Intended for compiler output, but actual output goes to `generated/`. No content ever placed here.
**Confidence:** Medium

#### `compiler/templates/`
**Classification:** MOVE (or DELETE)
**Reason:** Empty directory. Intended for compiler templates, but actual templates are in `templates/`. No content ever placed here.
**Confidence:** Medium

---

### `templates/`

#### `templates/cards/planet/slots.json`
**Classification:** KEEP
**Reason:** Active slot definition file (55 lines). Defines card dimensions, header, artwork, input/output positions, and footer. Consumed by `compiler/generate-frame.js`.
**Confidence:** High

#### `templates/cards/planet/frame.svg`
**Classification:** MOVE
**Reason:** Generated artifact (41 lines) produced by `compiler/generate-frame.js`. Should be treated as a build output, not a committed template. Keep if committed for convenience, but ideally add to `.gitignore` and regenerate on demand.
**Confidence:** High

#### `templates/cards/planet/masks.svg`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). No mask definitions ever created. Stub file.
**Confidence:** High

#### `templates/cards/planet/README.md`
**Classification:** DELETE
**Reason:** Empty file (0 bytes). No documentation content.
**Confidence:** High

#### `templates/boards/`
**Classification:** KEEP
**Reason:** Empty but structurally significant. Board templates are a planned Phase 3 item per ROADMAP.md. Keeping the directory preserves the intended structure.
**Confidence:** Medium

#### `templates/playerboards/`
**Classification:** KEEP
**Reason:** Same reasoning as `templates/boards/`. Planned future structure.
**Confidence:** Medium

---

### `source/style/`

#### `source/style/colors.json`
**Classification:** KEEP
**Reason:** Active canonical colour tokens (43 lines). Semantic colour definitions used across the design system.
**Confidence:** High

#### `source/style/typography.json`
**Classification:** KEEP
**Reason:** Active canonical typography tokens (29 lines). Font families, sizes, weights, line heights.
**Confidence:** High

#### `source/style/spacing.json`
**Classification:** KEEP
**Reason:** Active canonical spacing tokens (43 lines). Card radius, safe margins, padding, grid, icon sizes.
**Confidence:** High

#### `source/style/effects.json`
**Classification:** KEEP
**Reason:** Active canonical effect tokens (34 lines). Shadows, strokes, opacity, dash patterns, glow, corner smoothing.
**Confidence:** High

#### `source/style/README.md`
**Classification:** KEEP
**Reason:** Documents the design token system (90 lines). Naming conventions, usage rules, file overview, and future expansion guidance.
**Confidence:** High

---

### `source/csv/planets/`

#### `source/csv/planets/Mercurio_planet_layout_v3.csv`
**Classification:** KEEP
**Reason:** Active source data. Consumed by `compiler/build-card-model.js` for slot positioning per level.
**Confidence:** High

#### `source/csv/planets/PlanetBenefits_v3.csv`
**Classification:** KEEP
**Reason:** Active source data. Referenced by compiler (though not all CSV columns are used yet).
**Confidence:** High

#### `source/csv/planets/PlanetResources_v3.csv`
**Classification:** KEEP
**Reason:** Active source data. Core input for `compiler/build-card-model.js` defining input/output resources per card.
**Confidence:** High

#### `source/csv/planets/PlanetType_v3.csv`
**Classification:** KEEP
**Reason:** Active source data (82 lines). Maps card filenames to planet types. Consumed by compiler.
**Confidence:** High

---

### `source/artwork/`

#### `source/artwork/cards/planet/backgrounds/deep-space-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork. Referenced by compiler as `BACKGROUND = 'deep-space-v1'`.
**Confidence:** High

#### `source/artwork/cards/planet/backgrounds/README.md`
**Classification:** KEEP
**Reason:** Documents the background asset directory (202 lines). Purpose, current assets, usage, design goals, naming convention, future variants. Content is valuable but formatting is degraded (excessive blank lines, escaped backslashes). Consider reformatting.
**Confidence:** High

#### `source/artwork/cards/planet/planets/cold-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork for Cold planet type. Referenced by compiler (`TYPE_ARTWORK`).
**Confidence:** High

#### `source/artwork/cards/planet/planets/earth-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork for Earth planet type.
**Confidence:** High

#### `source/artwork/cards/planet/planets/forge-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork for Forge planet type.
**Confidence:** High

#### `source/artwork/cards/planet/planets/ice-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork for Ice planet type.
**Confidence:** High

#### `source/artwork/cards/planet/planets/jungle-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork for Jungle planet type.
**Confidence:** High

#### `source/artwork/cards/planet/planets/ocean-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork for Ocean planet type.
**Confidence:** High

#### `source/artwork/cards/planet/planets/proto-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork for Proto planet type.
**Confidence:** High

#### `source/artwork/cards/planet/planets/scrap-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork for Scrap planet type.
**Confidence:** High

#### `source/artwork/cards/planet/planets/swamp-v1.png`
**Classification:** KEEP
**Reason:** Active source artwork for Swamp planet type.
**Confidence:** High

#### `source/artwork/cards/planet/references/planet-library-v1-sheet.png`
**Classification:** KEEP
**Reason:** Reference sheet (spritesheet) used as a visual reference during artwork development.
**Confidence:** High

#### `source/artwork/cards/planet/overlays/`
**Classification:** DELETE
**Reason:** Empty directory. No overlay assets ever created. The rendering rules in `planet-card-rendering-rules.md` define overlays as runtime concepts, not pre-rendered assets.
**Confidence:** Medium

---

### `generated/`

#### `generated/models/planets.json`
**Classification:** MOVE (add to .gitignore)
**Reason:** Generated artifact (6241 lines). Produced by `compiler/build-card-model.js` from CSV source data. Fully regenerable. Should not be committed, or if kept for convenience, add to `.gitignore`.
**Confidence:** High

#### `generated/preview/index.html`
**Classification:** MOVE (add to .gitignore)
**Reason:** Generated artifact. Produced by `compiler/render-preview.js` from `planets.json`. Fully regenerable. Should not be committed.
**Confidence:** High

---

### `tmp/` (entire directory)

#### `tmp/README.md`
**Classification:** DELETE
**Reason:** Exact duplicate of `source/style/README.md` (90 lines, identical content). `tmp/` is a working directory; content should live only in `source/style/`.
**Confidence:** High

#### `tmp/colors.json`
**Classification:** DELETE
**Reason:** Exact duplicate of `source/style/colors.json` (43 lines, identical content). Canonical version is in `source/style/`.
**Confidence:** High

#### `tmp/typography.json`
**Classification:** DELETE
**Reason:** Exact duplicate of `source/style/typography.json` (29 lines, identical content).
**Confidence:** High

#### `tmp/spacing.json`
**Classification:** DELETE
**Reason:** Exact duplicate of `source/style/spacing.json` (43 lines, identical content).
**Confidence:** High

#### `tmp/effects.json`
**Classification:** DELETE
**Reason:** Exact duplicate of `source/style/effects.json` (34 lines, identical content).
**Confidence:** High

#### `tmp/frame.svg`
**Classification:** DELETE
**Reason:** Exact duplicate of `templates/cards/planet/frame.svg` (41 lines, identical content).
**Confidence:** High

#### `tmp/generate-frame.js`
**Classification:** DELETE
**Reason:** Exact duplicate of `compiler/generate-frame.js` (73 lines, identical content).
**Confidence:** High

#### `tmp/slots.json`
**Classification:** DELETE
**Reason:** Exact duplicate of `templates/cards/planet/slots.json` (55 lines, identical content).
**Confidence:** High

---

### Empty Directories — Future Scaffolding

The following directories are empty but represent planned future structure. These are **KEEP** candidates as they align with the ROADMAP:

| Directory | Phase / Purpose |
|-----------|----------------|
| `data/boards/` | Board data (Phase 3) |
| `data/cards/` | Additional card data |
| `data/icons/` | Icon data |
| `data/styles/` | Additional style data |
| `exports/bga/` | Board Game Arena export (Phase 4) |
| `exports/print/` | Print export (Phase 4) |
| `exports/tts/` | Tabletop Simulator export (Phase 4) |
| `generators/boards/` | Board generators (Phase 3) |
| `generators/cards/` | Additional card generators |
| `generators/sprites/` | Sprite generators |
| `illustrations/backgrounds/` | Illustration library |
| `illustrations/events/` | Event illustrations (Phase 2?) |
| `illustrations/governors/` | Governor illustrations |
| `illustrations/planets/` | Additional planet illustrations |
| `illustrations/technologies/` | Technology illustrations (Phase 2) |
| `illustrations/textures/` | Texture library |
| `prompts/events/` | AI prompts for events |
| `prompts/governors/` | AI prompts for governors |
| `prompts/planets/` | AI prompts for planets |
| `prompts/technologies/` | AI prompts for technologies |
| `scripts/build/` | Build scripts |
| `scripts/export/` | Export scripts (Phase 4) |
| `scripts/import/` | Import scripts |
| `scripts/utils/` | Utility scripts |
| `work/card-design/` | Design workspace |

**Recommendation:** KEEP these directories as they document the intended project architecture. Consider creating a `.gitkeep` convention or a README in each to clarify purpose.

### Empty Directories — No Justifiable Purpose

These directories have no content and no clear alignment with current project needs:

#### `source/reference/`
**Classification:** MERGE/DELETE
**Reason:** Empty directory. There is also a root-level `references/` (empty) directory and content lives in `source/artwork/cards/planet/references/`. This creates confusion between three separate `reference` locations.
**Confidence:** Medium

#### `references/` (root level)
**Classification:** MERGE/DELETE
**Reason:** Empty root-level directory. Duplicates intent of `source/reference/`. Neither has content. Artwork references live in `source/artwork/cards/planet/references/`.
**Confidence:** Medium

#### `source/ai/`
**Classification:** DELETE
**Reason:** Empty directory. AI-related guidance lives in `docs/ai-style-guide.md`. No AI source files needed.
**Confidence:** Medium

#### `source/figma/`
**Classification:** DELETE
**Reason:** Empty directory. No Figma export files or design system links committed.
**Confidence:** Medium

#### `source/scratch/`
**Classification:** DELETE
**Reason:** Empty directory. Named "scratch" implying temporary/throwaway work. Should not be in version control.
**Confidence:** High

#### `source/icons/` (all 4 subdirectories)
**Classification:** DELETE
**Reason:** Empty directories. No icon source files exist. Icon assets are expected at `icons/png/`, `icons/svg/`, `icons/webp/` instead. Dual icon directories (`source/icons/` and `icons/`) is confusing.
**Confidence:** High

#### `palette/`
**Classification:** DELETE
**Reason:** Empty directory. Colour palette is defined in `source/style/colors.json` and `docs/ai-style-guide.md`.
**Confidence:** High

#### `fonts/`
**Classification:** DELETE
**Reason:** Empty directory. No font files committed. Typography tokens in `source/style/typography.json` define families as generic stacks (system-ui, Arial, etc.) — no custom fonts are used.
**Confidence:** High

#### `icons/png/`, `icons/svg/`, `icons/webp/` (and all subdirectories)
**Classification:** DELETE
**Reason:** All 18 leaf directories are empty. No icon assets exist anywhere in the repository. Icon guidelines doc (`docs/icon-guidelines.md`) is also empty. The icon system is not yet implemented; these 18 directories are speculative scaffolding.
**Confidence:** High

---

### `.gitignore` Review

#### Missing entries
- `generated/` — regenerable build output
- `tmp/` — working directory
- `*.csv` backup patterns
- `generated/preview/` — preview HTML files

**Classification:** KEEP with update
**Confidence:** High

---

## Documentation Review

### Duplicate Documentation

| File | Duplicate Of | Status |
|------|-------------|--------|
| `tmp/README.md` | `source/style/README.md` | Identical |
| `tmp/colors.json` | `source/style/colors.json` | Identical |
| `tmp/typography.json` | `source/style/typography.json` | Identical |
| `tmp/spacing.json` | `source/style/spacing.json` | Identical |
| `tmp/effects.json` | `source/style/effects.json` | Identical |
| `tmp/frame.svg` | `templates/cards/planet/frame.svg` | Identical |
| `tmp/generate-frame.js` | `compiler/generate-frame.js` | Identical |
| `tmp/slots.json` | `templates/cards/planet/slots.json` | Identical |

### Conflicting Documentation

No conflicting documentation found. The docs that have content are consistent with each other.

### Multiple Sources of Truth

- **Card layout:** `docs/card-specification.md` and `docs/specifications/planet-card-rendering-rules.md` overlap. `card-specification.md` is the general spec; `planet-card-rendering-rules.md` adds implementation-specific details (hitboxes, production chaining, runtime overlays). This is complementary, not conflicting.

### Superseded Implementation Plans

- `docs/ROADMAP.md` shows Phase 0 as fully checked but Phase 1 items (planet artwork library, frame v2, first production card, compiler integration) remain unchecked. The compiler scripts and artwork already exist — the ROADMAP may be out of date.

### AI Workflow Files

No AI workflow files found (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CURSOR.md`, `CODEX.md`, Copilot instructions, Windsurf instructions). The only AI-related file is `docs/ai-style-guide.md`, which is a content generation guide rather than an AI tool configuration file.

---

## Summary

### Files Reviewed: 52

| Classification | Count | Details |
|---------------|-------|---------|
| **KEEP** | 35 | Core source files, compiler scripts, templates, active docs, artwork |
| **KEEP (Historical)** | 0 | No historical-only files identified |
| **DELETE** | 17 | Empty files (10), duplicate tmp/ files (7) |
| **MERGE** | 0 | No merge candidates (tmp/ duplicates should be deleted, not merged) |
| **MOVE** | 3 | `generated/models/planets.json`, `generated/preview/index.html`, `templates/cards/planet/frame.svg` |

### Empty Directories: 80 total directories, ~49 empty

| Classification | Count |
|---------------|-------|
| KEEP (scaffolding) | 40 |
| DELETE recommended | 24 |
| MERGE/DELETE | 2 (references/, source/reference/) |

### Estimated Impact

| Metric | Estimate |
|--------|----------|
| **Repository size reduction** | ~500 KB (6,241-line planets.json + HTML preview + 17 small files) |
| **Documentation reduction** | 7 empty doc files removed, 8 tmp/ duplicates removed |
| **Maintenance reduction** | No more confusion between tmp/ and canonical files; no empty placeholders |
| **Obsolete placeholders removed** | 10 empty files + 8 tmp/ duplicates = 18 |
| **Duplicate documents consolidated** | 8 tmp/ files deleted (all duplicates) |

### Recommendations by Priority

1. **High:** Delete `tmp/` directory (8 files, all duplicates of canonical sources)
2. **High:** Delete 7 empty `docs/` files (art-direction.md, asset-compiler.md, asset-pipeline.md, color-palette.md, icon-guidelines.md, visual-language.md — plus placeholder for asset... wait that's 6, plus the empty ones)
3. **High:** Delete `README.md` (empty) and `LICENSE` (empty)
4. **High:** Delete empty stubs: `templates/cards/planet/masks.svg`, `templates/cards/planet/README.md`
5. **Medium:** Add `generated/` to `.gitignore` (with exception for `.gitkeep` if needed)
6. **Medium:** Merge/delete duplicate `references/` and `source/reference/` directories
7. **Medium:** Delete speculative empty directories with no clear purpose (`source/ai/`, `source/figma/`, `source/scratch/`, `source/icons/`, `palette/`, `fonts/`, `icons/png/svg/webp/`)
8. **Low:** Reformat `source/artwork/cards/planet/backgrounds/README.md` (excessive whitespace)
9. **Low:** Update `docs/ROADMAP.md` to reflect current completion status
10. **Archive:** Keep empty scaffolding directories aligned with ROADMAP phases
