// Ownership model:
//   source/artwork/cards/planet/planets/<planet>-v2.png
//           │
//           ▼
//   bootstrap:planet-icons
//           │
//           ▼
//   source/artwork/icons/planets/<planet>_icon.png
//           │
//           ▼
//   renderers (read only)
//
// Bootstrap step only — not integrated into any build pipeline.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'source', 'artwork', 'cards', 'planet', 'planets');
const TARGET_DIR = path.join(ROOT, 'source', 'artwork', 'icons', 'planets');

const PLANETS = [
  { id: 'cold', file: 'cold-v2.png' },
  { id: 'earth', file: 'earth-v2.png' },
  { id: 'forge', file: 'forge-v2.png' },
  { id: 'ice', file: 'ice-v2.png' },
  { id: 'jungle', file: 'jungle-v2.png' },
  { id: 'ocean', file: 'ocean-v2.png' },
  { id: 'proto', file: 'proto-v2.png' },
  { id: 'scrap', file: 'scrap-v2.png' },
  { id: 'swamp', file: 'swamp-v2.png' },
];

const OUTPUT_SIZE = 256;
const CROP_SIZE = 448;
const BG_THRESHOLD = 28;
const PLANET_THRESHOLD = 55;
const WHITE_THRESHOLD = 248;

const force = process.argv.includes('--force');

function resolveInput(planet) {
  const p = path.join(SOURCE_DIR, planet.file);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing source artwork: ${p}`);
  }
  return p;
}

function ensureWritableDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
  } catch (err) {
    throw new Error(`Output directory not writable: ${dir} (${err.message})`);
  }
}

function checkOverwrite(planetIds) {
  const existing = planetIds.filter(id => {
    return fs.existsSync(path.join(TARGET_DIR, `${id}_icon.png`));
  });
  if (existing.length === 0) return;
  if (force) {
    console.log(`Force mode: overwriting ${existing.length} existing icon(s).`);
    return;
  }
  console.log('Planet icons already exist. Refusing to overwrite canonical source artwork.');
  console.log('Use: npm run bootstrap:planet-icons -- --force');
  console.log('if you intentionally want to regenerate everything.');
  process.exit(0);
}

function pixelAlpha(avg) {
  if (avg <= BG_THRESHOLD) return 0;
  if (avg >= WHITE_THRESHOLD) return 0;
  if (avg >= PLANET_THRESHOLD) return 255;
  const range = PLANET_THRESHOLD - BG_THRESHOLD;
  return Math.round(((avg - BG_THRESHOLD) / range) * 200);
}

function applyAlpha(srcBuf, dstBuf, w, h, srcX, srcY, dstIdx) {
  if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
    const srcIdx = (srcY * w + srcX) * 4;
    const r = srcBuf[srcIdx], g = srcBuf[srcIdx + 1], b = srcBuf[srcIdx + 2];
    const avg = (r + g + b) / 3;
    dstBuf[dstIdx] = r;
    dstBuf[dstIdx + 1] = g;
    dstBuf[dstIdx + 2] = b;
    dstBuf[dstIdx + 3] = pixelAlpha(avg);
  } else {
    dstBuf[dstIdx + 3] = 0;
  }
}

// Find the planet core centroid by weighting pixels by opacity.
function findPlanetCentroid(buf, w, h) {
  let sumX = 0, sumY = 0, weightSum = 0;
  for (let y = 30; y < h - 10; y++) {
    for (let x = 30; x < w - 10; x++) {
      const alpha = buf[(y * w + x) * 4 + 3];
      if (alpha > 200) {
        sumX += x * alpha;
        sumY += y * alpha;
        weightSum += alpha;
      }
    }
  }
  if (weightSum === 0) return null;
  return {
    x: Math.round(sumX / weightSum),
    y: Math.round(sumY / weightSum),
  };
}

async function main() {
  const planetIds = PLANETS.map(p => p.id);
  checkOverwrite(planetIds);
  ensureWritableDir(TARGET_DIR);

  // Pass 1: find each planet's center
  const planetCenters = [];

  for (const planet of PLANETS) {
    const inputPath = resolveInput(planet);
    const rawBuf = await sharp(inputPath).ensureAlpha().raw().toBuffer();
    const meta = await sharp(inputPath).metadata();
    const { width: w, height: h } = meta;

    const alphaBuf = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const r = rawBuf[i * 4], g = rawBuf[i * 4 + 1], b = rawBuf[i * 4 + 2];
      const avg = (r + g + b) / 3;
      alphaBuf[i * 4] = r;
      alphaBuf[i * 4 + 1] = g;
      alphaBuf[i * 4 + 2] = b;
      alphaBuf[i * 4 + 3] = pixelAlpha(avg);
    }

    const center = findPlanetCentroid(alphaBuf, w, h);
    if (!center) throw new Error(`No planet content found in ${planet.id}`);

    planetCenters.push({ planet, center });

    console.log(`  ${planet.id}: centroid (${center.x},${center.y})`);
  }

  const halfCrop = Math.round(CROP_SIZE / 2);
  console.log(`\n  Crop size: ${CROP_SIZE}×${CROP_SIZE}`);

  // Pass 2: extract each planet centered in a fixed square
  const written = [];

  for (const { planet, center } of planetCenters) {
    const inputPath = resolveInput(planet);
    const rawBuf = await sharp(inputPath).ensureAlpha().raw().toBuffer();
    const meta = await sharp(inputPath).metadata();
    const { width: w, height: h } = meta;

    const cropLeft = Math.max(0, center.x - halfCrop);
    const cropTop = Math.max(0, center.y - halfCrop);

    const outputName = `${planet.id}_icon.png`;
    const outputPath = path.join(TARGET_DIR, outputName);

    // Build the cropped RGBA buffer
    const cropBuf = Buffer.alloc(CROP_SIZE * CROP_SIZE * 4);
    for (let y = 0; y < CROP_SIZE; y++) {
      for (let x = 0; x < CROP_SIZE; x++) {
        const dstIdx = (y * CROP_SIZE + x) * 4;
        applyAlpha(rawBuf, cropBuf, w, h, cropLeft + x, cropTop + y, dstIdx);
      }
    }

    // Write directly: crop already has planet centered with padding,
    // space is transparent. Just resize and save.
    await sharp(cropBuf, {
      raw: { width: CROP_SIZE, height: CROP_SIZE, channels: 4 }
    })
      .resize({ width: OUTPUT_SIZE, height: OUTPUT_SIZE, fit: 'cover' })
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(outputPath);

    const stat = fs.statSync(outputPath);
    if (stat.size === 0) throw new Error(`Empty file: ${outputPath}`);
    written.push({ id: planet.id, file: outputPath, bytes: stat.size });
  }

  // Validation
  const errors = [];

  if (written.length !== PLANETS.length) {
    errors.push(`Expected ${PLANETS.length} icons, produced ${written.length}`);
  }

  const seen = new Set();
  for (const w of written) {
    if (seen.has(w.id)) errors.push(`Duplicate: ${w.id}`);
    seen.add(w.id);
    if (w.bytes === 0) errors.push(`Empty file: ${w.file}`);
  }

  const sizes = new Set();
  for (const w of written) {
    const m = await sharp(w.file).metadata();
    sizes.add(`${m.width}x${m.height}`);
  }
  if (sizes.size !== 1) {
    errors.push(`Icons have inconsistent dimensions: ${[...sizes].join(', ')}`);
  }

  let hasTransparency = false;
  for (const w of written) {
    const m = await sharp(w.file).metadata();
    if (m.hasAlpha) { hasTransparency = true; break; }
  }

  console.log(`\n  Written: ${written.length} planet icons`);
  console.log(`  Canvas size: ${[...sizes].join(', ')}`);

  for (const w of written) {
    console.log(`    ✓ ${path.relative(ROOT, w.file)} (${w.bytes} bytes)`);
  }

  if (errors.length > 0) {
    throw new Error('Validation failed:\n' + errors.map(e => '  ' + e).join('\n'));
  }

  // Determinism check
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  for (const w of written.sort((a, b) => a.id.localeCompare(b.id))) {
    hash.update(fs.readFileSync(w.file));
  }
  console.log(`\n  Deterministic hash: ${hash.digest('hex')}`);
  console.log('\nPlanet icon bootstrap complete.');
}

main().catch(err => {
  console.error('bootstrap:planet-icons failed:');
  console.error(err.message);
  process.exit(1);
});
