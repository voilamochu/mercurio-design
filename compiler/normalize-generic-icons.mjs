import { optimize } from 'svgo';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'source', 'artwork', 'icons', 'generic');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'optimized-generic-icons');
const RASTER_ICON_CANVAS_SIZE = 64;
const RASTER_GENERIC_ICONS = new Set(['planet_any', 'resource_any']);

// SVGO config for icon normalization.
// Preserves <symbol> elements (unlike the main config which runs removeUselessDefs).
const SVGO_CONFIG = {
  multipass: true,
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',
    'minifyStyles',
    'convertPathData',
    'convertTransform',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'mergePaths',
    'removeUnusedNS',
    'sortAttrs',
  ],
};

// Map from filename (without .svg) to logical icon name.
// Most filenames match the logical name; override exceptions here.
const FILENAME_TO_NAME = {
  project_icon: 'project',
};

function extractViewBox(svg) {
  const m = svg.match(/viewBox="([^"]+)"/);
  return m ? m[1] : null;
}

function extractInnerContent(svg) {
  return svg.replace(/<svg[^>]*>/g, '').replace(/<\/svg>/g, '').trim();
}

function flattenEmbeddedImage(inner) {
  // Pattern: <defs><image id="X" .../></defs><style>...</style><use href="#X" x="Y" y="Z"/>
  // Result: <image ... x="Y" y="Z"/>

  const imageMatch = inner.match(/<image\s+([^>]*?)\/?\s*>/i);
  const useMatch = inner.match(/<use\s+([^>]*?)\/?\s*>/i);

  if (!imageMatch || !useMatch) return inner;

  const imageAttrs = imageMatch[1].trim();
  const useAttrs = useMatch[1].trim();

  // Extract position from use element
  const xMatch = useAttrs.match(/x="([^"]*)"/);
  const yMatch = useAttrs.match(/y="([^"]*)"/);
  const x = xMatch ? xMatch[1] : '0';
  const y = yMatch ? yMatch[1] : '0';

  // Remove id attribute from image — not needed as direct child
  const cleanAttrs = imageAttrs.replace(/\s+id="[^"]*"/i, '');

  return `<image ${cleanAttrs} x="${x}" y="${y}"/>`;
}

function extractEmbeddedPng(svg) {
  const hrefRegex = /href="data:image\/png;base64,([^"]+)"/;
  const match = svg.match(hrefRegex);
  return match ? Buffer.from(match[1], 'base64') : null;
}

async function optimizeRasterGenericIcon(svg, logicalName, outputPath) {
  const sourceSvg = Buffer.from(svg, 'utf-8');
  const sourceMetadata = await sharp(sourceSvg).metadata();
  const sourceWidth = sourceMetadata.width;
  const sourceHeight = sourceMetadata.height;
  if (!sourceWidth || !sourceHeight) {
    throw new Error(`${logicalName}: source SVG has no raster dimensions`);
  }

  // Rasterize at the SVG's native dimensions, then contain-fit onto the
  // Governor canvas. The transparent padding is part of the final asset.
  const nativeRaster = await sharp(sourceSvg).raw().toBuffer({ resolveWithObject: true });

  await sharp(nativeRaster.data, {
    raw: {
      width: nativeRaster.info.width,
      height: nativeRaster.info.height,
      channels: nativeRaster.info.channels,
    },
  })
    .resize(RASTER_ICON_CANVAS_SIZE, RASTER_ICON_CANVAS_SIZE, {
      fit: 'contain',
      kernel: 'lanczos3',
      withoutEnlargement: true,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10, palette: true, dither: 0 })
    .toFile(outputPath);

  return { sourceWidth, sourceHeight };
}

function normalizeSvg(svg, logicalName) {
  const viewBox = extractViewBox(svg);
  if (!viewBox) {
    console.error(`  WARN: ${logicalName}.svg has no viewBox, skipping`);
    return null;
  }

  let inner = extractInnerContent(svg);

  // Remove empty style tags
  inner = inner.replace(/<style>\s*<\/style>/g, '');

  // Flatten embedded images (planet_any, resource_any)
  if (inner.includes('<defs>') && inner.includes('<image') && inner.includes('<use')) {
    inner = flattenEmbeddedImage(inner);
  }

  // Remove remaining empty <defs> wrappers
  inner = inner.replace(/<defs>\s*<\/defs>/g, '');

  // Wrap in symbol with viewBox
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  <defs>
    <symbol id="gv-generic-${logicalName}" viewBox="${viewBox}">
      ${inner}
    </symbol>
  </defs>
</svg>`;
}

async function main() {
  const start = Date.now();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(SOURCE_DIR)
    .filter(f => f.endsWith('.svg'))
    .sort();

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;

  for (const file of files) {
    const name = path.basename(file, '.svg');
    const logicalName = FILENAME_TO_NAME[name] || name;
    const outputFile = `${logicalName}.svg`;

    const sourcePath = path.join(SOURCE_DIR, file);
    const beforeSize = fs.statSync(sourcePath).size;
    totalBefore += beforeSize;

    const raw = fs.readFileSync(sourcePath, 'utf-8');

    if (RASTER_GENERIC_ICONS.has(logicalName)) {
      const outputPath = path.join(OUTPUT_DIR, `${logicalName}.png`);
      const staleSvgPath = path.join(OUTPUT_DIR, `${logicalName}.svg`);
      if (fs.existsSync(staleSvgPath)) fs.unlinkSync(staleSvgPath);
      const rasterResult = await optimizeRasterGenericIcon(raw, logicalName, outputPath);
      const afterSize = fs.statSync(outputPath).size;
      totalAfter += afterSize;
      processed++;
      console.log(`  ${logicalName}.png${' '.repeat(25 - logicalName.length)} ${(beforeSize / 1024).toFixed(1).padStart(8)}KB → ${(afterSize / 1024).toFixed(1).padStart(8)}KB  (rasterized ${rasterResult.sourceWidth}×${rasterResult.sourceHeight}, contain-fit 64×64)`);
      continue;
    }

    const normalized = normalizeSvg(raw, logicalName);
    if (!normalized) continue;

    // Run SVGO for structural optimization (preserves <symbol> elements)
    const result = optimize(normalized, { ...SVGO_CONFIG, path: outputFile });

    const outputPath = path.join(OUTPUT_DIR, outputFile);
    fs.writeFileSync(outputPath, result.data, 'utf-8');

    const afterSize = fs.statSync(outputPath).size;
    totalAfter += afterSize;
    processed++;

    const saved = beforeSize - afterSize;
    const pct = beforeSize > 0 ? ((saved / beforeSize) * 100).toFixed(1) : 0;
    console.log(`  ${outputFile.padEnd(30)} ${(beforeSize / 1024).toFixed(1).padStart(8)}KB → ${(afterSize / 1024).toFixed(1).padStart(8)}KB  (${pct}% reduction)`);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : 0;

  console.log('');
  console.log('─'.repeat(60));
  console.log(`Processed ${processed} generic icons in ${elapsed}s`);
  console.log(`Total before: ${(totalBefore / 1024).toFixed(1)}KB`);
  console.log(`Total after:  ${(totalAfter / 1024).toFixed(1)}KB`);
  console.log(`Total saved:  ${(totalSaved / 1024).toFixed(1)}KB (${totalPct}% reduction)`);
  console.log(`Output:       ${OUTPUT_DIR}`);
  console.log('─'.repeat(60));
}

main().catch(err => {
  console.error('Normalization failed:', err.message);
  process.exit(1);
});
