import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'source', 'artwork', 'icons', 'planets');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'optimized-planet-icons');
const CANVAS_SIZE = 64;
const EXPECTED_COUNT = 9;

async function main() {
  const start = Date.now();
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Planet icon source directory not found: ${SOURCE_DIR}`);
  }

  const sourceFiles = fs.readdirSync(SOURCE_DIR)
    .filter(file => file.endsWith('_icon.png'))
    .sort();
  if (sourceFiles.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} planet icons, found ${sourceFiles.length}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const expectedOutputs = new Set(sourceFiles.map(file => file.replace(/_icon\.png$/, '.png')));
  for (const file of fs.readdirSync(OUTPUT_DIR)) {
    if (file.endsWith('.png') && !expectedOutputs.has(file)) {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
    }
  }

  let sourceBytes = 0;
  let outputBytes = 0;
  for (const file of sourceFiles) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file.replace(/_icon\.png$/, '.png'));
    const sourceStat = fs.statSync(sourcePath);
    sourceBytes += sourceStat.size;

    const metadata = await sharp(sourcePath).metadata();
    if (!metadata.width || !metadata.height || !metadata.hasAlpha) {
      throw new Error(`${file}: expected a raster image with alpha`);
    }

    await sharp(sourcePath)
      .resize(CANVAS_SIZE, CANVAS_SIZE, {
        fit: 'contain',
        kernel: 'lanczos3',
        withoutEnlargement: true,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        compressionLevel: 9,
        effort: 10,
        palette: true,
        dither: 0,
      })
      .toFile(outputPath);

    const outputStat = fs.statSync(outputPath);
    const outputMetadata = await sharp(outputPath).metadata();
    if (outputMetadata.width !== CANVAS_SIZE || outputMetadata.height !== CANVAS_SIZE || !outputMetadata.hasAlpha) {
      throw new Error(`${file}: optimized output is not ${CANVAS_SIZE}×${CANVAS_SIZE} RGBA`);
    }
    outputBytes += outputStat.size;
  }

  console.log(`Optimized ${sourceFiles.length} planet icons: ${(sourceBytes / 1024).toFixed(1)}KB → ${(outputBytes / 1024).toFixed(1)}KB`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Canvas: ${CANVAS_SIZE}×${CANVAS_SIZE}, contain-fit, Lanczos3, indexed PNG, compressionLevel=9, effort=10, dither=0`);
  console.log(`Elapsed: ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch(err => {
  console.error('Planet icon normalization failed:', err.message);
  process.exit(1);
});
