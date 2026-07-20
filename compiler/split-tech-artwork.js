const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const TECH_DIR = path.join(ROOT, 'source', 'artwork', 'technology');
const DOMAIN_OUT_DIR = path.join(TECH_DIR, 'domains');
const OVERLAY_OUT_DIR = path.join(TECH_DIR, 'overlays');

const JOBS = [
  {
    label: 'domain',
    inputCandidates: ['domain-collage.png', 'tech_domain.png'],
    outputDir: DOMAIN_OUT_DIR,
    columns: 4,
    rows: 2,
    tiles: [
      'exploration',
      'energy',
      'infrastructure',
      'computation',
      'biosphere',
      'civilization',
      'commerce',
      'transcendence',
    ],
  },
  {
    label: 'overlay',
    inputCandidates: ['overlay-collage.png', 'tech_overlay.png'],
    outputDir: OVERLAY_OUT_DIR,
    columns: 5,
    rows: 1,
    tiles: [
      'construction',
      'optimization',
      'conversion',
      'expansion',
      'mastery',
    ],
  },
];

const force = process.argv.includes('--force');

function resolveInput(job) {
  for (const candidate of job.inputCandidates) {
    const full = path.join(TECH_DIR, candidate);
    if (fs.existsSync(full)) {
      return full;
    }
  }
  throw new Error(
    `Missing ${job.label} collage. Expected one of: ` +
      job.inputCandidates.map(c => path.join(TECH_DIR, c)).join(', ')
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

function allOutputPaths() {
  const paths = [];
  for (const job of JOBS) {
    for (const name of job.tiles) {
      paths.push(path.join(job.outputDir, `${name}.png`));
    }
  }
  return paths;
}

function checkOverwrite() {
  const existing = allOutputPaths().filter(p => fs.existsSync(p));
  if (existing.length === 0) return;
  if (force) {
    console.log(`Force mode: overwriting ${existing.length} existing tile(s).`);
    return;
  }
  console.log('Artwork already exists. Refusing to overwrite canonical source artwork.');
  console.log('Use: npm run bootstrap:tech-artwork -- --force');
  console.log('if you intentionally want to regenerate everything.');
  process.exit(0);
}

async function splitJob(job) {
  const inputPath = resolveInput(job);

  const expectedTiles = job.columns * job.rows;
  if (job.tiles.length !== expectedTiles) {
    throw new Error(
      `${job.label}: grid ${job.columns}x${job.rows} = ${expectedTiles} tiles but ${job.tiles.length} names supplied`
    );
  }

  const image = sharp(inputPath);
  const meta = await image.metadata();
  const { width, height } = meta;

  if (!width || !height) {
    throw new Error(`${job.label}: could not read dimensions from ${inputPath}`);
  }

  if (width % job.columns !== 0) {
    throw new Error(
      `${job.label}: width ${width} not divisible by ${job.columns} columns (${inputPath})`
    );
  }
  if (height % job.rows !== 0) {
    throw new Error(
      `${job.label}: height ${height} not divisible by ${job.rows} rows (${inputPath})`
    );
  }

  const tileWidth = width / job.columns;
  const tileHeight = height / job.rows;

  ensureWritableDir(job.outputDir);

  const written = [];
  let tileIndex = 0;

  for (let row = 0; row < job.rows; row++) {
    for (let col = 0; col < job.columns; col++) {
      const name = job.tiles[tileIndex];
      const left = col * tileWidth;
      const top = row * tileHeight;
      const outPath = path.join(job.outputDir, `${name}.png`);

      await sharp(inputPath)
        .extract({ left, top, width: tileWidth, height: tileHeight })
        .png()
        .toFile(outPath);

      const stat = fs.statSync(outPath);
      if (stat.size === 0) {
        throw new Error(`${job.label}: wrote empty file ${outPath}`);
      }

      written.push({ name, file: outPath, bytes: stat.size, col, row });
      tileIndex++;
    }
  }

  return {
    label: job.label,
    inputPath,
    width,
    height,
    tileWidth,
    tileHeight,
    columns: job.columns,
    rows: job.rows,
    written,
    expected: job.tiles.slice(),
  };
}

function validate(result) {
  const errors = [];

  const producedNames = result.written.map(w => path.basename(w.file, '.png'));
  const expectedNames = result.expected;

  if (producedNames.length !== expectedNames.length) {
    errors.push(
      `${result.label}: expected ${expectedNames.length} PNGs, produced ${producedNames.length}`
    );
  }

  expectedNames.forEach((name, i) => {
    if (producedNames[i] !== name) {
      errors.push(
        `${result.label}: filename mismatch at index ${i}: expected "${name}.png", got "${producedNames[i]}.png"`
      );
    }
  });

  result.written.forEach(w => {
    if (w.bytes === 0) {
      errors.push(`${result.label}: empty file ${w.file}`);
    }
  });

  return errors;
}

async function main() {
  checkOverwrite();

  const results = [];
  for (const job of JOBS) {
    results.push(await splitJob(job));
  }

  const allErrors = results.flatMap(validate);
  if (allErrors.length > 0) {
    throw new Error('Validation failed:\n' + allErrors.map(e => '  ' + e).join('\n'));
  }

  console.log('Technology artwork bootstrap complete.\n');
  for (const r of results) {
    console.log(
      `[${r.label}] ${path.relative(ROOT, r.inputPath)} ` +
        `${r.width}x${r.height} -> ${r.columns}x${r.rows} grid ` +
        `(${r.tileWidth}x${r.tileHeight} per tile)`
    );
    for (const w of r.written) {
      console.log(`  ✓ ${path.relative(ROOT, w.file)} (${w.bytes} bytes)`);
    }
    console.log('');
  }

  const domainCount = results.find(r => r.label === 'domain').written.length;
  const overlayCount = results.find(r => r.label === 'overlay').written.length;

  console.log('Validation summary:');
  console.log(`  ${domainCount === 8 ? '✓' : '✗'} ${domainCount} domain PNGs created (expected 8)`);
  console.log(`  ${overlayCount === 5 ? '✓' : '✗'} ${overlayCount} overlay PNGs created (expected 5)`);
  console.log('  ✓ no empty files');
  console.log('  ✓ output filenames match specification');

  if (domainCount !== 8 || overlayCount !== 5) {
    throw new Error('Validation failed: unexpected PNG counts');
  }
}

main().catch(err => {
  console.error('bootstrap:tech-artwork failed:');
  console.error(err.message);
  process.exit(1);
});
