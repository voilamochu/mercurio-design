# Governor Tile Layout Language — Design Specification

> **Status:** Investigation / Pre-renderer specification
> **Date:** 2026-07-22
> **Goal:** Define a minimal, reusable template system for rendering all 40 governor tiles from the `governors.json` layout model.

---

## 1. Every Governor Grouped by Visual Archetype

All 40 governors are classified by the *structure* of their `requirements` array (not gameplay theme). The unit of analysis is the **visual cluster** — the set of SVG elements produced by a single requirement group in `layout-model.js`.

### Archetype A — "2 Planet Icons" (7 governors)

Two `planetType` requirements with no count, no operator. The icon type may be planet or resource (e.g. Ore maps to a resource icon, not a planet shape).

| Governor | Req 1 | Req 2 |
|---|---|---|
| `industrial_symbiosis` | planetType(Ore) | planetType(Robots) |
| `life_support_loop` | planetType(Water) | planetType(Humans) |
| `synthetic_exchange` | planetType(Electronics) | planetType(Robots) |
| `civil_military_complex` | planetType(Humans) | planetType(Robots) |
| `vertical_integration` | planetType(Crates) | planetType(Electronics) |
| `industrial_wastes` | planetType(Forge) | planetType(Scrap) |
| `environmental_contrast` | planetType(Cold) | planetType(Jungle) |

**Cluster shape:** `[icon] [icon]`
**Row layout:** Centered, evenly spaced. Fits in 1 row.

### Archetype B — "3 Planet Icons" (9 governors)

Three `planetType` requirements, no count, no operator.

| Governor | Req 1 | Req 2 | Req 3 |
|---|---|---|---|
| `bio_processing_ring` | Algae | Water | Grain |
| `emergent_biosphere` | Proto | Jungle | Swamp |
| `terraforming_cluster` | Earth | Jungle | Ocean |
| `frozen_industrial_zone` | Forge | Cold | Ice |
| `harsh_frontier` | Cold | Scrap | Proto |
| `ecological_pressure_zone` | Swamp | Jungle | Cold |
| `mixed_climate_corridor` | Ice | Ocean | Earth |
| `industrial_biological_interface` | Forge | Swamp | Jungle |
| `climate_crossroads` | Cold | Ocean | Swamp |

**Cluster shape:** `[icon] [icon] [icon]`
**Row layout:** Centered, evenly spaced. Fits in 1 row.

### Archetype C — "2 Planets + Extra Resource/Input/Output" (4 governors)

Two `planetType` requirements plus a `requiredOutput` or `requiredInput`. The extra requirement carries an operator arrow (right-arrow for output, left-arrow for input).

| Governor | Req 1 | Req 2 | Req 3 (with operator) |
|---|---|---|---|
| `manufacturing_spine` | Forge | Scrap | requiredOutput(Electronics) → right-arrow |
| `cold_chain_logistics` | Cold | Ice | minProjectCount(1) → badge |
| `wetland_exploitation` | Swamp | Jungle | requiredOutput(Water) → right-arrow |
| `polar_research_sector` | Ice | Proto | requiredInput(Robot) → left-arrow |

**Cluster shape:** `[icon] [icon] [operator icon]` or `[icon] [icon] [badge icon]`
**Row layout:** 3-cluster row, or wraps to 2+1 if width exceeds available space.

### Archetype D — "Count-Badged Planet(s)" (5 governors)

One or two `planetType` requirements with `count > 1`, possibly plus another requirement.

| Governor | Cluster 1 | Cluster 2 |
|---|---|---|
| `proto_development_zone` | badge(2) + Proto | — |
| `oceanic_network` | badge(2) + Ocean | — |
| `deep_freeze_network` | badge(2) + Ice | — |
| `salvage_loop` | badge(2) + Scrap | badge(1) + project |
| `industrial_overlap` | badge(2) + Forge | Scrap (plain) |

**Cluster shape:** `[badge N] [icon]`
**Row layout:** 1–2 clusters, fits 1 row.

### Archetype E — "Planet type count" (4 governors)

Two requirements where both deal with planet/project counts.

| Governor | Cluster 1 | Cluster 2 |
|---|---|---|
| `extraction_corridor` | badge(2) + earth | badge(1) + project |
| `settlement_density` | badge(3) + earth | project + cross (negation) |
| `overdeveloped_sector` | badge(5) + earth | badge(2) + project |

**Cluster shape:** Mixed count badges + icons, potentially with negation cross.
**Row layout:** 2 clusters, fits 1 row.

### Archetype F — "Metric Badge with Operator" (8 governors)

Single requirement using a count badge on a planet icon with an arrow, checkmark, or other symbol indicating the metric direction.

| Governor | Type | Visual |
|---|---|---|
| `tri_specialization_hub` | minDifferentOutputs(3) | badge(3) + earth + → |
| `sector_megacity` | fullSector | badge(5) + earth |
| `self_sufficient_sector` | minSatisfiedInputs(3) | badge(3) + earth + ✓ |
| `mono_output_array` | minConsumedOutputs(3) | badge(3) + earth + → |
| `diverse_economic_zone` | minDifferentOutputs(5) | badge(5) + earth + → |
| `planetary_melting_pot` | minDifferentTypes(4) | badge(4) + earth |
| `fragmented_biosphere` | minDifferentBioTypes(3) | badge(3) + jungle |
| `resource_bottleneck` | minSameInputGood(2) | badge(2) + earth + ← |
| `redundant_infrastructure` | minSameOutputGood(2) | badge(2) + earth + → |
| `input_convergence` | singleGoodCount(2) | badge(2) + earth |

**Cluster shape:** `[badge N] [icon] [optional operator]`
**Row layout:** Single cluster, centered. Fits 1 row.

### Archetype G — "Special: Cold/Ice + OR Resources" (1 governor)

`harsh_coexistence` combines a `coldIcePlanets` group (Cold / Ice with slash) and an `outputAnyOf` group (Water OR Algae with label).

| Governor | Cluster 1 | Cluster 2 |
|---|---|---|
| `harsh_coexistence` | coldIcePlanets (Cold / Ice) | outputAnyOf (Water OR Algae) |

**Cluster shape:** `[Cold] [/] [Ice]` and `[Water] [OR] [Algae]`
**Row layout:** 2 special clusters side-by-side.

### Archetype H — "Special: ALL Label" (1 governor)

`sector_specialization` uses `singleGoodAll` — an "ALL" label above a generic earth icon.

| Governor | Cluster |
|---|---|
| `sector_specialization` | singleGoodAll (ALL + earth) |

**Cluster shape:** `[ALL text]` above `[icon]`
**Row layout:** Single cluster, centered.

---

## 2. Estimated Number of Reusable Templates

**8 reusable templates** cover all 40 governors.

| Template ID | Name | Governors served |
|---|---|---|
| T1 | `planets-row-2` | 7 |
| T2 | `planets-row-3` | 9 |
| T3 | `planets-plus-extra` | 4 |
| T4 | `count-badge-planet` | 5 |
| T5 | `metric-badge` | 10 |
| T6 | `negation-badge` | 1 (used in combination with T5) |
| T7 | `or-group` | 1 |
| T8 | `all-label` | 1 |
| **Total** | | **38 (via templates) + 2 bespoke** |

---

## 3. Governors Requiring Bespoke Layouts

**Exactly 2 governors cannot be fully handled by a generic template** — but these are compositions of templates rather than truly custom layouts:

| Governor | Why bespoke |
|---|---|
| `harsh_coexistence` | Composes **two special sub-clusters**: a `coldIcePlanets` pair (Cold / Ice with slash label) and an `outputAnyOf` triple (Water + OR label + Algae). No other tile has this combination of sub-icon spacing, slash-separator, and OR label. Must be rendered as a 2-column layout with custom sub-icon centering. |
| `sector_specialization` | The `singleGoodAll` group renders an "ALL" label *above* the icon (anchor: 'above') with a vertical offset. This label-to-icon stacking is unique. All other templates use horizontal or overlay positioning. |

**Technically**, these could be template variants (T7 = "side-by-side sub-icons with separator", T8 = "label-above-icon"), which is how they are treated in the count above. Only truly bespoke would be zero if T7 and T8 are accepted as proper templates.

---

## 4. Recommended Icon Arrangements for Each Archetype

### T1: planets-row-2

```
[icon 62x62]  +  [icon 62x62]
```

- Centered horizontally via `CENTER_X - totalW/2`
- Gap between icons: 32px (REQ_CONNECTOR_GAP in layout.js)
- Single row, 1 row group

### T2: planets-row-3

```
[icon 62x62]  +  [icon 62x62]  +  [icon 62x62]
```

- Same spacing as T2
- The "+" connector (plus sign) is rendered between icons as text (current `REQ_PLUS_OFFSET`)

### T3: planets-plus-extra

```
[icon]  +  [icon]  +  [op+icon]
```

- Two planet icons + one operator cluster
- Operator clusters render an arrow + icon (right-arrow for output, left-arrow for input)
- Arrow positioned between the group center and the icon
- Fits in 1 row; if width pressure, wraps to 2 rows (2+1)

### T4: count-badge-planet

```
[badge N] [icon]
```

- Badge rectangle positioned above the icon center (COUNT_BADGE.yOffset = -38 in layout.js)
- Badge width: 38px, height: 26px, rx: 13px
- Icon at standard size 84x84 (REQ_ICON_SIZE)

### T5: metric-badge

```
[badge N] [icon] [optional arrow/checkmark]
```

- Badge above icon center
- Arrow/checkmark positioned at corners (north-east for output arrows, south-west for input arrows)
- Arrow sizes: ~20px wide path

### T6: negation-badge

```
[icon] [cross overlay]
```

- Project icon with a red cross drawn diagonally across it
- Cross: two 12px lines at 45° angles, stroke `#EF5350`, width 3px
- No badge needed

### T7: or-group

```
[left icon 60x60]  [OR label]  [right icon 60x60]
```

- Sub-icons at reduced size (60px vs standard 84px)
- "OR" label centered between them, font-size 13, color `#C4A35A`
- Slash separator for coldIcePlanets variant: `[Cold 60px] [/ 18px] [Ice 60px]`

### T8: all-label

```
     [ALL label]
    [earth icon]
```

- "ALL" text label (font-size 16, color `#C4A35A`) positioned above the planet icon
- Icon slightly shrunken (shrink: 12px) and offset down (offsetY: 16px)

---

## 5. Visual Sketches (ASCII)

### T1: planets-row-2 (e.g. Industrial Symbiosis)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★  ★                          │
 │                                               │
 │        [Ore]  +  [Robots]                     │
 │                                               │
 │           Industrial Symbiosis                │
 └──────────────────────────────────────────────┘
```

### T2: planets-row-3 (e.g. Terraforming Cluster)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★  ★  ★                       │
 │                                               │
 │   [Earth]  +  [Jungle]  +  [Ocean]            │
 │                                               │
 │            Terraforming Cluster               │
 └──────────────────────────────────────────────┘
```

### T3: planets-plus-extra (e.g. Manufacturing Spine)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★  ★  ★                       │
 │                                               │
 │   [Forge]  +  [Scrap]  +  →[Electronics]      │
 │                                               │
 │            Manufacturing Spine                 │
 └──────────────────────────────────────────────┘
```

### T4: count-badge-planet (e.g. Proto-Development Zone)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★  ★                          │
 │                                               │
 │              [2]                              │
 │             [Proto]                           │
 │                                               │
 │          Proto-Development Zone               │
 └──────────────────────────────────────────────┘
```

### T5: metric-badge (e.g. Tri-Specialization Hub)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★                             │
 │                                               │
 │              [3]                              │
 │           [Earth]  →                          │
 │                                               │
 │          Tri-Specialization Hub               │
 └──────────────────────────────────────────────┘
```

### T5b: metric-badge with checkmark (Self-Sufficient Sector)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★  ★                          │
 │                                               │
 │              [3]  ✓                           │
 │             [Earth]                           │
 │                                               │
 │         Self-Sufficient Sector                │
 └──────────────────────────────────────────────┘
```

### T6: negation-badge (Settlement Density — cluster 2 of 2)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★  ★                          │
 │                                               │
 │   [3]         [Project]                       │
 │  [Earth]        ✕                             │
 │                                               │
 │           Settlement Density                  │
 └──────────────────────────────────────────────┘
```

### T7: or-group (Harsh Coexistence)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★  ★                          │
 │                                               │
 │ [Cold]  /  [Ice]    [Water]  OR  [Algae]      │
 │                                               │
 │           Harsh Coexistence                   │
 └──────────────────────────────────────────────┘
```

### T8: all-label (Sector Specialization)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★  ★  ★                       │
 │                                               │
 │                   ALL                         │
 │                 [Earth]                       │
 │                                               │
 │           Sector Specialization               │
 └──────────────────────────────────────────────┘
```

### Multi-row example (Extraction Corridor / Salvage Loop / Overdeveloped)

```
 ┌──────────────────────────────────────────────┐
 │                                               │
 │              ★  ★                             │
 │                                               │
 │   [2]         [1]                             │
 │  [Earth]     [Project]                        │
 │                                               │
 │          Extraction Corridor                  │
 └──────────────────────────────────────────────┘
```

---

## 6. Recommended Tile Dimensions

The current renderer uses **500×320 px** (tile-renderer.js). The `layout.js` module uses **600×780 px**. These represent two different output contexts.

**Recommendation for the next renderer:**

| Context | Width | Height | Aspect ratio | Use case |
|---|---|---|---|---|
| Web/canvas tile | 540 | 380 | ~1.42:1 | Card-like display with padding |
| Print/PDF tile | 600 | 780 | ~1:1.3 | Full card size for print |
| SVG export default | 540 | 380 | ~1.42:1 | Current generated output |

**Rationale for 540×380:**
- The current generated SVGs already use this dimension
- 80% composition rectangle: 432×304 → gives generous margins
- Leaves room for name text below visual block
- The existing `tile-renderer.js` uses 500×320 but the generated SVGs show 540×380

**Final recommendation:** Standardise on **540×380** as the canonical tile size. The `layout.js` module's 600×780 should be considered the "print ready" scale.

---

## 7. Recommended Icon Sizes

| Element | Current size (layout.js) | Current size (tile-renderer.js) | Recommended | Notes |
|---|---|---|---|---|
| **Primary planet icon** | 84px (REQ_ICON_SIZE) | 62px (IC) | **64px** | Balanced between two contexts |
| **Secondary/sub-icon** | 60px (coldIce/outputAnyOf) | 60px | **56px** | Slightly smaller for sub-pairs |
| **Badge width** | 38px | ~24px (auto text) | **32px** | Scaled to 64px icons |
| **Badge height** | 26px | ~16px | **22px** | Proportionally smaller |
| **Operator arrow** | ~24px path width | ~14px path width | **16px** | Fits between badges |
| **Cross overlay** | 12×12px | 10×10px | **12×12px** | Diagonally across icon |
| **Checkmark** | ~18×10px | ~10×6px | **14×8px** | Corner-anchored |
| **OR / slash label** | 13–18px font | — | **13px (OR), 16px (/)** | Sub-icon spacing governs |

---

## 8. Recommended Spacing Rules

| Space | Current (layout.js) | Current (tile-renderer.js) | Recommended | Notes |
|---|---|---|---|---|
| **Tile margin (outer pad)** | 24px | 14px | **16px** | Reduces wasted edge space |
| **Tile corner radius** | 20px | 14px | **14px** | Matching current output |
| **Gap between icon clusters** | 32px (CONNECTOR_GAP) | 14px (LG) | **24px** | Compromise; enough for " + " separator |
| **Gap between items in a cluster** | — | 4px (CG) | **6px** | Tight but readable |
| **Gap between rows** | — | 14px (RG) | **16px** | Clear row separation |
| **Badge horizontal padding** | — | — | **4px left/right** | Internal to badge rect |
| **VP stars gap** | 10px | 3px | **6px** | Grouped in top-right |
| **Name bottom margin** | 700px from top | 6px from block bottom | **12px from block bottom** | More breathing room |
| **Operator-to-icon adjacency** | — | 14px (OG) | **10px** | Arrow directly adjacent to icon |

### Row packing algorithm (from tile-renderer.js):

The current packing algorithm in `compose()` should be retained:
1. Measure each cluster's width
2. Measure VP badge width (model.vp × 14 + (model.vp − 1) × 3 + 6)
3. Calculate available width: `C.w - VP_W - 6`
4. Pack clusters left-to-right; if a cluster doesn't fit, start a new row
5. Vertically center the block within the composition (minimum 75% fill)
6. Place VP stars top-right of the block
7. Place name below the block

---

## 9. How VP Should Be Represented

### Current approach (two conflicting implementations):

**layout.js / vp.js:**
- 5-point stars at 20×20px with 10px gap
- Centered below title area (VP_Y = 52, below the 600×780 card top)
- Gold fill `#C4A35A`, gold stroke `#8B7335`
- Star definition uses outer radius 44px, inner radius 18px (50px viewBox)

**tile-renderer.js:**
- Same star geometry but rendered at 12×12px with 3px gap
- Positioned top-right of the composition area (not centered)
- Used inline (no defs in the function, but `star()` creates the def)

### Recommendation:

| Aspect | Decision |
|---|---|
| **Position** | Top-right of the composition area (matching tile-renderer.js) |
| **Size** | 14×14px star with 4px gap between stars |
| **Color** | Gold `#C4A35A` with darker stroke `#8B7335`, no fill gradient |
| **Star shape** | 5-point star — keep current geometry (inner spoke ratio 0.4) |
| **Alignment** | Top edge of stars aligned with top of first icon row |
| **Spacing from edge** | 4px from right edge of composition, 4px from top of row |
| **Max VP** | 4 (diverse_economic_zone has 4 VP) → star cluster width ~68px |

### Rationale:
- Top-right avoids interfering with centered icon layout
- Smaller stars (14px) vs layout.js (20px) because the tile is 540×380, not 600×780
- The gold "trophy" aesthetic matches the design system's VP representation on contract cards

---

## 10. How Names Should Be Represented

### Current approach:

**layout.js / title.js:**
- Font: "Exo 2", size 14px, weight 400, color `#5A6A7D`
- Position: y = 700px from top of 600×780 tile
- Centered horizontally (`text-anchor: middle`)

**tile-renderer.js:**
- Same font ("Exo 2"), size 11px or 12px, weight 400, color `#5A6A7D`
- Position: `blockY + blockH - 6 - extraPad/2` (dynamically computed)
- Centered at CX (270px)

### Recommendation:

| Aspect | Decision |
|---|---|
| **Font family** | "Exo 2" (consistent with game title font) |
| **Font size** | **12px** (540×380 tile) |
| **Font weight** | 400 (regular) |
| **Color** | `#5A6A7D` (current mid-grey) |
| **Position** | Below the icon block, centered, with 12px gap from block bottom |
| **Truncation** | Max width: 80% of composition (345px). Ellipsis overflow if needed. |
| **Longest name** | "Industrial–Biological Interface" (28 chars) at 12px Exo 2 ≈ fits in ~220px. No truncation needed. |
| **XML escaping** | Required (the en-dash in "Industrial–Biological" must be `&ndash;` or use Unicode directly) |

### Rationale:
- Consistent with contract/renderer style
- The dynamic vertical centering in tile-renderer.js is correct — the name should always be at the bottom of the block
- No need for subtitle or description text on the tile (the tile is a visual shorthand, not a rules reference)

---

## 11. Data-Driven vs Template-Driven vs Bespoke

### Layer 1: Purely data-driven (from layout-model JSON)

These aspects should be determined entirely by the compiled `governors.json` model, with no template selection logic:

| Aspect | Source field |
|---|---|
| VP count | `governor.vp` → number of stars |
| Governor name | `governor.name` → centered label |
| Number of requirement groups | `governor.requirements.length` → `groups.length` |
| Individual requirement type | `req.type` → which visual pattern to use |
| Planet/resource icon selection | `req.value` → resolved via `resolveIcon()` |
| Count badge value | `req.count` or `req.value` (metric-based) |
| Pool array | For `minDifferentBioTypes`, `outputAnyOf` |
| Requirement ordering | Array position → left-to-right rendering |

### Layer 2: Template-driven (auto-selected)

Based on the *array of groups* after layout-model compilation, a template selector chooses the arrangement:

| Pattern | Decides |
|---|---|
| Single group → **centered single cluster** | T4, T5, T8 |
| 2 groups of pure planets → **evenly spaced row** | T1 |
| 3 groups of pure planets → **evenly spaced row** | T2 |
| 2 planets + 1 operator group → **row with arrow group** | T3 |
| Group with sub-icons (coldIce/outputAnyOf) → **sub-icon pair layout** | T7 sub-routing |
| Group with noProjects → **negation cross overlay** | T6 sub-routing |
| Group multi-row overflow → **auto-wrap to 2 rows** | Packing algorithm |

**Template selection algorithm (pseudocode):**

```
function selectTemplate(groups):
    // Check for special single groups
    if length == 1:
        if group has sub-icons (size != default):  -> T7 (or T5 sub-variant)
        if group has label with anchor 'above':     -> T8
        else:                                       -> T5 (metric-badge)

    // Check for special compositions
    if length == 2:
        if any group has sub-icons:                 -> T7 layout, 2 columns
        if groups match [badge+icon, negation]:     -> T6 layout
        else:                                       -> T4/T5 layout, 2 clusters

    // Default multi-cluster
    if all elements are plain icons:
        if length == 2:                             -> T1
        if length == 3:                             -> T2
    else:
        if any cluster has operator arrows:          -> T3
        else:                                       -> auto-pack clusters
```

### Layer 3: Bespoke (per-governor)

| Governor | Bespoke aspect |
|---|---|
| `harsh_coexistence` | Sub-icon spacing is "tight" for coldIce pair, "loose" for OR pair. The tile has exactly 2 special groups side by side — no other tile has this exact combination. |
| `sector_specialization` | "ALL" label positioning above icon with Y offset and icon shrink. Unique vertical stacking within a single cluster. |

Even these "bespoke" governors are handled by generic sub-templates (T7 = sub-icon pair, T8 = label-above-icon) — the bespoke aspect is the *combination* of sub-template types within a single tile, not the individual rendering.

---

## 12. Template Count Justification

### Template T1: planets-row-2 (7 governors)

**Governors:** industrial_symbiosis, life_support_loop, synthetic_exchange, civil_military_complex, vertical_integration, industrial_wastes, environmental_contrast

**Structure:** 2 × `planetType` with no count, no operator. Each produces exactly one icon.

**Why no sub-template needed:** Both planet and resource icons are the same size (standard 64px). Placement is identical. The only difference is which SVG is referenced (planet SVG def vs PNG data URI for resources). This is a data-driven decision, not a template decision.

### Template T2: planets-row-3 (9 governors)

**Governors:** bio_processing_ring, emergent_biosphere, terraforming_cluster, frozen_industrial_zone, harsh_frontier, ecological_pressure_zone, mixed_climate_corridor, industrial_biological_interface, climate_crossroads

**Structure:** 3 × `planetType`. Identical to T1 but with 3 slots.

**Why separate from T1:** Three icons require different centering calculation and a "+" connector between each. The `computeReqLayout(count)` function already handles this dynamically, but the visual distinction (3 icons vs 2) warrants a separate template for clarity in the spec.

### Template T3: planets-plus-extra (4 governors)

**Governors:** manufacturing_spine, wetand_exploitation, polar_research_sector, cold_chain_logistics

**Structure:** 2 planetType + 1 `requiredOutput`/`requiredInput`/`minProjectCount`. The third cluster has an operator arrow or badge.

**Why separate from T1/T2:** The third cluster has a different visual structure (icon + operator arrow for requiredOutput, or icon + badge + special icon for requiredInput). The operator arrow transforms the cluster from a plain icon to a directional indicator.

### Template T4: count-badge-planet (5 governors, 4 unique layouts)

**Governors:** proto_development_zone, oceanic_network, deep_freeze_network (single-cluster), salvage_loop, industrial_overlap (two-cluster)

**Structure:** planetType with `count > 1` produces a badge + icon cluster. When two clusters exist, one may have a badge and the other may not.

**Why not fold into T5:** Count badges on `planetType` requirements represent physical planet duplicates (e.g. "2 Scrap planets") whereas metric badges represent abstract thresholds (e.g. "at least 3 different outputs"). They look the same (badge + icon) but the *meaning* is different, justifying a separate template name. From a rendering perspective, T4 and T5 use the same badge rendering code.

### Template T5: metric-badge (10 governors)

**Governors:** tri_specialization_hub, sector_megacity, self_sufficient_sector, mono_output_array, diverse_economic_zone, planetary_melting_pot, fragmented_biosphere, resource_bottleneck, redundant_infrastructure, input_convergence

**Structure:** Single requirement with a count threshold. Produces a badge + icon cluster, optionally with an arrow or checkmark in a corner.

**Sub-variants:**
| Sub-type | Governors | Extra element |
|---|---|---|
| badge + icon only | sector_megacity, planetary_melting_pot, fragmented_biosphere, input_convergence | — |
| badge + icon + right-arrow (east) | tri_specialization_hub, mono_output_array, diverse_economic_zone | Right arrow at east |
| badge + icon + check (north-east) | self_sufficient_sector | Green check NE |
| badge + icon + left-arrow (south-west) | resource_bottleneck | Left arrow SW |
| badge + icon + right-arrow (south-east) | redundant_infrastructure | Right arrow SE |

**Why these are one template:** All use the same structure (badge above icon, corner anchor for symbol). The only variance is which optional operator/mark is drawn and at which anchor point. This is data-driven from the layout model's `kind: 'operator'` / `kind: 'mark'` element.

### Template T6: negation-badge (1 governor, used in combination)

**Governors:** settlement_density (cluster 2 of 2)

**Structure:** Project icon with a red cross overlay.

**Why a separate template:** The cross overlay requires a different rendering path (drawing two angled lines) and the icon is shrunken before the cross is applied. No other element uses a cross mark. This is a visual "cancel" or "forbidden" symbol that needs its own layout logic.

### Template T7: or-group (1 governor)

**Governors:** harsh_coexistence

**Structure:** Two sub-icon clusters with a slash separator (coldIce) or OR label (outputAnyOf).

**Why a separate template:** Sub-icons render at reduced size (60px) with different spacing ("tight" = 4px, "loose" = 10px). The slash and OR label are text elements, not icons. This sub-icon positioning is unique to these two requirement types.

### Template T8: all-label (1 governor)

**Governors:** sector_specialization

**Structure:** "ALL" label above a shrunken, vertically offset planet icon.

**Why a separate template:** The label-anchor='above' positioning with vertical offset and icon shrink is unique. No other requirement produces a label above an icon in this manner.

### Total template justification

| Template | Governors | % of total | Justification |
|---|---|---|---|
| T1: planets-row-2 | 7 | 17.5% | Most common: "has planets X and Y" |
| T2: planets-row-3 | 9 | 22.5% | Most common: "has planets X, Y and Z" |
| T3: planets-plus-extra | 4 | 10% | "has planets X, Y and produces/consumes Z" |
| T4: count-badge-planet | 5 | 12.5% | "has N planets of type X" |
| T5: metric-badge | 10 | 25% | "has at least N different X" |
| T6: negation-badge | 1* | 2.5% | "no projects" |
| T7: or-group | 1 | 2.5% | "Cold or Ice" + "Water or Algae" |
| T8: all-label | 1 | 2.5% | "all planets share one good" |

*T6 is used in combination with a T5 cluster for settlement_density (2 clusters: [badge+earth] + [project+cross]).

**The minimum practical count is 8 templates.** This could be reduced to 6 by:
- Merging T4 into T5 (they share rendering code anyway)
- Merging T6 (negation) into a more general "overlay" system
- But keeping them separate in spec makes the system more comprehensible for implementers

The alternative — a single universal template — would require every tile to be composed of individually positioned elements, losing the pattern clarity that makes the visual language readable.

---

## Appendix: Complete Governor → Template Mapping

| ID | Governor | Requirements count | Template | Notes |
|---|---|---|---|---|
| 000 | Industrial Symbiosis | 2 | T1 | Ore + Robots |
| 001 | Life Support Loop | 2 | T1 | Water + Humans |
| 002 | Synthetic Exchange | 2 | T1 | Electronics + Robots |
| 003 | Bio-Processing Ring | 3 | T2 | Algae + Water + Grain |
| 004 | Extraction Corridor | 2 | T5+T5 | badge+earth, badge+project |
| 005 | Civil-Military Complex | 2 | T1 | Humans + Robots |
| 006 | Tri-Specialization Hub | 1 | T5 | badge+earth+arrow |
| 007 | Vertical Integration | 2 | T1 | Crates + Electronics |
| 008 | Sector Megacity | 1 | T5 | badge(5)+earth |
| 009 | Self-Sufficient Sector | 1 | T5 | badge+earth+check |
| 010 | Mono-Output Array | 1 | T5 | badge+earth+arrow |
| 011 | Diverse Economic Zone | 1 | T5 | badge(5)+earth+arrow |
| 012 | Industrial Wastes | 2 | T1 | Forge + Scrap |
| 013 | Salvage Loop | 2 | T4+T5 | badge(2)+scrap, badge+project |
| 014 | Manufacturing Spine | 3 | T3 | Forge + Scrap + arrow(Electronics) |
| 015 | Proto-Development Zone | 1 | T4 | badge(2)+Proto |
| 016 | Emergent Biosphere | 3 | T2 | Proto + Jungle + Swamp |
| 017 | Terraforming Cluster | 3 | T2 | Earth + Jungle + Ocean |
| 018 | Oceanic Network | 1 | T4 | badge(2)+Ocean |
| 019 | Cold Chain Logistics | 3 | T3 | Cold + Ice + badge+project |
| 020 | Environmental Contrast | 2 | T1 | Cold + Jungle |
| 021 | Planetary Melting Pot | 1 | T5 | badge(4)+earth |
| 022 | Wetland Exploitation | 3 | T3 | Swamp + Jungle + arrow(Water) |
| 023 | Polar Research Sector | 3 | T3 | Ice + Proto + arrow(Robot) |
| 024 | Frozen Industrial Zone | 3 | T2 | Forge + Cold + Ice |
| 025 | Harsh Frontier | 3 | T2 | Cold + Scrap + Proto |
| 026 | Deep Freeze Network | 1 | T4 | badge(2)+Ice |
| 027 | Ecological Pressure Zone | 3 | T2 | Swamp + Jungle + Cold |
| 028 | Overdeveloped Sector | 2 | T5+T5 | badge(5)+earth, badge(2)+project |
| 029 | Fragmented Biosphere | 1 | T5 | badge(3)+jungle |
| 030 | Industrial Overlap | 2 | T4+T1 | badge(2)+Forge, Scrap |
| 031 | Mixed Climate Corridor | 3 | T2 | Ice + Ocean + Earth |
| 032 | Resource Bottleneck | 1 | T5 | badge+earth+left-arrow |
| 033 | Redundant Infrastructure | 1 | T5 | badge+earth+right-arrow |
| 034 | Settlement Density | 2 | T5+T6 | badge+earth, project+cross |
| 035 | Industrial–Biological Interface | 3 | T2 | Forge + Swamp + Jungle |
| 036 | Harsh Coexistence | 2 | T7+T7 | coldIce pair + OR pair |
| 037 | Sector Specialization | 1 | T8 | ALL + earth |
| 038 | Input Convergence | 1 | T5 | badge(2)+earth |
| 039 | Climate Crossroads | 3 | T2 | Cold + Ocean + Swamp |
