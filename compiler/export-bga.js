const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  sourceDir: path.join(ROOT, 'generated', 'cards'),
  modelFile: path.join(ROOT, 'generated', 'models', 'planets.json'),
  exportDir: path.join(ROOT, 'exports', 'bga'),
  imgDir: path.join(ROOT, 'exports', 'bga', 'img'),
  dataDir: path.join(ROOT, 'exports', 'bga', 'data'),
  manifestFile: path.join(ROOT, 'exports', 'bga', 'manifest.json'),
};

const ARTWORK_SIZE = 576;
const ICON_SIZE = 96;
const CARD_W = 744;
const CARD_H = 1039;
const EXPECTED_CARDS = 81;
const RESOURCE_ICON_COUNT = 8;

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      rimraf(full);
    } else {
      fs.unlinkSync(full);
    }
  }
  fs.rmdirSync(dir);
}

function computeStats(cardFiles) {
  const sizes = cardFiles.map(f => fs.statSync(f).size);
  const total = sizes.reduce((a, b) => a + b, 0);
  const sorted = [...sizes].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  const avg = Math.round(total / sorted.length);

  return {
    totalCards: cardFiles.length,
    totalBytes: total,
    averageBytes: avg,
    medianBytes: median,
    largestBytes: sorted[sorted.length - 1],
    smallestBytes: sorted[0],
  };
}

function buildManifest(cardFiles, modelData) {
  const stats = computeStats(cardFiles);

  const typeCounts = {};
  for (const p of modelData.planets) {
    const name = p.planetType.displayName;
    typeCounts[name] = (typeCounts[name] || 0) + 1;
  }

  return {
    $schema: 'v1',
    project: 'mercurio-design',
    exportType: 'bga',
    generatedAt: new Date().toISOString(),
    assetVersion: 1,
    resolutions: {
      artwork: ARTWORK_SIZE,
      icon: ICON_SIZE,
      card: { width: CARD_W, height: CARD_H },
    },
    cardCount: stats.totalCards,
    size: {
      totalBytes: stats.totalBytes,
      averageBytes: stats.averageBytes,
      medianBytes: stats.medianBytes,
      largestBytes: stats.largestBytes,
      smallestBytes: stats.smallestBytes,
    },
    composition: {
      planetTypes: Object.keys(typeCounts).length,
      resourceIcons: RESOURCE_ICON_COUNT,
      copiesPerPlanet: 3,
      planetTypeDistribution: typeCounts,
    },
    files: {
      cards: 'img/',
      data: 'data/planets.json',
    },
  };
}

function validateExport(cardFiles, modelData, planetIds) {
  const errors = [];

  if (cardFiles.length !== EXPECTED_CARDS) {
    errors.push(`Expected ${EXPECTED_CARDS} SVGs, found ${cardFiles.length}`);
  }

  if (!modelData.schema) {
    errors.push('Model missing schema version');
  }
  if (!modelData.layoutTemplates || !modelData.layoutTemplates.length) {
    errors.push('Model missing layoutTemplates');
  }
  if (!modelData.panel || !modelData.icon) {
    errors.push('Model missing layout geometry (panel/icon)');
  }

  const exportedIds = cardFiles.map(f => path.basename(f, '.svg')).sort();
  const modelIds = planetIds.sort();

  if (JSON.stringify(exportedIds) !== JSON.stringify(modelIds)) {
    const missing = modelIds.filter(id => !exportedIds.includes(id));
    const extra = exportedIds.filter(id => !modelIds.includes(id));
    if (missing.length) errors.push(`Missing SVGs: ${missing.join(', ')}`);
    if (extra.length) errors.push(`Extra SVGs: ${extra.join(', ')}`);
  }

  for (const f of cardFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    if (!content.includes('data:image/png;base64,')) {
      errors.push(`${path.basename(f)}: missing embedded artwork`);
    }
    if (!content.startsWith('<svg ')) {
      errors.push(`${path.basename(f)}: invalid SVG structure`);
    }
  }

  const layoutTemplateIds = modelData.layoutTemplates
    ? new Set(modelData.layoutTemplates.map(t => t.id))
    : new Set();
  for (const p of modelData.planets) {
    if (p.layoutTemplate && !layoutTemplateIds.has(p.layoutTemplate)) {
      errors.push(`Planet ${p.id}: references unknown layoutTemplate "${p.layoutTemplate}"`);
    }
  }

  return errors;
}

function build() {
  const startTime = Date.now();

  if (!fs.existsSync(PATHS.sourceDir)) {
    console.error(`ERROR: source directory not found — ${PATHS.sourceDir}`);
    console.error('Run `npm run build:cards` first.');
    process.exit(1);
  }

  const sourceFiles = fs.readdirSync(PATHS.sourceDir)
    .filter(f => f.endsWith('.svg') && f !== 'contact-sheet.svg');

  if (sourceFiles.length === 0) {
    console.error(`ERROR: no SVG files found in ${PATHS.sourceDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(PATHS.modelFile)) {
    console.error(`ERROR: model file not found — ${PATHS.modelFile}`);
    process.exit(1);
  }

  const modelRaw = JSON.parse(fs.readFileSync(PATHS.modelFile, 'utf-8'));
  const modelPlanets = modelRaw.planets;
  const modelPlanetIds = modelPlanets.map(p => p.id);

  if (fs.existsSync(PATHS.exportDir)) {
    rimraf(PATHS.exportDir);
  }

  fs.mkdirSync(PATHS.imgDir, { recursive: true });
  fs.mkdirSync(PATHS.dataDir, { recursive: true });

  const cardPaths = [];
  for (const file of sourceFiles) {
    const src = path.join(PATHS.sourceDir, file);
    const dst = path.join(PATHS.imgDir, file);
    fs.copyFileSync(src, dst);
    cardPaths.push(dst);
  }

  const modelDst = path.join(PATHS.dataDir, 'planets.json');
  fs.copyFileSync(PATHS.modelFile, modelDst);

  const manifest = buildManifest(cardPaths, modelRaw);
  fs.writeFileSync(PATHS.manifestFile, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  const validationErrors = validateExport(cardPaths, modelRaw, modelPlanetIds);

  const duration = Date.now() - startTime;

  const exportedCount = cardPaths.length;

  console.log('\n────────────────────────────────────────');
  console.log('  BGA EXPORT REPORT');
  console.log('────────────────────────────────────────');
  console.log(`  SVGs exported:     ${exportedCount}`);
  console.log(`  manifest.json:     written`);
  console.log(`  Export duration:   ${duration}ms`);
  console.log(`  Output directory:  ${PATHS.exportDir}`);
  console.log(`  Total deck size:   ${(manifest.size.totalBytes / 1048576).toFixed(2)} MB`);
  console.log(`  Avg card size:     ${(manifest.size.averageBytes / 1024).toFixed(1)} KB`);
  console.log(`  Median card size:  ${(manifest.size.medianBytes / 1024).toFixed(1)} KB`);

  if (modelRaw.layoutTemplates) {
    console.log(`  Layout templates:  ${modelRaw.layoutTemplates.length}`);
    console.log(`  Model schema:      ${modelRaw.schema || 'unknown'}`);
  }

  if (validationErrors.length) {
    console.log(`\n  Validation:        FAILED — ${validationErrors.length} issue(s)`);
    for (const e of validationErrors) {
      console.log(`    ✗ ${e}`);
    }
    process.exit(1);
  } else {
    console.log(`  Validation:        PASSED`);
  }
  console.log('────────────────────────────────────────');
}

build();
