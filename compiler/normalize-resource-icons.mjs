import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'source', 'data', 'resource-icons.json');
const SOURCE_DIR = path.join(ROOT, 'source', 'artwork', 'resources');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'optimized-resource-icons');
const CANVAS_SIZE = 64;

function validateManifest(manifest) {
  const errors = [];
  if (!manifest || manifest.schema !== 'v1') {
    errors.push('Manifest must have schema "v1"');
  }
  if (!Array.isArray(manifest.resources)) {
    errors.push('Manifest must have a "resources" array');
    return errors;
  }
  const ids = new Set();
  for (const entry of manifest.resources) {
    if (!entry.id || typeof entry.id !== 'string') {
      errors.push('Each resource must have a string "id"');
      continue;
    }
    if (!entry.file || typeof entry.file !== 'string') {
      errors.push(`Resource "${entry.id}" must have a string "file"`);
      continue;
    }
    const filePath = path.join(SOURCE_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing source file: ${entry.file} (resource "${entry.id}")`);
    }
    if (ids.has(entry.id)) {
      errors.push(`Duplicate resource id: "${entry.id}"`);
    }
    ids.add(entry.id);
  }
  return errors;
}

async function main() {
  const start = Date.now();

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`ERROR: manifest not found — ${MANIFEST_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`ERROR: source directory not found — ${SOURCE_DIR}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const validationErrors = validateManifest(manifest);
  if (validationErrors.length > 0) {
    console.error('\n  MANIFEST VALIDATION FAILED:');
    for (const e of validationErrors) {
      console.error(`    \u2717 ${e}`);
    }
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;

  for (const entry of manifest.resources) {
    const srcPath = path.join(SOURCE_DIR, entry.file);
    const outputFile = `${entry.id}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    const sourceMetadata = await sharp(srcPath).metadata();
    const sourceWidth = sourceMetadata.width;
    const sourceHeight = sourceMetadata.height;

    const beforeSize = fs.statSync(srcPath).size;
    totalBefore += beforeSize;

    await sharp(srcPath)
      .resize(CANVAS_SIZE, CANVAS_SIZE, {
        fit: 'contain',
        kernel: 'lanczos3',
        withoutEnlargement: true,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9, effort: 10, palette: true, dither: 0 })
      .toFile(outputPath);

    const afterSize = fs.statSync(outputPath).size;
    totalAfter += afterSize;
    processed++;

    const saved = beforeSize - afterSize;
    const pct = beforeSize > 0 ? ((saved / beforeSize) * 100).toFixed(1) : 0;
    console.log(`  ${entry.id.padEnd(20)} ${(beforeSize / 1024).toFixed(1).padStart(8)}KB \u2192 ${(afterSize / 1024).toFixed(1).padStart(8)}KB  (${pct}% reduction)  ${sourceWidth}\u00d7${sourceHeight} \u2192 ${CANVAS_SIZE}\u00d7${CANVAS_SIZE}`);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : 0;

  console.log('');
  console.log('\u2500'.repeat(60));
  console.log(`Processed ${processed} resource icons in ${elapsed}s`);
  console.log(`Total before: ${(totalBefore / 1024).toFixed(1)}KB`);
  console.log(`Total after:  ${(totalAfter / 1024).toFixed(1)}KB`);
  console.log(`Total saved:  ${(totalSaved / 1024).toFixed(1)}KB (${totalPct}% reduction)`);
  console.log(`Output:       ${OUTPUT_DIR}`);
  console.log(`Canvas:       ${CANVAS_SIZE}\u00d7${CANVAS_SIZE}px, Lanczos3, contain-fit, transparent bg`);
  console.log(`PNG:          compressionLevel=9, effort=10, palette=true, dither=0, metadata stripped`);
  console.log('\u2500'.repeat(60));
}

main().catch(err => {
  console.error('Resource icon normalization failed:', err.message);
  process.exit(1);
});
