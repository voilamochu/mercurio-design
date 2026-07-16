const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  model: path.join(ROOT, 'generated', 'models', 'planets.json'),
  icons: path.join(ROOT, 'source', 'icons', 'resources'),
  artworkPlanets: path.join(ROOT, 'source', 'artwork', 'cards', 'planet', 'planets'),
  outputDir: path.join(ROOT, 'generated', 'render-preview'),
  outputFile: path.join(ROOT, 'generated', 'render-preview', 'final-planet-card.svg'),
};

const CARD_W = 744;
const CARD_H = 1039;

const ROW_Y_PCT = [57, 73, 89];
const DIVIDER_LINE_START = 36;
const DIVIDER_LINE_END = 708;
const DIVIDER_COLOR = '#8F8575';
const DIVIDER_STROKE_WIDTH = 3;
const DIVIDER_OPACITY = 0.85;

const INPUT_CELL_CENTER_X = 160;
const OUTPUT_CELL_CENTER_X = 584;
const ICON_SIZE = 80;
const TWO_ICON_OFFSET = 50;

const WATERMARK_PATCH_X = 620;
const WATERMARK_PATCH_Y = 920;
const WATERMARK_PATCH_SIZE = 74;
const WATERMARK_PATCH_COLOR = '#080D1A';

const RESOURCE_ICON_MAP = {
  algae: 'Algae.png',
  crate: 'Crate.png',
  electronics: 'Electronics.png',
  grain: 'Grain.png',
  human: 'Human.png',
  ore: 'Ore.png',
  robot: 'Robot.png',
  water: 'Water.png',
};

function fail(msg) {
  console.error('ERROR:', msg);
  process.exit(1);
}

function exists(p) {
  return fs.existsSync(p);
}

function findArtworkV2(typeId) {
  for (const v of [`${typeId}-v2.png`, `${typeId}_v2.png`]) {
    const p = path.join(PATHS.artworkPlanets, v);
    if (exists(p)) return p;
  }
  fail(`No V2 artwork found for planet type "${typeId}"`);
}

function loadPlanetData() {
  const raw = JSON.parse(fs.readFileSync(PATHS.model, 'utf-8'));
  if (!raw.planets || !raw.planets.length) fail('planets.json has no planets array');
  const planet = raw.planets.find(p => p.planetType.id === 'earth');
  if (!planet) fail('No Earth planet found in model data');
  return planet;
}

function loadIconDataUri(resourceId) {
  const filename = RESOURCE_ICON_MAP[resourceId];
  if (!filename) return null;
  const p = path.join(PATHS.icons, filename);
  if (!exists(p)) return null;
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
}

function groupByLevelSide(planet) {
  const groups = {};
  for (let level = 1; level <= 3; level++) {
    const ins = planet.inputs.filter(r => r.level === level);
    const outs = planet.outputs.filter(r => r.level === level);
    groups[level] = { inputs: ins, outputs: outs };
  }
  return groups;
}

function buildIconData(planet) {
  const uriCache = {};
  const allIds = new Set();
  for (const r of [...planet.inputs, ...planet.outputs]) allIds.add(r.resource.id);
  for (const id of allIds) {
    const uri = loadIconDataUri(id);
    if (uri) uriCache[id] = uri;
  }
  return uriCache;
}

function iconCenters(count, cellCenter, offset) {
  if (count === 0) return [];
  if (count === 1) return [cellCenter];
  const centers = [];
  for (let i = 0; i < count; i++) {
    const c = cellCenter + (i - (count - 1) / 2) * offset * 2;
    centers.push(Math.round(c));
  }
  return centers;
}

function render() {
  const planet = loadPlanetData();
  const groups = groupByLevelSide(planet);
  const icons = buildIconData(planet);
  const artworkFile = findArtworkV2(planet.planetType.id);
  const artworkRel = path.relative(PATHS.outputDir, artworkFile);

  const rowY = ROW_Y_PCT.map(p => Math.round((p / 100) * CARD_H));

  const dividerLines = [];
  for (let i = 0; i < rowY.length - 1; i++) {
    dividerLines.push(Math.round((rowY[i] + rowY[i + 1]) / 2));
  }

  const iconLines = [];
  for (let level = 1; level <= 3; level++) {
    const y = rowY[level - 1];
    const g = groups[level];
    if (!g) continue;

    const inputCenters = iconCenters(g.inputs.length, INPUT_CELL_CENTER_X, TWO_ICON_OFFSET);
    const outputCenters = iconCenters(g.outputs.length, OUTPUT_CELL_CENTER_X, TWO_ICON_OFFSET);

    for (let i = 0; i < g.inputs.length; i++) {
      const uri = icons[g.inputs[i].resource.id];
      if (!uri) continue;
      const cx = inputCenters[i];
      iconLines.push(`    <image href="${uri}" x="${cx - ICON_SIZE / 2}" y="${y - ICON_SIZE / 2}" width="${ICON_SIZE}" height="${ICON_SIZE}" />`);
    }

    for (let i = 0; i < g.outputs.length; i++) {
      const uri = icons[g.outputs[i].resource.id];
      if (!uri) continue;
      const cx = outputCenters[i];
      iconLines.push(`    <image href="${uri}" x="${cx - ICON_SIZE / 2}" y="${y - ICON_SIZE / 2}" width="${ICON_SIZE}" height="${ICON_SIZE}" />`);
    }
  }

  const dividersSvg = dividerLines.map(y =>
    `    <line x1="${DIVIDER_LINE_START}" y1="${y}" x2="${DIVIDER_LINE_END}" y2="${y}" stroke="${DIVIDER_COLOR}" stroke-width="${DIVIDER_STROKE_WIDTH}" opacity="${DIVIDER_OPACITY}" />`
  ).join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
  <image href="${artworkRel}" x="0" y="0" width="${CARD_W}" height="${CARD_H}" preserveAspectRatio="xMidYMid slice" />

  <rect x="${WATERMARK_PATCH_X}" y="${WATERMARK_PATCH_Y}" width="${WATERMARK_PATCH_SIZE}" height="${WATERMARK_PATCH_SIZE}" fill="${WATERMARK_PATCH_COLOR}" />

  <g id="top-layer">
${dividersSvg}
${iconLines.join('\n')}
  </g>
</svg>`;

  fs.mkdirSync(PATHS.outputDir, { recursive: true });
  fs.writeFileSync(PATHS.outputFile, svg, 'utf-8');

  const totalIcons = (svg.match(/<image/g) || []).length - 1;

  console.log(`  Planet: ${planet.id} (${planet.planetType.displayName})`);
  console.log(`  Inputs: ${planet.inputs.length}, Outputs: ${planet.outputs.length}`);
  console.log(`  Row Y positions: ${rowY.join(', ')} (from ${ROW_Y_PCT.join('%, ') + '%'})`);
  console.log(`  Dividers at Y: ${dividerLines.join(', ')}`);
  console.log(`  Icon centers: L1 inputs@${iconCenters(groups[1].inputs.length, INPUT_CELL_CENTER_X, TWO_ICON_OFFSET).join(',')}, outputs@${iconCenters(groups[1].outputs.length, OUTPUT_CELL_CENTER_X, TWO_ICON_OFFSET).join(',')}`);
  console.log(`  Icon centers: L2 inputs@${iconCenters(groups[2].inputs.length, INPUT_CELL_CENTER_X, TWO_ICON_OFFSET).join(',')}, outputs@${iconCenters(groups[2].outputs.length, OUTPUT_CELL_CENTER_X, TWO_ICON_OFFSET).join(',')}`);
  console.log(`  Icon centers: L3 inputs@${iconCenters(groups[3].inputs.length, INPUT_CELL_CENTER_X, TWO_ICON_OFFSET).join(',')}, outputs@${iconCenters(groups[3].outputs.length, OUTPUT_CELL_CENTER_X, TWO_ICON_OFFSET).join(',')}`);
  console.log(`\nGenerated: ${PATHS.outputFile}`);
  console.log(`  Size: ${svg.length} bytes`);
  console.log(`  Resource icons: ${totalIcons}`);
}

render();
