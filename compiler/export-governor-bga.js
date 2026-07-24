const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  sourceDir: path.join(ROOT, 'generated', 'governors'),
  modelFile: path.join(ROOT, 'generated', 'models', 'governors.json'),
  exportDir: path.join(ROOT, 'exports', 'bga'),
  imgDir: path.join(ROOT, 'exports', 'bga', 'img'),
  dataDir: path.join(ROOT, 'exports', 'bga', 'data'),
  manifestFile: path.join(ROOT, 'exports', 'bga', 'manifest.json'),
};

const EXPECTED_COUNT = 40;

function build() {
  const startTime = Date.now();

  if (!fs.existsSync(PATHS.sourceDir)) {
    console.error(`ERROR: source directory not found — ${PATHS.sourceDir}`);
    console.error('Run `npm run build:governor-cards` first.');
    process.exit(1);
  }

  const sourceFiles = fs.readdirSync(PATHS.sourceDir)
    .filter(f => f.endsWith('.svg'))
    .sort();

  if (sourceFiles.length === 0) {
    console.error(`ERROR: no SVG files found in ${PATHS.sourceDir}`);
    process.exit(1);
  }

  if (sourceFiles.length !== EXPECTED_COUNT) {
    console.error(`ERROR: expected ${EXPECTED_COUNT} governor SVGs, found ${sourceFiles.length}`);
    process.exit(1);
  }

  // Ensure export directories exist
  if (!fs.existsSync(PATHS.exportDir)) {
    console.error(`ERROR: export directory not found — ${PATHS.exportDir}`);
    console.error('Run `npm run export:planet-bga` first to initialise the export directory.');
    process.exit(1);
  }

  fs.mkdirSync(PATHS.imgDir, { recursive: true });
  fs.mkdirSync(PATHS.dataDir, { recursive: true });

  // Copy governor SVGs
  let copied = 0;
  for (const file of sourceFiles) {
    const src = path.join(PATHS.sourceDir, file);
    const dst = path.join(PATHS.imgDir, file);
    fs.copyFileSync(src, dst);
    copied++;
  }

  // Copy model data
  const model = JSON.parse(fs.readFileSync(PATHS.modelFile, 'utf-8'));
  const dataDest = path.join(PATHS.dataDir, 'governors.json');
  fs.writeFileSync(dataDest, JSON.stringify(model, null, 2), 'utf-8');

  // Update manifest
  let manifest = {};
  if (fs.existsSync(PATHS.manifestFile)) {
    try { manifest = JSON.parse(fs.readFileSync(PATHS.manifestFile, 'utf-8')); } catch (e) { manifest = {}; }
  }
  manifest.governors = {
    count: copied,
    source: sourceFiles,
    exportedAt: new Date().toISOString(),
    assetVersion: 1,
  };
  fs.writeFileSync(PATHS.manifestFile, JSON.stringify(manifest, null, 2), 'utf-8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Exported ${copied} governor tiles + model to exports/bga/ (${elapsed}s)`);
}

build();
