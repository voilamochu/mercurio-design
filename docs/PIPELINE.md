# Mercurio Design — Asset Pipeline

## Architecture

Every supported asset class follows the same lifecycle:

```
Canonical Source
       ↓
Generated Model           [build:*‑model]
       ↓
Bootstrap (one‑time)      [bootstrap:*]
       ↓
Artwork Optimization      [inside build script]
       ↓
Renderer                  [build:*‑cards]
       ↓
SVGO                      [inside build script, SVGs only]
       ↓
Export                    [export:*‑bga]
       ↓
exports/bga/img/
```

**Release orchestrates only:** `build → resource-icons → deploy`.
No stage performs work that belongs to another stage.

---

## Supported asset classes

### 1. Planet cards (81 SVGs)

| Stage | Script / Command | Input | Output |
|---|---|---|---|
| Canonical source | — | `source/csv/planets/*.csv` | — |
| Generated model | `build:model` | CSV files | `generated/models/planets.json` |
| Artwork optimization | `build:cards` (imports `optimize-assets.js`) | `source/artwork/cards/planet/planets/*.png`<br>`source/icons/resources/*.png` | `generated/optimized-assets/artwork/*.png`<br>`generated/optimized-assets/icons/*.png` |
| Renderer | `build:cards` | model + optimized artwork + icons | `generated/cards/*.svg` (81) + `index.json` + `contact-sheet.svg` |
| SVGO | `build:cards` | `generated/cards/*.svg` | in‑place optimization |
| Export | `export:planet-bga` | `generated/cards/*.svg` + `planets.json` | `exports/bga/img/*.svg` + `data/planets.json` |

### 2. Technology cards (40 SVGs)

| Stage | Script / Command | Input | Output |
|---|---|---|---|
| Canonical source | — | `source/data/technologies.json`<br>`source/data/technology-artwork-map.json` | — |
| Generated model | `build:tech-model` | `technologies.json` | `generated/models/technologies.json` |
| Bootstrap (one‑time) | `bootstrap:tech-artwork` | `tech_domain.png` + `tech_overlay.png` | `source/artwork/technology/domains/*.png` (8)<br>`source/artwork/technology/overlays/*.png` (5) |
| Artwork optimization | `build:tech-cards` (imports `optimize-tech-assets.js`) | domain + overlay PNGs | `generated/optimized-tech-assets/domains/*.png`<br>`generated/optimized-tech-assets/overlays/*.png` |
| Renderer | `build:tech-cards` | model + artwork map + optimized tiles | `generated/cards-tech/*.svg` (40) |
| SVGO | `build:tech-cards` | `generated/cards-tech/*.svg` | in‑place optimization |
| Export | `export:tech-bga` | SVGs + `technologies.json` | `exports/bga/img/*.svg` + `data/technologies.json` |

### 3. Contract cards (25 SVGs)

| Stage | Script / Command | Input | Output |
|---|---|---|---|
| Canonical source | — | `source/data/contracts.json`<br>`source/data/contract-artwork-map.json` | — |
| Generated model | `build:contract-model` | `contracts.json` | `generated/models/contracts.json` |
| Bootstrap (one‑time) | `bootstrap:contract-artwork` | `civilization_murals.png` | `source/artwork/contracts/artwork/*.png` (25) |
| Artwork optimization | `build:contract-cards` (imports `optimize-contract-assets.js`) | contract PNGs | `generated/optimized-contract-assets/*.png` |
| Renderer | `build:contract-cards` | model + artwork map + optimized PNGs | `generated/contracts/*.svg` (25) |
| SVGO | `build:contract-cards` | `generated/contracts/*.svg` | in‑place optimization |
| Export | `export:contract-bga` | SVGs + `contracts.json` | `exports/bga/img/*.svg` + `data/contracts.json` |

### 4. Resource icons (11 PNGs)

| Stage | Script / Command | Input | Output |
|---|---|---|---|
| Canonical source | — | `source/data/resource-icons.json`<br>`source/artwork/resources/*.png` | — |
| Bootstrap (one‑time) | `bootstrap-resource-icons.js` | (various source icons) | `source/artwork/resources/*.png` |
| Optimization | `build:resource-icons` | source PNGs | `generated/bga/img/*.png` |
| Export | `export:resource-icons-bga` | optimized PNGs | `exports/bga/img/*.png` |

Resource icons are PNG (not SVG), so there is no SVGO stage.

---

## Bootstrap vs Build vs Release

### Bootstrap (one‑time, manual)

- `bootstrap:tech-artwork` — splits domain/overlay collages into individual tile PNGs
- `bootstrap:contract-artwork` — slices the civilization mural into 25 contract portraits
- `bootstrap-resource-icons.js` — imports/generates the 11 resource icon PNGs
- `import-contracts.js` — one‑time import from legacy scratch data

These are not part of any automated pipeline. Run once when source assets change.

### Build (automated)

| Command | What it does |
|---|---|
| `build` | model + cards for all three SVG classes |
| `build:assets` | cards + resource icons (no models) |
| `build:resource-icons` | optimize + generate resource PNGs |
| `release` | `build` + `build:resource-icons` + `deploy` (full pipeline) |

### Deploy / Export

| Command | What it does |
|---|---|
| `deploy` | all four `export:*‑bga` steps |
| `export:planet-bga` | wipes `exports/bga/`, copies planet SVGs + model |
| `export:tech-bga` | merges tech SVGs + model into existing export |
| `export:contract-bga` | merges contract SVGs + model into existing export |
| `export:resource-icons-bga` | merges resource PNGs into existing export |

`export:planet-bga` always runs first (it wipes and recreates the directory).

---

## Generated folder responsibilities

| Folder | Purpose | Consumed by |
|---|---|---|
| `generated/models/` | Canonical JSON models for all card types | Build scripts |
| `generated/cards/` | Planet card SVGs (+ index.json, contact-sheet) | `export:planet-bga` |
| `generated/cards-tech/` | Technology card SVGs | `export:tech-bga` |
| `generated/contracts/` | Contract card SVGs | `export:contract-bga` |
| `generated/bga/img/` | Optimized resource icon PNGs | `export:resource-icons-bga` |
| `generated/optimized-assets/` | Pre‑processed planet artwork + resource icons | `build:cards` |
| `generated/optimized-tech-assets/` | Pre‑processed domain/overlay tiles | `build:tech-cards` |
| `generated/optimized-contract-assets/` | Pre‑processed contract portrait PNGs | `build:contract-cards` |

Experimental / research subdirectories under `generated/` (`experiments/`, `preview/`, `render-preview/`, `svg/`, `design/`) are development artifacts and not part of any build pipeline.

---

## Export structure

```
exports/bga/
├── manifest.json           # augmented by each export step
├── data/
│   ├── planets.json
│   ├── technologies.json
│   └── contracts.json
└── img/
    ├── card_001_1.svg … card_027_3.svg   (81 planet cards)
    ├── tech_000.svg … tech_039.svg        (40 technology cards)
    ├── contract_000.svg … contract_024.svg (25 contract cards)
    ├── algae.png … water.png              (11 resource icons)
```

All 157 files share a flat namespace. Filename patterns are distinct by construction.

---

## Determinism guarantees

- **SVG output** is deterministic: same source → same SVG (fonts, artwork, and layout are all deterministic).
- **PNG optimization** uses Sharp with fixed settings (`compressionLevel: 9`, `effort: 10`, `adaptiveFiltering: true`) producing byte‑identical output across runs.
- **SVGO** runs with `multipass: true` and is idempotent on already‑optimized SVGs.
- **Generated timestamps** are embedded in model JSONs and manifest but do not affect any rendering or export path.

---

## Adding a new asset class

To add a new card type to the pipeline:

1. Add canonical source data to `source/data/` (or `source/csv/`).
2. Create `build:‹type›-model.js` → `generated/models/‹type›.json`.
3. (Optional) Create `bootstrap:‹type›-artwork.js` for source asset setup.
4. Create `lib/‹type›/` with layout + renderer modules.
5. Create `build:‹type›-cards.js` that optimizes artwork, renders SVGs, runs SVGO.
6. Create `export:‹type›-bga.js` that copies SVGs + model into `exports/bga/`.
7. Wire into `package.json`: add to `build`, `build:assets`, `deploy`, and `release`.
