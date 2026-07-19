const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODEL_FILE = path.join(ROOT, 'generated', 'models', 'technologies.json');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'cards-tech');

const EXPECTED_COUNT = 40;

const {
  RULES_BOX,
  FOOTER,
  PROJECT_BOX,
} = require('./lib/technology/layout');

const { renderOuterFrame } = require('./lib/technology/frame');
const { renderArtworkWindow } = require('./lib/technology/artwork');
const { renderTitleBar } = require('./lib/technology/title');
const { renderProjectBox } = require('./lib/technology/project');
const { renderRulesBox } = require('./lib/technology/rules');
const { renderFooter } = require('./lib/technology/footer');
const { wrapSvg } = require('./lib/technology/svg');

function isProject(tech) {
  return tech.type === 'Project';
}

function computeRulesBoxY(hasProject) {
  if (hasProject) {
    return PROJECT_BOX.y + PROJECT_BOX.height + 16;
  }
  const { TITLE_BAR } = require('./lib/technology/layout');
  return TITLE_BAR.y + TITLE_BAR.height + 16;
}

function computeFooterY(rulesY) {
  return rulesY + RULES_BOX.height + 16;
}

function renderTechSvg(tech) {
  const hasProject = isProject(tech);

  const rulesY = computeRulesBoxY(hasProject);
  RULES_BOX.y = rulesY;

  const footerY = computeFooterY(rulesY);
  FOOTER.y = footerY;

  const body = [
    renderOuterFrame(),
    renderArtworkWindow(),
    renderTitleBar(tech.name, tech.romanLevel),
  ];

  if (hasProject) {
    body.push(renderProjectBox(tech.projectName, tech.projectDescription));
  }

  body.push(renderRulesBox(tech.description));
  body.push(renderFooter(tech.displayType));

  return wrapSvg(body.join('\n'), tech.assetId);
}

function isWellFormedSvg(content) {
  if (!content.startsWith('<svg')) return false;
  if (!content.trim().endsWith('</svg>')) return false;
  const opens = (content.match(/<svg/g) || []).length;
  const closes = (content.match(/<\/svg>/g) || []).length;
  return opens === 1 && closes === 1;
}

function main() {
  if (!fs.existsSync(MODEL_FILE)) {
    throw new Error(`Renderer model not found: ${MODEL_FILE}. Run npm run build:tech-model first.`);
  }

  const model = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf-8'));
  const technologies = model.technologies;

  if (!technologies || technologies.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} technologies, found ${technologies ? technologies.length : 0}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const written = [];
  const seenFilenames = new Set();

  for (const tech of technologies) {
    const svg = renderTechSvg(tech);
    const filename = `${tech.assetId}.svg`;

    if (seenFilenames.has(filename)) {
      throw new Error(`Duplicate output filename: ${filename}`);
    }
    seenFilenames.add(filename);

    if (!isWellFormedSvg(svg)) {
      throw new Error(`Malformed SVG for ${tech.assetId}`);
    }

    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, svg, 'utf-8');
    written.push(filename);
  }

  if (written.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} SVGs, wrote ${written.length}`);
  }

  console.log(`Generated ${written.length} technology cards in ${OUTPUT_DIR}`);
}

main();
