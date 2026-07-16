const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  sourceDir: path.join(ROOT, 'generated', 'cards'),
  exportDir: path.join(ROOT, 'exports', 'bga'),
  imgDir: path.join(ROOT, 'exports', 'bga', 'img', 'planets'),
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
    .filter(f => /^planet_\d{3}\.svg$/.test(f));

  if (sourceFiles.length !== 81) {
    console.error(`ERROR: expected 81 SVGs in generated/cards/, found ${sourceFiles.length}`);
    process.exit(1);
  }

  if (fs.existsSync(PATHS.exportDir)) {
    rimraf(PATHS.exportDir);
  }

  fs.mkdirSync(PATHS.imgDir, { recursive: true });

  for (const file of sourceFiles) {
    const src = path.join(PATHS.sourceDir, file);
    const dst = path.join(PATHS.imgDir, file);
    fs.copyFileSync(src, dst);
  }

  const expectedFiles = fs.readdirSync(PATHS.imgDir)
    .filter(f => /^planet_\d{3}\.svg$/.test(f));
  const exportedCount = expectedFiles.length;

  if (exportedCount !== 81) {
    console.error(`ERROR: expected 81 SVGs in export, found ${exportedCount}`);
    process.exit(1);
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    assets: {
      planets: exportedCount,
    },
  };

  fs.writeFileSync(
    path.join(PATHS.exportDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8',
  );

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
