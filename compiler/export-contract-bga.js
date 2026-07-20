const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  sourceDir: path.join(ROOT, 'generated', 'contracts'),
  modelFile: path.join(ROOT, 'generated', 'models', 'contracts.json'),
  exportDir: path.join(ROOT, 'exports', 'bga'),
  imgDir: path.join(ROOT, 'exports', 'bga', 'img'),
  dataDir: path.join(ROOT, 'exports', 'bga', 'data'),
  manifestFile: path.join(ROOT, 'exports', 'bga', 'manifest.json'),
};

const EXPECTED_CONTRACT_CARDS = 25;

function build() {
  const startTime = Date.now();

  if (!fs.existsSync(PATHS.sourceDir)) {
    console.error(`ERROR: source directory not found — ${PATHS.sourceDir}`);
    console.error('Run `npm run build:contract-cards` first.');
    process.exit(1);
  }

  const sourceFiles = fs.readdirSync(PATHS.sourceDir)
    .filter(f => f.endsWith('.svg'))
    .sort();

  if (sourceFiles.length === 0) {
    console.error(`ERROR: no SVG files found in ${PATHS.sourceDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(PATHS.modelFile)) {
    console.error(`ERROR: model file not found — ${PATHS.modelFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(PATHS.imgDir)) {
    console.error(`ERROR: export img/ directory not found — ${PATHS.imgDir}`);
    console.error('Run `npm run export:planet-bga` first.');
    process.exit(1);
  }

  const modelRaw = JSON.parse(fs.readFileSync(PATHS.modelFile, 'utf-8'));
  const modelContracts = modelRaw.contracts;

  const existingFiles = new Set(fs.readdirSync(PATHS.imgDir));
  const collisions = sourceFiles.filter(f => existingFiles.has(f));

  if (collisions.length > 0) {
    console.error(`ERROR: ${collisions.length} filename collision(s) detected:`);
    for (const c of collisions) {
      console.error(`  \u2717 ${c} already exists in ${PATHS.imgDir}`);
    }
    process.exit(1);
  }

  const cardPaths = [];
  for (const file of sourceFiles) {
    const src = path.join(PATHS.sourceDir, file);
    const dst = path.join(PATHS.imgDir, file);
    fs.copyFileSync(src, dst);
    cardPaths.push(dst);
  }

  const modelDst = path.join(PATHS.dataDir, 'contracts.json');
  fs.copyFileSync(PATHS.modelFile, modelDst);

  if (fs.existsSync(PATHS.manifestFile)) {
    const manifest = JSON.parse(fs.readFileSync(PATHS.manifestFile, 'utf-8'));
    manifest.contractCount = modelContracts.length;
    manifest.files.contracts = 'data/contracts.json';
    fs.writeFileSync(PATHS.manifestFile, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  }

  const errors = [];

  if (cardPaths.length !== EXPECTED_CONTRACT_CARDS) {
    errors.push(`Expected ${EXPECTED_CONTRACT_CARDS} SVGs, found ${cardPaths.length}`);
  }

  const exportedIds = cardPaths.map(f => path.basename(f, '.svg')).sort();
  const modelIds = modelContracts.map(t => t.assetId).sort();

  if (JSON.stringify(exportedIds) !== JSON.stringify(modelIds)) {
    const missing = modelIds.filter(id => !exportedIds.includes(id));
    const extra = exportedIds.filter(id => !modelIds.includes(id));
    if (missing.length) errors.push(`Missing SVGs: ${missing.join(', ')}`);
    if (extra.length) errors.push(`Extra SVGs: ${extra.join(', ')}`);
  }

  for (const f of cardPaths) {
    const content = fs.readFileSync(f, 'utf-8');
    if (!content.startsWith('<svg ')) {
      errors.push(`${path.basename(f)}: invalid SVG structure`);
    }
  }

  const duration = Date.now() - startTime;
  const exportedCount = cardPaths.length;

  console.log('\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log('  CONTRACT BGA EXPORT REPORT');
  console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log(`  Contract SVGs:   ${exportedCount}`);
  console.log(`  Contract data:   contracts.json`);
  console.log(`  Export duration: ${duration}ms`);
  console.log(`  Output img/:     ${PATHS.imgDir}`);

  if (errors.length) {
    console.log(`\n  Validation:      FAILED \u2014 ${errors.length} issue(s)`);
    for (const e of errors) {
      console.log(`    \u2717 ${e}`);
    }
    process.exit(1);
  } else {
    console.log(`  Validation:      PASSED`);
  }
  console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
}

build();
