const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', '..', '..');
const { ARTWORK_RENDER_WIDTH, ARTWORK_RENDER_HEIGHT } = require('./layout');

const SOURCE_DIR = path.join(ROOT, 'source', 'artwork', 'contracts', 'artwork');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'optimized-contract-assets');

async function optimizeContractAssets() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.png'));
  let count = 0;

  for (const file of files) {
    const inputPath = path.join(SOURCE_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    await sharp(inputPath)
      .resize(ARTWORK_RENDER_WIDTH, ARTWORK_RENDER_HEIGHT, {
        fit: 'cover',
        kernel: 'lanczos3',
        withoutEnlargement: true,
      })
      .flatten()
      .withMetadata()
      .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
      .toFile(outputPath);
    count++;
  }

  return count;
}

module.exports = { optimizeContractAssets };
