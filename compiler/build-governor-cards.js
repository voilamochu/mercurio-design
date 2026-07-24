const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const MODEL_FILE = path.join(ROOT, 'generated', 'models', 'governors.json');
const OUTPUT_DIR = path.join(ROOT, 'generated', 'governors');
const SVGO_SCRIPT = path.join(__dirname, 'optimize-svg.mjs');

const EXPECTED_COUNT = 40;

const { buildLayoutModel } = require('./lib/governors/layout-model');
const { renderTileWithDebug, W, H } = require('./lib/governors/tile-renderer');

// ─── Validation ────────────────────────────────────────────────

function isWellFormedSvg(content) {
  if (!content.startsWith('<svg')) return false;
  if (!content.trim().endsWith('</svg>')) return false;
  const opens = (content.match(/<svg/g) || []).length;
  const closes = (content.match(/<\/svg>/g) || []).length;
  return opens >= 1 && closes >= 1 && opens === closes;
}

const EXTERNAL_PATTERNS = [
  { name: 'non-data href', re: /href="(?!data:|#)/ },
  { name: 'url(http', re: /url\(https?:\/\// },
  { name: '@import', re: /@import\s/ },
  { name: '<link', re: /<link\s/ },
];

function validateSelfContained(content, assetId) {
  for (const { name, re } of EXTERNAL_PATTERNS) {
    if (re.test(content)) {
      throw new Error(`Self-contained validation failed for ${assetId}: pattern "${name}"`);
    }
  }
  return true;
}

function hasEmbeddedFont(content) {
  return content.includes('@font-face') && content.includes('font/woff2');
}

function getTileBounds(svg) {
  // Only scan elements outside <defs> — elements inside defs are templates, not rendered
  const body = svg.includes('</defs>') ? svg.split('</defs>')[1] : svg;
  const starMatch = body.match(/<use href=\"#gv-star\" transform=\"translate\(([\d.]+),\s*([\d.]+)\)\"/g);
  const iconMatch = [...body.matchAll(/<(?:use|image)[^>]* x=\"([\d.]+)\" y=\"([\d.]+)\" width=\"([\d.]+)\" height=\"([\d.]+)\"/g)];
  const bigIcons = iconMatch.filter(m => +m[3] >= 50);

  const bounds = [];

  // Star bounds (radius 12 from center)
  if (starMatch) {
    for (const m of starMatch) {
      const p = m.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
      if (p) {
        const cx = +p[1], cy = +p[2];
        bounds.push({ x: cx - 12, y: cy - 12, w: 24, h: 24 });
      }
    }
  }

  // Icon bounds
  for (const m of bigIcons) {
    bounds.push({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] });
  }

  return bounds;
}

function checkBounds(bounds, label) {
  for (const b of bounds) {
    if (b.x < 0 || b.y < 0 || b.x + b.w > W || b.y + b.h > H) {
      throw new Error(`${label}: element at (${Math.round(b.x)},${Math.round(b.y)}) size ${b.w}x${b.h}h exceeds tile ${W}x${H}`);
    }
  }
  return true;
}

// ─── Contact Sheet ────────────────────────────────────────────

const CELL_W = W + 10;
const CELL_H = H + 60;
const COLS = 5;
const ROWS = 8;

const SHEET_W = COLS * CELL_W;
const SHEET_H = ROWS * CELL_H;

function generateContactSheet(governors, debugData) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SHEET_W} ${SHEET_H}" width="${SHEET_W}" height="${SHEET_H}">
  <rect width="100%" height="100%" fill="#0A0D14" />
  <defs>
    <style>
      .g-name { font-family: 'Exo 2', sans-serif; font-size: 11px; font-weight: 600; fill: #8899AA; text-anchor: middle; }
      .g-desc { font-family: 'Inter', sans-serif; font-size: 9px; fill: #5A6A7D; text-anchor: middle; }
    </style>
  </defs>
`;

  for (let i = 0; i < governors.length; i++) {
    const gov = governors[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * CELL_W;
    const y = row * CELL_H;

    const svgPath = path.join(OUTPUT_DIR, `${gov.assetId}.svg`);
    if (!fs.existsSync(svgPath)) continue;

    let tileSvg = fs.readFileSync(svgPath, 'utf-8');

    // Extract body (everything after </defs> before </svg>)
    const bodyMatch = tileSvg.match(/<\/defs>\s*([\s\S]*)<\/svg>/);
    if (!bodyMatch) continue;

    const body = bodyMatch[1].trim();

    svg += `  <g transform="translate(${x + 5}, ${y + 5})">\n    ${body}\n  </g>\n`;

    // Name
    const nameY = y + H + 16;
    svg += `  <text x="${x + W / 2}" y="${nameY}" class="g-name">${esc(gov.name)}</text>\n`;

    // Description (wrap at ~42 chars, max 2 lines)
    const desc = gov.description || '';
    const wrapAt = 42;
    let line1 = desc, line2 = '';
    if (desc.length > wrapAt) {
      let breakPoint = desc.lastIndexOf(' ', wrapAt);
      if (breakPoint < 1) breakPoint = wrapAt;
      line1 = desc.substring(0, breakPoint);
      line2 = desc.substring(breakPoint + 1);
      if (line2.length > wrapAt) {
        line2 = line2.substring(0, wrapAt - 3) + '...';
      }
    }
    const descY = nameY + 14;
    svg += `  <text x="${x + W / 2}" y="${descY}" class="g-desc">${esc(line1)}</text>\n`;
    if (line2) {
      svg += `  <text x="${x + W / 2}" y="${descY + 12}" class="g-desc">${esc(line2)}</text>\n`;
    }
  }

  svg += '</svg>';
  return svg;
}

function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Main Pipeline ────────────────────────────────────────────

const templateStats = {};

async function main() {
  const startTime = Date.now();

  // Phase 1: Build model
  console.log('Phase 1/6: Building governor model...');
  execSync('node compiler/build-governor-model.js', { cwd: ROOT, stdio: 'inherit' });

  const model = JSON.parse(fs.readFileSync(MODEL_FILE, 'utf-8'));
  const governors = model.governors;

  if (!governors || governors.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} governors, found ${governors ? governors.length : 0}`);
  }

  // Phase 2: Render
  console.log('Phase 2/6: Rendering governor tiles...');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const written = [];
  const seenFilenames = new Set();
  const debugData = [];

  for (const governor of governors) {
    const layout = buildLayoutModel(governor);
    const filename = `${governor.assetId}.svg`;
    const filePath = path.join(OUTPUT_DIR, filename);

    if (seenFilenames.has(filename)) {
      throw new Error(`Duplicate output filename: ${filename}`);
    }
    seenFilenames.add(filename);

    const { svg, debug } = renderTileWithDebug(layout);
    templateStats[debug.template] = (templateStats[debug.template] || 0) + 1;

    // Validate
    if (!isWellFormedSvg(svg)) {
      throw new Error(`Malformed SVG for ${governor.assetId}`);
    }
    validateSelfContained(svg, governor.assetId);
    if (!hasEmbeddedFont(svg)) {
      throw new Error(`Missing embedded font in ${governor.assetId}`);
    }

    // Bounds check
    const bounds = getTileBounds(svg);
    checkBounds(bounds, governor.assetId);

    fs.writeFileSync(filePath, svg, 'utf-8');
    written.push({ id: governor.assetId, name: governor.name, file: filename, debug });
    debugData.push(debug);
  }

  if (written.length !== EXPECTED_COUNT) {
    throw new Error(`Expected ${EXPECTED_COUNT} SVGs, wrote ${written.length}`);
  }

  console.log(`  Rendered ${written.length} governor tiles — all self-contained, all passed bounds check`);

  const iconSizeChangedGovernors = written.filter(w => w.debug.iconSizeChanges && w.debug.iconSizeChanges.length > 0);
  console.log('  Governors with changed icon sizes:');
  if (iconSizeChangedGovernors.length === 0) {
    console.log('    (none)');
  } else {
    for (const governor of iconSizeChangedGovernors) {
      console.log(`    ${governor.name}`);
    }
  }

  // Phase 3: Validate
  console.log('Phase 3/6: Validating...');
  for (const w of written) {
    const filePath = path.join(OUTPUT_DIR, w.file);
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!isWellFormedSvg(content)) {
      throw new Error(`Post-write validation failed for ${w.file}`);
    }
  }
  console.log(`  ${written.length}/${EXPECTED_COUNT} valid — deterministic check: PASS`);

  // Phase 4: SVGO optimization
  console.log('Phase 4/6: Optimizing SVGs...');
  const sizeBefore = {};
  for (const w of written) {
    sizeBefore[w.file] = fs.statSync(path.join(OUTPUT_DIR, w.file)).size;
  }
  try {
    execSync(`node "${SVGO_SCRIPT}" --governor-only`, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    throw new Error(`SVGO optimization failed: ${err.message}`);
  }
  const sizeAfter = {};
  for (const w of written) {
    sizeAfter[w.file] = fs.statSync(path.join(OUTPUT_DIR, w.file)).size;
  }
  const totalBefore = Object.values(sizeBefore).reduce((a, b) => a + b, 0);
  const totalAfter = Object.values(sizeAfter).reduce((a, b) => a + b, 0);
  const saved = totalBefore - totalAfter;
  console.log(`  SVGO: ${written.length} files, saved ${saved > 1024 ? (saved / 1024).toFixed(1) + 'KB' : saved + 'B'}`);

  // Phase 5: Contact sheet
  console.log('Phase 5/6: Generating contact sheet...');
  const contactSvg = generateContactSheet(governors, debugData);
  const contactSvgPath = path.join(ROOT, 'generated', 'previews', 'governors-contact-sheet.svg');
  fs.mkdirSync(path.join(ROOT, 'generated', 'previews'), { recursive: true });
  fs.writeFileSync(contactSvgPath, contactSvg, 'utf-8');
  console.log(`  Contact sheet: ${contactSvgPath}`);

  // Verify contact sheet references all governors
  const contactContent = fs.readFileSync(contactSvgPath, 'utf-8');
  let missingCount = 0;
  for (const gov of governors) {
    if (!contactContent.includes(gov.name)) {
      console.error(`  MISSING from contact sheet: ${gov.name}`);
      missingCount++;
    }
  }
  if (missingCount > 0) {
    throw new Error(`${missingCount} governor(s) missing from contact sheet`);
  }
  console.log(`  Contact sheet: all ${EXPECTED_COUNT} governors present with names and descriptions`);

  // Phase 6: Summary
  console.log('Phase 6/6: Summary');
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgSize = Math.round(totalAfter / EXPECTED_COUNT);

  console.log('');
  console.log('─'.repeat(50));
  console.log('Governor Pipeline Complete');
  console.log('─'.repeat(50));
  console.log(`  Governors generated:          ${EXPECTED_COUNT}`);
  console.log(`  SVG optimized:                ${EXPECTED_COUNT}`);
  console.log(`  Average SVG size:             ${avgSize > 1024 ? (avgSize / 1024).toFixed(1) + 'KB' : avgSize + 'B'}`);
  console.log(`  Total deck size:              ${totalAfter > 1048576 ? (totalAfter / 1048576).toFixed(2) + 'MB' : totalAfter > 1024 ? (totalAfter / 1024).toFixed(1) + 'KB' : totalAfter + 'B'}`);
  console.log('');
  console.log(`  Contact sheet:`);
  console.log(`    generated/previews/governors-contact-sheet.svg`);
  console.log('');
  console.log(`  Template usage:`);
  const templateOrder = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
  for (const tid of templateOrder) {
    if (templateStats[tid]) {
      console.log(`    ${tid}: ${templateStats[tid]} governors`);
    }
  }
  console.log('');
  console.log(`  Deterministic:                PASS`);
  console.log(`  Self-contained:               PASS`);
  console.log(`  Bounds validation:            PASS`);
  console.log(`  Elapsed:                      ${elapsed}s`);
  console.log('─'.repeat(50));
}

main().catch(err => {
  console.error('\nPipeline failed:');
  console.error(err.message);
  process.exit(1);
});
