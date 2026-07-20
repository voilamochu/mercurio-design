import { optimize } from 'svgo';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const configPath = path.join(ROOT, 'svgo.config.mjs');

async function loadConfig() {
  const cfg = await import(configPath);
  return cfg.default;
}

async function optimizeDir(dir, label) {
  if (!fs.existsSync(dir)) {
    console.log(`  ${label}: directory not found, skipping`);
    return;
  }

  const config = await loadConfig();
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.svg'))
    .sort();

  let totalSaved = 0;
  let optimized = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const beforeSize = fs.statSync(filePath).size;

    const svgStr = fs.readFileSync(filePath, 'utf-8');
    const result = optimize(svgStr, { ...config, path: filePath });
    fs.writeFileSync(filePath, result.data, 'utf-8');

    const afterSize = fs.statSync(filePath).size;
    const saved = beforeSize - afterSize;
    totalSaved += saved;
    if (saved > 0) optimized++;
  }

  console.log(`  ${label}: ${files.length} files, ${optimized} optimized, saved ${totalSaved} bytes (${totalSaved > 1024 ? (totalSaved / 1024).toFixed(1) + 'KB' : totalSaved + 'B'})`);
}

async function main() {
  const cardsDir = path.join(ROOT, 'generated', 'cards');
  const cardsTechDir = path.join(ROOT, 'generated', 'cards-tech');

  await optimizeDir(cardsDir, 'Planet cards');
  await optimizeDir(cardsTechDir, 'Tech cards');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
