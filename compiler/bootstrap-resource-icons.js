const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');

const RESOURCE_ICONS = [
  'grain', 'water', 'algae', 'ore', 'robot',
  'electronics', 'crate', 'power', 'science',
  'population', 'influence',
];

const EXISTING_SOURCE = path.join(ROOT, 'source', 'icons', 'resources');
const TARGET_DIR = path.join(ROOT, 'source', 'artwork', 'resources');

const EXISTING_MAP = {
  algae: 'Algae.png',
  crate: 'Crate.png',
  electronics: 'Electronics.png',
  grain: 'Grain.png',
  ore: 'Ore.png',
  population: 'Human.png',
  robot: 'Robot.png',
  water: 'Water.png',
};

const COLLAGE_DIR = path.join(ROOT, 'source', 'artwork', 'icons');

class GridImporter {
  constructor({ collage, cols, rows, outputMap }) {
    this.collage = collage;
    this.cols = cols;
    this.rows = rows;
    this.outputMap = outputMap;
  }

  async extractAll(targetDir) {
    const collagePath = path.join(COLLAGE_DIR, this.collage);
    if (!fs.existsSync(collagePath)) {
      console.error(`ERROR: collage not found — ${collagePath}`);
      process.exit(1);
    }

    const img = sharp(collagePath);
    const { width, height } = await img.metadata();
    const tileW = Math.floor(width / this.cols);
    const tileH = Math.floor(height / this.rows);

    const results = [];
    let cellIndex = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const id = this.outputMap[cellIndex];
        if (!id) { cellIndex++; continue; }

        const targetPath = path.join(targetDir, `${id}.png`);
        if (fs.existsSync(targetPath)) {
          console.log(`  EXISTS: ${id}.png — skipped (grid)`);
          cellIndex++;
          continue;
        }

        await sharp(collagePath)
          .extract({ left: col * tileW, top: row * tileH, width: tileW, height: tileH })
          .toFile(targetPath);

        console.log(`  EXTRACTED: ${id}.png from ${this.collage} (grid ${col},${row})`);
        results.push(id);
        cellIndex++;
      }
    }
    return results;
  }
}

class BoundingBoxImporter {
  constructor({ collage, ids, padding }) {
    this.collage = collage;
    this.ids = ids;
    this.padding = padding;
  }

  async extractAll(targetDir) {
    const collagePath = path.join(COLLAGE_DIR, this.collage);
    if (!fs.existsSync(collagePath)) {
      console.error(`ERROR: collage not found — ${collagePath}`);
      process.exit(1);
    }

    const image = sharp(collagePath);
    const { width, height } = await image.metadata();
    const buf = await image.raw().toBuffer();

    const PAD = this.padding;
    const ALPHA_MIN = 10;
    const MIN_REGION_PX = 1000;
    const MIN_GAP = 40;

    const colOccupied = new Array(width).fill(false);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (buf[(y * width + x) * 4 + 3] > ALPHA_MIN) {
          colOccupied[x] = true;
          break;
        }
      }
    }

    const runs = [];
    let start = -1;
    for (let x = 0; x < width; x++) {
      if (colOccupied[x] && start === -1) start = x;
      if (!colOccupied[x] && start !== -1) {
        if (x - start > MIN_GAP) {
          runs.push({ start, end: x - 1 });
        }
        start = -1;
      }
    }
    if (start !== -1 && width - start > MIN_GAP) {
      runs.push({ start, end: width - 1 });
    }

    const boxes = [];
    for (const run of runs) {
      let minY = height, maxY = 0, pxCount = 0;
      for (let x = run.start; x <= run.end; x++) {
        for (let y = 0; y < height; y++) {
          const a = buf[(y * width + x) * 4 + 3];
          if (a > ALPHA_MIN) {
            pxCount++;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (pxCount < MIN_REGION_PX) continue;

      const left = Math.max(0, run.start - PAD);
      const top = Math.max(0, minY - PAD);
      const right = Math.min(width - 1, run.end + PAD);
      const bottom = Math.min(height - 1, maxY + PAD);

      boxes.push({
        left,
        top,
        width: right - left + 1,
        height: bottom - top + 1,
        pxCount,
      });
    }

    if (boxes.length !== this.ids.length) {
      console.error(`ERROR: expected ${this.ids.length} regions in ${this.collage}, found ${boxes.length}`);
      console.error('  Check that the collage has the expected number of distinct artwork regions.');
      process.exit(1);
    }

    const results = [];
    for (let i = 0; i < boxes.length; i++) {
      const id = this.ids[i];
      const box = boxes[i];
      const targetPath = path.join(targetDir, `${id}.png`);

      if (fs.existsSync(targetPath)) {
        console.log(`  EXISTS: ${id}.png — skipped (bounding box)`);
        results.push(id);
        continue;
      }

      await sharp(collagePath)
        .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
        .toFile(targetPath);

      console.log(`  EXTRACTED: ${id}.png from ${this.collage} (bbox ${box.width}\u00d7${box.height}+${box.left}+${box.top})`);
      results.push(id);
    }
    return results;
  }
}

async function main() {
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  // Legacy 8 icons — copied from source/icons/resources/
  for (const id of RESOURCE_ICONS) {
    const targetPath = path.join(TARGET_DIR, `${id}.png`);

    if (fs.existsSync(targetPath)) {
      continue;
    }

    if (EXISTING_MAP[id]) {
      const src = path.join(EXISTING_SOURCE, EXISTING_MAP[id]);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, targetPath);
        console.log(`  COPIED: ${EXISTING_MAP[id]} \u2192 ${id}.png`);
      }
    }
  }

  // ResourceIcons_2.png — 3 standalone icons extracted by bounding box
  const bbImporter = new BoundingBoxImporter({
    collage: 'ResourceIcons_2.png',
    ids: ['science', 'power', 'influence'],
    padding: 20,
  });
  await bbImporter.extractAll(TARGET_DIR);

  const files = fs.readdirSync(TARGET_DIR).filter(f => f.endsWith('.png')).sort();
  const iconFiles = files.filter(f => !/^ResourceIcons(_\d)?\.png$/.test(f));
  console.log(`\n  Total: ${iconFiles.length} resource icons in ${TARGET_DIR}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
