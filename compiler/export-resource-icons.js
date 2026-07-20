const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  manifest: path.join(ROOT, 'source', 'data', 'resource-icons.json'),
  sourceDir: path.join(ROOT, 'source', 'artwork', 'resources'),
  outputDir: path.join(ROOT, 'generated', 'bga', 'img'),
};

const EXPECTED_COUNT = 11;

function validateManifest(manifest) {
  const errors = [];

  if (!manifest || manifest.schema !== 'v1') {
    errors.push('Manifest must have schema "v1"');
  }

  if (!Array.isArray(manifest.resources)) {
    errors.push('Manifest must have a "resources" array');
    return errors;
  }

  const ids = new Set();
  const files = new Set();

  for (const entry of manifest.resources) {
    if (!entry.id || typeof entry.id !== 'string') {
      errors.push('Each resource must have a string "id"');
      continue;
    }

    if (!entry.file || typeof entry.file !== 'string') {
      errors.push(`Resource "${entry.id}" must have a string "file"`);
      continue;
    }

    if (!/^[a-z0-9-]+\.png$/.test(entry.file)) {
      errors.push(`Resource "${entry.id}": invalid filename "${entry.file}" — must be lowercase PNG`);
    }

    if (!/^[a-z][a-z0-9-]*$/.test(entry.id)) {
      errors.push(`Resource "${entry.id}": invalid id — must be lowercase alphanumeric starting with a letter`);
    }

    if (ids.has(entry.id)) {
      errors.push(`Duplicate resource id: "${entry.id}"`);
    }
    ids.add(entry.id);

    if (files.has(entry.file)) {
      errors.push(`Duplicate filename: "${entry.file}"`);
    }
    files.add(entry.file);

    const filePath = path.join(PATHS.sourceDir, entry.file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing source file: ${entry.file} (resource "${entry.id}")`);
    }
  }

  if (manifest.resources.length !== EXPECTED_COUNT) {
    errors.push(`Expected ${EXPECTED_COUNT} resources in manifest, found ${manifest.resources.length}`);
  }

  return errors;
}

function findOrphanedPngs(manifest) {
  const manifestFiles = new Set(manifest.resources.map(r => r.file));
  const sourceFiles = fs.readdirSync(PATHS.sourceDir).filter(f => f.endsWith('.png'));
  return sourceFiles.filter(f => !manifestFiles.has(f));
}

async function optimizeAndExport(manifest) {
  fs.mkdirSync(PATHS.outputDir, { recursive: true });

  const results = [];
  let totalSrcSize = 0;
  let totalDstSize = 0;

  for (const entry of manifest.resources) {
    const src = path.join(PATHS.sourceDir, entry.file);
    const dst = path.join(PATHS.outputDir, entry.file);

    const srcStat = fs.statSync(src);
    totalSrcSize += srcStat.size;

    await sharp(src)
      .withMetadata()
      .png({
        compressionLevel: 9,
        palette: true,
        effort: 10,
        adaptiveFiltering: true,
      })
      .toFile(dst);

    const dstStat = fs.statSync(dst);
    totalDstSize += dstStat.size;

    results.push({
      id: entry.id,
      file: entry.file,
      srcBytes: srcStat.size,
      dstBytes: dstStat.size,
      saved: srcStat.size - dstStat.size,
    });
  }

  return { results, totalSrcSize, totalDstSize };
}

async function build() {
  const startTime = Date.now();

  if (!fs.existsSync(PATHS.manifest)) {
    console.error(`ERROR: manifest not found — ${PATHS.manifest}`);
    console.error('Create source/data/resource-icons.json first.');
    process.exit(1);
  }

  if (!fs.existsSync(PATHS.sourceDir)) {
    console.error(`ERROR: source directory not found — ${PATHS.sourceDir}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(PATHS.manifest, 'utf-8'));

  const validationErrors = validateManifest(manifest);
  if (validationErrors.length > 0) {
    console.error('\n  MANIFEST VALIDATION FAILED:');
    for (const e of validationErrors) {
      console.error(`    \u2717 ${e}`);
    }
    process.exit(1);
  }

  const orphaned = findOrphanedPngs(manifest);
  if (orphaned.length > 0) {
    console.error(`\n  WARNING: ${orphaned.length} orphaned PNG(s) in source directory:`);
    for (const f of orphaned) {
      console.error(`    \u26A0 ${f} — not listed in manifest`);
    }
    console.error('\n  Either add them to the manifest or remove them.');
    process.exit(1);
  }

  const { results, totalSrcSize, totalDstSize } = await optimizeAndExport(manifest);

  const outputFiles = fs.readdirSync(PATHS.outputDir).filter(f => f.endsWith('.png'));
  let exportErrors = [];

  if (outputFiles.length !== EXPECTED_COUNT) {
    exportErrors.push(`Expected ${EXPECTED_COUNT} exported PNGs, found ${outputFiles.length}`);
  }

  for (const entry of manifest.resources) {
    if (!outputFiles.includes(entry.file)) {
      exportErrors.push(`Missing exported file: ${entry.file}`);
    }
  }

  const duration = Date.now() - startTime;

  console.log('\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log('  RESOURCE ICONS EXPORT REPORT');
  console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log(`  Icons exported:    ${outputFiles.length}/${EXPECTED_COUNT}`);
  console.log(`  Total source size: ${(totalSrcSize / 1024).toFixed(1)} KB`);
  console.log(`  Total export size: ${(totalDstSize / 1024).toFixed(1)} KB`);
  console.log(`  Total saved:       ${(((totalSrcSize - totalDstSize) / totalSrcSize) * 100).toFixed(1)}%`);
  console.log(`  Export duration:   ${duration}ms`);
  console.log(`  Output directory:  ${PATHS.outputDir}`);
  console.log(`  Manifest:          ${PATHS.manifest}`);

  if (exportErrors.length > 0) {
    console.log(`\n  Validation:        FAILED \u2014 ${exportErrors.length} issue(s)`);
    for (const e of exportErrors) {
      console.log(`    \u2717 ${e}`);
    }
    process.exit(1);
  } else {
    console.log(`  Validation:        PASSED`);
  }

  console.log('  Deterministic:     yes (Sharp PNG with fixed settings)');
  console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');
}

build();
