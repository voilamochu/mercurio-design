const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODEL_FILE = path.join(ROOT, 'generated', 'models', 'technologies.json');
const MAP_FILE = path.join(ROOT, 'source', 'data', 'technology-artwork-map.json');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'cards-tech');

const EXPECTED_COUNT = 40;

const {
  RULES_BOX,
  FOOTER,
  PROJECT_BOX,
  FLAVOR_BOX,
  ARTWORK_WINDOW,
} = require('./lib/technology/layout');

const { renderOuterFrame } = require('./lib/technology/frame');
const { renderTitleBar } = require('./lib/technology/title');
const { renderProjectBox } = require('./lib/technology/project');
const { renderRulesBox } = require('./lib/technology/rules');
const { renderFlavorBox } = require('./lib/technology/flavor');
const { renderFooter } = require('./lib/technology/footer');
const { wrapSvg } = require('./lib/technology/svg');
const { renderArtwork, loadDomain, loadOverlay } = require('./lib/technology/artwork-compositor');

function isProject(tech) {
  return tech.type === 'Project';
}

function computeRulesBoxY(hasProject) {
  if (hasProject) {
    return PROJECT_BOX.y + PROJECT_BOX.height + 14;
  }
  return ARTWORK_WINDOW.y + ARTWORK_WINDOW.height + 14;
}

function computeFlavorY(rulesY) {
  return rulesY + RULES_BOX.height + 14;
}

function computeFooterY(flavorY) {
  return flavorY + FLAVOR_BOX.height + 14;
}

async function renderTechSvg(tech, mapping) {
  const hasProject = isProject(tech);

  const rulesY = computeRulesBoxY(hasProject);
  RULES_BOX.y = rulesY;

  const flavorY = computeFlavorY(rulesY);
  FLAVOR_BOX.y = flavorY;

  const footerY = computeFooterY(flavorY);
  FOOTER.y = footerY;

  const entry = mapping[tech.id];
  if (!entry) {
    throw new Error(`No artwork mapping for technology id: ${tech.id}`);
  }

  const art = await renderArtwork(tech.assetId, ARTWORK_WINDOW, entry.domain, entry.overlay);

  const body = [
    renderOuterFrame(tech.frameStyle),
    renderTitleBar(tech.name, tech.romanLevel),
    art.body,
  ];

  if (hasProject) {
    body.push(renderProjectBox(tech.projectName, tech.projectDescription));
  }

  body.push(renderRulesBox(tech.description));
  body.push(renderFlavorBox(tech.flavorText));
  body.push(renderFooter(tech.displayType));

  return wrapSvg(body.join('\n'), tech.assetId, art.defs);
}

function isWellFormedSvg(content) {
  if (!content.startsWith('<svg')) return false;
  if (!content.trim().endsWith('</svg>')) return false;
  const opens = (content.match(/<svg/g) || []).length;
  const closes = (content.match(/<\/svg>/g) || []).length;
  return opens === 1 && closes === 1;
}

async function main() {
  if (!fs.existsSync(MODEL_FILE)) {
    throw new Error(`Renderer model not found: ${MODEL_FILE}. Run npm run build:tech-model first.`);
  }
  if (!fs.existsSync(MAP_FILE)) {
    throw new Error(`Artwork map not found: ${MAP_FILE}`);
  }

  const model = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf-8'));
  const technologies = model.technologies;

  if (!technologies || technologies.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} technologies, found ${technologies ? technologies.length : 0}`);
  }

  const mapData = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  const mapping = mapData.mapping;

  for (const tech of technologies) {
    if (!mapping[tech.id]) {
      throw new Error(`Artwork map missing entry for technology id: ${tech.id}`);
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const written = [];
  const seenFilenames = new Set();
  const missingAssets = [];

  for (const tech of technologies) {
    const svg = await renderTechSvg(tech, mapping);
    const filename = `${tech.assetId}.svg`;

    if (seenFilenames.has(filename)) {
      throw new Error(`Duplicate output filename: ${filename}`);
    }
    seenFilenames.add(filename);

    if (!isWellFormedSvg(svg)) {
      throw new Error(`Malformed SVG for ${tech.assetId}`);
    }

    const entry = mapping[tech.id];
    if (!loadDomain(entry.domain)) {
      missingAssets.push({ id: tech.id, kind: 'domain', value: entry.domain });
    }
    if (entry.overlay && !loadOverlay(entry.overlay)) {
      missingAssets.push({ id: tech.id, kind: 'overlay', value: entry.overlay });
    }

    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, svg, 'utf-8');
    written.push(filename);
  }

  if (written.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} SVGs, wrote ${written.length}`);
  }

  console.log(`Generated ${written.length} technology cards in ${OUTPUT_DIR}`);
  if (missingAssets.length) {
    console.log(`WARNING: ${missingAssets.length} artwork asset(s) not found (falling back to placeholder):`);
    for (const m of missingAssets) {
      console.log(`  ${m.id}: missing ${m.kind} "${m.value}"`);
    }
  }
}

main().catch(err => {
  console.error('tech-cards build failed:');
  console.error(err.message);
  process.exit(1);
});
