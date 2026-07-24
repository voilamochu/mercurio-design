const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const OPTIMIZED_PLANET_ICON_DIR = path.join(ROOT, 'generated', 'optimized-planet-icons');
const OPTIMIZED_ICON_DIR = path.join(ROOT, 'generated', 'optimized-generic-icons');
const OPTIMIZED_RESOURCE_ICON_DIR = path.join(ROOT, 'generated', 'optimized-resource-icons');
const RASTER_GENERIC_ICONS = new Set(['planet_any', 'resource_any']);

const SVG_ICONS = {
  planet_any: 'source/artwork/icons/generic/planet_any.svg',
  resource_any: 'source/artwork/icons/generic/resource_any.svg',
  project: 'source/artwork/icons/generic/project_icon.svg',
};

const OPERATOR_ICONS = {
  equals: 'source/artwork/icons/operators/equals.svg',
};

const PLANET_NAMES = ['cold', 'earth', 'forge', 'ice', 'jungle', 'ocean', 'proto', 'scrap', 'swamp'];

const RESOURCE_MAP = {
  Ore: 'ore',
  Robots: 'robot',
  Water: 'water',
  Humans: 'population',
  Human: 'population',
  Electronics: 'electronics',
  Algae: 'algae',
  Grain: 'grain',
  Crates: 'crate',
  Robot: 'robot',
};

const PLANET_SET = new Set(PLANET_NAMES);

const SVG_NAMES = Object.keys(SVG_ICONS);
const OPERATOR_NAMES = Object.keys(OPERATOR_ICONS);

function getSvgIconNames() {
  return SVG_NAMES;
}

function getOperatorNames() {
  return OPERATOR_NAMES;
}

function getPlanetNames() {
  return PLANET_NAMES;
}

function getResourceMap() {
  return RESOURCE_MAP;
}

function getPlanetSet() {
  return PLANET_SET;
}

function getSvgFilePath(name) {
  return path.join(ROOT, SVG_ICONS[name]);
}

function getOptimizedSvgFilePath(name) {
  return path.join(OPTIMIZED_ICON_DIR, `${name}.svg`);
}

function getOptimizedPngFilePath(name) {
  return path.join(OPTIMIZED_ICON_DIR, `${name}.png`);
}

function getOperatorFilePath(name) {
  return path.join(ROOT, OPERATOR_ICONS[name]);
}

function getPlanetFilePath(name) {
  return path.join(ROOT, 'source', 'artwork', 'icons', 'planets', `${name}_icon.png`);
}

function getOptimizedPlanetFilePath(name) {
  return path.join(OPTIMIZED_PLANET_ICON_DIR, `${name}.png`);
}

function getResourceFilePath(id) {
  return path.join(ROOT, 'source', 'artwork', 'resources', `${id}.png`);
}

function getOptimizedResourceFilePath(id) {
  return path.join(OPTIMIZED_RESOURCE_ICON_DIR, `${id}.png`);
}

function getResourceId(value) {
  return RESOURCE_MAP[value] || null;
}

function isPlanetType(value) {
  return PLANET_SET.has(value.toLowerCase());
}

function getSvgDefId(name) {
  return `gv-generic-${name}`;
}

function getOperatorDefId(name) {
  return `gv-op-${name}`;
}

function resolveIcon(value) {
  const lower = String(value).toLowerCase();
  if (PLANET_SET.has(lower)) {
    return { icon: lower, iconType: 'planet' };
  }
  const resourceId = RESOURCE_MAP[value];
  if (resourceId) {
    return { icon: resourceId, iconType: 'resource' };
  }
  return { icon: lower, iconType: 'resource' };
}

function getIconCategory(semantic) {
  if (SVG_ICONS[semantic]) return 'svg';
  if (OPERATOR_ICONS[semantic]) return 'operator';
  if (PLANET_SET.has(semantic)) return 'planet';
  return null;
}

module.exports = {
  SVG_ICONS,
  OPERATOR_ICONS,
  PLANET_NAMES,
  RESOURCE_MAP,
  PLANET_SET,
  SVG_NAMES,
  OPERATOR_NAMES,
  getSvgIconNames,
  getOperatorNames,
  getPlanetNames,
  getResourceMap,
  getPlanetSet,
  getSvgFilePath,
  getOptimizedSvgFilePath,
  getOptimizedPngFilePath,
  RASTER_GENERIC_ICONS,
  getOperatorFilePath,
  getPlanetFilePath,
  getOptimizedPlanetFilePath,
  getResourceFilePath,
  getOptimizedResourceFilePath,
  getResourceId,
  isPlanetType,
  getSvgDefId,
  getOperatorDefId,
  resolveIcon,
  getIconCategory,
};
