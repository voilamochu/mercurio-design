const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', '..', '..');
const { ARTWORK_RENDER_WIDTH, ARTWORK_RENDER_HEIGHT } = require('./layout');

const DOMAIN_SOURCE_DIR = path.join(ROOT, 'source', 'artwork', 'technology', 'domains');
const OVERLAY_SOURCE_DIR = path.join(ROOT, 'source', 'artwork', 'technology', 'overlays');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'optimized-tech-assets');

async function optimizeDomains() {
  const outDir = path.join(OUTPUT_DIR, 'domains');
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(DOMAIN_SOURCE_DIR).filter(f => f.endsWith('.png'));
  let count = 0;

  for (const file of files) {
    const inputPath = path.join(DOMAIN_SOURCE_DIR, file);
    const outputPath = path.join(outDir, file);

    await sharp(inputPath)
      .resize(ARTWORK_RENDER_WIDTH, ARTWORK_RENDER_HEIGHT, {
        fit: 'cover',
        kernel: 'lanczos3',
      })
      .flatten()
      .withMetadata()
      .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
      .toFile(outputPath);
    count++;
  }

  return count;
}

async function optimizeOverlays() {
  const outDir = path.join(OUTPUT_DIR, 'overlays');
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(OVERLAY_SOURCE_DIR).filter(f => f.endsWith('.png'));
  let count = 0;

  for (const file of files) {
    const inputPath = path.join(OVERLAY_SOURCE_DIR, file);
    const outputPath = path.join(outDir, file);

    await sharp(inputPath)
      .resize(ARTWORK_RENDER_WIDTH, ARTWORK_RENDER_HEIGHT, {
        fit: 'cover',
        kernel: 'lanczos3',
      })
      .flatten()
      .withMetadata()
      .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
      .toFile(outputPath);
    count++;
  }

  return count;
}

async function optimizeTechAssets() {
  const domainCount = await optimizeDomains();
  const overlayCount = await optimizeOverlays();
  return { domainCount, overlayCount };
}

module.exports = { optimizeTechAssets, optimizeDomains, optimizeOverlays };
