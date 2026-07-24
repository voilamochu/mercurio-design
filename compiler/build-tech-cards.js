const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MODEL_FILE = path.join(ROOT, 'generated', 'models', 'technologies.json');
const MAP_FILE = path.join(ROOT, 'source', 'data', 'technology-artwork-map.json');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'cards-tech');
const SVGO_SCRIPT = path.join(ROOT, 'compiler', 'optimize-svg.mjs');

const EXPECTED_COUNT = 40;

const {
  ARTWORK_WINDOW,
  ARTWORK_PREFERRED_HEIGHT,
  ARTWORK_MIN_HEIGHT,
  OUTER_FRAME,
  PROJECT_BOX,
  RULES_BOX,
  GAP_AFTER_ARTWORK,
  GAP_BETWEEN_BOXES,
  computeLineCount,
  computeBoxHeight,
  computeProjectBoxHeight,
} = require('./lib/technology/layout');

const { renderOuterFrame } = require('./lib/technology/frame');
const { renderTitleBar } = require('./lib/technology/title');
const { renderProjectBox } = require('./lib/technology/project');
const { renderRulesBox } = require('./lib/technology/rules');

const { wrapSvg } = require('./lib/technology/svg');
const { renderArtwork, loadDomain, loadOverlay } = require('./lib/technology/artwork-compositor');
const { generateFontCss, getEmbeddedFontCount, getEmbeddedFontNames } = require('./lib/svg/font-embed');
const { optimizeTechAssets } = require('./lib/technology/optimize-tech-assets');

function isProject(tech) {
  return tech.type === 'Project';
}

function computeArtworkTop() {
  return ARTWORK_WINDOW.y;
}

function computeLayout(tech) {
  const hasProject = isProject(tech);
  const artworkTop = computeArtworkTop();
  const frameBottom = OUTER_FRAME.y + OUTER_FRAME.height;
  const availableHeight = frameBottom - 12 - artworkTop;

  const innerWidth = PROJECT_BOX.width - PROJECT_BOX.paddingX * 2;

  let projectBoxHeight = 0;
  if (hasProject) {
    const headingText = tech.projectName ? `Project: ${tech.projectName}` : 'Project';
    const descText = tech.projectDescription ? tech.projectDescription : '';
    const headingLines = computeLineCount(headingText, PROJECT_BOX.nameFont, innerWidth);
    const descLines = computeLineCount(descText, PROJECT_BOX.descFont, innerWidth);
    projectBoxHeight = computeProjectBoxHeight(Math.max(headingLines, 1), descLines, PROJECT_BOX.nameFont, PROJECT_BOX.descFont);
  }

  const rulesLines = computeLineCount(tech.description, RULES_BOX.font, innerWidth);
  const rulesBoxHeight = rulesLines > 0 ? computeBoxHeight(rulesLines, RULES_BOX.font) : 0;

  const gaps = GAP_AFTER_ARTWORK
    + (hasProject ? GAP_BETWEEN_BOXES : 0);

  const fixedContentHeight = projectBoxHeight + rulesBoxHeight + gaps;

  let artworkHeight = ARTWORK_PREFERRED_HEIGHT;
  const totalHeight = artworkHeight + fixedContentHeight;

  if (totalHeight > availableHeight) {
    artworkHeight = Math.max(ARTWORK_MIN_HEIGHT, availableHeight - fixedContentHeight);
  }

  const artworkBottom = artworkTop + artworkHeight;

  let projectBoxY = 0;
  let rulesBoxY = 0;

  if (hasProject) {
    projectBoxY = artworkBottom + GAP_AFTER_ARTWORK;
    rulesBoxY = projectBoxY + projectBoxHeight + GAP_BETWEEN_BOXES;
  } else {
    rulesBoxY = artworkBottom + GAP_AFTER_ARTWORK;
  }

  return {
    artworkHeight,
    projectBoxY,
    projectBoxHeight,
    rulesBoxY,
    rulesBoxHeight,
  };
}

async function renderTechSvg(tech, mapping) {
  const layout = computeLayout(tech);

  ARTWORK_WINDOW.height = layout.artworkHeight;

  PROJECT_BOX.y = layout.projectBoxY;
  PROJECT_BOX.height = layout.projectBoxHeight;

  RULES_BOX.y = layout.rulesBoxY;
  RULES_BOX.height = layout.rulesBoxHeight;

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

  if (isProject(tech)) {
    body.push(renderProjectBox(tech.projectName, tech.projectDescription));
  }

  body.push(renderRulesBox(tech.description));

  return wrapSvg(body.join('\n'), tech.assetId, art.defs);
}

function isWellFormedSvg(content) {
  if (!content.startsWith('<svg')) return false;
  if (!content.trim().endsWith('</svg>')) return false;
  const opens = (content.match(/<svg/g) || []).length;
  const closes = (content.match(/<\/svg>/g) || []).length;
  return opens === 1 && closes === 1;
}

const EXTERNAL_PATTERNS = [
  { name: 'non-data href', re: /href="(?!data:)/ },
  { name: 'url(http', re: /url\(https?:\/\// },
  { name: '@import', re: /@import\s/ },
  { name: '<link', re: /<link\s/ },
];

function validateSelfContained(content, assetId) {
  for (const { name, re } of EXTERNAL_PATTERNS) {
    if (re.test(content)) {
      throw new Error(`Self-contained validation failed for ${assetId}: pattern "${name}"`);
    }
  }
  return true;
}

async function main() {
  console.log('Optimizing tech artwork assets...');
  const opt = await optimizeTechAssets();
  console.log(`  Domains: ${opt.domainCount} files, Overlays: ${opt.overlayCount} files → generated/optimized-tech-assets/`);

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

    if (!validateSelfContained(svg, tech.assetId)) {
      throw new Error(`External reference detected in ${tech.assetId}`);
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

  generateFontCss();
  console.log(`Generated ${written.length} technology cards in ${OUTPUT_DIR}`);
  console.log(`Embedded ${getEmbeddedFontCount()} font faces: ${getEmbeddedFontNames().join(', ')}`);
  console.log('All SVGs are self-contained: ✓ artwork embedded, ✓ fonts embedded, ✓ no external references');
  if (missingAssets.length) {
    console.log(`WARNING: ${missingAssets.length} artwork asset(s) not found (falling back to placeholder):`);
    for (const m of missingAssets) {
      console.log(`  ${m.id}: missing ${m.kind} "${m.value}"`);
    }
  }

  console.log('\nRunning SVGO optimization...');
  try {
    execSync(`node "${SVGO_SCRIPT}" --tech-only`, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error('SVGO optimization failed:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('tech-cards build failed:');
  console.error(err.message);
  process.exit(1);
});
