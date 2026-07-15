# Planet Card — Renderer-Agnostic Rendering Specification

## 1. Resource Placement Rules

### 1.1 Data Sources

Each planet card has a unique ID (`card_NNN_M.webp` where NNN = 001–027, M = 1–3 copy number). Two data tables keyed by card ID determine resource placement:

- **planetResources** (`data/planetResources.js`): maps card ID to `{ inputs: { l1, l2, l3 }, outputs: { l1, l2, l3 } }`. Each level is an ordered array of resource name strings (e.g. `["Algae", "Grain"]`).
- **planetLayoutData** (`data/planetLayoutData.js`): maps card ID to per-hitbox position data (x%, y% coordinates). Hitbox IDs follow the pattern `l{level}_{index}` (1-based index). CSV columns encode up to 2 input slots × 3 levels and 2 output slots × 3 levels.

### 1.2 Slot Data Model

A card's **hitboxes** structure is assembled at deck-construction time by merging layout data with resource data:

```typescript
// Assembled once, stored on the card object
interface Hitboxes {
  inputs: Hitbox[]   // ordered by level then index
  outputs: Hitbox[]  // ordered by level then index
}

interface Hitbox {
  level: 1 | 2 | 3   // income level this slot belongs to
  id: string          // e.g. "l1_1" — level + underscore + 1-based index
  x: number           // horizontal position as percentage of card width (0–100)
  y: number           // vertical position as percentage of card height (0–100)
}
```

Each hitbox carries no resource name. Resource names are looked up at render time using `planetResources[cardId].{inputs|outputs}["l{level}"][index]`, where `index = parseInt(hitbox.id.split('_')[1]) - 1`.

### 1.3 Input Slot Rendering

**Position:** Each input hitbox is rendered at its (x, y) coordinate within the card bounds. Positions are percentages relative to the card's full dimensions (width × height). The hitbox center is positioned at (x%, y%).

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

**Ordering:** Inputs are ordered by their `id` (lexicographic within the hitboxes.inputs array). The array positions determine the index into the resource data arrays. **The hitbox id index directly maps to the array index** (zero-based after parsing): `id "l1_1" → index 0, "l1_2" → index 1`, etc.

**Empty slots:** If a level has no resources defined for a given array index, or the resource name is undefined/null, that slot position does not exist in the hitboxes list. Hitboxes are only created for positions that have data in the CSV layout.

### 1.4 Output Slot Rendering

**Position:** Identical coordinate system to inputs.

**Icon:** Same resource icon resolution via `planetResources.outputs["l{level}"][index]`.

**Ordering:** Same as inputs — ordered by `id` within the `hitboxes.outputs` array.

**Empty slots:** Same rule — no hitbox is created for layout positions that have no resource data.

### 1.5 Production Level Rules

Three income levels (L1, L2, L3) each define input requirements and output rewards. Levels are hierarchical.

**Input-to-Output Chaining:** When an input hitbox is toggled to "satisfied" (`true`), output availability is recomputed:

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

## 2. Planet Type Rendering

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

### 2.2 Planet Type Icon Resolution

The type string is mapped through **PLANET_TYPE_ICONS** (`constants/icons.js`):

| Type | Icon Asset Path |
|---|---|
| Cold | `/assets/Cold.webp` |
| Earth | `/assets/Earth.webp` |
| Forge | `/assets/Forge.webp` |
| Ice | `/assets/Ice.webp` |
| Jungle | `/assets/Jungle.webp` |
| Ocean | `/assets/Ocean.webp` |
| Proto | `/assets/Proto.webp` |
| Scrap | `/assets/Scrap.webp` |
| Swamp | `/assets/Swamp.webp` |

### 2.3 Artwork Selection (Future Specification)

Card artwork is currently not selected by type. The fallback rendering uses the raw card image (`/assets/card_NNN_M.webp`). A future renderer SHOULD:

1. Map planet type to a biome artwork variant.
2. Map card ID to a unique terrain composition (craters, flora, structures).
3. Composite the type icon, artwork, and hitbox elements into a single generated asset.

---

## 3. VP Rendering

### 3.1 VP Sources and Determination

A planet can display VP icons for two distinct sources:

| Source | Amount | When Granted | Persistence |
|---|---|---|---|
| **Settle VP** | +1 | Immediately when a card is played to a sector (engine: `cardReducer.settle.js`) | Permanent for the game |
| **Development VP** | +1 | When all output slots are in the `true` (used) state (engine: `marketReducer.js` on SELL_RESOURCE, or hook on toggle) | Revocable — revoked if outputs become incomplete |

No VP is shown for an unsettled card.

### 3.2 VP Display Count Logic

```
if card is not settled:
    display 0 VP icons
else if all outputs are used (every activeOutputs[idx] === true):
    display 2 VP icons
else:
    display 1 VP icon
```

"All outputs used" is determined by checking every element of `activeOutputs` corresponding to `hitboxes.outputs` — each must be `true`. An empty output list results in 1 VP (settle only), not 2.

### 3.3 VP Icon Rendering

VP icons use the `vpIcon` asset. Each icon is rendered at a fixed small size (relative to card scale). Multiple VP icons are displayed adjacent to the planet type icon in the card's title bar area.

---

## 4. Status Overlays

### 4.1 Runtime-Only Overlays (Must Never Be Baked into Generated Assets)

| Overlay | Location | Visual | Condition |
|---|---|---|---|
| **Unsatisfied input badge** | Input hitbox | Red X icon (bottom-right of hitbox circle) | Card is settled AND the input is not satisfied (`activeInputs[idx] !== true`) AND the card is not in distribution mode |
| **Available output badge** | Output hitbox | Green checkmark icon (bottom-right of hitbox circle) | Card is settled AND output is `false` (available) AND not in sale mode |
| **Pirate raid target** | Output hitbox | Pulsing red border | A `pirateRaidState` matches this card's sector + slot index, AND the output is available |
| **Sale mode — seller** | Output hitbox | Green pulse + ring when selected | Player is in sale mode, owns the card, and the output matches the good being sold |
| **Sale mode — non-seller** | Output hitbox | Dimmed/disabled (opacity reduced) | Sale mode is active but the player is not the seller |
| **Distribution mode — receivable** | Input hitbox | Amber pulse | Distribution is active, the input is not satisfied, and the distributed resource type matches the input requirement |
| **Distribution mode — non-receivable** | Input hitbox | Disabled (button disabled, no pulse) | Distribution is active but resource type does not match |

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

The owner indicator bar MUST NOT be baked into generated card assets — it is purely a runtime UI concern.

### 5.2 Settled State

A card is considered "settled" (owned by a player and placed on the board) when `sectorIndex` is not null/undefined. The `ownerRole` alone determines settlement for rendering purposes (its presence/absence gates VP display and overlay behaviour).

---

## 6. Rendering Order (Layer Stack)

From back to front:

| Layer | Z-order | Content |
|---|---|---|
| 1 (bottom) | auto | Card image (raw asset) or digital background |
| 2 | z-5 | Divider line separating title bar from hitbox area (horizontal, at `topBarPercent`) |
| 3 | z-5 | Vertical centreline (for reference grid) |
| 4 | z-10 | Input hitboxes — circular overlays at percentage positions |
| 5 | z-10 | Output hitboxes — circular overlays at percentage positions |
| 6 | z-20 | Title bar — planet type icon (left) + VP icons (right) |
| 7 | auto | Owner indicator bar — thin strip at bottom edge |
| 8 (top) | auto | Children/descendant content |

### 6.1 Title Bar

The title bar occupies the top `topBarPercent`% of the card height. Default is 12% for raw image mode, 20% for digital layout mode. It contains:

- **Left:** Planet type icon (18× scale px). Falls back to truncated card ID text if no type icon is available.
- **Right:** VP icon(s) (11× scale px each), zero or more per VP count logic above.

A horizontal divider line separates the title bar from the hitbox area.

### 6.2 Hitbox Y-Coordinate Remapping

When the title bar height changes (e.g. from 12% base to 20% in digital mode), hitbox Y positions must be remapped linearly:

- If y ≤ baseTopBarPercent: `newY = (y / baseTopBarPercent) × topBarPercent`
- If y > baseTopBarPercent: `newY = topBarPercent + ((y - baseTopBarPercent) / (100 - baseTopBarPercent)) × (100 - topBarPercent)`

X coordinates are never remapped.

---

## 7. Rendering Modes

| Mode | Trigger | Behaviour |
|---|---|---|
| **Raw image** | Default (no data props, variant != 'digital') | Show `<img>` asset. No type icon, no VP, no hitboxes. Cannot interact. |
| **Digital** | `resources` or `benefits` data props provided, OR `variant === "digital"` | Render title bar + hitbox overlays + owner bar. Full interactivity. |
| **Special face** | Raw image mode AND card ID contains `card_028` (Asteroid) or `card_029` (Lost Fleet) | Render special face component instead of image. Non-interactive. |

---

## 8. Summary: Data Flow for a Complete Render

```
card ID
  ├──→ PLANET_TYPES[cardId]              → type string
  │     └──→ PLANET_TYPE_ICONS[type]      → type icon asset path
  ├──→ PLANET_RESOURCES[cardId]           → { inputs, outputs }
  │     └── per hitbox: RESOURCE_ICONS[name] → resource icon asset
  ├──→ PLANET_BENEFITS[cardId]            → { l0, l1, l2, l3 } income/vp values (engine use)
  ├──→ hitboxes (from deck build)         → position data (x%, y%)
  ├──→ activeInputs (runtime)             → boolean[] — satisfied state
  ├──→ activeOutputs (runtime)            → (boolean|null)[] — locked/available/used
  ├──→ ownerRole (runtime)                → settlement + theme
  └──→ sectorIndex (runtime)              → settled state gate
```
