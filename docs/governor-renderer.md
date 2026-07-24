# Governor Tile Renderer

## Source of truth

Governor tile data originates from the reference project at
`scratch/src/data/sectorTiles.js`. That file is the source of truth for gameplay
facts (VP values, conditions, requirement flags). It is **never read by the
renderer**.

All 40 tiles were extracted and converted to the canonical schema during the
initial bootstrap. The original file contained ad-hoc flags that have been
normalised into a uniform requirement model (see schema below).

## Canonical data

`source/data/governors.json` is the canonical, engine-independent data source.
It is hand-authored during the bootstrap import and contains only
renderer-relevant information:

| Field            | Description                                                |
|------------------|------------------------------------------------------------|
| `id`             | Unique identifier, snake-case (`industrial_symbiosis`)     |
| `name`           | Human-readable tile name                                   |
| `vp`             | Victory point value (2–4)                                  |
| `description`    | Natural-language scoring condition text                    |
| `requirements`   | Normalised array of requirement objects (see schema below) |

**Do not hand-edit** this file after bootstrap. Treat it as a stable snapshot.

### Canonical schema

```json
{
  "schema": "v1",
  "description": "Canonical, engine-independent Governor (Sector Tile) data for Mercurio.",
  "governorCount": 40,
  "governors": [
    {
      "id": "industrial_symbiosis",
      "name": "Industrial Symbiosis",
      "vp": 3,
      "description": "Score 3 VP if sector has planets with Ore and Robot outputs.",
      "requirements": [
        { "type": "planetType", "value": "Ore" },
        { "type": "planetType", "value": "Robots" }
      ]
    }
  ]
}
```

### Requirement model

The original source used a dozen ad-hoc boolean/count flags
(`requiresPlanetCount`, `requiresProjectCount`, `requiresDifferentOutputs`,
`requiresFullSector`, `requiresColdIcePlanets`, etc.). These have been
normalised into a uniform array of typed requirement objects.

Each requirement must be satisfied for the tile to score. The array uses AND
semantics (every entry must pass).

Available requirement types:

| Type                  | Fields                          | Description                                              |
|-----------------------|---------------------------------|----------------------------------------------------------|
| `planetType`          | `value` (string), `count` (int, optional) | Sector must contain `count` planets of type `value` |
| `minPlanetCount`      | `value` (int)                   | Minimum number of planet cards in sector                 |
| `minProjectCount`     | `value` (int)                   | Minimum number of project cards in sector                |
| `fullSector`          | none                            | All planet slots must be filled                          |
| `minDifferentOutputs` | `value` (int)                   | Minimum distinct output goods produced in sector         |
| `minDifferentTypes`   | `value` (int)                   | Minimum distinct planet types in sector                  |
| `minDifferentBioTypes`| `value` (int), `pool` (string[]) | Minimum distinct bio planets from `pool`               |
| `minSatisfiedInputs`  | `value` (int)                   | Minimum planets with all inputs satisfied                |
| `minConsumedOutputs`  | `value` (int)                   | Minimum planets with all outputs consumed                |
| `requiredOutput`      | `value` (string)                | Sector must produce the specified output good            |
| `requiredInput`       | `value` (string)                | Sector must consume the specified input good             |
| `minSameInputGood`    | `value` (int)                   | Minimum planets sharing the same input good              |
| `minSameOutputGood`   | `value` (int)                   | Minimum planets producing the same output good           |
| `noProjects`          | none                            | Sector must contain no project cards                     |
| `coldIcePlanets`      | none                            | Sector must contain Cold or Ice planets                  |
| `outputAnyOf`         | `value` (string[])              | Sector must produce at least one of the listed goods     |
| `singleGoodAll`       | none                            | All planets share one specific good as input or output   |
| `singleGoodCount`     | `value` (int)                   | Minimum planets sharing one specific good as I/O         |

### Transformations applied during bootstrap

| Source field (scratch)                     | Canonical representation                                      |
|--------------------------------------------|---------------------------------------------------------------|
| `planetTypes: ["Ore", "Robots"]`           | `{type:"planetType", value:"Ore"}, {type:"planetType", value:"Robots"}` |
| `planetTypes: ["Scrap","Scrap"]`           | `{type:"planetType", value:"Scrap", count: 2}`                |
| `requiresPlanetCount: 2`                   | `{type:"minPlanetCount", value: 2}`                           |
| `requiresProjectCount: 1`                  | `{type:"minProjectCount", value: 1}`                          |
| `requiresFullSector: true`                 | `{type:"fullSector"}`                                         |
| `requiresDifferentOutputs: 3`              | `{type:"minDifferentOutputs", value: 3}`                      |
| `requiresDifferentTypes: 4`                | `{type:"minDifferentTypes", value: 4}`                        |
| `requiresDifferentBioTypes: 3` + bioTypes  | `{type:"minDifferentBioTypes", value: 3, pool: [...]}`        |
| `requiresSatisfiedInputs: 3`               | `{type:"minSatisfiedInputs", value: 3}`                       |
| `requiresConsumedOutputs: 3`               | `{type:"minConsumedOutputs", value: 3}`                       |
| `requiresOutput: "Electronics"`            | `{type:"requiredOutput", value: "Electronics"}`               |
| `requiresInput: "Robot"`                   | `{type:"requiredInput", value: "Robot"}`                      |
| `requiresSameInputGoodCount: 2`            | `{type:"minSameInputGood", value: 2}`                         |
| `requiresSameOutputGoodCount: 2`           | `{type:"minSameOutputGood", value: 2}`                        |
| `requiresNoProjects: true`                 | `{type:"noProjects"}`                                         |
| `requiresColdIcePlanets: true`             | `{type:"coldIcePlanets"}`                                     |
| `requiresOutputAnyOf: ["Water","Algae"]`   | `{type:"outputAnyOf", value: ["Water","Algae"]}`              |
| `requiresSingleGoodAsInputOrOutputForAllPlanets: true` | `{type:"singleGoodAll"}`                    |
| `requiresSingleGoodAsInputOrOutputCount: 2` | `{type:"singleGoodCount", value: 2}`                         |
| `planetTypes` with `"Planet"`/`"Project"` entries | Dropped in favour of explicit count/flag requirements |

### Known source inconsistencies

The original `sectorTiles.js` contained two VP mismatches between the `vp`
field and the `conditionDescription` string. The `vp` field is authoritative:

| Tile                      | `vp` | Description text says |
|---------------------------|------|-----------------------|
| `civil_military_complex`  | 3    | "Score 2 VP"          |
| `climate_crossroads`      | 4    | "Score 3 VP"          |

Additionally, `climate_crossroads` has `planetTypes: ['Cold', 'Ocean', 'Swamp']`
but its description text describes a different condition (Cold/Ice + 2 bio
planets). The `planetTypes` array is authoritative.

All descriptions are preserved verbatim from the source for documentation
value, but the `requirements` array is the authoritative representation.

## Generated model

`compiler/build-governor-model.js` reads the canonical data and produces
`generated/models/governors.json` — the **renderer model**. This mirrors the
technology and contract model architecture exactly:

```
source/data/governors.json              (canonical — hand-authored from reference)
        │  npm run build:governor-model
        ▼
generated/models/governors.json         (renderer model — consume this only)
```

The compiler copies gameplay fields verbatim and **derives rendering metadata**:

| Derived field     | Description                                           |
|-------------------|-------------------------------------------------------|
| `sequentialIndex` | 0-based position in the array (stable render order)   |
| `assetId`         | Stable identifier `governor_000`, `governor_001`, ... |
| `artworkDomain`   | Placeholder `"unassigned"`; replaced by artwork map   |
| `artworkOverlay`  | Placeholder `"unassigned"`; replaced by artwork map   |
| `artworkVariant`  | Default `"placeholder"`                                |
| `frameStyle`      | Always `"Governor"` (single unified style)             |
| `frameColor`      | Purple `#8957e5` (all governors share this colour)     |
| `displayType`     | Always `"Governor"`                                    |
| `flavorText`      | Empty string (no flavour text defined for governors)   |
| `rendererVersion` | `"v1"` — model contract version                        |

### Frame colour

| Style     | Colour | Hex       |
|-----------|--------|-----------|
| Governor  | Purple | `#8957e5` |

All governors share a single frame style, consistent with the art direction
specification ("Governor cards: purple accent strip on the left edge").

## Validation

The compiler enforces:
- Exactly 40 governors
- Unique `id` and `assetId` values
- Valid frame style (single `"Governor"` style)
- Sequential indices match array position
- Asset IDs match expected pattern `governor_NNN`
- VP values in valid range (2–4)
- Non-empty `name` and `description`
- All renderer fields populated
- Every requirement has a valid type from the approved set
- `planetType` requirements have a `value`
- `outputAnyOf` requirements have a `value` array
- `minDifferentBioTypes` requirements have a `pool` array

Aborts on any failure before writing output.

## Renderer responsibilities

The renderer **must never read** `source/data/governors.json` or any reference
project file. It consumes only:

| File                                  | Purpose                              |
|---------------------------------------|--------------------------------------|
| `generated/models/governors.json`     | Governor tile data + rendering metadata |

The renderer is responsible for:
1. Loading the generated model
2. Iterating the `governors` array
3. Rendering each governor tile using the model fields
4. Displaying `vp` as a score badge (2–4 VP)
5. Displaying `description` as the rules text
6. Interpreting `requirements` array as visual requirement indicators
7. Applying `frameStyle` / `frameColor` to card framing (unified purple)
8. Compositing artwork from `artworkDomain` / `artworkOverlay` (future)

The renderer **does not** implement:
- Gameplay logic or engine rules
- Condition evaluation or scoring calculation
- Governor slot state, placement, or ownership
- Pool interaction (drafting, refresh, claim mechanics)
- Reducers or state management
- Firestore data access
- Runtime interactivity

## Ownership

| Path                                        | Role                          | Modified by                           |
|---------------------------------------------|-------------------------------|---------------------------------------|
| `source/data/governors.json`                | Canonical source data         | Bootstrap import (one-time)           |
| `generated/models/governors.json`           | Renderer model                | `build:governor-model`               |
| `source/data/governor-artwork-map.json`     | Artwork mapping (future)      | Artist                                |
| `generated/cards-governor/*.svg`            | Card render output (future)   | `build:governor-cards` (future)       |

`build:governor-model` is a **read-only** consumer of the canonical file. It
never writes to `source/data/`.
