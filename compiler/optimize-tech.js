const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const script = path.join(__dirname, 'optimize-svg.mjs');

console.log('Optimizing technology card SVGs...');
try {
  execSync(`node "${script}" --tech-only`, { cwd: ROOT, stdio: 'inherit' });
} catch (err) {
  console.error('Technology SVG optimization failed:', err.message);
  process.exit(1);
}
