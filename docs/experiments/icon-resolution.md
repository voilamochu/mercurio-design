# Resource Icon Resolution Experiment

## Objective

Determine the lowest acceptable resource icon resolution while preserving
visual quality. Planet artwork is fixed at 576 px for all cards.

## Representative Cards

| Card ID | Planet Type | Reason | Icons |
|---------|-------------|--------|-------|
| card_019_1 | Earth | bright artwork (Earth) | 8 |
| card_001_1 | Swamp | dark artwork (Swamp) | 6 |
| card_005_1 | Scrap | busy artwork (Scrap) | 5 |
| card_011_1 | Ocean | smooth artwork (Ocean) | 5 |
| card_014_1 | Jungle | high icon count (Jungle, 8 icons) | 8 |

## Resolution Profiles

| Profile | Icon Resolution | Artwork Resolution |
|---------|----------------|-------------------|
| baseline | 352×384 | 576×811 |
| I1 | 256 | 576×811 |
| I2 | 192 | 576×811 |
| I3 | 128 | 576×811 |
| I4 | 96 | 576×811 |

## Per-Card Results

### baseline (352×384)

| Filename | Card ID | Icon Res | SVG Size | Artwork(b64) | Icons(b64) | Markup |
|----------|---------|----------|----------|--------------|------------|--------|
| card_019_1__baseline.svg | card_019_1 | 352×384 | 1.11 MB | 696.2 KB | 442.8 KB | 2.5 KB |
| card_001_1__baseline.svg | card_001_1 | 352×384 | 1.15 MB | 793.3 KB | 383.7 KB | 2.7 KB |
| card_005_1__baseline.svg | card_005_1 | 352×384 | 1.03 MB | 736.5 KB | 321.1 KB | 2.2 KB |
| card_011_1__baseline.svg | card_011_1 | 352×384 | 1.00 MB | 769.9 KB | 252.5 KB | 1.8 KB |
| card_014_1__baseline.svg | card_014_1 | 352×384 | 1.19 MB | 777.0 KB | 442.8 KB | 2.5 KB |

### I1 (256)

| Filename | Card ID | Icon Res | SVG Size | Artwork(b64) | Icons(b64) | Markup |
|----------|---------|----------|----------|--------------|------------|--------|
| card_019_1__I1.svg | card_019_1 | 256 | 979.8 KB | 696.2 KB | 281.1 KB | 2.5 KB |
| card_001_1__I1.svg | card_001_1 | 256 | 1.01 MB | 793.3 KB | 238.2 KB | 2.7 KB |
| card_005_1__I1.svg | card_005_1 | 256 | 938.2 KB | 736.5 KB | 199.5 KB | 2.2 KB |
| card_011_1__I1.svg | card_011_1 | 256 | 930.3 KB | 769.9 KB | 158.7 KB | 1.8 KB |
| card_014_1__I1.svg | card_014_1 | 256 | 1.04 MB | 777.0 KB | 281.1 KB | 2.5 KB |

### I2 (192)

| Filename | Card ID | Icon Res | SVG Size | Artwork(b64) | Icons(b64) | Markup |
|----------|---------|----------|----------|--------------|------------|--------|
| card_019_1__I2.svg | card_019_1 | 192 | 879.3 KB | 696.2 KB | 180.6 KB | 2.5 KB |
| card_001_1__I2.svg | card_001_1 | 192 | 944.4 KB | 793.3 KB | 148.5 KB | 2.7 KB |
| card_005_1__I2.svg | card_005_1 | 192 | 863.2 KB | 736.5 KB | 124.5 KB | 2.2 KB |
| card_011_1__I2.svg | card_011_1 | 192 | 873.3 KB | 769.9 KB | 101.7 KB | 1.8 KB |
| card_014_1__I2.svg | card_014_1 | 192 | 960.1 KB | 777.0 KB | 180.6 KB | 2.5 KB |

### I3 (128)

| Filename | Card ID | Icon Res | SVG Size | Artwork(b64) | Icons(b64) | Markup |
|----------|---------|----------|----------|--------------|------------|--------|
| card_019_1__I3.svg | card_019_1 | 128 | 797.6 KB | 696.2 KB | 98.9 KB | 2.5 KB |
| card_001_1__I3.svg | card_001_1 | 128 | 873.2 KB | 793.3 KB | 77.3 KB | 2.7 KB |
| card_005_1__I3.svg | card_005_1 | 128 | 806.0 KB | 736.5 KB | 67.3 KB | 2.2 KB |
| card_011_1__I3.svg | card_011_1 | 128 | 827.7 KB | 769.9 KB | 56.0 KB | 1.8 KB |
| card_014_1__I3.svg | card_014_1 | 128 | 878.4 KB | 777.0 KB | 98.9 KB | 2.5 KB |

### I4 (96)

| Filename | Card ID | Icon Res | SVG Size | Artwork(b64) | Icons(b64) | Markup |
|----------|---------|----------|----------|--------------|------------|--------|
| card_019_1__I4.svg | card_019_1 | 96 | 763.1 KB | 696.2 KB | 64.4 KB | 2.5 KB |
| card_001_1__I4.svg | card_001_1 | 96 | 846.1 KB | 793.3 KB | 50.1 KB | 2.7 KB |
| card_005_1__I4.svg | card_005_1 | 96 | 783.8 KB | 736.5 KB | 45.1 KB | 2.2 KB |
| card_011_1__I4.svg | card_011_1 | 96 | 808.1 KB | 769.9 KB | 36.4 KB | 1.8 KB |
| card_014_1__I4.svg | card_014_1 | 96 | 843.9 KB | 777.0 KB | 64.4 KB | 2.5 KB |

## Profile Summary

| Profile | Icon Res | Average | Largest | Smallest | vs Baseline |
|---------|----------|---------|---------|----------|-------------|
| baseline | 352×384 | 1.10 MB | 1.19 MB | 1.00 MB | +0.0% |
| I1 | 256 | 988.6 KB | 1.04 MB | 930.3 KB | -12.2% |
| I2 | 192 | 904.1 KB | 960.1 KB | 863.2 KB | -19.7% |
| I3 | 128 | 836.6 KB | 878.4 KB | 797.6 KB | -25.7% |
| I4 | 96 | 809.0 KB | 846.1 KB | 763.1 KB | -28.1% |

## Component Size Breakdown

| Profile | Artwork(b64) | Icons(b64) | Markup | Total |
|---------|--------------|------------|--------|-------|
| baseline | 754.6 KB | 368.6 KB | 2.3 KB | 1.10 MB |
| I1 | 754.6 KB | 231.7 KB | 2.3 KB | 988.6 KB |
| I2 | 754.6 KB | 147.2 KB | 2.3 KB | 904.1 KB |
| I3 | 754.6 KB | 79.7 KB | 2.3 KB | 836.6 KB |
| I4 | 754.6 KB | 52.1 KB | 2.3 KB | 809.0 KB |

## Validation

### Visual Composition
- Icon positions match production layout
- Resource panel rendered identically to production
- Planet artwork fixed at 576 px across all variants

### Determinism
- All artwork resized with lanczos3 kernel, PNG compression level 9
- All icons trimmed and resized with lanczos3 kernel, palette PNG
- Output is deterministic

### Generated Files
- Total SVGs: 25
- Output directory: `generated/experiments/icon-resolution/`

## Recommendation

| Profile | Icon Resolution | Avg SVG | vs Baseline | Visual Impact |
|---------|----------------|---------|-------------|---------------|
| baseline | 352×384 | 1.10 MB | +0.0% | TBD (requires visual review) |
| I1 | 256 | 988.6 KB | -12.2% | TBD (requires visual review) |
| I2 | 192 | 904.1 KB | -19.7% | TBD (requires visual review) |
| I3 | 128 | 836.6 KB | -25.7% | TBD (requires visual review) |
| I4 | 96 | 809.0 KB | -28.1% | TBD (requires visual review) |

---

*This experiment was generated by `compiler/experiment-icon-resolution.js`.
Do NOT modify production pipeline based solely on this experiment.
Review generated SVGs visually before making any production decisions.*