const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '..', 'source', 'data', 'technologies.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'models');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'technologies.json');

const EXPECTED_COUNT = 40;
const VALID_FRAME_STYLES = ['Project', 'Passive', 'Active', 'Endgame'];
const RENDERER_VERSION = 'v1';

const ROMAN_NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const FRAME_STYLE_COLORS = {
  Project: '#1f6feb',
  Passive: '#2da44e',
  Active: '#bf8700',
  Endgame: '#8957e5',
};

const DISPLAY_TYPE = {
  Project: 'Project',
  Passive: 'Passive',
  Active: 'Active',
  Endgame: 'Endgame',
};

function toRoman(level) {
  if (level < 1 || level >= ROMAN_NUMERALS.length) {
    throw new Error(`Level ${level} out of roman numeral range`);
  }
  return ROMAN_NUMERALS[level];
}

function padIndex(index) {
  return String(index).padStart(3, '0');
}

function loadSource(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Canonical technology file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function buildTechModel(source, index) {
  const tech = source;
  const sequentialIndex = index;
  const type = tech.type;

  if (!VALID_FRAME_STYLES.includes(type)) {
    throw new Error(`Technology "${tech.id}": invalid type "${type}"`);
  }

  const assetId = `tech_${padIndex(index)}`;

  return {
    id: tech.id,
    name: tech.name,
    level: tech.level,
    type: type,
    copies: tech.copies,
    description: tech.description,
    projectName: tech.projectName !== undefined ? tech.projectName : null,
    projectDescription: tech.projectDescription !== undefined ? tech.projectDescription : null,
    projectOutput: tech.projectOutput !== undefined ? tech.projectOutput : null,
    sequentialIndex,
    assetId,
    artworkDomain: 'unassigned',
    artworkOverlay: 'unassigned',
    artworkVariant: 'placeholder',
    frameStyle: type,
    frameColor: FRAME_STYLE_COLORS[type],
    romanLevel: toRoman(tech.level),
    displayLevel: `Level ${tech.level}`,
    displayType: DISPLAY_TYPE[type],
    flavorText: '',
    rendererVersion: RENDERER_VERSION,
  };
}

function validateTechModel(technologies) {
  const errors = [];

  if (technologies.length !== EXPECTED_COUNT) {
    errors.push(`Expected ${EXPECTED_COUNT} technologies, found ${technologies.length}`);
  }

  const seenIds = new Set();
  const seenAssetIds = new Set();

  technologies.forEach((tech, idx) => {
    if (!tech.id) {
      errors.push(`Technology at index ${idx} is missing id`);
    } else if (seenIds.has(tech.id)) {
      errors.push(`Duplicate technology id: ${tech.id}`);
    }
    seenIds.add(tech.id);

    if (!tech.assetId) {
      errors.push(`Technology ${tech.id}: missing assetId`);
    } else if (seenAssetIds.has(tech.assetId)) {
      errors.push(`Duplicate assetId: ${tech.assetId}`);
    }
    seenAssetIds.add(tech.assetId);

    if (tech.sequentialIndex !== idx) {
      errors.push(`Technology ${tech.id}: sequentialIndex ${tech.sequentialIndex} != ${idx}`);
    }

    const expectedAssetId = `tech_${padIndex(idx)}`;
    if (tech.assetId !== expectedAssetId) {
      errors.push(`Technology ${tech.id}: assetId ${tech.assetId} != expected ${expectedAssetId}`);
    }

    if (!VALID_FRAME_STYLES.includes(tech.frameStyle)) {
      errors.push(`Technology ${tech.id}: invalid frameStyle "${tech.frameStyle}"`);
    }

    if (!tech.frameColor) {
      errors.push(`Technology ${tech.id}: missing frameColor`);
    }

    const expectedRoman = toRoman(tech.level);
    if (tech.romanLevel !== expectedRoman) {
      errors.push(`Technology ${tech.id}: romanLevel "${tech.romanLevel}" != expected "${expectedRoman}"`);
    }

    ['artworkDomain', 'artworkOverlay', 'artworkVariant', 'displayLevel', 'displayType', 'flavorText', 'rendererVersion']
      .forEach(field => {
        if (tech[field] === undefined || tech[field] === null) {
          errors.push(`Technology ${tech.id}: renderer field "${field}" not populated`);
        }
      });

    if (tech.rendererVersion !== RENDERER_VERSION) {
      errors.push(`Technology ${tech.id}: rendererVersion "${tech.rendererVersion}" != "${RENDERER_VERSION}"`);
    }
  });

  if (errors.length > 0) {
    throw new Error('Validation failed:\n' + errors.join('\n'));
  }
}

function main() {
  const source = loadSource(SOURCE_FILE);

  if (!source.technologies || !Array.isArray(source.technologies)) {
    throw new Error('Source file missing "technologies" array');
  }

  const technologies = source.technologies.map((tech, idx) => buildTechModel(tech, idx));

  validateTechModel(technologies);

  const output = {
    schema: 'v1',
    generatedAt: new Date().toISOString(),
    technologyCount: technologies.length,
    rendererVersion: RENDERER_VERSION,
    technologies,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');

  console.log(`Generated ${OUTPUT_FILE} with ${technologies.length} technologies`);
}

main();
