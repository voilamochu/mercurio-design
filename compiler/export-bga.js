const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  sourceDir: path.join(ROOT, 'generated', 'cards'),
  modelFile: path.join(ROOT, 'generated', 'models', 'planets.json'),
  exportDir: path.join(ROOT, 'exports', 'bga'),
  imgDir: path.join(ROOT, 'exports', 'bga', 'img', 'planets'),
  dataDir: path.join(ROOT, 'exports', 'bga', 'data'),
};

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

  if (fs.existsSync(PATHS.exportDir)) {
    rimraf(PATHS.exportDir);
  }

  fs.mkdirSync(PATHS.imgDir, { recursive: true });
  fs.mkdirSync(PATHS.dataDir, { recursive: true });

  for (const file of sourceFiles) {
    const src = path.join(PATHS.sourceDir, file);
    const dst = path.join(PATHS.imgDir, file);
    fs.copyFileSync(src, dst);
  }

  if (fs.existsSync(PATHS.modelFile)) {
    const modelDst = path.join(PATHS.dataDir, 'planets.json');
    fs.copyFileSync(PATHS.modelFile, modelDst);
  } else {
    console.error(`ERROR: model file not found — ${PATHS.modelFile}`);
    process.exit(1);
  }

  const exportedCount = sourceFiles.length;

  const duration = Date.now() - startTime;

  console.log('\n────────────────────────────────────────');
  console.log('  BGA EXPORT REPORT');
  console.log('────────────────────────────────────────');
  console.log(`  SVGs exported:     ${exportedCount}`);
  console.log(`  Export duration:   ${duration}ms`);
  console.log(`  Output directory:  ${PATHS.exportDir}`);
  console.log('  Status:            PASSED');
  console.log('────────────────────────────────────────');
}

build();
