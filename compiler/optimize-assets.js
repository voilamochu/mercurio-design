const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  artwork: path.join(ROOT, 'source', 'artwork', 'cards', 'planet', 'planets'),
  icons: path.join(ROOT, 'source', 'icons', 'resources'),
  output: path.join(ROOT, 'generated', 'optimized-assets'),
};

const ARTWORK_SIZE = 576;
const ICON_SIZE = 96;

async function optimizeArtwork() {
  const outDir = path.join(PATHS.output, 'artwork');
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(PATHS.artwork).filter(f => f.endsWith('.png'));

  for (const file of files) {
    const inputPath = path.join(PATHS.artwork, file);
    const outputPath = path.join(outDir, file);

    await sharp(inputPath)
      .resize({ width: ARTWORK_SIZE, kernel: 'lanczos3' })
      .png({ compressionLevel: 9, palette: false })
      .toFile(outputPath);
  }

  console.log(`  Artwork: ${files.length} files → ${outDir}`);
}

async function optimizeIcons() {
  const outDir = path.join(PATHS.output, 'icons');
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(PATHS.icons).filter(f => f.endsWith('.png'));

  for (const file of files) {
    const inputPath = path.join(PATHS.icons, file);
    const outputPath = path.join(outDir, file);

    await sharp(inputPath)
      .trim({ threshold: 0, lineArt: false })
      .resize(ICON_SIZE, ICON_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: 'lanczos3',
      })
      .png({ compressionLevel: 9, palette: true })
      .toFile(outputPath);
  }

  console.log(`  Icons: ${files.length} files → ${outDir}`);
}

async function main() {
  const startTime = Date.now();
  console.log('Optimizing assets...\n');

  fs.mkdirSync(PATHS.output, { recursive: true });

  await optimizeArtwork();
  await optimizeIcons();

  const duration = Date.now() - startTime;
  console.log(`\nDone in ${duration}ms`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
}

module.exports = { optimizeArtwork, optimizeIcons };
