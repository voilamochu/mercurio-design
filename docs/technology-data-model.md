# Technology Data Model

## Why this file exists

The reference web application (`bga-mercurio`) stores technology information spread
across engine-specific JavaScript modules (`techs.js`, `projectDescriptions.js`, etc.).
Those files mix content with implementation logic (reducers, React components, game
state), and follow a file layout that is convenient for the engine but hostile to
consumption by design renderers.

`source/data/technologies.json` is the **canonical, engine-independent** technology
data source for the Mercurio Design repository. It is the single source of truth for
technology-card content used by future renderers. It contains **only content** — no
runtime state, no costs, no engine logic, no reducers.

This mirrors the planet pipeline approach (`generated/models/planets.json`), where the
design repository owns normalized content that downstream renderers read directly.

## Why the design repo owns the canonical data

- **Single source of truth** — renderers, compilers, and exports all read the same file.
- **Engine independence** — the design repo must not depend on the reference engine's
  module system, naming, or file layout.
- **Normalization** — duplicated/redundant structures (e.g. `projectDescriptions.js`
  keyed by id, building names embedded in `techs.js` descriptions) are resolved into a
  flat, renderer-ready record per technology.
- **Validation** — the canonical file is validated (unique ids/names, valid types,
  levels, copy counts, complete project metadata, non-empty descriptions) before use.

## Schema

Top-level object:

| Field            | Type    | Description                                                        |
|------------------|---------|--------------------------------------------------------------------|
| `schema`         | string  | Schema version, currently `"v1"`.                                  |
| `generatedAt`    | string  | ISO-8601 timestamp of generation.                                  |
| `description`    | string  | Human-readable purpose of the file.                                |
| `technologyCount`| number  | Number of technology records.                                      |
| `technologies`   | array   | The canonical list of technology records (see below).              |

### Technology record

| Field               | Type             | Applies to        | Description                                                                 |
|---------------------|------------------|-------------------|-----------------------------------------------------------------------------|
| `id`                | string           | all               | Stable unique identifier (snake_case), e.g. `"quantum_computing"`.           |
| `name`              | string           | all               | Display name shown on the card, e.g. `"Quantum Computing"`.                  |
| `level`             | number           | all               | Technology tier: `1`, `2`, or `3`.                                          |
| `type`              | string           | all               | One of `Project`, `Passive`, `Active`, `Endgame`.                            |
| `copies`            | number           | all               | Number of copies in the deck: `1`, `2`, or `3`.                             |
| `description`       | string           | all               | Short card text describing the technology's effect.                          |
| `projectName`       | string \| null   | `Project` only    | The building constructed by the project (e.g. `"Resort Complex"`).           |
| `projectDescription`| string \| null   | `Project` only    | Ability text of the constructed project (from `ProjectDescriptions.csv`).    |
| `projectOutput`     | string \| null   | `Project` only    | Single resource the project produces, when unambiguously one (e.g. `"power"`). `null` when the project has no single output (e.g. copies an existing output). |

Non-Project technologies do not carry the `projectName`, `projectDescription`, or
`projectOutput` fields.

## Validation rules

The file is validated by `scripts/validate-technologies.cjs`. Checks:

1. **Unique ids** — every `id` is unique across the list.
2. **Unique names** — every `name` is unique across the list.
3. **Valid type** — `type` ∈ {`Project`, `Passive`, `Active`, `Endgame`}.
4. **Valid level** — `level` ∈ {`1`, `2`, `3`}.
5. **Valid copy count** — `copies` ∈ {`1`, `2`, `3`}.
6. **Project metadata** — every `Project` record has a non-empty `projectName` and a
   defined `projectDescription`; non-Project records must not carry project fields.
7. **No missing descriptions** — every record has a non-empty `description`.

If any check fails, the validator prints the errors and exits non-zero.

## Source provenance

Imported content (data only) from the reference project:

- `reference-data/standalone-src-data/techs.js` (`TECH_DATA`) — id, name, description,
  level, copies, type, and the embedded building name for Project techs.
- `reference-data/standalone-src-data/projectDescriptions.js` (`PROJECT_DESCRIPTIONS`)
  — project ability text keyed by technology id.

Generated by `scripts/gen-technologies.cjs`, which imports the content, normalizes it
into the schema above, and writes `source/data/technologies.json`. Re-run the generator
after any source change, then re-run the validator.
