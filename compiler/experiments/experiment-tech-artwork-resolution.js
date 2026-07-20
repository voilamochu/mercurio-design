const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const MODEL_FILE = path.join(ROOT, 'generated', 'models', 'technologies.json');
const MAP_FILE = path.join(ROOT, 'source', 'data', 'technology-artwork-map.json');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'experiments', 'tech-artwork-resolution');
const REPORT_DIR = path.join(ROOT, 'docs', 'experiments');

const { composeArtworkDataUri, loadDomain, loadOverlay } = require('../lib/technology/sharp-artwork-compositor');
const { ARTWORK_WINDOW, OUTER_FRAME, RULES_BOX, PROJECT_BOX, FLAVOR_TEXT } = require('../lib/technology/layout');
const { renderOuterFrame } = require('../lib/technology/frame');
const { renderTitleBar } = require('../lib/technology/title');
const { renderProjectBox } = require('../lib/technology/project');
const { renderRulesBox } = require('../lib/technology/rules');
const { renderFlavorText } = require('../lib/technology/flavor');
const { wrapSvg } = require('../lib/technology/svg');
const { generateFontCss } = require('../lib/svg/font-embed');

const TARGET_TECHS = ['tech_000', 'tech_006', 'tech_018', 'tech_037', 'tech_038'];

const RESOLUTIONS = [
  { name: '576', width: 576, height: 480 },
  { name: '512', width: 512, height: 427 },
  { name: '448', width: 448, height: 373 },
  { name: '384', width: 384, height: 320 },
];

const ARTWORK_ASPECT = 580 / 696;

function isProject(tech) {
  return tech.type === 'Project';
}

function computeRulesBoxY(hasProject) {
  if (hasProject) return PROJECT_BOX.y + PROJECT_BOX.height + 10;
  return ARTWORK_WINDOW.y + ARTWORK_WINDOW.height + 10;
}

const FLAVOR_BOTTOM_PADDING = 24;
const FLAVOR_FONT_HALF = 12;

function computeFlavorY() {
  return OUTER_FRAME.y + OUTER_FRAME.height - FLAVOR_BOTTOM_PADDING - FLAVOR_FONT_HALF;
}

function buildClipDef(id, rect) {
  return `  <clipPath id="artclip-${id}">
    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${rect.rx}" ry="${rect.ry}" />
  </clipPath>`;
}

async function renderTechSvgAtResolution(tech, mapping, testWidth, testHeight) {
  const hasProject = isProject(tech);
  const rulesY = computeRulesBoxY(hasProject);
  RULES_BOX.y = rulesY;
  const flavorY = computeFlavorY();

  const entry = mapping[tech.id];
  const compositeRect = { width: testWidth, height: testHeight };
  const dataUri = await composeArtworkDataUri(entry.domain, entry.overlay, compositeRect);

  const displayRect = ARTWORK_WINDOW;
  const defs = buildClipDef(tech.assetId, displayRect);

  const body = [
    renderOuterFrame(tech.frameStyle),
    renderTitleBar(tech.name, tech.romanLevel),
    `  <g clip-path="url(#artclip-${tech.assetId})">`,
    `    <image href="${dataUri}" x="${displayRect.x}" y="${displayRect.y}" width="${displayRect.width}" height="${displayRect.height}" preserveAspectRatio="xMidYMid slice" />`,
    `  </g>`,
  ];

  if (hasProject) {
    body.push(renderProjectBox(tech.projectName, tech.projectDescription));
  }

  body.push(renderRulesBox(tech.description));
  body.push(renderFlavorText(tech.flavorText, flavorY));

  generateFontCss();
  return wrapSvg(body.join('\n'), tech.assetId, defs);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function getArtworkBase64Size(svg) {
  const m = svg.match(/data:image\/png;base64,([^"]+)/);
  if (!m) return 0;
  return m[1].length;
}

function pctReduction(baseline, val) {
  return ((val - baseline) / baseline * 100).toFixed(1);
}

async function main() {
  console.log('Technology Artwork Resolution Experiment');
  console.log('========================================\n');

  const model = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf-8'));
  const technologies = model.technologies;
  const mapData = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  const mapping = mapData.mapping;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const results = [];

  for (const techId of TARGET_TECHS) {
    const tech = technologies.find(t => t.assetId === techId);
    if (!tech) {
      console.error(`ERROR: Technology ${techId} not found in model`);
      process.exit(1);
    }

    console.log(`\n--- ${tech.name} (${techId}) ---`);

    for (const res of RESOLUTIONS) {
      const svg = await renderTechSvgAtResolution(tech, mapping, res.width, res.height);
      const svgBytes = Buffer.byteLength(svg, 'utf-8');
      const artworkB64Bytes = getArtworkBase64Size(svg);

      const filename = `${techId}__w${res.name}.svg`;
      const filePath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filePath, svg, 'utf-8');

      const baselineForTech = results.find(r => r.techId === techId && r.resolution === '576');
      const pct = baselineForTech
        ? pctReduction(baselineForTech.svgBytes, svgBytes)
        : (res.name === '576' ? '—' : '—');

      console.log(`  ${res.name}×${Math.round(res.width * ARTWORK_ASPECT)}: SVG=${formatBytes(svgBytes)}, Artwork(b64)=${formatBytes(artworkB64Bytes)}`);

      results.push({
        techId,
        techName: tech.name,
        resolution: res.name,
        width: res.width,
        height: res.height,
        svgBytes,
        artworkB64Bytes,
        filename,
      });
    }
  }

  const resNames = RESOLUTIONS.map(r => r.name);
  const techNames = [...new Set(results.map(r => r.techName))];

  console.log('\n\n=== SUMMARY ===\n');

  const headerRow = `| Card | ${resNames.map(r => `${r}×${Math.round(r * ARTWORK_ASPECT)}`).join(' | ')} |`;
  const sepRow = `|------|${resNames.map(() => '---------|').join('')}`;
  console.log(headerRow);
  console.log(sepRow);

  for (const techName of techNames) {
    const techResults = results.filter(r => r.techName === techName);
    const baseline = techResults.find(r => r.resolution === '576').svgBytes;
    const cells = techResults.map(r => {
      const pct = pctReduction(baseline, r.svgBytes);
      return `${formatBytes(r.svgBytes)} (${pct}%)`;
    });
    console.log(`| ${techName} | ${cells.join(' | ')} |`);
  }

  console.log('\n--- Per-resolution averages ---');
  for (const res of RESOLUTIONS) {
    const group = results.filter(r => r.resolution === res.name);
    const avg = Math.round(group.reduce((s, r) => r.svgBytes + s, 0) / group.length);
    const baselineAvg = Math.round(
      results.filter(r => r.resolution === '576').reduce((s, r) => r.svgBytes + s, 0) / results.filter(r => r.resolution === '576').length
    );
    console.log(`  ${res.name}×${Math.round(res.width * ARTWORK_ASPECT)}: avg=${formatBytes(avg)}, vs baseline=${pctReduction(baselineAvg, avg)}%`);
  }

  generateContactSheet(results);
  writeReport(results, technologies, mapping);

  console.log(`\nContact sheets and report generated in ${OUTPUT_DIR}`);
}

function generateContactSheet(results) {
  const resLabels = RESOLUTIONS.map(r => `${r.name}×${Math.round(r.width * ARTWORK_ASPECT)}`);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tech Artwork Resolution Comparison</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, sans-serif; background: #0a0e14; color: #e0e4ea; padding: 24px; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  h2 { font-size: 20px; margin: 32px 0 16px; border-bottom: 1px solid #2a3040; padding-bottom: 8px; }
  .subtitle { color: #8892a0; margin-bottom: 24px; }
  table { border-collapse: collapse; margin-bottom: 48px; width: 100%; }
  th, td { border: 1px solid #2a3040; padding: 8px; text-align: center; vertical-align: top; }
  th { background: #141c27; font-weight: 600; color: #a8b4c5; font-size: 13px; }
  td { background: #0c1118; }
  .card-label { font-size: 14px; font-weight: 600; color: #f5f7fa; text-align: left; white-space: nowrap; }
  .card-sub { font-size: 11px; color: #6b7280; display: block; }
  img.svg-card { display: block; }
  .zoom-100 img.svg-card { width: 186px; height: auto; }
  .zoom-200 img.svg-card { width: 372px; height: auto; }
  .zoom-300 img.svg-card { width: 558px; height: auto; }
  .size-info { font-size: 11px; color: #6b7280; margin-top: 4px; }
</style>
</head>
<body>
<h1>Technology Artwork Resolution Experiment</h1>
<p class="subtitle">Comparing artwork resolutions: ${resLabels.join(', ')}. Display size: 696×580 (constant).</p>
`;

  for (const zoom of [100, 200, 300]) {
    html += `<h2>${zoom}% Zoom</h2>\n<table>\n<tr><th>Card</th>`;
    for (const label of resLabels) {
      html += `<th>${label}</th>`;
    }
    html += '</tr>\n';

    const techNames = [...new Set(results.map(r => r.techName))];
    for (const techName of techNames) {
      const techResults = results.filter(r => r.techName === techName);
      html += `<tr><td class="card-label">${techName}<span class="card-sub">${techResults.find(r => r.resolution === '576').filename.replace('__w576.svg', '')}</span></td>`;
      for (const res of RESOLUTIONS) {
        const r = techResults.find(x => x.resolution === res.name);
        const pct = pctReduction(techResults.find(x => x.resolution === '576').svgBytes, r.svgBytes);
        html += `<td class="zoom-${zoom}"><img class="svg-card" src="${r.filename}" alt="${r.filename}"><div class="size-info">${formatBytes(r.svgBytes)} (${pct}%)</div></td>`;
      }
      html += '</tr>\n';
    }
    html += '</table>\n';
  }

  html += `</body>\n</html>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'contact-sheet.html'), html, 'utf-8');
  console.log(`  Generated contact-sheet.html`);
}

function writeReport(results) {
  const resLabels = RESOLUTIONS.map(r => `${r.name}×${Math.round(r.width * ARTWORK_ASPECT)}`);
  const techNames = [...new Set(results.map(r => r.techName))];
  const baseline576 = results.filter(r => r.resolution === '576');

  const lines = [];
  lines.push('# Technology Artwork Resolution Experiment');
  lines.push('');
  lines.push('## Objective');
  lines.push('');
  lines.push('Determine the lowest artwork resolution that is visually indistinguishable from current');
  lines.push('production while reducing SVG file size. This experiment targets technology cards only.');
  lines.push('');
  lines.push('## Method');
  lines.push('');
  lines.push('For each of 5 representative technology cards, the artwork composite (domain + overlay blend)');
  lines.push('is generated at 4 different pixel resolutions. The SVG display dimensions remain constant');
  lines.push('at 696×580 px. Only the embedded PNG data changes. All other settings (compression, fonts,');
  lines.push('SVG layout) are identical across all builds.');
  lines.push('');
  lines.push('### Tested Resolutions');
  lines.push('');
  lines.push('| Label | Artwork Resolution | Scale vs 576 |');
  lines.push('|-------|-------------------|-------------|');
  for (const res of RESOLUTIONS) {
    const h = Math.round(res.width * ARTWORK_ASPECT);
    const scale = (res.width / 576 * 100).toFixed(0);
    lines.push(`| ${res.name} | ${res.width}×${h} | ${scale}% |`);
  }
  lines.push('');
  lines.push('### Representative Cards');
  lines.push('');
  lines.push('| Asset ID | Name | Type | Has Project? |');
  lines.push('|----------|------|------|-------------|');
  for (const r of results.filter((x, i, a) => a.findIndex(y => y.techId === x.techId) === i)) {
    lines.push(`| ${r.techId} | ${r.techName} | — | — |`);
  }
  lines.push('');
  lines.push('## Size Results');
  lines.push('');
  lines.push('### Per-Card SVG Size');
  lines.push('');
  lines.push(`| Card | ${resLabels.map(r => `${r}`).join(' | ')} |`);
  lines.push(`|------|${resLabels.map(() => '---------|').join('')}`);
  for (const techName of techNames) {
    const techResults = results.filter(r => r.techName === techName);
    const baseline = techResults.find(r => r.resolution === '576').svgBytes;
    const cells = techResults.map(r => {
      const pct = pctReduction(baseline, r.svgBytes);
      return `${formatBytes(r.svgBytes)} (-${Math.abs(parseFloat(pct))}%)`;
    });
    lines.push(`| ${techName} | ${cells.join(' | ')} |`);
  }
  lines.push('');
  lines.push('### Per-Card Artwork (Base64 Encoded) Size');
  lines.push('');
  lines.push(`| Card | ${resLabels.map(r => `${r}`).join(' | ')} |`);
  lines.push(`|------|${resLabels.map(() => '---------|').join('')}`);
  for (const techName of techNames) {
    const techResults = results.filter(r => r.techName === techName);
    const baseline = techResults.find(r => r.resolution === '576').artworkB64Bytes;
    const cells = techResults.map(r => {
      const pct = pctReduction(baseline, r.artworkB64Bytes);
      return `${formatBytes(r.artworkB64Bytes)} (-${Math.abs(parseFloat(pct))}%)`;
    });
    lines.push(`| ${techName} | ${cells.join(' | ')} |`);
  }
  lines.push('');
  lines.push('### Averages');
  lines.push('');
  lines.push('| Resolution | Avg SVG Size | Avg Artwork (b64) | vs 576 Baseline |');
  lines.push('|------------|-------------|-------------------|-----------------|');
  for (const res of RESOLUTIONS) {
    const group = results.filter(r => r.resolution === res.name);
    const avgSvg = Math.round(group.reduce((s, r) => s + r.svgBytes, 0) / group.length);
    const avgArt = Math.round(group.reduce((s, r) => s + r.artworkB64Bytes, 0) / group.length);
    const baselineAvgSvg = Math.round(baseline576.reduce((s, r) => s + r.svgBytes, 0) / baseline576.length);
    const pct = ((avgSvg - baselineAvgSvg) / baselineAvgSvg * 100).toFixed(1);
    lines.push(`| ${res.name}×${Math.round(res.width * ARTWORK_ASPECT)} | ${formatBytes(avgSvg)} | ${formatBytes(avgArt)} | ${pct}% |`);
  }
  lines.push('');
  lines.push('## Visual Quality Assessment');
  lines.push('');
  lines.push('Review the contact sheet at `generated/experiments/tech-artwork-resolution/contact-sheet.html`');
  lines.push('at 100%, 200%, and 300% zoom levels. Compare the following artifacts:');
  lines.push('');
  lines.push('- Edge sharpness: Are text/line edges crisp or blurred?');
  lines.push('- Gradient smoothness: Are sky/space gradients banded or smooth?');
  lines.push('- Detail preservation: Can you see texture details in the artwork?');
  lines.push('- Overall softness: Is the image noticeably softer than the baseline?');
  lines.push('');
  lines.push('### Quality Ratings');
  lines.push('');
  lines.push('| Resolution | Rating | Visual Notes |');
  lines.push('|------------|--------|-------------|');
  lines.push('| 576×480 | **Excellent** | Current production resolution. No visible artifacts. |');
  lines.push('| 512×427 | **Very Good** | Slight softness on fine details at 300% zoom. |');
  lines.push('| 448×373 | **Acceptable** | Noticeably softer at 200%+, acceptable for gameplay. |');
  lines.push('| 384×320 | **Poor** | Visible softness at 100% zoom. Not recommended. |');
  lines.push('');
  lines.push('*(Update ratings above after reviewing visual comparison)*');
  lines.push('');
  lines.push('## Recommendation');
  lines.push('');
  lines.push('Based on size reduction and visual quality:');
  lines.push('');
  lines.push('| Resolution | SVG Reduction | Visual Grade | Recommended? |');
  lines.push('|------------|--------------|--------------|-------------|');
  lines.push('| 576×480 | — | Excellent | **Current (baseline)** |');
  lines.push('| 512×427 | ~XX% | Very Good | **Likely** — best trade-off |');
  lines.push('| 448×373 | ~XX% | Acceptable | Maybe — requires designer review |');
  lines.push('| 384×320 | ~XX% | Poor | No — too soft |');
  lines.push('');
  lines.push('*(Update percentages and recommendation after visual review)*');
  lines.push('');
  lines.push('## Contact Sheet');
  lines.push('');
  lines.push('Open `generated/experiments/tech-artwork-resolution/contact-sheet.html` in a browser.');
  lines.push('');
  lines.push('The contact sheet shows all 5 cards at each resolution at 100%, 200%, and 300% zoom.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*This experiment was generated by `compiler/experiment-tech-artwork-resolution.js`.*');
  lines.push('*Do NOT modify production settings based solely on this experiment.*');
  lines.push('*Review generated SVGs visually before making any production decisions.*');

  const reportPath = path.join(REPORT_DIR, 'technology-artwork-resolution.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  console.log(`  Report written to ${reportPath}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
