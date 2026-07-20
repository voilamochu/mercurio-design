const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const MODEL_FILE = path.join(ROOT, 'generated', 'models', 'technologies.json');
const MAP_FILE = path.join(ROOT, 'source', 'data', 'technology-artwork-map.json');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'cards-tech', 'preview');

const { ARTWORK_WINDOW } = require('./lib/technology/layout');
const { composeArtwork } = require('./lib/technology/sharp-artwork-compositor');

async function main() {
  if (!fs.existsSync(MODEL_FILE)) {
    throw new Error(`Model not found: ${MODEL_FILE}`);
  }
  if (!fs.existsSync(MAP_FILE)) {
    throw new Error(`Artwork map not found: ${MAP_FILE}`);
  }

  const model = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf-8'));
  const technologies = model.technologies;

  const mapData = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  const mapping = mapData.mapping;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, 'artwork'), { recursive: true });

  const results = [];
  for (const tech of technologies) {
    const entry = mapping[tech.id];
    if (!entry) {
      console.warn(`  WARNING: no artwork mapping for ${tech.id}, skipping`);
      continue;
    }

    const png = await composeArtwork(entry.domain, entry.overlay, ARTWORK_WINDOW);
    const filename = `${tech.assetId}.png`;
    const filePath = path.join(OUTPUT_DIR, 'artwork', filename);
    fs.writeFileSync(filePath, png);
    results.push({ id: tech.assetId, name: tech.name, file: filename, bytes: png.length });
    console.log(`  ✓ ${filename} (${(png.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\nGenerated ${results.length} artwork previews in ${path.join(OUTPUT_DIR, 'artwork')}`);
}

main().catch(err => {
  console.error('Preview generation failed:');
  console.error(err.message);
  process.exit(1);
});
