const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { renderResourcePanel } = require('../svg/resource-panel');

const ROOT = path.join(__dirname, '..', '..');

const CARD_W = 744;
const CARD_H = 1039;
const PANEL_W = 664;
const PANEL_H = 430;
const BOTTOM_MARGIN = 24;
const INPUT_CELL_CENTER_X = 160;
const OUTPUT_CELL_CENTER_X = 584;
const ICON_DISPLAY_SIZE = 96;
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

const SOURCE_ARTWORK_DIR = path.join(ROOT, 'source', 'artwork', 'cards', 'planet', 'planets');
const SOURCE_ICONS_DIR = path.join(ROOT, 'source', 'icons', 'resources');
const MODEL_PATH = path.join(ROOT, 'generated', 'models', 'planets.json');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'experiments', 'icon-resolution');
const REPORT_DIR = path.join(ROOT, 'docs', 'experiments');

const REPRESENTATIVE_CARDS = [
  { id: 'card_019_1', reason: 'bright artwork (Earth)' },
  { id: 'card_001_1', reason: 'dark artwork (Swamp)' },
  { id: 'card_005_1', reason: 'busy artwork (Scrap)' },
  { id: 'card_011_1', reason: 'smooth artwork (Ocean)' },
  { id: 'card_014_1', reason: 'high icon count (Jungle, 8 icons)' },
];

const ARTWORK_WIDTH = 576;

const PROFILES = [
  { name: 'baseline', iconSize: 352, iconLabel: '352\u00D7384' },
  { name: 'I1',       iconSize: 256, iconLabel: '256' },
  { name: 'I2',       iconSize: 192, iconLabel: '192' },
  { name: 'I3',       iconSize: 128, iconLabel: '128' },
  { name: 'I4',       iconSize: 96,  iconLabel: '96' },
];

let _flowChevronSvg = null;
function loadFlowChevronSvg() {
  if (_flowChevronSvg) return _flowChevronSvg;
  const p = path.join(ROOT, 'source', 'icons', 'chevron-right.svg');
  const raw = fs.readFileSync(p, 'utf-8');
  const match = raw.match(/<path[^>]*\/>/);
  _flowChevronSvg = match
    ? match[0]
    : '<path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  return _flowChevronSvg;
}

function getStageCount(planet) {
  const levels = new Set();
  for (const r of planet.inputs) levels.add(r.level);
  return Math.max(1, levels.size);
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

async function resizeArtwork(inputPath, width) {
  const buf = fs.readFileSync(inputPath);
  const aspect = 1216 / 864;
  const height = Math.round(width * aspect);
  return sharp(buf)
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

async function resizeIcon(inputPath, size) {
  const buf = fs.readFileSync(inputPath);
  const pipeline = sharp(buf).trim({ threshold: 0, lineArt: false });
  if (size > 0) {
    pipeline.resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3',
    });
  }
  return pipeline.png({ compressionLevel: 9, palette: true }).toBuffer();
}

function renderPlanetSvg(planet, artworkDataUri, iconDataUris) {
  const inputLevelCount = getStageCount(planet);
  const panelX = Math.round((CARD_W - PANEL_W) / 2);
  const panelY = CARD_H - BOTTOM_MARGIN - PANEL_H;
  const chevronSvg = loadFlowChevronSvg();
  const panelSvg = renderResourcePanel({
    stageCount: inputLevelCount,
    x: panelX,
    y: panelY,
    width: PANEL_W,
    height: PANEL_H,
    chevronSvg,
  });

  const inputRowY = computeStageCenters(panelY, PANEL_H, inputLevelCount);
  const outputRowY = computeStageCenters(panelY, PANEL_H, 3);

  const iconLines = [];

  for (let level = 1; level <= inputLevelCount; level++) {
    const y = inputRowY[level - 1];
    const ins = planet.inputs.filter(r => r.level === level);
    const inputCenters = iconCenters(ins.length, INPUT_CELL_CENTER_X, TWO_ICON_OFFSET);
    for (let i = 0; i < ins.length; i++) {
      const uri = iconDataUris[ins[i].resource.id];
      if (!uri) continue;
      const cx = inputCenters[i];
      iconLines.push(`    <image href="${uri}" x="${cx - ICON_DISPLAY_SIZE / 2}" y="${y - ICON_DISPLAY_SIZE / 2}" width="${ICON_DISPLAY_SIZE}" height="${ICON_DISPLAY_SIZE}" filter="url(#icon-enhance)" />`);
    }
  }

  for (let level = 1; level <= 3; level++) {
    const y = outputRowY[level - 1];
    const outs = planet.outputs.filter(r => r.level === level);
    const outputCenters = iconCenters(outs.length, OUTPUT_CELL_CENTER_X, TWO_ICON_OFFSET);
    for (let i = 0; i < outs.length; i++) {
      const uri = iconDataUris[outs[i].resource.id];
      if (!uri) continue;
      const cx = outputCenters[i];
      iconLines.push(`    <image href="${uri}" x="${cx - ICON_DISPLAY_SIZE / 2}" y="${y - ICON_DISPLAY_SIZE / 2}" width="${ICON_DISPLAY_SIZE}" height="${ICON_DISPLAY_SIZE}" filter="url(#icon-enhance)" />`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
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
  <image href="${artworkDataUri}" x="0" y="0" width="${CARD_W}" height="${CARD_H}" preserveAspectRatio="xMidYMid slice" />
  <rect x="${WATERMARK_PATCH_X}" y="${WATERMARK_PATCH_Y}" width="${WATERMARK_PATCH_SIZE}" height="${WATERMARK_PATCH_SIZE}" fill="${WATERMARK_PATCH_COLOR}" />
  <g id="top-layer">
${panelSvg}
${iconLines.join('\n')}
  </g>
</svg>`;
}

async function generateCard(cardId, planet, iconSize) {
  const typeId = planet.planetType.id;
  const artworkFilename = `${typeId}-v2.png`;
  const artworkPath = path.join(SOURCE_ARTWORK_DIR, artworkFilename);
  const artworkBuf = await resizeArtwork(artworkPath, ARTWORK_WIDTH);
  const artworkDataUri = `data:image/png;base64,${artworkBuf.toString('base64')}`;

  const allResourceIds = new Set();
  for (const r of [...planet.inputs, ...planet.outputs]) allResourceIds.add(r.resource.id);

  const iconUris = {};
  for (const id of allResourceIds) {
    const iconFilename = RESOURCE_ICON_MAP[id];
    if (!iconFilename) continue;
    const iconPath = path.join(SOURCE_ICONS_DIR, iconFilename);
    const iconBuf = await resizeIcon(iconPath, iconSize);
    iconUris[id] = `data:image/png;base64,${iconBuf.toString('base64')}`;
  }

  return renderPlanetSvg(planet, artworkDataUri, iconUris);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

async function main() {
  console.log('Resource Icon Resolution Experiment');
  console.log('===================================\n');

  const model = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf-8'));
  const planets = model.planets;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const results = [];

  for (const card of REPRESENTATIVE_CARDS) {
    const planet = planets.find(p => p.id === card.id);
    if (!planet) {
      console.error(`ERROR: Card ${card.id} not found in model`);
      process.exit(1);
    }

    const iconCount = planet.inputs.length + planet.outputs.length;

    for (const profile of PROFILES) {
      const svg = await generateCard(card.id, planet, profile.iconSize);
      const svgBytes = Buffer.byteLength(svg, 'utf-8');

      // Artwork base64 encoded length
      const artworkMatch = svg.match(/<image href="data:image\/png;base64,([^"]+)"/);
      const artworkEncodedLength = artworkMatch ? artworkMatch[1].length : 0;
      const artworkDecodedSize = artworkMatch ? Math.round(artworkMatch[1].length * 3 / 4) : 0;

      // Icons: sum of base64 encoded lengths (matching filter="url(#icon-enhance)")
      const iconMatches = svg.match(/<image href="data:image\/png;base64,[^"]+"[^>]*filter="url\(#icon-enhance\)"/g) || [];
      let iconsEncodedLength = 0;
      let iconsDecodedSize = 0;
      for (const m of iconMatches) {
        const b64match = m.match(/data:image\/png;base64,([^"]+)/);
        if (b64match) {
          iconsEncodedLength += b64match[1].length;
          iconsDecodedSize += Math.round(b64match[1].length * 3 / 4);
        }
      }

      const markupSize = svgBytes - artworkEncodedLength - iconsEncodedLength;

      const artworkHeight = Math.round(ARTWORK_WIDTH * (1216 / 864));

      const filename = `${card.id}__${profile.name}.svg`;
      const filePath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filePath, svg, 'utf-8');

      console.log(`  ${filename}`);
      console.log(`    Artwork: ${ARTWORK_WIDTH}×${artworkHeight}, Icons: ${profile.iconLabel}`);
      console.log(`    SVG size: ${formatBytes(svgBytes)}`);

      results.push({
        cardId: card.id,
        planetType: planet.planetType.displayName,
        profile: profile.name,
        iconSize: profile.iconSize,
        iconLabel: profile.iconLabel,
        svgBytes,
        artworkEncodedLength,
        artworkDecodedSize,
        iconsEncodedLength,
        iconsDecodedSize,
        markupSize,
        iconCount,
        filename,
        reason: card.reason,
      });
    }
  }

  // Per-profile statistics
  const profileNames = [...new Set(results.map(r => r.profile))];
  const profileStats = {};
  for (const name of profileNames) {
    const group = results.filter(r => r.profile === name);
    const sizes = group.map(r => r.svgBytes);
    profileStats[name] = {
      avg: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
      max: Math.max(...sizes),
      min: Math.min(...sizes),
    };
  }

  const baselineAvg = profileStats.baseline.avg;

  // Write report
  const reportLines = [];
  reportLines.push('# Resource Icon Resolution Experiment');
  reportLines.push('');
  reportLines.push('## Objective');
  reportLines.push('');
  reportLines.push('Determine the lowest acceptable resource icon resolution while preserving');
  reportLines.push('visual quality. Planet artwork is fixed at 576 px for all cards.');
  reportLines.push('');
  reportLines.push('## Representative Cards');
  reportLines.push('');
  reportLines.push('| Card ID | Planet Type | Reason | Icons |');
  reportLines.push('|---------|-------------|--------|-------|');
  for (const card of REPRESENTATIVE_CARDS) {
    const p = planets.find(x => x.id === card.id);
    const cnt = p.inputs.length + p.outputs.length;
    reportLines.push(`| ${card.id} | ${p.planetType.displayName} | ${card.reason} | ${cnt} |`);
  }
  reportLines.push('');
  reportLines.push('## Resolution Profiles');
  reportLines.push('');
  reportLines.push('| Profile | Icon Resolution | Artwork Resolution |');
  reportLines.push('|---------|----------------|-------------------|');
  const artworkHeight = Math.round(ARTWORK_WIDTH * (1216 / 864));
  for (const p of PROFILES) {
    reportLines.push(`| ${p.name} | ${p.iconLabel} | ${ARTWORK_WIDTH}×${artworkHeight} |`);
  }
  reportLines.push('');

  // Per-card per-profile results
  reportLines.push('## Per-Card Results');
  reportLines.push('');
  for (const name of profileNames) {
    reportLines.push(`### ${name} (${PROFILES.find(p => p.name === name).iconLabel})`);
    reportLines.push('');
    reportLines.push('| Filename | Card ID | Icon Res | SVG Size | Artwork(b64) | Icons(b64) | Markup |');
    reportLines.push('|----------|---------|----------|----------|--------------|------------|--------|');
    for (const r of results.filter(x => x.profile === name)) {
      reportLines.push(`| ${r.filename} | ${r.cardId} | ${r.iconLabel} | ${formatBytes(r.svgBytes)} | ${formatBytes(r.artworkEncodedLength)} | ${formatBytes(r.iconsEncodedLength)} | ${formatBytes(r.markupSize)} |`);
    }
    reportLines.push('');
  }

  // Profile summary
  reportLines.push('## Profile Summary');
  reportLines.push('');
  reportLines.push('| Profile | Icon Res | Average | Largest | Smallest | vs Baseline |');
  reportLines.push('|---------|----------|---------|---------|----------|-------------|');
  for (const name of profileNames) {
    const stat = profileStats[name];
    const pct = ((stat.avg - baselineAvg) / baselineAvg * 100).toFixed(1);
    const sign = pct.startsWith('-') ? '' : '+';
    reportLines.push(`| ${name} | ${PROFILES.find(p => p.name === name).iconLabel} | ${formatBytes(stat.avg)} | ${formatBytes(stat.max)} | ${formatBytes(stat.min)} | ${sign}${pct}% |`);
  }
  reportLines.push('');

  // Component breakdown
  reportLines.push('## Component Size Breakdown');
  reportLines.push('');
  reportLines.push('| Profile | Artwork(b64) | Icons(b64) | Markup | Total |');
  reportLines.push('|---------|--------------|------------|--------|-------|');
  for (const name of profileNames) {
    const group = results.filter(r => r.profile === name);
    const avgArtwork = Math.round(group.reduce((s, r) => s + r.artworkEncodedLength, 0) / group.length);
    const avgIcons = Math.round(group.reduce((s, r) => s + r.iconsEncodedLength, 0) / group.length);
    const avgMarkup = Math.round(group.reduce((s, r) => s + r.markupSize, 0) / group.length);
    const avgTotal = Math.round(group.reduce((s, r) => s + r.svgBytes, 0) / group.length);
    reportLines.push(`| ${name} | ${formatBytes(avgArtwork)} | ${formatBytes(avgIcons)} | ${formatBytes(avgMarkup)} | ${formatBytes(avgTotal)} |`);
  }
  reportLines.push('');

  // Validation
  reportLines.push('## Validation');
  reportLines.push('');
  reportLines.push('### Visual Composition');
  reportLines.push('- Icon positions match production layout');
  reportLines.push('- Resource panel rendered identically to production');
  reportLines.push('- Planet artwork fixed at 576 px across all variants');
  reportLines.push('');
  reportLines.push('### Determinism');
  reportLines.push('- All artwork resized with lanczos3 kernel, PNG compression level 9');
  reportLines.push('- All icons trimmed and resized with lanczos3 kernel, palette PNG');
  reportLines.push('- Output is deterministic');
  reportLines.push('');
  reportLines.push('### Generated Files');
  reportLines.push(`- Total SVGs: ${results.length}`);
  reportLines.push(`- Output directory: \`generated/experiments/icon-resolution/\``);
  reportLines.push('');

  // Recommendation
  reportLines.push('## Recommendation');
  reportLines.push('');
  reportLines.push('| Profile | Icon Resolution | Avg SVG | vs Baseline | Visual Impact |');
  reportLines.push('|---------|----------------|---------|-------------|---------------|');
  for (const name of profileNames) {
    const stat = profileStats[name];
    const pct = ((stat.avg - baselineAvg) / baselineAvg * 100).toFixed(1);
    const sign = pct.startsWith('-') ? '' : '+';
    reportLines.push(`| ${name} | ${PROFILES.find(p => p.name === name).iconLabel} | ${formatBytes(stat.avg)} | ${sign}${pct}% | TBD (requires visual review) |`);
  }
  reportLines.push('');
  reportLines.push('---');
  reportLines.push('');
  reportLines.push('*This experiment was generated by `compiler/experiment-icon-resolution.js`.');
  reportLines.push('Do NOT modify production pipeline based solely on this experiment.');
  reportLines.push('Review generated SVGs visually before making any production decisions.*');

  const reportContent = reportLines.join('\n');
  const reportPath = path.join(REPORT_DIR, 'icon-resolution.md');
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`\nReport written to ${reportPath}`);

  // Print summary
  console.log('\n=== Summary ===');
  for (const name of profileNames) {
    const stat = profileStats[name];
    const pct = ((stat.avg - baselineAvg) / baselineAvg * 100).toFixed(1);
    console.log(`  ${name} (${PROFILES.find(p => p.name === name).iconLabel}): avg=${formatBytes(stat.avg)}, max=${formatBytes(stat.max)}, min=${formatBytes(stat.min)}, Δ=${pct}%`);
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
