const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  sourceDir: path.join(ROOT, 'generated', 'bga', 'img'),
  exportDir: path.join(ROOT, 'exports', 'bga', 'img'),
  manifestFile: path.join(ROOT, 'exports', 'bga', 'manifest.json'),
};

const EXPECTED_COUNT = 11;

function build() {
  const startTime = Date.now();

  if (!fs.existsSync(PATHS.sourceDir)) {
    console.error(`ERROR: resource icons not found — ${PATHS.sourceDir}`);
    console.error('Run `npm run build:resource-icons` first.');
    process.exit(1);
  }

  const sourceFiles = fs.readdirSync(PATHS.sourceDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  if (sourceFiles.length === 0) {
    console.error(`ERROR: no PNG files found in ${PATHS.sourceDir}`);
    process.exit(1);
  }

  fs.mkdirSync(PATHS.exportDir, { recursive: true });

  for (const file of sourceFiles) {
    const src = path.join(PATHS.sourceDir, file);
    const dst = path.join(PATHS.exportDir, file);
    fs.copyFileSync(src, dst);
  }

  if (fs.existsSync(PATHS.manifestFile)) {
    const manifest = JSON.parse(fs.readFileSync(PATHS.manifestFile, 'utf-8'));
    manifest.resourceIcons = {
      count: sourceFiles.length,
      files: 'img/',
    };
    fs.writeFileSync(PATHS.manifestFile, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  }

  const errors = [];
  if (sourceFiles.length !== EXPECTED_COUNT) {
    errors.push(`Expected ${EXPECTED_COUNT} resource icons, found ${sourceFiles.length}`);
  }

  const duration = Date.now() - startTime;

  console.log('\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log('  RESOURCE ICONS BGA EXPORT REPORT');
  console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log(`  Icons exported:    ${sourceFiles.length}/${EXPECTED_COUNT}`);
  console.log(`  Export duration:   ${duration}ms`);
  console.log(`  Output:            ${PATHS.exportDir}`);

  if (errors.length) {
    console.log(`\n  Validation:        FAILED \u2014 ${errors.length} issue(s)`);
    for (const e of errors) {
      console.log(`    \u2717 ${e}`);
    }
    process.exit(1);
  } else {
    console.log(`  Validation:        PASSED`);
  }
  console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
}

build();
