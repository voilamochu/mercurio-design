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
  ARTWORK_FULL,
  ARTWORK_PREFERRED_HEIGHT,
  ARTWORK_MIN_HEIGHT,
  OUTER_FRAME,
  PROJECT_BOX,
  RULES_BOX,
  TITLE_BAR,
  GAP_AFTER_ARTWORK,
  GAP_BETWEEN_BOXES,
  computeLineCount,
  computeBoxHeight,
} = require('./lib/technology/layout');
const { CARD, BOX } = require('./lib/shared/card');
const { stackBoxes } = require('./lib/shared/stack');

const { renderOuterFrame } = require('./lib/technology/frame');
const { renderTitleBar, wrapTitle, computeTitleHeight } = require('./lib/technology/title');
const { renderProjectBox } = require('./lib/technology/project');
const { renderRulesBox } = require('./lib/technology/rules');

const { wrapSvg } = require('./lib/technology/svg');
const { renderArtwork, loadDomain, loadOverlay } = require('./lib/technology/artwork-compositor');
const { generateFontCss, getEmbeddedFontCount, getEmbeddedFontNames } = require('./lib/svg/font-embed');
const { optimizeTechAssets } = require('./lib/technology/optimize-tech-assets');

function isProject(tech) {
  return tech.type === 'Project';
}

function computeArtworkTop(tech) {
  if (tech) {
    const { lines } = wrapTitle(tech.name, tech.romanLevel);
    const h = computeTitleHeight(lines);
    TITLE_BAR.height = h;
  }
  return TITLE_BAR.y;
}

function computeLayout(tech) {
  // Title height flex via wrapTitle (80h at y12 for single line, taller if wrapped)
  computeArtworkTop(tech);

  const innerWidth = PROJECT_BOX.width - PROJECT_BOX.paddingX * 2;

  let effectBoxHeight = 0;
  const hasProject = isProject(tech);
  if (hasProject) {
    const descText = tech.projectDescription ? tech.projectDescription : '';
    const descLines = descText ? computeLineCount(descText, PROJECT_BOX.descFont, innerWidth) : 0;
    effectBoxHeight = descLines > 0 ? computeBoxHeight(descLines, PROJECT_BOX.descFont) : 0;
  }

  const rulesLines = computeLineCount(tech.description, RULES_BOX.font, innerWidth);
  const rulesBoxHeight = rulesLines > 0 ? computeBoxHeight(rulesLines, RULES_BOX.font) : 0;

  // Art is full-bleed 500x700 background (not a window), boxes stacked below title with standardized gap 8 via stackBoxes
  const boxes = [];
  boxes.push({ height: rulesBoxHeight });
  if (hasProject) boxes.push({ height: effectBoxHeight });
  // stackBoxes uses TITLE as anchor: y = TITLE.y + TITLE.height + gapAfterArt
  const stacked = stackBoxes(TITLE_BAR.y, TITLE_BAR.height, boxes);
  const rulesBoxY = stacked.boxes[0] ? stacked.boxes[0].y : 0;
  const effectBoxY = hasProject ? (stacked.boxes[1] ? stacked.boxes[1].y : 0) : 0;

  // Art is full-bleed 500x700 at 0,0 — not computed as window height; return full for artwork
  const artworkHeight = CARD.H;
  const artworkY = 0;

  return {
    artworkY,
    artworkHeight,
    effectBoxY,
    effectBoxHeight,
    rulesBoxY,
    rulesBoxHeight,
  };
}

async function renderTechSvg(tech, mapping) {
  const layout = computeLayout(tech);

  PROJECT_BOX.y = layout.effectBoxY;
  PROJECT_BOX.height = layout.effectBoxHeight;

  RULES_BOX.y = layout.rulesBoxY;
  RULES_BOX.height = layout.rulesBoxHeight;

  const entry = mapping[tech.id];
  if (!entry) {
    throw new Error(`No artwork mapping for technology id: ${tech.id}`);
  }

  // Art is full-bleed 500x700 background at 0,0 with preserveAspectRatio slice (like planet)
  const art = await renderArtwork(tech.assetId, ARTWORK_FULL, entry.domain, entry.overlay);

  // Z-order: art at very back (full-bleed), then title/rules/project translucent boxes (0.78) on top of art, border stroke last on top
  // Title is on top of card at y12 80h, boxes stacked with gap 8 via stackBoxes, all full-width 500 x0 rx0 with paddingX24 so text not under border
  const body = [
    art.body,
    renderTitleBar(tech.name, tech.romanLevel),
  ];

  body.push(renderRulesBox(tech.description));

  if (isProject(tech)) {
    body.push(renderProjectBox(tech.projectDescription));
  }

  body.push(renderOuterFrame(tech.frameStyle));

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
