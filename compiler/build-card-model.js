const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, '..', 'source', 'csv', 'planets');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'models');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'planets.json');

const RESOURCES_CSV = path.join(CSV_DIR, 'PlanetResources_v3.csv');

const TYPES_CSV = path.join(CSV_DIR, 'PlanetType_v3.csv');

const RESOURCE_DISPLAY_NAMES = {
  algae: 'Algae',
  crate: 'Crate',
  electronics: 'Electronics',
  grain: 'Grain',
  human: 'Human',
  ore: 'Ore',
  robot: 'Robot',
  water: 'Water',
};

const TYPE_ARTWORK = {
  cold: 'cold-v2',
  earth: 'earth-v2',
  forge: 'forge-v2',
  ice: 'ice-v2',
  jungle: 'jungle-v2',
  ocean: 'ocean-v2',
  proto: 'proto-v2',
  scrap: 'scrap-v2',
  swamp: 'swamp-v2',
};

const BACKGROUND = 'deep-space-v1';

const LEVELS = [1, 2, 3];

const { CARD } = require('./lib/shared/card');
const CARD_W = CARD.W;
const CARD_H = CARD.H;
const PANEL_W = 446;
const PANEL_H = 362;
const BOTTOM_MARGIN = CARD.MARGIN;
const INPUT_CELL_CENTER_X = 114;
const OUTPUT_CELL_CENTER_X = 386;
const ICON_SIZE = 108;
const ICON_DUAL_OFFSET = 55;

function loadCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = idx < values.length ? values[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

function parseResourceCell(cell) {
  if (!cell) return [];
  const x2Match = cell.match(/^(.+?)\s+X2$/);
  if (x2Match) {
    const name = x2Match[1].trim();
    return [name, name];
  }
  return cell.split('+').map(r => r.trim()).filter(Boolean);
}

function buildResourceEntry(resourceName) {
  const id = resourceName.toLowerCase();
  if (!RESOURCE_DISPLAY_NAMES[id]) {
    throw new Error(`Unknown resource: "${resourceName}"`);
  }
  return {
    resource: {
      id,
      displayName: RESOURCE_DISPLAY_NAMES[id],
    },
  };
}

function computeStageCenters(panelY, panelH, stageCount) {
  if (stageCount === 2) {
    const rowH = panelH / 3;
    return [
      Math.round(panelY + rowH / 2),
      Math.round(panelY + rowH + (panelH - rowH) / 2),
    ];
  }
  const centers = [];
  for (let i = 0; i < stageCount; i++) {
    centers.push(Math.round(panelY + (i + 0.5) * panelH / stageCount));
  }
  return centers;
}

const PANEL_X = Math.round((CARD_W - PANEL_W) / 2);
const PANEL_Y = CARD_H - BOTTOM_MARGIN - PANEL_H;

const LAYOUT_TEMPLATES = [
  {
    id: 'stage-1',
    stageCount: 1,
    inputRowYCenters: computeStageCenters(PANEL_Y, PANEL_H, 1),
    outputRowYCenters: computeStageCenters(PANEL_Y, PANEL_H, 3),
  },
  {
    id: 'stage-2',
    stageCount: 2,
    inputRowYCenters: computeStageCenters(PANEL_Y, PANEL_H, 2),
    outputRowYCenters: computeStageCenters(PANEL_Y, PANEL_H, 3),
  },
  {
    id: 'stage-3',
    stageCount: 3,
    inputRowYCenters: computeStageCenters(PANEL_Y, PANEL_H, 3),
    outputRowYCenters: computeStageCenters(PANEL_Y, PANEL_H, 3),
  },
];

function getStageCount(resourceRow) {
  const levels = new Set();
  LEVELS.forEach(level => {
    const inputCell = resourceRow[`Level${level}_Input`] || '';
    if (inputCell) levels.add(level);
  });
  return Math.max(1, levels.size);
}

function getLayoutTemplateId(stageCount) {
  if (stageCount === 1) return 'stage-1';
  if (stageCount === 2) return 'stage-2';
  return 'stage-3';
}

function buildPlanetModel(resourceRow, typeRow) {
  const cardFilename = resourceRow.Card_Filename;
  const cardId = cardFilename.replace(/\.webp$/i, '');
  const planetTypeName = typeRow.Type;
  const planetTypeId = planetTypeName.toLowerCase();

  if (!TYPE_ARTWORK[planetTypeId]) {
    throw new Error(`Unknown planet type: "${planetTypeName}" for ${cardFilename}`);
  }

  const stageCount = getStageCount(resourceRow);

  const inputs = [];
  const outputs = [];

  LEVELS.forEach(level => {
    const inputCell = resourceRow[`Level${level}_Input`] || '';
    const inputResources = parseResourceCell(inputCell);
    inputResources.forEach(resName => {
      const entry = buildResourceEntry(resName);
      entry.level = level;
      inputs.push(entry);
    });

    const outputCell = resourceRow[`Level${level}_Output`] || '';
    const outputResources = parseResourceCell(outputCell);
    outputResources.forEach(resName => {
      const entry = buildResourceEntry(resName);
      entry.level = level;
      outputs.push(entry);
    });
  });

  return {
    id: cardId,
    planetType: {
      id: planetTypeId,
      displayName: planetTypeName,
      artwork: TYPE_ARTWORK[planetTypeId],
      background: BACKGROUND,
    },
    layoutTemplate: getLayoutTemplateId(stageCount),
    inputs,
    outputs,
  };
}

function validatePlanetModel(planets) {
  const errors = [];
  const seenIds = new Set();

  planets.forEach((planet, idx) => {
    if (!planet.id) {
      errors.push(`Planet at index ${idx} is missing id`);
    } else if (seenIds.has(planet.id)) {
      errors.push(`Duplicate planet id: ${planet.id}`);
    }
    seenIds.add(planet.id);

    if (!planet.planetType) {
      errors.push(`Planet ${planet.id}: missing planetType`);
    } else {
      if (!planet.planetType.id) errors.push(`Planet ${planet.id}: missing planetType.id`);
      if (!planet.planetType.displayName) errors.push(`Planet ${planet.id}: missing planetType.displayName`);
      if (!planet.planetType.artwork) errors.push(`Planet ${planet.id}: missing planetType.artwork mapping`);
    }

    if (!planet.layoutTemplate) {
      errors.push(`Planet ${planet.id}: missing layoutTemplate`);
    } else if (!LAYOUT_TEMPLATES.find(t => t.id === planet.layoutTemplate)) {
      errors.push(`Planet ${planet.id}: unknown layoutTemplate "${planet.layoutTemplate}"`);
    }

    [...planet.inputs, ...planet.outputs].forEach(res => {
      if (!res.resource || !res.resource.id) {
        errors.push(`Planet ${planet.id}: resource missing resource id`);
      }
      if (!res.resource || !res.resource.displayName) {
        errors.push(`Planet ${planet.id}: resource missing displayName`);
      }
      if (res.level === undefined) {
        errors.push(`Planet ${planet.id}: resource ${res.resource?.id} missing level`);
      }
    });
  });

  if (errors.length > 0) {
    throw new Error('Validation failed:\n' + errors.join('\n'));
  }
}

function main() {
  const resourceRows = loadCsv(RESOURCES_CSV);
  const typeRows = loadCsv(TYPES_CSV);

  const typeIndex = {};
  typeRows.forEach(row => { typeIndex[row.Card_Filename] = row; });

  const planets = [];

  resourceRows.forEach(resourceRow => {
    const cardFilename = resourceRow.Card_Filename;
    const typeRow = typeIndex[cardFilename];
    if (!typeRow) throw new Error(`Missing planet type for ${cardFilename}`);

    planets.push(buildPlanetModel(resourceRow, typeRow));
  });

  validatePlanetModel(planets);

  const output = {
    schema: 'v2',
    generatedAt: new Date().toISOString(),
    planetCount: planets.length,
    card: {
      width: CARD_W,
      height: CARD_H,
    },
    panel: {
      x: PANEL_X,
      y: PANEL_Y,
      width: PANEL_W,
      height: PANEL_H,
      bottomMargin: BOTTOM_MARGIN,
    },
    icon: {
      size: ICON_SIZE,
      dualOffset: ICON_DUAL_OFFSET,
      inputCellCenterX: INPUT_CELL_CENTER_X,
      outputCellCenterX: OUTPUT_CELL_CENTER_X,
    },
    layoutTemplates: LAYOUT_TEMPLATES,
    planets,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');

  console.log(`Generated ${OUTPUT_FILE} with ${planets.length} planets`);
  console.log(`Layout templates: ${LAYOUT_TEMPLATES.map(t => t.id).join(', ')}`);
}

main();
