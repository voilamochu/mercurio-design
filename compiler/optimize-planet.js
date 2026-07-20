const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const script = path.join(__dirname, 'optimize-svg.mjs');

console.log('Optimizing planet card SVGs...');
try {
  execSync(`node "${script}" --planet-only`, { cwd: ROOT, stdio: 'inherit' });
} catch (err) {
  console.error('Planet SVG optimization failed:', err.message);
  process.exit(1);
}
