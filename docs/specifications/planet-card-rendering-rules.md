# Planet Card — Renderer-Agnostic Rendering Specification

## 1. Resource Placement Rules

### 1.1 Data Sources

Each planet card has a unique ID (`card_NNN_M.webp` where NNN = 001–027, M = 1–3 copy number). Resource data is keyed by card ID:

- **planetResources** (`data/planetResources.js`): maps card ID to `{ inputs: { l1, l2, l3 }, outputs: { l1, l2, l3 } }`. Each level is an ordered array of resource name strings (e.g. `["Algae", "Grain"]`).

Slot positions are not stored per-card. All planet cards share the same cell layout defined by the renderer (`compiler/build-cards.js`).

### 1.2 Cell Layout Model

The information panel (Layer 2) defines a fixed grid of cells. Each cell is identified by side (input/output), level (I/II/III), and index within that level:

| ID | Side | Level | Position (x, y) |
|---|---|---|---|
| `input-I-1` | Input | I | (130, 680) |
| `input-I-2` | Input | I | (210, 680) |
| `input-II-1` | Input | II | (130, 800) |
| `input-II-2` | Input | II | (210, 800) |
| `input-III-1` | Input | III | (130, 920) |
| `input-III-2` | Input | III | (210, 920) |
| `output-I-1` | Output | I | (534, 680) |
| `output-I-2` | Output | I | (614, 680) |
| `output-II-1` | Output | II | (534, 800) |
| `output-II-2` | Output | II | (614, 800) |
| `output-III-1` | Output | III | (534, 920) |
| `output-III-2` | Output | III | (614, 920) |

Resource names are looked up at render time using `planetResources[cardId].{inputs|outputs}["l{level}"][index]`, where `level` is 1–3 and `index` is 0-based.

### 1.3 Input Slot Rendering

**Position:** Each resource icon is centred within its cell in the information panel. Cell centre coordinates are defined in Section 6.2.

**Icon:** The resource icon is determined by looking up the resource name (from `planetResources.inputs["l{level}"][index]`) in a **RESOURCE_ICONS** map:

| Resource Name(s) | Icon Asset |
|---|---|
| Grain | `grainIcon` |
| Water | `waterIcon` |
| Electronics | `electronicsIcon` |
| Robot, Robots | `robotIcon` |
| Crate, Crates | `crateIcon` |
| Ore | `oreIcon` |
| Algae | `algaeIcon` |
| Human, Humans, Population | `humanIcon` |
| Science | `scienceIcon` |
| Tech | `techIcon` |
| Culture, Influence | `cultureIcon` |
| Power | `powerIcon` |
| Money | `moneyIcon` |
| Project, Projects, Project0 | `projectIcon` |
| VP | `vpIcon` |
| Mindforge | `questionIcon` (inline SVG) |
| 'Trade Port' | `null` (no icon, nexus resource) |

Plural/singular variants (e.g. "Crate" vs "Crates") map to the same icon. "Population" maps to the same icon as "Human".

**Ordering:** Inputs are ordered by level then index. Level I cells are populated first (left to right), then Level II, then Level III.

**Empty slots:** If a level has no resources defined for a given array index, or the resource name is undefined/null, that cell is left empty — no icon is rendered in that position.

### 1.4 Output Slot Rendering

**Position:** Same cell-based positioning as inputs, using the output column cells in the information panel.

**Icon:** Same resource icon resolution via `planetResources.outputs["l{level}"][index]`.

**Ordering:** Same as inputs — ordered by level then index.

**Empty slots:** Same rule — empty cells render no icon.

### 1.5 Production Level Rules

Three income levels (L1, L2, L3) each define input requirements and output rewards. Levels are hierarchical.

**Input-to-Output Chaining:** When an input slot is toggled to "satisfied" (`true`), output availability is recomputed:

- If the card has **1 input level**: all outputs at all levels become available when L1 inputs are satisfied.
- If the card has **2 input levels**: L1 outputs become available when L1 inputs are satisfied; L2 and L3 outputs become available when L1 AND L2 inputs are satisfied.
- If the card has **3 input levels**: output level N becomes available only when all input levels 1..N are satisfied.

Outputs have three states:
| State | Meaning | Visual |
|---|---|---|
| `null` | Locked (inputs not satisfied) | Dimmed/ghosted |
| `false` | Available (inputs satisfied, not yet used) | Highlighted (green accent) |
| `true` | Used (already consumed/sold) | Neutral/muted |

### 1.6 Empty/Zero Level Behaviour

If a level has zero output slots (empty array), that level is considered vacuously complete — it does not block progression to higher levels. A level is "complete" when all its output slots are in the `true` (used) state, or it has no output slots at all.

---

## 2. Planet Identity

### 2.1 Planet Type Lookup

Planet type is determined from the card ID via the **PLANET_TYPES** table (`data/planetTypes.js`):

| Card ID Range | Type |
|---|---|
| `card_001`–`card_003` | Swamp |
| `card_004`–`card_006` | Scrap |
| `card_007`–`card_009` | Proto |
| `card_010`–`card_012` | Ocean |
| `card_013`–`card_015` | Jungle |
| `card_016`–`card_018` | Cold |
| `card_019`–`card_021` | Earth |
| `card_022`–`card_023` | Ice |
| `card_024`–`card_027` | Forge |

Each card copy (M = 1, 2, 3) has the same type as its base card.

### 2.2 Artwork Selection

Planet type is communicated visually through the planet artwork (Layer 1). The artwork is a single raster image that includes both the planet and its surrounding space.

| Type | Artwork Asset |
|---|---|
| Cold | `source/artwork/cards/planet/planets/cold-v2.png` |
| Earth | `source/artwork/cards/planet/planets/earth-v2.png` |
| Forge | `source/artwork/cards/planet/planets/forge-v2.png` |
| Ice | `source/artwork/cards/planet/planets/ice-v2.png` |
| Jungle | `source/artwork/cards/planet/planets/jungle-v2.png` |
| Ocean | `source/artwork/cards/planet/planets/ocean-v2.png` |
| Proto | `source/artwork/cards/planet/planets/proto-v2.png` |
| Scrap | `source/artwork/cards/planet/planets/scrap-v2.png` |
| Swamp | `source/artwork/cards/planet/planets/swamp-v2.png` |

One artwork exists per planet type. Multiple cards of the same type share the same artwork. The planet type icon and separate space background layer are no longer used — the planet artwork alone communicates planet identity.

---

## 3. VP Indicator (Obsolete)

The VP indicator has been removed from the canonical planet card design.

The card's upper portion communicates flavour, not gameplay data. VP is tracked through game-state UI outside the card surface.

---

## 4. Status Overlays

### 4.1 Runtime-Only Overlays (Must Never Be Baked into Generated Assets)

| Overlay | Location | Visual | Condition |
|---|---|---|---|---|
| **Unsatisfied input badge** | Input cell | Red X icon (bottom-right of cell) | Card is settled AND the input is not satisfied (`activeInputs[idx] !== true`) AND the card is not in distribution mode |
| **Available output badge** | Output cell | Green checkmark icon (bottom-right of cell) | Card is settled AND output is `false` (available) AND not in sale mode |
| **Pirate raid target** | Output cell | Pulsing red border | A `pirateRaidState` matches this card's sector + slot index, AND the output is available |
| **Sale mode — seller** | Output cell | Green pulse + ring when selected | Player is in sale mode, owns the card, and the output matches the good being sold |
| **Sale mode — non-seller** | Output cell | Dimmed/disabled (opacity reduced) | Sale mode is active but the player is not the seller |
| **Distribution mode — receivable** | Input cell | Amber pulse | Distribution is active, the input is not satisfied, and the distributed resource type matches the input requirement |
| **Distribution mode — non-receivable** | Input cell | Disabled (button disabled, no pulse) | Distribution is active but resource type does not match |

### 4.2 Asset-Generation Safe Overlays (May Be Baked)

None of the overlays listed in 4.1 are safe to bake. All depend on runtime game state.

---

## 5. Ownership Rendering

### 5.1 Runtime-Only Ownership Elements

| Element | Visual | Condition |
|---|---|---|
| **Owner indicator bar** | Thin coloured bar across the bottom edge of the card | `ownerRole` is defined (non-undefined). Height proportional to card scale. |
| **Theme colour** | Bar colour matches player theme | Mapped from `ownerRole` string (`'p1'`–`'p4'` or `'neutral'`) to theme: |

| Owner Role | Bar Colour |
|---|---|
| `p1` | Amber |
| `p2` | Red |
| `p3` | Blue |
| `p4` | Emerald |
| `neutral` | Slate/Grey |

The owner indicator bar MUST NOT be baked into generated card assets — it is purely a runtime UI concern. It is rendered below the information panel, along the bottom edge of the card.

### 5.2 Settled State

A card is considered "settled" (owned by a player and placed on the board) when `sectorIndex` is not null/undefined. The `ownerRole` alone determines settlement for rendering purposes (its presence/absence gates VP display and overlay behaviour).

---

## 6. Composition (Three-Layer Stack)

A production planet card consists of exactly three visual layers composited from back to front:

| Layer | Content | Source | Description |
|---|---|---|---|
| 1 (bottom) | Planet Artwork | `source/artwork/cards/planet/planets/{type}-v2.png` | Single raster image including both the planet and surrounding space. One artwork per planet type. |
| 2 | Information Panel | Rendered programmatically | Watermark cover (gradient overlay providing a dark backing behind gameplay information). Defined by the renderer, which hardcodes all layout constants for row positions, margins, and the watermark path. Contains no gameplay data, resource icons, or text. |
| 3 (top) | Gameplay Elements | Rendered programmatically | Resource icons and future overlays. Centred within the cells defined by the information panel. |

### 6.1 Information Panel Responsibilities

The information panel (Layer 2) provides:

- Watermark cover with gradient fill transitioning from transparent at the top to opaque at the bottom
- Gameplay dividers (two horizontal lines) separating production levels
- Dark backing behind resource icons for readability

The panel is rendered programmatically by `compiler/build-cards.js`. It contains no gameplay data, resource icons, or text.

### 6.2 Gameplay Element Positioning

Gameplay elements (Layer 3) are rendered programmatically into fixed row positions. Each row is centred on Y coordinates defined by the renderer:

| Level | Input Cell Center X | Output Cell Center X | Row Y (px) | Row Y (% of 1039) |
|---|---|---|---|---|---|
| I | 160 | 584 | 592 | 57% |
| II | 160 | 584 | 758 | 73% |
| III | 160 | 584 | 925 | 89% |

Resource icons are centred within each cell. Overlays (availability, satisfaction, etc.) are positioned relative to the cell centre.

---

## 7. Rendering Modes

| Mode | Trigger | Behaviour |
|---|---|---|
| **Composited** | Default | Compose all three layers: planet artwork → information panel → gameplay elements. Full card with interactivity. |
| **Artwork only** | Preview / selection context | Show only Layer 1 (planet artwork). No panel, no gameplay elements. |
| **Special face** | Card ID contains `card_028` (Asteroid) or `card_029` (Lost Fleet) | Render special face component instead of the three-layer composition. Non-interactive. |

---

## 8. Summary: Data Flow for a Complete Render

```
card ID
  ├──→ PLANET_TYPES[cardId]                     → type string
  │     └──→ artwork path based on type          → Layer 1: Planet Artwork
  ├──→ compiler/build-cards.js                   → Layer 2: Watermark / Information Panel (rendered programmatically)
  ├──→ PLANET_RESOURCES[cardId]                  → { inputs, outputs }
  │     └── per cell: RESOURCE_ICONS[name]       → resource icon asset (Layer 3)
  ├──→ PLANET_BENEFITS[cardId]                   → { l0, l1, l2, l3 } income values (engine use)
  ├──→ activeInputs (runtime)                    → boolean[] — satisfied state
  ├──→ activeOutputs (runtime)                   → (boolean|null)[] — locked/available/used
  ├──→ ownerRole (runtime)                       → settlement + theme
  └──→ sectorIndex (runtime)                     → settled state gate
```

The two fixed layers (artwork and information panel) are resolved at compile time. Gameplay elements and runtime overlays are resolved at render time.
```
