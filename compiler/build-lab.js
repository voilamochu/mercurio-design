const fs = require('fs');
const path = require('path');
const { renderLab } = require('./lib/lab/renderer');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  stageData: path.join(ROOT, 'source', 'data', 'lab-stages.json'),
  outputDir: path.join(ROOT, 'generated', 'lab'),
  exportDir: path.join(ROOT, 'exports', 'bga', 'img'),
};

async function build() {
  const startTime = Date.now();

  console.log('\n  LAB ASSET PIPELINE');
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

  fs.mkdirSync(PATHS.outputDir, { recursive: true });
  fs.mkdirSync(PATHS.exportDir, { recursive: true });

  const raw = JSON.parse(fs.readFileSync(PATHS.stageData, 'utf-8'));
  console.log(`  Levels: ${raw.levels.length}`);

  const svg = await renderLab(raw, ROOT);

  const svgPath = path.join(PATHS.outputDir, 'lab.svg');
  fs.writeFileSync(svgPath, svg, 'utf-8');
  const svgSize = Buffer.byteLength(svg, 'utf-8');
  console.log(`  SVG:    ${svgPath} (${(svgSize / 1024).toFixed(1)} KB)`);

  const exportSvgPath = path.join(PATHS.exportDir, 'lab.svg');
  fs.writeFileSync(exportSvgPath, svg, 'utf-8');
  console.log(`  Export: ${exportSvgPath}`);

  const duration = Date.now() - startTime;
  const errors = [];
  if (!fs.existsSync(svgPath)) errors.push('SVG not generated');
  if (svgSize < 500) errors.push(`SVG suspiciously small: ${svgSize} bytes`);

  console.log(`\n  Done in ${duration}ms`);
  console.log(`  Validation: ${errors.length ? 'FAILED \u2014 ' + errors.join(', ') : 'PASSED'}`);
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');

  if (errors.length) process.exit(1);
}

build().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
