const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  sourcePng: path.join(ROOT, 'generated', 'lab', 'lab.png'),
  exportDir: path.join(ROOT, 'exports', 'bga', 'img'),
};

async function build() {
  const startTime = Date.now();

  console.log('\n  LAB ASSET PIPELINE');
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

  fs.mkdirSync(PATHS.exportDir, { recursive: true });

  if (!fs.existsSync(PATHS.sourcePng)) {
    console.error(`  ERROR: source PNG not found — ${PATHS.sourcePng}`);
    process.exit(1);
  }

  const exportPngPath = path.join(PATHS.exportDir, 'lab.png');
  fs.copyFileSync(PATHS.sourcePng, exportPngPath);
  const fileSize = fs.statSync(exportPngPath).size;
  console.log(`  Export: ${exportPngPath} (${(fileSize / 1024).toFixed(1)} KB)`);

  const duration = Date.now() - startTime;
  console.log(`\n  Done in ${duration}ms`);
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');
}

build().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
