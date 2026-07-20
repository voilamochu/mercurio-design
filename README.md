# MERCURIO-DESIGN BUILD / EXPORT CHEAT SHEET

## One-Time Bootstrap

Split artwork collages into canonical technology artwork:

```bash
npm run bootstrap:tech-artwork
```

Force re-split (overwrites manually edited artwork):

```bash
npm run bootstrap:tech-artwork -- --force
```

## Build

```bash
npm run build:model          # Rebuild planet data model
npm run build:cards          # Rebuild planet cards
npm run build:tech-model     # Rebuild technology model
npm run build:tech-cards     # Rebuild technology cards
npm run build                # Rebuild everything
```

## Optimize

```bash
npm run optimize:planet      # Optimize planet SVGs
npm run optimize:tech        # Optimize technology SVGs
```

## Export

```bash
npm run export:planet-bga    # Export planet assets
npm run export:tech-bga      # Export technology assets
npm run deploy               # Export everything
```

## Full Release Pipeline (recommended)

```bash
npm run release
```

Runs: `build` → `optimize:planet` → `optimize:tech` → `deploy`

## Sync Into BGA Project

```bash
cd ../bga-mercurio
make sync-assets
```

## Common Workflows

**Technology artwork changed:**
```bash
npm run build:tech-cards
npm run optimize:tech
npm run export:tech-bga
cd ../bga-mercurio
make sync-assets
```

**Planet artwork changed:**
```bash
npm run build:cards
npm run optimize:planet
npm run export:planet-bga
cd ../bga-mercurio
make sync-assets
```

**Everything changed:**
```bash
npm run release
cd ../bga-mercurio
make sync-assets
```
