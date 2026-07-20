const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MODEL_FILE = path.join(ROOT, 'generated', 'models', 'contracts.json');
const MAP_FILE = path.join(ROOT, 'source', 'data', 'contract-artwork-map.json');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'contracts');
const SVGO_SCRIPT = path.join(ROOT, 'compiler', 'optimize-svg.mjs');

const EXPECTED_COUNT = 25;

const { optimizeContractAssets } = require('./lib/contracts/optimize-contract-assets');
const { renderOuterFrame } = require('./lib/contracts/frame');
const { renderTitle } = require('./lib/contracts/title');
const { renderArtwork } = require('./lib/contracts/artwork');
const { renderClaimSlots } = require('./lib/contracts/claim-slots');
const { renderRequirement } = require('./lib/contracts/requirement');
const { renderReward } = require('./lib/contracts/reward');
const { renderFlavorText } = require('./lib/contracts/flavor');
const { renderFooter } = require('./lib/contracts/footer');
const { wrapSvg } = require('./lib/contracts/svg');

function renderContractSvg(contract, artworkFilename) {
  const art = renderArtwork(contract.assetId, artworkFilename);

  const body = [
    renderOuterFrame(),
    renderTitle(contract.name),
    art.body,
    renderRequirement(contract.requirement),
    renderReward(contract.reward),
    renderClaimSlots(),
    renderFlavorText(contract.flavorText),
    renderFooter(),
  ];

  return wrapSvg(body.join('\n'), contract.assetId, art.defs);
}

function isWellFormedSvg(content) {
  if (!content.startsWith('<svg')) return false;
  if (!content.trim().endsWith('</svg>')) return false;
  const opens = (content.match(/<svg/g) || []).length;
  const closes = (content.match(/<\/svg>/g) || []).length;
  return opens >= 1 && closes >= 1 && opens === closes;
}

function validateSelfContained(content, assetId) {
  const patterns = [
    { name: 'non-data href', re: /href="(?!data:)/ },
    { name: 'url(http', re: /url\(https?:\/\// },
    { name: '@import', re: /@import\s/ },
    { name: '<link', re: /<link\s/ },
  ];
  for (const { name, re } of patterns) {
    if (re.test(content)) {
      throw new Error(`Self-contained validation failed for ${assetId}: pattern "${name}"`);
    }
  }
  return true;
}

async function main() {
  console.log('Optimizing contract artwork assets...');
  const optCount = await optimizeContractAssets();
  console.log(`  ${optCount} files → generated/optimized-contract-assets/`);

  if (!fs.existsSync(MODEL_FILE)) {
    throw new Error(`Renderer model not found: ${MODEL_FILE}. Run npm run build:contract-model first.`);
  }
  if (!fs.existsSync(MAP_FILE)) {
    throw new Error(`Artwork map not found: ${MAP_FILE}`);
  }

  const model = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf-8'));
  const contracts = model.contracts;

  if (!contracts || contracts.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} contracts, found ${contracts ? contracts.length : 0}`);
  }

  const mapData = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  const mapping = mapData.mapping;

  for (const c of contracts) {
    if (!mapping[c.id]) {
      throw new Error(`Artwork map missing entry for contract id: ${c.id}`);
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const written = [];
  const seenFilenames = new Set();
  const missingArtwork = [];

  for (const contract of contracts) {
    const artworkFilename = mapping[contract.id];
    const svg = renderContractSvg(contract, artworkFilename);
    const filename = `${contract.assetId}.svg`;

    if (seenFilenames.has(filename)) {
      throw new Error(`Duplicate output filename: ${filename}`);
    }
    seenFilenames.add(filename);

    if (!isWellFormedSvg(svg)) {
      throw new Error(`Malformed SVG for ${contract.assetId}`);
    }

    validateSelfContained(svg, contract.assetId);

    const artworkPath = path.join(ROOT, 'generated', 'optimized-contract-assets', artworkFilename);
    if (!fs.existsSync(artworkPath)) {
      missingArtwork.push({ id: contract.id, file: artworkFilename });
    }

    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, svg, 'utf-8');
    written.push(filename);
  }

  if (written.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} SVGs, wrote ${written.length}`);
  }

  console.log(`Generated ${written.length} contract cards in ${OUTPUT_DIR}`);
  console.log('All SVGs are self-contained: ✓ artwork embedded, ✓ no external references');
  if (missingArtwork.length) {
    console.log(`WARNING: ${missingArtwork.length} artwork file(s) not found (falling back to placeholder):`);
    for (const m of missingArtwork) {
      console.log(`  ${m.id}: missing "${m.file}"`);
    }
  }

  console.log('\nRunning SVGO optimization...');
  try {
    execSync(`node "${SVGO_SCRIPT}" --contract-only`, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error('SVGO optimization failed:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('contract-cards build failed:');
  console.error(err.message);
  process.exit(1);
});
