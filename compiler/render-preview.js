const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'generated', 'models', 'planets.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'preview');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.html');

const SHOW_COORD_MARKERS = true;
const SHOW_RESOURCE_INDICES = true;
const SHOW_BOUNDING_BOX = true;

const RESOURCE_COLORS = {
  algae: '#4CAF50',
  crate: '#8D6E63',
  electronics: '#42A5F5',
  grain: '#FFC107',
  human: '#EC407A',
  ore: '#78909C',
  robot: '#26C6DA',
  water: '#5C6BC0',
};

const VALID_RESOURCES = Object.keys(RESOURCE_COLORS);
const VALID_LEVELS = [1, 2, 3];

const TYPE_DISPLAY = {
  cold: 'Cold', earth: 'Earth', forge: 'Forge', ice: 'Ice',
  jungle: 'Jungle', ocean: 'Ocean', proto: 'Proto', scrap: 'Scrap', swamp: 'Swamp',
};

const VALID_TYPES = Object.keys(TYPE_DISPLAY);

function validatePlanets(planets) {
  const errors = [];
  const seenIds = new Set();

  planets.forEach((planet, idx) => {
    if (!planet.id) {
      errors.push(`Planet at index ${idx}: missing id`);
    } else if (seenIds.has(planet.id)) {
      errors.push(`Duplicate planet id: ${planet.id}`);
    }
    seenIds.add(planet.id);

    if (!planet.planetType) {
      errors.push(`Planet ${planet.id || idx}: missing planetType`);
    } else {
      if (!planet.planetType.id) errors.push(`Planet ${planet.id}: missing planetType.id`);
      else if (!VALID_TYPES.includes(planet.planetType.id)) {
        errors.push(`Planet ${planet.id}: unknown planet type "${planet.planetType.id}"`);
      }
      if (!planet.planetType.displayName) {
        errors.push(`Planet ${planet.id}: missing planetType.displayName`);
      }
    }

    if (!planet.inputs || !planet.outputs) {
      errors.push(`Planet ${planet.id}: missing inputs or outputs arrays`);
      return;
    }

    const allResources = [...planet.inputs, ...planet.outputs];
    const positionKeys = new Set();

    allResources.forEach((res, ri) => {
      if (!res.resource || !res.resource.id) {
        errors.push(`Planet ${planet.id}: resource at index ${ri} missing resource.id`);
      } else {
        if (!VALID_RESOURCES.includes(res.resource.id)) {
          errors.push(`Planet ${planet.id}: unknown resource type "${res.resource.id}"`);
        }
        if (!res.resource.displayName) {
          errors.push(`Planet ${planet.id}: resource "${res.resource.id}" missing displayName`);
        }
      }

      if (res.level === undefined || res.level === null) {
        errors.push(`Planet ${planet.id}: resource at index ${ri} missing level`);
      } else if (!VALID_LEVELS.includes(res.level)) {
        errors.push(`Planet ${planet.id}: resource at index ${ri} has invalid level ${res.level}`);
      }

      if (!res.position || res.position.x === undefined || res.position.y === undefined) {
        errors.push(`Planet ${planet.id}: resource "${res.resource?.id}" at index ${ri} missing coordinates`);
      } else {
        const pk = `${res.position.x},${res.position.y}`;
        if (positionKeys.has(pk)) {
          errors.push(`Planet ${planet.id}: duplicate position ${pk} for resource "${res.resource?.id}"`);
        }
        positionKeys.add(pk);
      }
    });
  });

  if (errors.length > 0) {
    console.error('VALIDATION FAILED');
    console.error(errors.join('\n'));
    process.exit(1);
  }
}

function computeStats(planets) {
  const typeCounts = {};
  const resourceCounts = {};
  let totalResources = 0;

  planets.forEach(planet => {
    const type = planet.planetType?.id || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    [...(planet.inputs || []), ...(planet.outputs || [])].forEach(res => {
      const rid = res.resource?.id || 'unknown';
      resourceCounts[rid] = (resourceCounts[rid] || 0) + 1;
      totalResources++;
    });
  });

  return { typeCounts, resourceCounts, totalResources };
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generatePlanetCard(planet, planetIndex) {
  const typeInfo = planet.planetType || {};
  const typeId = typeInfo.id || 'unknown';
  const displayName = typeInfo.displayName || typeId;
  const idParts = planet.id.split('_');
  const versionSuffix = idParts.length > 2 ? idParts[idParts.length - 1] : '';

  const allResources = [...(planet.inputs || []), ...(planet.outputs || [])];

  let resourcesHtml = '';
  allResources.forEach((res, ri) => {
    const isInput = ri < (planet.inputs || []).length;
    const x = res.position.x;
    const y = res.position.y;
    const color = RESOURCE_COLORS[res.resource?.id] || '#999';
    const label = `${res.resource?.displayName || '?'} L${res.level}`;

    resourcesHtml += `
            <div class="res" style="left:${x}%;top:${y}%">
              <span class="dot" style="background:${color}"></span>
              <span class="rlab">${escapeHtml(label)}</span>
              ${SHOW_RESOURCE_INDICES ? `<span class="ridx">#${ri}</span>` : ''}
              ${SHOW_COORD_MARKERS ? `<span class="rcoord">(${x},${y})</span>` : ''}
              <span class="io-tag ${isInput ? 'input' : 'output'}">${isInput ? 'IN' : 'OUT'}</span>
            </div>`;
  });

  const inputCount = (planet.inputs || []).length;
  const outputCount = (planet.outputs || []).length;

  const boundingBoxClass = SHOW_BOUNDING_BOX ? ' with-bbox' : '';

  return `
          <div class="card${boundingBoxClass}">
            <div class="card-header">
              <div class="card-title">${escapeHtml(displayName)} <span class="card-type">${escapeHtml(typeId)}</span></div>
              <div class="card-id">${escapeHtml(planet.id)}${versionSuffix ? ` <span class="card-version">v${escapeHtml(versionSuffix)}</span>` : ''}</div>
            </div>
            <div class="card-body">
              ${resourcesHtml}
              <div class="card-resource-count">${inputCount} in / ${outputCount} out</div>
            </div>
          </div>`;
}

function generateStatsPanel(stats) {
  const sortedTypes = Object.keys(TYPE_DISPLAY).sort();
  const sortedResources = Object.keys(RESOURCE_COLORS).sort();

  let typesHtml = sortedTypes.map(t => {
    const count = stats.typeCounts[t] || 0;
    return `<li>${TYPE_DISPLAY[t]}: ${count}</li>`;
  }).join('\n');

  let resourcesHtml = sortedResources.map(r => {
    const count = stats.resourceCounts[r] || 0;
    return `<li><span class="stat-dot" style="background:${RESOURCE_COLORS[r]}"></span> ${RESOURCE_COLORS[r] ? '' : ''}${RESOURCE_COLORS[r] ? '' : ''}${r}: ${count}</li>`;
  }).join('\n');

  return `
    <div class="stats-panel">
      <h1>Planet Preview Renderer <span class="subtitle">(Validation Tool)</span></h1>
      <div class="stats-grid">
        <div class="stat-section">
          <h2>Planets: ${Object.values(stats.typeCounts).reduce((a, b) => a + b, 0)}</h2>
          <ul>${typesHtml}</ul>
        </div>
        <div class="stat-section">
          <h2>Resources: ${stats.totalResources}</h2>
          <ul>${resourcesHtml}</ul>
        </div>
      </div>
    </div>`;
}

function generateHTML(planets, stats) {
  const cardsHtml = planets.map((p, i) => generatePlanetCard(p, i)).join('\n');
  const statsHtml = generateStatsPanel(stats);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Planet Preview Renderer</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
  padding: 20px;
}
.stats-panel {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}
.stats-panel h1 {
  font-size: 20px;
  margin-bottom: 12px;
  color: #e94560;
}
.stats-panel .subtitle {
  font-weight: normal;
  font-size: 14px;
  color: #8899aa;
}
.stats-grid {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}
.stat-section h2 {
  font-size: 14px;
  color: #8899aa;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.stat-section ul {
  list-style: none;
  columns: 2;
  column-gap: 20px;
}
.stat-section li {
  font-size: 13px;
  padding: 2px 0;
  color: #c0c0c0;
}
.stat-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.card {
  background: #1e2a3a;
  border: 1px solid #2a3a4a;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
.card.with-bbox .card-body {
  border: 1px dashed #e94560;
}
.card-header {
  padding: 10px 12px;
  background: #0f1a2a;
  border-bottom: 2px solid #2a3a4a;
}
.card-title {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}
.card-type {
  font-size: 11px;
  color: #8899aa;
  font-weight: normal;
}
.card-id {
  font-size: 10px;
  color: #5a6a7a;
  margin-top: 2px;
}
.card-version {
  color: #e94560;
}
.card-body {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
  margin: 0;
}
.res {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  pointer-events: none;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.3);
}
.rlab {
  font-size: 10px;
  color: #e0e0e0;
  text-shadow: 0 0 3px #000, 0 0 3px #000;
  line-height: 1;
}
.ridx {
  font-size: 8px;
  color: #8899aa;
  background: rgba(0,0,0,0.6);
  padding: 0 3px;
  border-radius: 2px;
}
.rcoord {
  font-size: 8px;
  color: #5a6a7a;
  background: rgba(0,0,0,0.6);
  padding: 0 3px;
  border-radius: 2px;
  display: none;
}
.card:hover .rcoord {
  display: inline;
}
.io-tag {
  font-size: 7px;
  padding: 0 3px;
  border-radius: 2px;
  font-weight: bold;
}
.io-tag.input {
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.15);
}
.io-tag.output {
  color: #42A5F5;
  background: rgba(66, 165, 245, 0.15);
}
.card-resource-count {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 9px;
  color: #5a6a7a;
}
@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; }
  .stat-section ul { columns: 1; }
}
</style>
</head>
<body>
${statsHtml}
<div class="grid">
${cardsHtml}
</div>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`ERROR: Input file not found: ${INPUT_FILE}`);
    console.error('Run compiler/build-card-model.js first to generate planets.json');
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_FILE, 'utf-8');
  const data = JSON.parse(raw);

  if (!data.planets || !Array.isArray(data.planets)) {
    console.error('ERROR: planets.json does not contain a valid "planets" array');
    process.exit(1);
  }

  console.log(`Validating ${data.planets.length} planets...`);
  validatePlanets(data.planets);
  console.log('Validation passed.');

  const stats = computeStats(data.planets);

  console.log('Generating HTML...');
  const html = generateHTML(data.planets, stats);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

  console.log(`\nGenerated: ${OUTPUT_FILE}`);
  console.log(`Planets: ${data.planets.length}`);
  console.log(`Total resources: ${stats.totalResources}`);
  console.log(`\nOpen file://${OUTPUT_FILE} in a browser to preview.`);
}

main();
