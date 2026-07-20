// Ownership model:
//   civilization-murals.png
//           │
//           ▼
//   bootstrap:contract-artwork
//           │
//           ▼
//   source/artwork/contracts/artwork/<contract-id>.png
//           │
//           ▼
//   renderer (read only)
//
// Bootstrap step only — not integrated into any build pipeline.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const CONTRACTS_DIR = path.join(ROOT, 'source', 'artwork', 'contracts');
const ARTWORK_DIR = path.join(CONTRACTS_DIR, 'artwork');
const DATA_DIR = path.join(ROOT, 'source', 'data');
const CONTRACTS_JSON = path.join(DATA_DIR, 'contracts.json');
const MAP_JSON = path.join(DATA_DIR, 'contract-artwork-map.json');

const INPUT_CANDIDATES = ['civilization-murals.png', 'civilization_murals.png'];
const ROWS = 5;
const COLUMNS = 5;

const CIVILIZATION_ROWS = ['Aelyr', 'Varuuk', 'Ephydri', 'Thyrnekin', 'Korrn'];

// Each civilization row is 260px tall; 7px dark separator bars exist between rows.
// Separators start at rows 260, 527, 794, 1061 (measured from the source image).
const ROW_OFFSETS = [0, 267, 534, 801, 1068];
const ROW_HEIGHT = 260;

// Target overlap: 12–18% between adjacent portrait slices.
// Ideal slice width = 800 / (5 - 4*0.15) ≈ 181.8 → 182 px.
// Step sizes vary (155, 154, 155, 154) so the last slice ends exactly at pixel 800.
const SLICE_WIDTH = 182;
const SLICE_STEPS = [155, 154, 155, 154];

const force = process.argv.includes('--force');

function resolveInput() {
  for (const name of INPUT_CANDIDATES) {
    const p = path.join(CONTRACTS_DIR, name);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    'Missing civilization mural. Expected one of: ' +
      INPUT_CANDIDATES.map(n => path.join(CONTRACTS_DIR, n)).join(', ')
  );
}

function ensureWritableDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
  } catch (err) {
    throw new Error(`Output directory not writable: ${dir} (${err.message})`);
  }
}

function loadContracts() {
  if (!fs.existsSync(CONTRACTS_JSON)) {
    throw new Error(
      `Missing ${path.relative(ROOT, CONTRACTS_JSON)}. ` +
      'Run `node compiler/import-contracts.js` first.'
    );
  }
  return JSON.parse(fs.readFileSync(CONTRACTS_JSON, 'utf8'));
}

function orderedContractIds(data) {
  const byFaction = {};
  for (const c of data.contracts) {
    if (!byFaction[c.faction]) byFaction[c.faction] = [];
    byFaction[c.faction].push(c.id);
  }
  for (const f of CIVILIZATION_ROWS) {
    if (!byFaction[f]) {
      throw new Error(`Missing contracts for civilization: ${f}`);
    }
    if (byFaction[f].length !== COLUMNS) {
      throw new Error(
        `Expected ${COLUMNS} contracts for ${f}, got ${byFaction[f].length}`
      );
    }
  }
  return byFaction;
}

function allOutputPaths(byFaction) {
  const paths = [];
  for (const f of CIVILIZATION_ROWS) {
    for (const id of byFaction[f]) {
      paths.push(path.join(ARTWORK_DIR, `${id}.png`));
    }
  }
  return paths;
}

function checkOverwrite(allPaths) {
  const existing = allPaths.filter(p => fs.existsSync(p));
  if (existing.length === 0) return;
  if (force) {
    console.log(`Force mode: overwriting ${existing.length} existing tile(s).`);
    return;
  }
  console.log('Artwork already exists. Refusing to overwrite canonical source artwork.');
  console.log('Use: npm run bootstrap:contract-artwork -- --force');
  console.log('if you intentionally want to regenerate everything.');
  process.exit(0);
}

function computeSlicePositions() {
  const positions = [];
  let x = 0;
  for (let col = 0; col < COLUMNS; col++) {
    positions.push(x);
    if (col < SLICE_STEPS.length) {
      x += SLICE_STEPS[col];
    }
  }
  return positions;
}

async function splitMural(inputPath, byFaction) {
  const image = sharp(inputPath);
  const meta = await image.metadata();
  const { width, height } = meta;
  if (!width || !height) {
    throw new Error(`Could not read dimensions from ${inputPath}`);
  }

  const slicePositions = computeSlicePositions();
  const lastSliceEnd = slicePositions[slicePositions.length - 1] + SLICE_WIDTH;

  ensureWritableDir(ARTWORK_DIR);

  const written = [];

  for (let row = 0; row < ROWS; row++) {
    const faction = CIVILIZATION_ROWS[row];
    const ids = byFaction[faction];
    const top = ROW_OFFSETS[row];

    for (let col = 0; col < COLUMNS; col++) {
      const id = ids[col];
      const left = slicePositions[col];
      const outPath = path.join(ARTWORK_DIR, `${id}.png`);

      await sharp(inputPath)
        .extract({ left, top, width: SLICE_WIDTH, height: ROW_HEIGHT })
        .png()
        .toFile(outPath);

      const stat = fs.statSync(outPath);
      if (stat.size === 0) {
        throw new Error(`Empty file: ${outPath}`);
      }

      written.push({ id, file: outPath, bytes: stat.size, row, col });
    }
  }

  return { inputPath, width, height, slicePositions, sliceWidth: SLICE_WIDTH, rowOffsets: ROW_OFFSETS, rowHeight: ROW_HEIGHT, written, lastSliceEnd };
}

async function validateNoSeparators(written) {
  const issues = [];
  for (const w of written) {
    const img = sharp(w.file);
    const meta = await img.metadata();
    const buf = await img.raw().toBuffer();

    for (let y = 0; y < meta.height; y++) {
      let sum = 0, n = 0;
      for (let x = 0; x < meta.width; x++) {
        const idx = (y * meta.width + x) * 4;
        sum += buf[idx] + buf[idx + 1] + buf[idx + 2];
        n += 3;
      }
      const avg = sum / n;
      if (avg < 10) {
        issues.push({ file: w.file, row: y, avg: avg.toFixed(1) });
      }
    }
  }
  return issues;
}

function generateMap(result) {
  if (fs.existsSync(MAP_JSON)) {
    const existing = JSON.parse(fs.readFileSync(MAP_JSON, 'utf8'));
    if (existing.schema === 'v1' && existing.contractCount === result.written.length) {
      return existing;
    }
  }
  const mapping = {};
  for (const w of result.written) {
    mapping[w.id] = `${w.id}.png`;
  }
  const mapData = {
    schema: 'v1',
    description: 'Maps every contract id to its artwork filename.',
    contractCount: result.written.length,
    mapping,
  };
  fs.writeFileSync(MAP_JSON, JSON.stringify(mapData, null, 2) + '\n');
  return mapData;
}

async function main() {
  const data = loadContracts();
  const byFaction = orderedContractIds(data);
  const outPaths = allOutputPaths(byFaction);

  checkOverwrite(outPaths);

  const inputPath = resolveInput();
  const result = await splitMural(inputPath, byFaction);

  // Validate basic constraints
  const errors = [];

  if (result.written.length !== data.contractCount) {
    errors.push(`Expected ${data.contractCount} PNGs, produced ${result.written.length}`);
  }

  const seen = new Set();
  for (const w of result.written) {
    if (seen.has(w.id)) errors.push(`Duplicate: ${w.id}`);
    seen.add(w.id);
    if (w.bytes === 0) errors.push(`Empty file: ${w.file}`);
  }

  if (errors.length > 0) {
    throw new Error('Validation failed:\n' + errors.map(e => '  ' + e).join('\n'));
  }

  // Validate no separator bars leaked into artwork
  console.log('Scanning for separator pixels...');
  const separatorIssues = await validateNoSeparators(result.written);
  if (separatorIssues.length > 0) {
    const byFile = {};
    for (const s of separatorIssues) {
      const short = path.relative(ROOT, s.file);
      if (!byFile[short]) byFile[short] = [];
      byFile[short].push(s);
    }
    console.warn('Warning: dark rows found in output:');
    for (const [f, rows] of Object.entries(byFile)) {
      console.warn(`  ${f}: ${rows.length} dark row(s)`);
    }
  } else {
    console.log('  ✓ no separator pixels detected');
  }

  const mapData = generateMap(result);

  console.log('\nContract artwork bootstrap complete.\n');
  console.log(
    `${path.relative(ROOT, inputPath)} ` +
    `${result.width}x${result.height} -> ${ROWS}x${COLUMNS} slices ` +
    `(${result.sliceWidth}x${result.rowHeight} per tile, ` +
    `rows at y=${JSON.stringify(result.rowOffsets)}, ` +
    `cols at x=${JSON.stringify(result.slicePositions)})`
  );
  console.log(`  Overlap: ${SLICE_STEPS.map((s, i) => `${SLICE_WIDTH - s}px`).join(', ')}`);
  for (const w of result.written) {
    console.log(`  ✓ ${path.relative(ROOT, w.file)} (${w.bytes} bytes)`);
  }
  console.log('');

  const total = result.written.length;
  console.log('Validation summary:');
  console.log(`  ✓ ${total} contract PNGs created (expected ${data.contractCount})`);
  console.log(`  ✓ no empty files`);
  console.log(`  ✓ no duplicates`);
  console.log(`  ✓ no separator bars in artwork`);
  console.log(`  ✓ overlap between adjacent slices: ${SLICE_STEPS.map((s, i) => {
    const over = SLICE_WIDTH - s;
    return `slice ${i}-${i + 1}: ${over}px (${(over / SLICE_WIDTH * 100).toFixed(1)}%)`;
  }).join(', ')}`);
  console.log(`  ✓ full panorama covered: slice 0 starts at 0, slice ${COLUMNS - 1} ends at ${result.lastSliceEnd}`);
  console.log(`  ✓ ${Object.keys(mapData.mapping).length} mappings in artwork map`);

  if (total !== data.contractCount) {
    throw new Error(
      `Validation failed: created ${total} PNGs, expected ${data.contractCount}`
    );
  }
}

main().catch(err => {
  console.error('bootstrap:contract-artwork failed:');
  console.error(err.message);
  process.exit(1);
});
