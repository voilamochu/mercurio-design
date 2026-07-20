const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '..', 'source', 'data', 'contracts.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'models');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'contracts.json');

const EXPECTED_COUNT = 25;
const VALID_FRAME_STYLES = ['Bounty', 'Deal', 'Permanent', 'Accord'];
const RENDERER_VERSION = 'v1';

const VALID_CIVILIZATIONS = ['Aelyr', 'Varuuk', 'Ephydri', 'Thyrnekin', 'Korrn'];

const FRAME_STYLE_COLORS = {
  Bounty: '#2da44e',
  Deal: '#1f6feb',
  Permanent: '#8957e5',
  Accord: '#bf8700',
};

const DISPLAY_TYPE = {
  Bounty: 'Bounty',
  Deal: 'Deal',
  Permanent: 'Permanent',
  Accord: 'Accord',
};

function padIndex(index) {
  return String(index).padStart(3, '0');
}

function loadSource(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Canonical contracts file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function buildContractModel(source, index) {
  const contract = source;
  const sequentialIndex = index;
  const type = contract.type;

  if (!VALID_FRAME_STYLES.includes(type)) {
    throw new Error(`Contract "${contract.id}": invalid type "${type}"`);
  }

  const assetId = `contract_${padIndex(index)}`;

  return {
    id: contract.id,
    name: contract.name,
    civilization: contract.civilization,
    requirement: contract.requirement,
    reward: contract.reward,
    type: type,
    requiredTech: contract.requiredTech !== undefined ? contract.requiredTech : null,
    requiredResources: contract.requiredResources !== undefined ? contract.requiredResources : {},
    sequentialIndex,
    assetId,
    artworkDomain: 'unassigned',
    artworkOverlay: 'unassigned',
    artworkVariant: 'placeholder',
    frameStyle: type,
    frameColor: FRAME_STYLE_COLORS[type],
    displayType: DISPLAY_TYPE[type],
    flavorText: contract.flavor !== undefined ? contract.flavor : '',
    rendererVersion: RENDERER_VERSION,
  };
}

function validateContractModel(contracts) {
  const errors = [];

  if (contracts.length !== EXPECTED_COUNT) {
    errors.push(`Expected ${EXPECTED_COUNT} contracts, found ${contracts.length}`);
  }

  const seenIds = new Set();
  const seenAssetIds = new Set();

  contracts.forEach((contract, idx) => {
    if (!contract.id) {
      errors.push(`Contract at index ${idx} is missing id`);
    } else if (seenIds.has(contract.id)) {
      errors.push(`Duplicate contract id: ${contract.id}`);
    }
    seenIds.add(contract.id);

    if (!contract.assetId) {
      errors.push(`Contract ${contract.id}: missing assetId`);
    } else if (seenAssetIds.has(contract.assetId)) {
      errors.push(`Duplicate assetId: ${contract.assetId}`);
    }
    seenAssetIds.add(contract.assetId);

    if (contract.sequentialIndex !== idx) {
      errors.push(`Contract ${contract.id}: sequentialIndex ${contract.sequentialIndex} != ${idx}`);
    }

    const expectedAssetId = `contract_${padIndex(idx)}`;
    if (contract.assetId !== expectedAssetId) {
      errors.push(`Contract ${contract.id}: assetId ${contract.assetId} != expected ${expectedAssetId}`);
    }

    if (!VALID_FRAME_STYLES.includes(contract.frameStyle)) {
      errors.push(`Contract ${contract.id}: invalid frameStyle "${contract.frameStyle}"`);
    }

    if (!contract.frameColor) {
      errors.push(`Contract ${contract.id}: missing frameColor`);
    }

    if (!VALID_CIVILIZATIONS.includes(contract.civilization)) {
      errors.push(`Contract ${contract.id}: invalid civilization "${contract.civilization}"`);
    }

    if (!contract.requirement) {
      errors.push(`Contract ${contract.id}: missing requirement`);
    }

    ['artworkDomain', 'artworkOverlay', 'artworkVariant', 'displayType', 'flavorText', 'rendererVersion']
      .forEach(field => {
        if (contract[field] === undefined || contract[field] === null) {
          errors.push(`Contract ${contract.id}: renderer field "${field}" not populated`);
        }
      });

    if (contract.rendererVersion !== RENDERER_VERSION) {
      errors.push(`Contract ${contract.id}: rendererVersion "${contract.rendererVersion}" != "${RENDERER_VERSION}"`);
    }
  });

  if (errors.length > 0) {
    throw new Error('Validation failed:\n' + errors.join('\n'));
  }
}

function main() {
  const source = loadSource(SOURCE_FILE);

  if (!source.contracts || !Array.isArray(source.contracts)) {
    throw new Error('Source file missing "contracts" array');
  }

  const contracts = source.contracts.map((contract, idx) => buildContractModel(contract, idx));

  validateContractModel(contracts);

  const output = {
    schema: 'v1',
    generatedAt: new Date().toISOString(),
    contractCount: contracts.length,
    rendererVersion: RENDERER_VERSION,
    contracts,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');

  console.log(`Generated ${OUTPUT_FILE} with ${contracts.length} contracts`);
}

main();
