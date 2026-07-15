const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, '..', 'source', 'csv', 'planets');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'models');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'planets.json');

const RESOURCES_CSV = path.join(CSV_DIR, 'PlanetResources_v3.csv');
const LAYOUT_CSV = path.join(CSV_DIR, 'Mercurio_planet_layout_v3.csv');
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
  cold: 'cold-v1',
  earth: 'earth-v1',
  forge: 'forge-v1',
  ice: 'ice-v1',
  jungle: 'jungle-v1',
  ocean: 'ocean-v1',
  proto: 'proto-v1',
  scrap: 'scrap-v1',
  swamp: 'swamp-v1',
};

const BACKGROUND = 'deep-space-v1';

const LEVELS = [1, 2, 3];

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

function parseLayoutRow(row) {
  const positions = { inputs: {}, outputs: {} };
  LEVELS.forEach(level => {
    const inputSlots = [];
    const outputSlots = [];
    for (let slot = 1; slot <= 2; slot++) {
      const ix = parseFloat(row[`ip_l${level}_${slot}_x`]);
      const iy = parseFloat(row[`ip_l${level}_${slot}_y`]);
      if (!isNaN(ix) && !isNaN(iy)) inputSlots.push({ x: ix, y: iy });
      const ox = parseFloat(row[`op_l${level}_${slot}_x`]);
      const oy = parseFloat(row[`op_l${level}_${slot}_y`]);
      if (!isNaN(ox) && !isNaN(oy)) outputSlots.push({ x: ox, y: oy });
    }
    positions.inputs[level] = inputSlots;
    positions.outputs[level] = outputSlots;
  });
  return positions;
}

function buildPlanetModel(resourceRow, typeRow, layoutRow) {
  const cardFilename = resourceRow.Card_Filename;
  const cardId = cardFilename.replace(/\.webp$/i, '');
  const planetTypeName = typeRow.Type;
  const planetTypeId = planetTypeName.toLowerCase();

  if (!TYPE_ARTWORK[planetTypeId]) {
    throw new Error(`Unknown planet type: "${planetTypeName}" for ${cardFilename}`);
  }

  const inputs = [];
  const outputs = [];
  const positions = parseLayoutRow(layoutRow);

  LEVELS.forEach(level => {
    const inputCell = resourceRow[`Level${level}_Input`] || '';
    const inputResources = parseResourceCell(inputCell);
    const inputPositions = positions.inputs[level];
    if (inputResources.length !== inputPositions.length) {
      throw new Error(
        `Card ${cardId}: Level ${level} input has ${inputResources.length} resource(s) but ${inputPositions.length} position(s)`
      );
    }
    inputResources.forEach((resName, idx) => {
      const entry = buildResourceEntry(resName);
      entry.level = level;
      entry.position = { x: inputPositions[idx].x, y: inputPositions[idx].y };
      inputs.push(entry);
    });

    const outputCell = resourceRow[`Level${level}_Output`] || '';
    const outputResources = parseResourceCell(outputCell);
    const outputPositions = positions.outputs[level];
    if (outputResources.length !== outputPositions.length) {
      throw new Error(
        `Card ${cardId}: Level ${level} output has ${outputResources.length} resource(s) but ${outputPositions.length} position(s)`
      );
    }
    outputResources.forEach((resName, idx) => {
      const entry = buildResourceEntry(resName);
      entry.level = level;
      entry.position = { x: outputPositions[idx].x, y: outputPositions[idx].y };
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

    const positionKeys = new Set();
    [...planet.inputs, ...planet.outputs].forEach(res => {
      if (!res.resource || !res.resource.id) {
        errors.push(`Planet ${planet.id}: resource missing resource id`);
      }
      if (!res.resource || !res.resource.displayName) {
        errors.push(`Planet ${planet.id}: resource missing displayName`);
      }
      if (!res.position || res.position.x === undefined || res.position.y === undefined) {
        errors.push(`Planet ${planet.id}: resource ${res.resource?.id} missing x/y coordinates`);
      }
      if (res.position) {
        const pk = `${res.position.x},${res.position.y}`;
        if (positionKeys.has(pk)) {
          errors.push(`Planet ${planet.id}: duplicate position ${pk}`);
        }
        positionKeys.add(pk);
      }
    });
  });

  if (errors.length > 0) {
    throw new Error('Validation failed:\n' + errors.join('\n'));
  }
}

function main() {
  const resourceRows = loadCsv(RESOURCES_CSV);
  const layoutRows = loadCsv(LAYOUT_CSV);
  const typeRows = loadCsv(TYPES_CSV);

  const typeIndex = {};
  typeRows.forEach(row => { typeIndex[row.Card_Filename] = row; });

  const layoutIndex = {};
  layoutRows.forEach(row => { layoutIndex[row['Card ID']] = row; });

  const planets = [];

  resourceRows.forEach(resourceRow => {
    const cardFilename = resourceRow.Card_Filename;
    const typeRow = typeIndex[cardFilename];
    if (!typeRow) throw new Error(`Missing planet type for ${cardFilename}`);

    const layoutRow = layoutIndex[cardFilename];
    if (!layoutRow) throw new Error(`Missing layout for ${cardFilename}`);

    planets.push(buildPlanetModel(resourceRow, typeRow, layoutRow));
  });

  validatePlanetModel(planets);

  const output = {
    schema: 'v1',
    generatedAt: new Date().toISOString(),
    planetCount: planets.length,
    planets,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');

  console.log(`Generated ${OUTPUT_FILE} with ${planets.length} planets`);
}

main();
