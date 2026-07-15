const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  planets: path.join(ROOT, 'generated', 'models', 'planets.json'),
  iconsResources: path.join(ROOT, 'source', 'icons', 'resources'),
  artworkBg: path.join(ROOT, 'source', 'artwork', 'cards', 'planet', 'backgrounds'),
  artworkPlanets: path.join(ROOT, 'source', 'artwork', 'cards', 'planet', 'planets'),
  output: path.join(ROOT, 'generated', 'svg', 'debug', 'card-preview.svg'),
};

const VALID_TYPES = ['cold', 'earth', 'forge', 'ice', 'jungle', 'ocean', 'proto', 'scrap', 'swamp'];
const VALID_RESOURCES = ['algae', 'crate', 'electronics', 'grain', 'human', 'ore', 'robot', 'water'];

const RESOURCE_ICON_MAP = {
  'algae': 'Algae.png',
  'crate': 'Crate.png',
  'electronics': 'Electronics.png',
  'grain': 'Grain.png',
  'human': 'Human.png',
  'ore': 'Ore.png',
  'robot': 'Robot.png',
  'water': 'Water.png',
};

const LAYOUT = {
  planetArtwork: { x: 544, y: 0, size: 200 },
  iconSize: 80,
  iconGap: 38,
  circleRadius: 57,
  inputStartX: 110,
  outputStartX: 430,
  rowY: [340, 540, 740],
};

function fail(message) {
  console.error('ERROR:', message);
  process.exit(1);
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  if (!fileExists(filePath)) {
    fail(`File not found: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    fail(`Failed to parse JSON: ${filePath} — ${err.message}`);
  }
}

function relativePath(fromFile, toFile) {
  return path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/');
}

function loadPlanetModel() {
  const data = readJson(PATHS.planets);

  if (!data.planets || !Array.isArray(data.planets) || data.planets.length === 0) {
    fail('planets.json must contain a non-empty "planets" array');
  }

  const planet = data.planets[0];

  if (!planet.planetType || !planet.planetType.id) {
    fail(`First planet (${planet.id || 'unknown'}) missing planetType.id`);
  }

  if (!VALID_TYPES.includes(planet.planetType.id)) {
    fail(`Unknown planet type "${planet.planetType.id}" for planet ${planet.id}. Valid types: ${VALID_TYPES.join(', ')}`);
  }

  if (!planet.inputs || !planet.outputs) {
    fail(`Planet ${planet.id} missing inputs or outputs array`);
  }

  const allResources = [...planet.inputs, ...planet.outputs];
  for (const res of allResources) {
    if (!res.resource || !res.resource.id) {
      fail(`Planet ${planet.id}: resource missing resource.id`);
    }
    if (!VALID_RESOURCES.includes(res.resource.id)) {
      fail(`Planet ${planet.id}: unknown resource "${res.resource.id}". Valid: ${VALID_RESOURCES.join(', ')}`);
    }
  }

  const bgFile = path.join(PATHS.artworkBg, `${planet.planetType.background || 'deep-space-v1'}.png`);
  if (!fileExists(bgFile)) {
    fail(`Background artwork not found: ${bgFile}`);
  }

  const planetArtFile = path.join(PATHS.artworkPlanets, `${planet.planetType.artwork || planet.planetType.id + '-v1'}.png`);
  if (!fileExists(planetArtFile)) {
    fail(`Planet artwork not found: ${planetArtFile}`);
  }

  return planet;
}

function loadResourceIconDataUri(resourceId) {
  const filename = RESOURCE_ICON_MAP[resourceId];
  if (!filename) {
    fail(`No icon mapping for resource "${resourceId}"`);
  }
  const iconPath = path.join(PATHS.iconsResources, filename);
  if (!fileExists(iconPath)) {
    fail(`Resource icon not found: ${iconPath}`);
  }
  const data = fs.readFileSync(iconPath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

function loadAllResourceIcons(planet) {
  const seen = new Set();
  const icons = {};

  for (const res of [...planet.inputs, ...planet.outputs]) {
    const id = res.resource.id;
    if (seen.has(id)) continue;
    seen.add(id);
    icons[id] = loadResourceIconDataUri(id);
  }

  return icons;
}

function renderBackground(planet, outputPath) {
  const bgFilename = `${planet.planetType.background || 'deep-space-v1'}.png`;
  const bgFile = path.join(PATHS.artworkBg, bgFilename);
  const relPath = relativePath(outputPath, bgFile);

  return `<image href="${relPath}" x="0" y="0" width="744" height="1039" preserveAspectRatio="xMidYMid slice"/>`;
}

function renderPlanet(planet, outputPath) {
  const artFilename = `${planet.planetType.artwork || planet.planetType.id + '-v1'}.png`;
  const artFile = path.join(PATHS.artworkPlanets, artFilename);
  const relPath = relativePath(outputPath, artFile);
  const { x, y, size } = LAYOUT.planetArtwork;

  return `<image href="${relPath}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
}

function renderResourceIcon(href, cx, cy) {
  const { iconSize, circleRadius } = LAYOUT;
  const halfIcon = iconSize / 2;
  return [
    `<circle cx="${cx}" cy="${cy}" r="${circleRadius}" fill="#3a3a3a" stroke="#666" stroke-width="3"/>`,
    `<image href="${href}" x="${cx - halfIcon}" y="${cy - halfIcon}" width="${iconSize}" height="${iconSize}"/>`,
  ].join('\n');
}

function renderResources(planet) {
  const icons = loadAllResourceIcons(planet);
  const { iconSize, iconGap, inputStartX, outputStartX, rowY } = LAYOUT;
  const groups = [];

  const inputsByLevel = { 1: [], 2: [], 3: [] };
  const outputsByLevel = { 1: [], 2: [], 3: [] };

  for (const inp of planet.inputs) {
    inputsByLevel[inp.level].push(inp);
  }
  for (const out of planet.outputs) {
    outputsByLevel[out.level].push(out);
  }

  for (let level = 1; level <= 3; level++) {
    const y = rowY[level - 1];
    const inputs = inputsByLevel[level];
    const outputs = outputsByLevel[level];

    for (let i = 0; i < inputs.length; i++) {
      const cx = inputStartX + i * (iconSize + iconGap) + iconSize / 2;
      const href = icons[inputs[i].resource.id];
      groups.push(renderResourceIcon(href, cx, y));
    }

    for (let i = 0; i < outputs.length; i++) {
      const cx = outputStartX + i * (iconSize + iconGap) + iconSize / 2;
      const href = icons[outputs[i].resource.id];
      groups.push(renderResourceIcon(href, cx, y));
    }
  }

  return groups.join('\n');
}

function assembleSvg(bgSvg, planetSvg, resourcesSvg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 744 1039" width="744" height="1039">
  <defs>
    <style>
      .icon { pointer-events: none; }
    </style>
  </defs>

  <!-- Layer 1: Deep Space Background -->
  ${bgSvg}

  <!-- Layer 2: Planet Artwork (decorative, upper-right) -->
  ${planetSvg}

  <!-- Layer 3: Resource Icons (PNG inside circles) -->
  <g id="resource-icons">
${resourcesSvg}
  </g>
</svg>`;
}

function writeSvg(svgContent) {
  const outputDir = path.dirname(PATHS.output);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(PATHS.output, svgContent, 'utf-8');
  console.log(`Generated: ${PATHS.output}`);
}

function main() {
  console.log('Mercurio SVG Renderer — Proof of Concept');
  console.log('━'.repeat(50));

  console.log('\nLoading planet model...');
  const planet = loadPlanetModel();
  console.log(`  Planet: ${planet.id} (${planet.planetType.displayName})`);
  console.log(`  Inputs: ${planet.inputs.length}, Outputs: ${planet.outputs.length}`);

  console.log('Rendering background...');
  const bgSvg = renderBackground(planet, PATHS.output);

  console.log('Rendering planet artwork (decorative, upper-right)...');
  const planetSvg = renderPlanet(planet, PATHS.output);

  console.log('Rendering resource icons with circles...');
  const resourcesSvg = renderResources(planet);

  console.log('Assembling SVG...');
  const svg = assembleSvg(bgSvg, planetSvg, resourcesSvg);

  console.log('Writing output...');
  writeSvg(svg);

  console.log('\nDone.');
}

main();
