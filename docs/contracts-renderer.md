# Contract Card Renderer

## Source

Contract data originates from the reference project at
`bga-mercurio/reference-data/standalone-src-data/contracts.js`. That file is the
source of truth for gameplay facts (requirements, rewards, types, tech
requirements). It is **never read by the renderer**.

## Canonical data

`source/data/contracts.json` is the canonical, engine-independent data source.
It is hand-authored during import from the reference project and contains only
renderer-relevant information:

| Field            | Description                                            |
|------------------|--------------------------------------------------------|
| `id`             | Unique identifier, kebab-case (`aelyr-1`)              |
| `name`           | Human-readable card name                               |
| `civilization`   | Faction name, PascalCase (`Aelyr`, `Varuuk`, etc.)     |
| `requirement`    | Natural-language fulfillment condition                 |
| `reward`         | Natural-language reward description                    |
| `type`           | Card type: `Bounty`, `Deal`, `Permanent`, `Accord`     |
| `requiredTech`   | Array of tech IDs needed, or `null`                    |
| `requiredResources` | Resource costs for fulfillment (empty `{}` for now) |
| `flavor`         | Flavor text (empty string for now)                     |
| `artwork`        | Future artwork asset reference (`null` for now)         |

**Do not hand-edit** this file after import. Treat it as a stable snapshot.

## Generated model

`compiler/build-contract-model.js` reads the canonical data and produces
`generated/models/contracts.json` — the **renderer model**. This mirrors the
technology model architecture exactly:

```
source/data/contracts.json         (canonical — hand-authored from reference)
        │  npm run build:contract-model
        ▼
generated/models/contracts.json    (renderer model — consume this only)
```

The compiler copies gameplay fields verbatim and **derives rendering metadata**:

| Derived field     | Description                                           |
|-------------------|-------------------------------------------------------|
| `sequentialIndex` | 0-based position in the array (stable render order)   |
| `assetId`         | Stable identifier `contract_000`, `contract_001`, ... |
| `artworkDomain`   | Placeholder `"unassigned"`; replaced by artwork map   |
| `artworkOverlay`  | Placeholder `"unassigned"`; replaced by artwork map   |
| `artworkVariant`  | Default `"placeholder"`                                |
| `frameStyle`      | One of `Bounty`, `Deal`, `Permanent`, `Accord`        |
| `frameColor`      | Color keyed to `frameStyle`                            |
| `displayType`     | Human-friendly type string                             |
| `flavorText`      | Copied from canonical `flavor` field                   |
| `rendererVersion` | `"v1"` — model contract version                        |

### Frame colors

| Style       | Color   | Hex       |
|-------------|---------|-----------|
| Bounty      | Green   | `#2da44e` |
| Deal        | Blue    | `#1f6feb` |
| Permanent   | Purple  | `#8957e5` |
| Accord      | Amber   | `#bf8700` |

### Validation

The compiler enforces:
- Exactly 25 contracts
- Unique `id` and `assetId` values
- Valid frame style (one of the four)
- Valid civilization (one of five factions)
- Sequential indices match array position
- Asset IDs match expected pattern `contract_NNN`
- All renderer fields populated
- Non-empty requirement string

Aborts on any failure before writing output.

## Renderer responsibilities

The renderer **must never read** `source/data/contracts.json` or any reference
project file. It consumes only:

| File                                   | Purpose                             |
|----------------------------------------|-------------------------------------|
| `generated/models/contracts.json`      | Contract card data + rendering metadata |
| `source/data/contract-artwork-map.json`| Future: artwork domain/overlay mapping |

The renderer is responsible for:
1. Loading the generated model
2. Iterating the `contracts` array
3. Rendering each contract card using the model fields
4. Applying `frameStyle` / `frameColor` to card framing
5. Displaying `requirement`, `reward`, `flavorText` as text regions
6. Showing `requiredTech` as icon badges if present
7. Rendering `civilization` as a faction indicator
8. Compositing artwork from `artworkDomain` / `artworkOverlay` (future)

The renderer **does not** implement:
- Gameplay logic or engine rules
- Claim-slot state or player markers
- Reducers or state management
- Firestore data access
- Runtime interactivity (claim/undo mechanics)

## Future artwork mapping

When contract artwork is produced, a `source/data/contract-artwork-map.json`
file will map each contract `id` to a `(domain, overlay)` pair, following the
same pattern as `source/data/technology-artwork-map.json`. The compiler will
be updated to inject those values into the generated model, and the renderer
will compose artwork from the mapped asset files.

## Pipeline

```
bga-mercurio/reference-data/standalone-src-data/contracts.js
        │  (import — one-time, manual)
        ▼
source/data/contracts.json                              (canonical)
        │  npm run build:contract-model
        ▼
compiler/build-contract-model.js                        (compiler)
        │
        ▼
generated/models/contracts.json                         (renderer model)
        │
        ├── (future) npm run build:contract-cards
        │       ▼
        │   generated/cards-contract/contract_*.svg
        │
        └── (future) npm run generate:contract-preview
                ▼
            generated/cards-contract/preview/artwork/contract_*.png
```

## Ownership

| Path                                        | Role                          | Modified by                         |
|---------------------------------------------|-------------------------------|-------------------------------------|
| `source/data/contracts.json`                | Canonical source data         | Import author (one-time)            |
| `generated/models/contracts.json`           | Renderer model                | `build:contract-model`              |
| `source/data/contract-artwork-map.json`     | Artwork mapping (future)      | Artist                              |
| `generated/cards-contract/*.svg`            | Card render output (future)   | `build:contract-cards`              |

`build:contract-model` is a **read-only** consumer of the canonical file. It
never writes to `source/data/`.
