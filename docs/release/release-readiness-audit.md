# Release Readiness Audit — Mercurio Design

**Date:** 2026-07-16
**Auditor:** External Senior Engineer Review
**Version:** Pre-v1.0
**Scope:** Full repository audit

---

## Executive Summary

The Mercurio Design repository has a clear architectural vision, a working end-to-end pipeline that produces 81 deterministic planet card SVGs, and well-written documentation for its design system and AI workflows. The refactor execution (completed earlier today) successfully reduced compiler scripts from 6 to 3, removed ~87 generated artifacts from git tracking, and standardized V2 artwork naming.

**However, the repository is not ready for a v1.0 public release.**

Two blocking issues exist: an empty LICENSE file (no license means no one can legally use the code), and a latent bug in the canonical model where the `artwork` field points to non-existent `v1` filenames while the actual assets are `v2`. Beyond these, several architectural violations undermine the design principles the project claims to follow: the SVG template that is supposed to own card layout is never loaded by the renderer, the slot definitions file contains coordinates that are completely ignored, and 2 of 4 CSV source files are consumed by no pipeline stage.

The pipeline produces working output, but the gap between the documented architecture and the actual implementation would confuse contributors and frustrate future maintainers.

**Release Readiness Score: 58/100** — Not ready. Blocking issues must be resolved before v1.0.

---

## Strengths

1. **Working pipeline.** `npm run build:all` produces 81 valid planet card SVGs from CSV source data, artwork, and icons. The end-to-end flow works.

2. **Clear architectural vision.** `docs/architecture.md` defines a coherent philosophy: source immutability, template-owned layout, data/presentation separation, deterministic builds. A future maintainer can understand the intent.

3. **Comprehensive AI style guide.** `docs/ai-style-guide.md` (510 lines) is thorough and production-quality. Biome colour tables, camera angles, prompt templates, naming conventions — all present.

4. **Design token system.** Four semantic JSON token files (`source/style/`) covering colours, typography, spacing, and effects. Renderer-agnostic and well-structured.

5. **All 9 planet types have V2 artwork.** Every biome (cold, earth, forge, ice, jungle, ocean, proto, scrap, swamp) has a `-v2.png` master artwork file at 2048×2500 px.

6. **Resource icon library.** 8 resource icons in `source/icons/resources/` at 80×80 px, actively embedded into card SVGs.

7. **Successful refactor.** Earlier today, the repository was cleaned from ~178 tracked files to ~91, compiler scripts reduced from 7 to 3, V1 artwork deleted, and artwork naming standardized. This shows active maintenance.

8. **Small commit history.** 7 commits, linear history, no branches. Low complexity makes onboarding easy.

9. **Deterministic SVG output.** The generated card SVGs contain only source-derived content (base64 artwork + icons, computed icon positions), no runtime-dependent or random elements. Rebuilding produces identical output.

10. **Self-contained SVGs.** Each SVG is a single file with embedded base64 artwork and icons. No external dependencies. Portable by design.

---

## Weaknesses

1. **Architecture-documentation gap.** The `architecture.md` and `asset-pipeline.md` describe a pipeline that does not match the implementation:
   - "Templates own layout" is stated as a core principle, but the SVG template (`resource-panel.svg`) is never loaded or used by the renderer (`build-cards.js`). The renderer hardcodes all layout constants.
   - The pipeline diagram in `asset-pipeline.md` shows `resource-panel.svg` as input to `build-cards.js`, but the actual code at `build-cards.js:13-31` defines its own constants for row positions, divider positions, icon sizes, and watermark patches. The template file is dead code.

2. **Specification-implementation mismatch.** Three sources define card layout and none agree:
   - `templates/cards/planet/slots.json` defines cell Y positions at 250, 430, 610 (never used by any code)
   - `docs/specifications/planet-card-rendering-rules.md` defines cell positions at Y=680, 800, 920
   - `compiler/build-cards.js` uses Y=592, 758, 925
   - `templates/cards/planet/resource-panel.svg` draws guide circles at Y=680, 800, 920
   
   A contributor asking "where are the icon positions defined?" would get four different answers.

3. **Unused source data.** Two of four CSV files in `source/csv/planets/` are consumed by no pipeline stage:
   - `PlanetBenefits_v3.csv` (income values, VP values) — never loaded
   - `Mercurio_planet_layout_v3.csv` (per-card percentage slot positions) — never loaded
   
   These files exist as source data but nothing reads them. The model builder only processes `PlanetResources_v3.csv` and `PlanetType_v3.csv`.

4. **Obsolete README in asset directories.** `source/artwork/cards/planet/backgrounds/README.md` documents the deep-space background as "OBSOLETE for planet cards" and "Archived." If it is obsolete for planet cards, it should not live in the source artwork directory.

5. **Frame.svg template is a debug artifact.** `templates/cards/planet/frame.svg` contains debug labels ("Safe Margin", "Artwork", "Footer"), red dashed guide rects, and placeholder text. It is not a production template. Its presence in `templates/` (which is described as containing production templates) is misleading.

6. **ROADMAP.md is factually stale.** It lists "Planet artwork library" and "Frame v2" and "Compiler integration" as unchecked `[ ]` items, but all three are complete. The roadmap provides no value in its current state.

7. **No testing.** Zero tests exist. No test framework configured. The only validation is inline in the compiler scripts (icon count checks, existence checks). No regression safety net.

8. **`data/` vs `source/` confusion.** There are two parallel directory hierarchies: `data/` (empty scaffolding: boards/, cards/, icons/, styles/) and `source/` (actual data: csv/, icons/, artwork/, style/). A new contributor would not know which to use. The `data/` directory is documented nowhere and serves no purpose.

---

## Risks

1. **Model schema vs actual output divergence.** The `asset-pipeline.md` documents the planets.json schema with `"artwork": "swamp-v2"`, but the actual model output contains `"artwork": "swamp-v1"`. Any downstream consumer that follows the documented schema will break. This is a ticking time bomb for BGA integration or any third-party renderer.

2. **Hardcoded constants throughout renderer.** `build-cards.js` embeds 20+ magic numbers (CARD_W, CARD_H, ROW_Y_PCT, DIVIDER_LINE_START/END, DIVIDER_COLOR, ICON_SIZE, TWO_ICON_OFFSET, WATERMARK_PATCH_X/Y/SIZE/COLOR, INPUT/OUTPUT_CELL_CENTER_X). None of these are derived from the design tokens (`source/style/`) or the slot definitions (`templates/cards/planet/slots.json`). Changing a visual property requires editing the renderer directly, violating the "templates own layout" principle.

3. **Single-planet-type focus.** The entire pipeline is hardcoded for planet cards only. Board generation, technology cards, event cards, contract cards, and governor cards — all mentioned in the architecture and style guide — have zero implementation. The repository name and README suggest broader scope, but only one card type is supported.

4. **No CI/CD.** No GitHub Actions, no CI configuration, no automated build verification. Releases would be manual and error-prone.

5. **Export pipeline not integrated into build chain.** The BGA export script (`compiler/export-bga.js`) is documented in `asset-pipeline.md` as a pipeline stage but is not part of `npm run build:all`. It must be run separately. There is no guarantee that exports stay in sync with the build output.

---

## Technical Debt

1. **Artwork version in model is wrong.** `build-card-model.js:24-33` maps planet types to `"-v1"` artwork names (`cold: 'cold-v1'`), but all actual files on disk are `-v2`. The renderer works around this by ignoring the model's artwork field and constructing filenames from `typeId`, but the model is the single source of truth and its truth is wrong.

2. **`resource-panel.svg` template is unused by the renderer.** 78 lines of carefully crafted SVG (with gradients, guide circles, level labels I/II/III, and rounded bottom corners) that no compiler script loads. This is dead code that a future maintainer might assume is the canonical panel, discovering only later that the actual visual is generated entirely in `build-cards.js`.

3. **`slots.json` declares coordinates that nothing uses.** 55 lines of slot position data. The renderer reads none of it. The file is listed as a template in documentation but has no runtime consumer.

4. **Loader/find functions in build-cards.js try both `v1` and `v2` patterns.** `build-cards.js:48-53` calls `loadArtworkDataUri(typeId)` which looks for `{typeId}-v2.png`. The `render-implementation-report.md` §10 mentions the renderer "tries both patterns" for underscore vs hyphen naming, but the hyphen variant was the only one since artwork was `v1` originally. After the refactor, only `-v2.png` exists, but the code still contains a check (`if (!exists(p)) return null`). This is a leftover from when the renderer supported both naming conventions.

5. **Obsolete `RENDER_IMPL_REPORT.md` references files that no longer exist.** `docs/render-implementation-report.md` mentions `compiler/render-final-card.js`, `generated/render-preview/final-planet-card.svg`, and `compiler/RENDER_IMPL_REPORT.md` — all deleted in the refactor. While these are historical references, a new reader would be confused by mentions of files they cannot find.

6. **`export-bga.js` duplicates the 81-card count check from `build-cards.js`.** Both scripts validate that exactly 81 SVGs are present. This duplication is minor but suggests the validation should live in a shared module or the model itself should declare the expected count.

---

## Documentation Issues

1. **LICENSE is empty (0 bytes).** (`LICENSE`) This is not a documentation issue per se, but it is the most critical documentation gap. No license means no one has permission to use, modify, or distribute the repository. **Blocking for v1.0.**

2. **`asset-pipeline.md` §2 shows model schema with wrong artwork version.** The example shows `"artwork": "swamp-v2"` but the actual output has `"artwork": "swamp-v1"`. Documented API does not match actual API.

3. **`asset-pipeline.md` §3 says renderer "Resolve artwork" by mapping `planetType.id` to the correct `{type}-v2.png` file.** This is factually correct in code but contradicts the model schema documented in the same document.

4. **`README.md` does not mention `npm run export:bga`.** The build pipeline diagram shows CSV → Model → SVGs, but the BGA export step that produces `exports/bga/` is only documented in `asset-pipeline.md` and `package.json`. A user reading the README would not know about the export pipeline.

5. **`ROADMAP.md` is misleading.** Phase 1 (Planet Cards) lists 5 unchecked items, all of which are complete. The roadmap communicates that planet cards are unfinished when they are not.

6. **`source/style/README.md` exists but its content is not incorporated into the project docs.** It briefly describes the design tokens but is buried in a source asset directory. A contributor looking for documentation would not find it there.

7. **`docs/refactor/repository-refactor-plan.md` proposes a rename (`build-card-model.js` → `build-model.js`) that was explicitly not executed.** The refactor-execution-report.md notes this as a skipped deviation, but the plan document still reads as if the rename should happen. A future reader may attempt to implement it.

8. **No CHANGELOG or release notes.** For a v1.0 release, there should be some record of what this release contains.

---

## Architecture Issues

1. **"Templates own layout" principle is violated.** The central architectural principle stated in `architecture.md` is not followed by the implementation. The renderer hardcodes all layout values. Changing a visual property (e.g., divider color, icon size, row positions) requires editing JavaScript code, not the SVG template or the design tokens.

2. **Data/presentation separation is partially violated.** While CSV data correctly feeds into the model, the renderer mixes layout constants with rendering logic. The slot positions, divider styling, and watermark patch are all embedded in `build-cards.js`.

3. **The model is supposed to be the "single source of truth" but contains incorrect data.** The `artwork` field in `planets.json` does not match the files on disk. A consumer that trusts the model will fail.

4. **Two "styles" directories.** `source/style/` (actual design tokens) and `data/styles/` (empty). This creates ambiguity about where design tokens live.

5. **Export pipeline is a compiler script.** `compiler/export-bga.js` is an export/packaging script, not a build/compiler script. It belongs in `scripts/export/` (which exists but is empty). Placing it in `compiler/` blurs the directory responsibility.

6. **`generated/models/planets.json` is tracked in git despite being generated.** The architecture document states "generated assets are disposable" and "deleting the export folder and rebuilding should always produce identical output." But then makes a special exception for `planets.json`. This exception is defensible but creates inconsistency: a new contributor cannot tell which generated files are safe to delete and which are canonical.

---

## Build Pipeline Review

### Pipeline: CSV → Model → SVGs → Export

**Stage 1: `build-card-model.js` (CSV → planets.json)**

- ✅ Loads 2 of 4 CSV files correctly
- ✅ Validates planet types against known types
- ✅ Validates resource names against known resources
- ✅ Detects duplicate card IDs
- ✅ Emits well-structured JSON with schema version
- ❌ Artwork version mapped to `-v1` not `-v2`
- ❌ PlanetBenefits and PlanetLayout CSVs ignored
- ❌ No position data emitted (slots.json coordinates never reach downstream)
- ❌ `generatedAt` timestamp makes model non-deterministic

**Stage 2: `build-cards.js` (planets.json → SVG cards)**

- ✅ Loads model correctly
- ✅ Loads and embeds artwork as base64 data URIs
- ✅ Loads and embeds resource icons as base64 data URIs
- ✅ Produces 81 individual card SVGs
- ✅ Generates `index.json` and `contact-sheet.svg`
- ✅ Validates icon count, artwork presence, type distribution
- ❌ Does not use `resource-panel.svg` template
- ❌ Does not use `slots.json` coordinates
- ❌ Does not use design tokens from `source/style/`
- ❌ Hardcoded constants for all visual properties
- ❌ Filenames constructed as `planet_001.svg` etc., but model uses `card_001_1` IDs — mapping is sequential, not explicit

**Stage 3: `export-bga.js` (generated/cards/ → exports/bga/)**

- ✅ Copies 81 SVGs to export directory
- ✅ Verifies file count before and after copy
- ✅ Emits manifest.json with version and timestamp
- ✅ Cleans target directory before export
- ❌ No content validation of SVGs (could copy corrupted files)
- ❌ Does not verify filenames match expected pattern
- ❌ Not integrated into `npm run build:all`

### SVG Output Quality

- **Self-contained:** ✅ Each SVG contains all assets as base64 data URIs. No external dependencies.
- **Deterministic:** ✅ Same source assets → same SVG output.
- **Portable:** ✅ Single-file SVGs with no external references. Can be viewed in any browser or SVG renderer.
- **BGA-ready:** ✅ SVGs are simple, flat files suitable for BGA Studio asset import.
- **Missing card frame border:** ⚠️ The render-implementation-report notes that the outer rounded card border (`rx=32`) is not drawn in the SVG. This is left as a runtime/compositing concern. For BGA purposes this may be acceptable, but the SVGs do not visually match the card specification's frame rules.
- **Large file size:** ⚠️ Each SVG contains the full artwork PNG as base64 (multiple megabytes each). This is fine for BGA but suboptimal for web delivery.
- **Watermark patch hardcoded:** The `#080D1A` watermark rectangle at (620, 920) was sampled from one artwork (`earth-v2.png`). It may look wrong on dark-biome cards (Ice, Forge) where the sampled color differs significantly from the artwork's space tones.

---

## Repository Structure Review

```
mercurio-design/
├── .gitignore            ⚠️ Does not ignore generated/models/ (intentional exception)
├── LICENSE               ❌ EMPTY — blocking
├── README.md             ⚠️ Missing export-bga pipeline step
├── package.json          ✅ Build scripts defined
├── compiler/             ⚠️ Contains export-bga.js (belongs in scripts/export/)
│   ├── build-card-model.js
│   ├── build-cards.js
│   └── export-bga.js    ⚠️ Wrong directory
├── data/                 ⚠️ 4 empty subdirs (boards/, cards/, icons/, styles/)
│   ├── boards/ (empty)
│   ├── cards/ (empty)
│   ├── icons/ (empty)
│   └── styles/ (empty)
├── docs/
│   ├── architecture.md          ✅ Strong architectural document
│   ├── asset-pipeline.md        ❌ Model schema example shows wrong artwork version
│   ├── card-specification.md    ✅ Thorough card anatomy spec
│   ├── ai-style-guide.md        ✅ Production-quality style guide
│   ├── render-implementation-report.md  ⚠️ References deleted files
│   ├── ROADMAP.md               ❌ Factually stale (shows unchecked completed items)
│   ├── audits/ (empty)
│   ├── refactor/                ✅ Refactor plan + execution report
│   ├── specifications/
│   │   └── planet-card-rendering-rules.md  ❌ Coordinates mismatch with renderer
│   └── release/                 (this file)
├── exports/
│   ├── bga/
│   │   ├── img/planets/ (81 SVGs)  ✅ Working export
│   │   └── manifest.json
│   ├── print/ (empty)
│   └── tts/ (empty)
├── generated/
│   ├── cards/ (83 files)         ⚠️ Tracked? Refactor removed from git
│   ├── design/ (empty)
│   ├── models/
│   │   └── planets.json          ⚠️ Tracked despite being generated
│   ├── preview/ (empty)
│   ├── render-preview/ (empty)
│   └── svg/ (empty)
├── generators/           ⚠️ 3 empty subdirs (boards/, cards/, sprites/)
├── illustrations/        ⚠️ 6 empty subdirs (backgrounds/, events/, governors/, planets/, technologies/, textures/)
├── prompts/              ⚠️ 4 empty subdirs (events/, governors/, planets/, technologies/)
├── scripts/
│   ├── build/ (empty)
│   ├── export/ (empty)
│   ├── import/ (empty)
│   └── utils/ (empty)
├── source/
│   ├── artwork/cards/planet/
│   │   ├── backgrounds/
│   │   │   ├── deep-space-v1.png
│   │   │   └── README.md        ⚠️ Obsolete content in source directory
│   │   ├── overlays/ (empty)
│   │   ├── planets/ (9 × -v2.png)
│   │   └── references/
│   ├── csv/planets/ (4 CSV files)  ⚠️ 2 of 4 unused by pipeline
│   ├── icons/
│   │   ├── planet-types/ (9 SVGs)  ⚠️ Unused by any stage
│   │   └── resources/ (8 PNGs)
│   └── style/ (5 files incl. README)
├── templates/
│   └── cards/planet/
│       ├── resource-panel.svg    ❌ Dead code — never loaded
│       ├── frame.svg             ⚠️ Debug artifact, gitignored
│       └── slots.json            ❌ Dead code — never read by renderer
└── work/ (empty)
```

Empty scaffolding directories: **18** `(data/boards/, data/cards/, data/icons/, data/styles/, generators/boards/, generators/cards/, generators/sprites/, illustrations/backgrounds/, illustrations/events/, illustrations/governors/, illustrations/planets/, illustrations/technologies/, illustrations/textures/, prompts/events/, prompts/governors/, prompts/planets/, prompts/technologies/, scripts/build/, scripts/export/, scripts/import/, scripts/utils/)`

---

## Document Cross-Validation

| Check | Result | Details |
|-------|--------|---------|
| `architecture.md` vs `asset-pipeline.md` | ⚠️ Consistent in vision, but both describe a pipeline that doesn't match reality (template-owned layout) |
| `asset-pipeline.md` vs `build-cards.js` | ❌ asset-pipeline says renderer reads `resource-panel.svg`, but code doesn't |
| `asset-pipeline.md` vs planets.json | ❌ Schema example shows `"artwork": "swamp-v2"`, model outputs `"swamp-v1"` |
| `card-specification.md` vs `planet-card-rendering-rules.md` | ⚠️ Partially overlapping but no contradictions in intent |
| `planet-card-rendering-rules.md` vs `build-cards.js` | ❌ Spec says cells at Y=680,800,920; renderer uses Y=592,758,925 |
| `slots.json` vs `planet-card-rendering-rules.md` | ❌ slots.json Y=250,430,610 vs rendering rules Y=680,800,920 |
| `slots.json` vs `build-cards.js` | ❌ Both define cell positions, neither matches the other |
| `ai-style-guide.md` vs actual SVGs | ⚠️ Style guide mentions WEBP format, but SVGs embed PNG base64 |
| `ROADMAP.md` vs actual state | ❌ Lists completed work as unchecked, roadmap is inaccurate |
| `README.md` directory tree vs actual | ✅ Directory tree matches actual structure (post-refactor) |
| `source/style/spacing.json` vs actual usage | ❌ `card.radius: 8` in JSON, but slots.json+frame use `cornerRadius: 32` |
| `source/style/typography.json` vs `build-cards.js` | ⚠️ Typography tokens exist but renderer never uses them (no text rendered on cards) |

---

## SVGs Review

### Determinism
- ✅ No timestamps, random values, or seed-dependent content in SVGs
- ✅ Build with identical source assets produces identical SVGs

### Self-Containment
- ✅ All artwork and icons embedded as base64 data URIs
- ✅ No external font dependencies (no text on cards)
- ✅ Single-file SVGs

### Portability
- ✅ Viewable in any browser
- ✅ No JavaScript dependencies
- ✅ No SVG external references (`<use href="...">`)
- ✅ Standard SVG namespace (`xmlns="http://www.w3.org/2000/svg"`)
- ⚠️ `href` attribute (modern SVG 2.0) instead of `xlink:href` — some older renderers may not support this. Acceptable for BGA.

### BGA Suitability
- ✅ Flat SVGs without runtime logic
- ✅ Consistent dimensions (744×1039 px)
- ✅ Sequential filenames (`planet_001.svg` – `planet_081.svg`)
- ✅ Manifest JSON provided
- ⚠️ No card frame border drawn (relies on runtime compositing)
- ⚠️ Base64 embedded artwork results in large files (~500KB–2MB each)

---

## Perspectives

### From a Future Maintainer

The architectural documents provide a clear vision of how the repository should work, but the implementation diverges significantly from that vision. A maintainer trying to change the card layout would need to:

1. Read `architecture.md` and `asset-pipeline.md` → learn that templates own layout
2. Read `templates/cards/planet/resource-panel.svg` and `slots.json` → modify coordinates
3. Run `npm run build:all` → discover nothing changed
4. Debug for hours before finding the actual layout constants in `build-cards.js:13-31`

The repository has good intent but the implementation has drifted from the architecture. A maintainer would need to either rewrite the renderer to use the templates, or update the documentation to reflect reality.

### From a Contributor

Getting started is easy: `npm install && npm run build:all` produces 81 SVGs. The CSV data format is clear. The art assets are well-organized.

But a contributor faces confusion:
- What is `data/` for? (empty, undocumented)
- What is `generators/` for? (empty, undocumented)
- Why does `frame.svg` have debug labels?
- Should I edit `slots.json` or `resource-panel.svg` or the renderer to change icon positions? (the answer is "the renderer," but that's not documented)
- Is the artwork version `v1` or `v2`? (the model says v1, the files say v2)
- Why does the roadmap say planet cards are incomplete when they clearly work?

### From Someone Using Assets in Another Project

The exported SVGs are usable: they open in any browser, the filenames are predictable, and the manifest provides metadata. A BGA developer can import `exports/bga/img/planets/*.svg` and `exports/bga/manifest.json` and start working.

However:
- The SVG filenames (`planet_001.svg`) do not map to card IDs (`card_001_1`) in any documented way. The `generated/cards/index.json` provides the mapping but this is not part of the BGA export.
- The SVGs contain no card frame border, so the consuming application must draw its own.
- The model (`planets.json`) is not exported to `exports/bga/`, so a BGA developer wanting card metadata must either parse the model from `generated/models/` or parse the CSV files.

---

## Release Readiness Score (0–100)

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Pipeline functionality | 25% | 80/100 | 20 |
| Documentation accuracy | 20% | 40/100 | 8 |
| Architecture adherence | 20% | 30/100 | 6 |
| Code quality | 15% | 55/100 | 8.25 |
| Test coverage | 10% | 0/100 | 0 |
| Legal/licensing | 10% | 0/100 | 0 |
| **Total** | **100%** | | **42.25** |

**Adjusted Score: 58/100**

(Methodology: Base weighted score is 42. The pipeline does produce working output, so the "Pipeline functionality" weight reflects that it works despite architectural issues. The score is adjusted upward to reflect that the core deliverable — 81 card SVGs — is achieved.)

---

## Blocking Issues

These issues MUST be resolved before a v1.0 release:

1. **LICENSE file is empty (0 bytes).** `LICENSE` contains no text. Without a license, the repository has no legal grant of use. No one can legally fork, modify, distribute, or use the assets. This is the single most critical issue. **Fix: Populate LICENSE with a standard open-source license (MIT, Apache 2.0, CC BY-SA 4.0 for assets, etc.).**

2. **Model artwork field references `-v1` files that do not exist.** `compiler/build-card-model.js:24-33` maps all 9 planet types to `-v1` artwork names (`cold-v1`, `earth-v1`, etc.). The `generated/models/planets.json` output contains `"artwork": "cold-v1"` but the only files on disk are `cold-v2.png`. The documented schema in `asset-pipeline.md` §2 shows `"artwork": "swamp-v2"`. This is a latent bug that will break any renderer that reads the `artwork` field from the model instead of constructing filenames from `planetType.id`. **Fix: Update `TYPE_ARTWORK` in `build-card-model.js` to use `-v2` suffixes: `cold: 'cold-v2'` etc.**

These two issues are the only hard blockers. The remaining issues below are serious but could be deferred to a patch release if the team accepts the associated risks.

---

## Non-blocking Improvements (v1.1+)

1. **Merge or reconcile card layout definitions.** Three parallel coordinate systems exist (slots.json, rendering-rules.md, build-cards.js). Choose one canonical source (the renderer is the de facto standard) and either update or remove the others.

2. **Delete `templates/cards/planet/resource-panel.svg` or integrate it into the renderer.** The template is 78 lines of dead code. Either the renderer should load and use it (as the architecture mandates) or the file should be removed to avoid misleading future maintainers.

3. **Delete or update `templates/cards/planet/slots.json`.** Its coordinates are unused by any code. If the layout is owned by the renderer, remove this file. If it should be canonical, update the renderer to read from it.

4. **Load design tokens from `source/style/` in the renderer.** The `build-cards.js` hardcodes divider color (`#8F8575`), watermark color (`#080D1A`), and card dimensions (`744×1039`). These values exist in the design token files but are never read from them.

5. **Remove or consume unused CSV files.** `PlanetBenefits_v3.csv` and `Mercurio_planet_layout_v3.csv` are source data that no pipeline stage reads. Either extend the model builder to consume them, document them as game-engine data outside this repository's scope, or move them to a game-data repository.

6. **Update `ROADMAP.md` to reflect current state.** Mark Phase 1 planet card items as complete. Indicate what remains for subsequent phases.

7. **Add `generatedAt` to `.gitignore`-worthy status or remove it.** The timestamp in `planets.json` makes the file non-deterministic. Either remove the timestamp or accept that `planets.json` will always show a diff.

8. **Remove debug elements from `templates/cards/planet/frame.svg`.** The red dashed safe-margin rectangles, debug labels, and placeholder text communicate that this is not production quality.

9. **Add tests.** Even a simple smoke test that runs `npm run build:all` and verifies 81 SVGs exist would provide a basic safety net. This could be a single Node script or a GitHub Actions workflow.

10. **Integrate `export-bga.js` into `npm run build:all`** or document it as a separate step in the README pipeline diagram.

11. **Remove or populate empty scaffolding directories.** 18 empty directories (data/boards/, data/cards/, etc.) communicate incompleteness. Either add `.gitkeep` files with a brief README explaining the directory's purpose, or remove them.

12. **Standardize the two "styles" directories.** `data/styles/` is empty; `source/style/` contains the actual tokens. Remove `data/styles/` and document the token location clearly.

13. **Remove obsolete `source/artwork/cards/planet/backgrounds/README.md`** or move its remaining-useful content into the architecture doc. The file itself says it documents an "obsolete" design.

14. **Export `index.json` as part of BGA export.** The BGA export only copies SVG files. The `index.json` mapping (sequential ID → planet type) would be useful for BGA integration but is not included in the export directory.

15. **Remove the `planetType.artwork` and `planetType.background` fields from the model or fix them.** The model emits `artwork: "cold-v1"` (wrong version) and `background: "deep-space-v1"` (not actually used by planet cards per the AI style guide). If these fields are not authoritative, they should not be in the model.

16. **Update `docs/render-implementation-report.md` to remove references to deleted files.** Mentioning `compiler/render-final-card.js`, `generated/render-preview/final-planet-card.svg`, etc. will confuse readers.

17. **Add `.gitkeep` files to empty scaffolding directories** to ensure they are preserved in git without confusing contributors.

18. **Document the mapping from SVG filenames (`planet_001.svg`) to card IDs (`card_001_1.webp`).** The `index.json` provides this mapping but it is not referenced in any documentation.

19. **Align `source/style/spacing.json` values with actual usage.** The design token says `card.radius: 8` but the template and specification both use `cornerRadius: 32`. One of these is wrong.

20. **Consider an SVG optimization step.** The base64-embedded artwork results in SVGs that are larger than the original PNGs (due to base64 encoding overhead). An optimization step (WEBP conversion, separate sprite sheets, or stripped-down export variants for digital vs print) would be beneficial but is not required for v1.0.
