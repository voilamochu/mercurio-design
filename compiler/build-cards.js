const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { renderResourcePanel } = require('./svg/resource-panel');
const { optimizeArtwork, optimizeIcons } = require('./optimize-assets');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  model: path.join(ROOT, 'generated', 'models', 'planets.json'),
  icons: path.join(ROOT, 'generated', 'optimized-assets', 'icons'),
  artworkPlanets: path.join(ROOT, 'generated', 'optimized-assets', 'artwork'),
  outputDir: path.join(ROOT, 'generated', 'cards'),
};

const SVGO_SCRIPT = path.join(__dirname, 'optimize-svg.mjs');

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

const WATERMARK_PATCH_X = 620;
const WATERMARK_PATCH_Y = 920;
const WATERMARK_PATCH_SIZE = 74;
const WATERMARK_PATCH_COLOR = '#080D1A';

function exists(p) {
  return fs.existsSync(p);
}

function loadArtworkDataUri(typeId) {
  const filename = `${typeId}-v2.png`;
  const p = path.join(PATHS.artworkPlanets, filename);
  if (!exists(p)) return null;
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
}

function loadResourceIconDataUri(resourceId) {
  const filename = RESOURCE_ICON_MAP[resourceId];
  if (!filename) return null;
  const p = path.join(PATHS.icons, filename);
  if (!exists(p)) return null;
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
}

let _flowChevronSvg = null;
function loadFlowChevronSvg() {
  if (_flowChevronSvg) return _flowChevronSvg;
  const p = path.join(ROOT, 'source', 'icons', 'chevron-right.svg');
  const raw = fs.readFileSync(p, 'utf-8');
  const match = raw.match(/<path[^>]*\/>/);
  _flowChevronSvg = match ? match[0] : '<path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  return _flowChevronSvg;
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

function getStageCount(planet) {
  const levels = new Set();
  for (const r of planet.inputs) {
    levels.add(r.level);
  }
  return Math.max(1, levels.size);
}

function preloadAllIcons(planets) {
  const uriCache = {};
  const allIds = new Set();
  for (const planet of planets) {
    for (const r of [...planet.inputs, ...planet.outputs]) allIds.add(r.resource.id);
  }
  for (const id of allIds) {
    const uri = loadResourceIconDataUri(id);
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

function renderPlanetSvg(planet, artworkUri, iconDataUris, layout) {
  const inputLevelCount = getStageCount(planet);
  const template = layout.layoutTemplates.find(t => t.id === planet.layoutTemplate);
  if (!template) {
    throw new Error(`Unknown layout template "${planet.layoutTemplate}" for planet ${planet.id}`);
  }

  const panelX = layout.panel.x;
  const panelY = layout.panel.y;
  const iconSize = layout.icon.size;
  const dualOffset = layout.icon.dualOffset;
  const chevronSvg = loadFlowChevronSvg();

  const panelSvg = renderResourcePanel({
    stageCount: inputLevelCount,
    x: panelX,
    y: panelY,
    width: layout.panel.width,
    height: layout.panel.height,
    chevronSvg,
  });

  const inputRowY = template.inputRowYCenters;
  const outputRowY = template.outputRowYCenters;

  const iconLines = [];

  for (let level = 1; level <= inputLevelCount; level++) {
    const y = inputRowY[level - 1];
    const ins = planet.inputs.filter(r => r.level === level);
    const inputCenters = iconCenters(ins.length, layout.icon.inputCellCenterX, dualOffset);

    for (let i = 0; i < ins.length; i++) {
      const uri = iconDataUris[ins[i].resource.id];
      if (!uri) continue;
      const cx = inputCenters[i];
      iconLines.push(`    <image href="${uri}" x="${cx - iconSize / 2}" y="${y - iconSize / 2}" width="${iconSize}" height="${iconSize}" filter="url(#icon-enhance)" />`);
    }
  }

  for (let level = 1; level <= 3; level++) {
    const y = outputRowY[level - 1];
    const outs = planet.outputs.filter(r => r.level === level);
    const outputCenters = iconCenters(outs.length, layout.icon.outputCellCenterX, dualOffset);

    for (let i = 0; i < outs.length; i++) {
      const uri = iconDataUris[outs[i].resource.id];
      if (!uri) continue;
      const cx = outputCenters[i];
      iconLines.push(`    <image href="${uri}" x="${cx - iconSize / 2}" y="${y - iconSize / 2}" width="${iconSize}" height="${iconSize}" filter="url(#icon-enhance)" />`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.card.width} ${layout.card.height}" width="${layout.card.width}" height="${layout.card.height}">
  <defs>
    <filter id="icon-enhance" color-interpolation-filters="sRGB">
      <feColorMatrix type="saturate" values="1.35"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.35"/>
        <feFuncG type="linear" slope="1.35"/>
        <feFuncB type="linear" slope="1.35"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <image href="${artworkUri}" x="0" y="0" width="${layout.card.width}" height="${layout.card.height}" preserveAspectRatio="xMidYMid slice" />

  <rect x="${WATERMARK_PATCH_X}" y="${WATERMARK_PATCH_Y}" width="${WATERMARK_PATCH_SIZE}" height="${WATERMARK_PATCH_SIZE}" fill="${WATERMARK_PATCH_COLOR}" />

  <g id="top-layer">
${panelSvg}
${iconLines.join('\n')}
  </g>
</svg>`;

  return svg;
}

async function build() {
  const startTime = Date.now();
  const warnings = [];
  const missingAssets = [];
  const stats = { rendered: 0, skipped: 0 };

  console.log('Optimizing assets...\n');
  await optimizeArtwork();
  await optimizeIcons();
  console.log('');

  const raw = JSON.parse(fs.readFileSync(PATHS.model, 'utf-8'));
  if (!raw.planets || !raw.planets.length) {
    console.error('ERROR: planets.json has no planets array');
    process.exit(1);
  }
  if (!raw.layoutTemplates || !raw.layoutTemplates.length) {
    console.error('ERROR: planets.json has no layoutTemplates');
    process.exit(1);
  }

  const planets = raw.planets;
  const layout = {
    card: raw.card,
    panel: raw.panel,
    icon: raw.icon,
    layoutTemplates: raw.layoutTemplates,
  };
  console.log(`Loaded ${planets.length} planets from model (schema: ${raw.schema || 'unknown'})`);
  console.log(`Layout templates: ${layout.layoutTemplates.map(t => t.id).join(', ')}`);

  const iconDataUris = preloadAllIcons(planets);
  for (const [id, uri] of Object.entries(iconDataUris)) {
    console.log(`  Icon loaded: ${id} (${Math.round(uri.length * 3 / 4)} bytes)`);
  }

  const resourceIconCount = Object.keys(iconDataUris).length;
  if (resourceIconCount < 8) {
    warnings.push(`Expected 8 resource icons, found ${resourceIconCount}`);
  }

  fs.mkdirSync(PATHS.outputDir, { recursive: true });

  const indexEntries = [];
  const cardSvgContents = [];

  for (const planet of planets) {
    const canonicalId = planet.id;
    const typeId = planet.planetType.id;
    const displayName = planet.planetType.displayName;
    const artworkUri = loadArtworkDataUri(typeId);

    if (!artworkUri) {
      warnings.push(`No V2 artwork for "${typeId}" (${canonicalId})`);
      missingAssets.push({ planetId: canonicalId, type: typeId, asset: 'artwork' });
      stats.skipped++;
      continue;
    }

    const inputCount = planet.inputs.length;
    const outputCount = planet.outputs.length;
    const totalIcons = inputCount + outputCount;

    const svg = renderPlanetSvg(planet, artworkUri, iconDataUris, layout);

    const iconRefs = (svg.match(/<image /g) || []).length - 1;
    if (iconRefs !== totalIcons) {
      warnings.push(`Icon count mismatch for ${canonicalId}: expected ${totalIcons} icons, SVG has ${iconRefs}`);
    }

    const filename = `${canonicalId}.svg`;
    const filePath = path.join(PATHS.outputDir, filename);
    fs.writeFileSync(filePath, svg, 'utf-8');

    cardSvgContents.push(svg);

    indexEntries.push({
      id: canonicalId,
      filename,
      planetType: displayName,
    });

    stats.rendered++;
  }

  const indexJson = JSON.stringify(indexEntries, null, 2);
  fs.writeFileSync(path.join(PATHS.outputDir, 'index.json'), indexJson, 'utf-8');
  console.log(`\nWrote index.json (${indexEntries.length} entries)`);

  const contactSheetSvg = renderContactSheet(cardSvgContents);
  fs.writeFileSync(path.join(PATHS.outputDir, 'contact-sheet.svg'), contactSheetSvg, 'utf-8');
  console.log('Wrote contact-sheet.svg');

  const duration = Date.now() - startTime;

  const typeCounts = {};
  for (const e of indexEntries) {
    typeCounts[e.planetType] = (typeCounts[e.planetType] || 0) + 1;
  }

  console.log('\n────────────────────────────────────────');
  console.log('  ASSET COMPILER REPORT');
  console.log('────────────────────────────────────────');
  console.log(`  Cards rendered:    ${stats.rendered}`);
  console.log(`  Cards skipped:     ${stats.skipped}`);
  console.log(`  Render duration:   ${duration}ms`);
  console.log(`  Output directory:  ${PATHS.outputDir}`);

  console.log(`\n  Planet type distribution:`);
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => a[1] - b[1])) {
    console.log(`    ${type}: ${count}`);
  }

  if (missingAssets.length) {
    console.log(`\n  Missing assets:`);
    for (const m of missingAssets) {
      console.log(`    ${m.planetId} (${m.type}): ${m.asset}`);
    }
  }

  if (warnings.length) {
    console.log(`\n  Warnings (${warnings.length}):`);
    for (const w of warnings) {
      console.log(`    ${w}`);
    }
  }

  const validationErrors = [];
  if (stats.rendered !== 81) validationErrors.push(`Expected 81 cards, rendered ${stats.rendered}`);
  const expectedTypes = ['Cold', 'Earth', 'Forge', 'Ice', 'Jungle', 'Ocean', 'Proto', 'Scrap', 'Swamp'];
  for (const t of expectedTypes) {
    if (!typeCounts[t]) validationErrors.push(`Missing planet type: ${t}`);
  }
  if (Object.keys(iconDataUris).length < 8) validationErrors.push('Missing resource icons');
  if (missingAssets.length) validationErrors.push(`${missingAssets.length} missing artwork assets`);

  console.log(`\n  Validation:`);
  if (validationErrors.length) {
    console.log(`    FAILED - ${validationErrors.length} issue(s):`);
    for (const e of validationErrors) console.log(`      ${e}`);
  } else {
    console.log('    PASSED - all checks OK');
  }
  console.log('────────────────────────────────────────');

  console.log('\nRunning SVGO optimization...');
  try {
    execSync(`node "${SVGO_SCRIPT}" --planet-only`, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error('SVGO optimization failed:', err.message);
    process.exit(1);
  }
}

function renderContactSheet(cardSvgContents) {
  const COLS = 9;
  const ROWS = 9;
  const CARD_W = 744;
  const CARD_H = 1039;
  const THUMB_W = 100;
  const THUMB_H = Math.round(100 * CARD_H / CARD_W);
  const GAP = 12;

  const sheetW = COLS * THUMB_W + (COLS + 1) * GAP;
  const sheetH = ROWS * THUMB_H + (ROWS + 1) * GAP;

  const lines = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheetW} ${sheetH}" width="${sheetW}" height="${sheetH}">`);
  lines.push(`  <rect width="${sheetW}" height="${sheetH}" fill="#1a1a1a" />`);
  lines.push(`  <g id="contact-sheet">`);

  for (let i = 0; i < cardSvgContents.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = GAP + col * (THUMB_W + GAP);
    const y = GAP + row * (THUMB_H + GAP);

    const rawSvg = cardSvgContents[i];
    const viewBoxMatch = rawSvg.match(/viewBox="([^"]+)"/);
    const innerContent = rawSvg.replace(/<\?xml[^>]+\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').trim();

    lines.push(`    <svg x="${x}" y="${y}" width="${THUMB_W}" height="${THUMB_H}" viewBox="${viewBoxMatch ? viewBoxMatch[1] : '0 0 744 1039'}" preserveAspectRatio="xMidYMid meet">`);
    lines.push(innerContent);
    lines.push(`    </svg>`);
  }

  lines.push(`  </g>`);
  lines.push(`</svg>`);

  return lines.join('\n');
}

build().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
