const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '..', 'source', 'data', 'governors.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'models');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'governors.json');

const EXPECTED_COUNT = 40;
const RENDERER_VERSION = 'v1';

const VALID_REQUIREMENT_TYPES = [
  'planetType',
  'minPlanetCount',
  'minProjectCount',
  'fullSector',
  'minDifferentOutputs',
  'minDifferentTypes',
  'minDifferentBioTypes',
  'minSatisfiedInputs',
  'minConsumedOutputs',
  'requiredOutput',
  'requiredInput',
  'minSameInputGood',
  'minSameOutputGood',
  'noProjects',
  'coldIcePlanets',
  'outputAnyOf',
  'singleGoodAll',
  'singleGoodCount',
  'bioPlanetCluster',
];

const FRAME_STYLE = 'Governor';
const FRAME_COLOR = '#8957e5';
const DISPLAY_TYPE = 'Governor';

function padIndex(index) {
  return String(index).padStart(3, '0');
}

function loadSource(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Canonical governors file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function buildGovernorModel(source, index) {
  const governor = source;
  const sequentialIndex = index;
  const assetId = `governor_${padIndex(index)}`;

  return {
    id: governor.id,
    name: governor.name,
    vp: governor.vp,
    description: governor.description,
    requirements: governor.requirements !== undefined ? governor.requirements : [],
    sequentialIndex,
    assetId,
    artworkDomain: 'unassigned',
    artworkOverlay: 'unassigned',
    artworkVariant: 'placeholder',
    frameStyle: FRAME_STYLE,
    frameColor: FRAME_COLOR,
    displayType: DISPLAY_TYPE,
    flavorText: '',
    rendererVersion: RENDERER_VERSION,
  };
}

function validateGovernorModel(governors) {
  const errors = [];

  if (governors.length !== EXPECTED_COUNT) {
    errors.push(`Expected ${EXPECTED_COUNT} governors, found ${governors.length}`);
  }

  const seenIds = new Set();
  const seenAssetIds = new Set();

  governors.forEach((gov, idx) => {
    if (!gov.id) {
      errors.push(`Governor at index ${idx} is missing id`);
    } else if (seenIds.has(gov.id)) {
      errors.push(`Duplicate governor id: ${gov.id}`);
    }
    seenIds.add(gov.id);

    if (!gov.assetId) {
      errors.push(`Governor ${gov.id}: missing assetId`);
    } else if (seenAssetIds.has(gov.assetId)) {
      errors.push(`Duplicate assetId: ${gov.assetId}`);
    }
    seenAssetIds.add(gov.assetId);

    if (gov.sequentialIndex !== idx) {
      errors.push(`Governor ${gov.id}: sequentialIndex ${gov.sequentialIndex} != ${idx}`);
    }

    const expectedAssetId = `governor_${padIndex(idx)}`;
    if (gov.assetId !== expectedAssetId) {
      errors.push(`Governor ${gov.id}: assetId ${gov.assetId} != expected ${expectedAssetId}`);
    }

    if (gov.frameStyle !== FRAME_STYLE) {
      errors.push(`Governor ${gov.id}: frameStyle "${gov.frameStyle}" != "${FRAME_STYLE}"`);
    }

    if (!gov.frameColor) {
      errors.push(`Governor ${gov.id}: missing frameColor`);
    }

    if (gov.vp === undefined || gov.vp === null) {
      errors.push(`Governor ${gov.id}: missing vp`);
    } else if (typeof gov.vp !== 'number' || gov.vp < 2 || gov.vp > 4) {
      errors.push(`Governor ${gov.id}: vp ${gov.vp} out of valid range [2-4]`);
    }

    if (!gov.name) {
      errors.push(`Governor ${gov.id}: missing name`);
    }

    if (!gov.description) {
      errors.push(`Governor ${gov.id}: missing description`);
    }

    if (!gov.requirements || !Array.isArray(gov.requirements)) {
      errors.push(`Governor ${gov.id}: missing or invalid requirements array`);
    } else {
      gov.requirements.forEach((req, ri) => {
        if (!VALID_REQUIREMENT_TYPES.includes(req.type)) {
          errors.push(`Governor ${gov.id}: requirement ${ri} has invalid type "${req.type}"`);
        }
        if (req.type === 'planetType' && !req.value) {
          errors.push(`Governor ${gov.id}: requirement ${ri} (planetType) missing value`);
        }
        if (req.type === 'outputAnyOf' && (!req.value || !Array.isArray(req.value))) {
          errors.push(`Governor ${gov.id}: requirement ${ri} (outputAnyOf) missing or invalid value array`);
        }
        if (req.type === 'minDifferentBioTypes' && (!req.pool || !Array.isArray(req.pool))) {
          errors.push(`Governor ${gov.id}: requirement ${ri} (minDifferentBioTypes) missing or invalid pool`);
        }
      });
    }

    ['artworkDomain', 'artworkOverlay', 'artworkVariant', 'displayType', 'flavorText', 'rendererVersion']
      .forEach(field => {
        if (gov[field] === undefined || gov[field] === null) {
          errors.push(`Governor ${gov.id}: renderer field "${field}" not populated`);
        }
      });

    if (gov.rendererVersion !== RENDERER_VERSION) {
      errors.push(`Governor ${gov.id}: rendererVersion "${gov.rendererVersion}" != "${RENDERER_VERSION}"`);
    }
  });

  if (errors.length > 0) {
    throw new Error('Validation failed:\n' + errors.join('\n'));
  }
}

function main() {
  const source = loadSource(SOURCE_FILE);

  if (!source.governors || !Array.isArray(source.governors)) {
    throw new Error('Source file missing "governors" array');
  }

  const governors = source.governors.map((gov, idx) => buildGovernorModel(gov, idx));

  validateGovernorModel(governors);

  const output = {
    schema: 'v1',
    generatedAt: new Date().toISOString(),
    governorCount: governors.length,
    rendererVersion: RENDERER_VERSION,
    governors,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');

  console.log(`Generated ${OUTPUT_FILE} with ${governors.length} governors`);
  governors.forEach((g, i) => console.log(`  governor_${padIndex(i)}  ${g.id.padEnd(35)} VP=${g.vp}  reqs=${g.requirements.length}`));
}

main();
