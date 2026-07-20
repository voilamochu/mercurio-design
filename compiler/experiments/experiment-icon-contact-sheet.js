const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const INPUT_DIR = path.join(ROOT, 'generated', 'experiments', 'icon-resolution');
const OUTPUT_DIR = INPUT_DIR;
const PNG_OUTPUT = path.join(OUTPUT_DIR, 'contact-sheet-icons.png');
const PDF_OUTPUT = path.join(OUTPUT_DIR, 'contact-sheet-icons.pdf');

const CARD_W = 744;
const CARD_H = 1039;

const DISPLAY_W = 372;
const DISPLAY_H = 520;

const PROFILES = [
  { label: '352 px\n(Current)', suffix: 'baseline' },
  { label: '256 px',           suffix: 'I1' },
  { label: '192 px',           suffix: 'I2' },
  { label: '128 px',           suffix: 'I3' },
  { label: '96 px',            suffix: 'I4' },
];

const CARDS = [
  { id: 'card_019_1', type: 'Earth',   reason: 'bright artwork' },
  { id: 'card_001_1', type: 'Swamp',   reason: 'dark artwork' },
  { id: 'card_005_1', type: 'Scrap',   reason: 'busy artwork' },
  { id: 'card_011_1', type: 'Ocean',   reason: 'smooth artwork' },
  { id: 'card_014_1', type: 'Jungle',  reason: 'high icon count' },
];

const ROW_LABEL_W = 170;
const COL_HEADER_H = 70;
const GAP_X = 24;
const GAP_Y = 24;
const MARGIN = 40;

const COLS = PROFILES.length;
const ROWS = CARDS.length;

function colX(col) {
  return MARGIN + ROW_LABEL_W + col * (DISPLAY_W + GAP_X);
}

function rowY(row) {
  return MARGIN + COL_HEADER_H + row * (DISPLAY_H + GAP_Y);
}

const sheetW = MARGIN + ROW_LABEL_W + COLS * DISPLAY_W + (COLS - 1) * GAP_X + MARGIN;
const sheetH = MARGIN + COL_HEADER_H + ROWS * DISPLAY_H + (ROWS - 1) * GAP_Y + MARGIN;

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function buildLabelsSvg() {
  const lines = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}">`);

  for (let c = 0; c < COLS; c++) {
    const cx = colX(c) + DISPLAY_W / 2;
    const cy = MARGIN + COL_HEADER_H / 2;
    const labelParts = PROFILES[c].label.split('\n');
    lines.push(`  <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#333">${escapeXml(labelParts[0])}</text>`);
    if (labelParts[1]) {
      lines.push(`  <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#666">${escapeXml(labelParts[1])}</text>`);
    }
    lines.push(`  <line x1="${colX(c)}" y1="${MARGIN + COL_HEADER_H}" x2="${colX(c) + DISPLAY_W}" y2="${MARGIN + COL_HEADER_H}" stroke="#CCC" stroke-width="1" />`);
  }

  for (let r = 0; r < ROWS; r++) {
    const ry = rowY(r) + DISPLAY_H / 2;
    const lx = MARGIN + ROW_LABEL_W - 10;
    lines.push(`  <text x="${lx}" y="${ry - 10}" text-anchor="end" font-family="sans-serif" font-size="14" font-weight="bold" fill="#333">${escapeXml(CARDS[r].id)}</text>`);
    lines.push(`  <text x="${lx}" y="${ry + 12}" text-anchor="end" font-family="sans-serif" font-size="13" fill="#666">${escapeXml(CARDS[r].type)}</text>`);
    lines.push(`  <line x1="${MARGIN}" y1="${rowY(r) + DISPLAY_H + GAP_Y / 2}" x2="${MARGIN + ROW_LABEL_W + COLS * (DISPLAY_W + GAP_X)}" y2="${rowY(r) + DISPLAY_H + GAP_Y / 2}" stroke="#EEE" stroke-width="1" />`);
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = colX(c) + DISPLAY_W / 2;
      const cy = rowY(r) + DISPLAY_H + 4;
      const label = PROFILES[c].label.replace('\n', ' ');
      lines.push(`  <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#999">${escapeXml(label)}</text>`);
    }
  }

  lines.push(`</svg>`);
  return lines.join('\n');
}

async function main() {
  console.log('Generating icon contact sheet...\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const cardImages = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const filename = `${CARDS[r].id}__${PROFILES[c].suffix}.svg`;
      const filePath = path.join(INPUT_DIR, filename);
      if (!fs.existsSync(filePath)) {
        console.error(`  MISSING: ${filename}`);
        continue;
      }
      const svg = fs.readFileSync(filePath);
      const img = await sharp(svg)
        .resize(DISPLAY_W, DISPLAY_H, { fit: 'fill', kernel: 'lanczos3' })
        .png()
        .toBuffer();
      cardImages.push({ buf: img, row: r, col: c });
      console.log(`  Rendered ${filename} → ${DISPLAY_W}×${DISPLAY_H}`);
    }
  }

  const bgColor = { r: 229, g: 229, b: 229, alpha: 1 };
  const canvas = await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: bgColor,
    },
  }).png().toBuffer();

  const composites = cardImages.map(img => ({
    input: img.buf,
    left: colX(img.col),
    top: rowY(img.row),
  }));

  const labelsSvg = await buildLabelsSvg();
  composites.push({
    input: Buffer.from(labelsSvg),
    left: 0,
    top: 0,
  });

  const result = await sharp(canvas)
    .composite(composites)
    .png()
    .toBuffer();

  fs.writeFileSync(PNG_OUTPUT, result);
  const pngStat = fs.statSync(PNG_OUTPUT);
  console.log(`\nWrote ${PNG_OUTPUT} (${(pngStat.size / 1024 / 1024).toFixed(2)} MB, ${sheetW}×${sheetH} px)`);

  try {
    execSync(`convert "${PNG_OUTPUT}" "${PDF_OUTPUT}"`, { stdio: 'pipe' });
    const pdfStat = fs.statSync(PDF_OUTPUT);
    console.log(`Wrote ${PDF_OUTPUT} (${(pdfStat.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error(`PDF conversion failed: ${err.message}`);
  }

  console.log('\n=== Contact Sheet Report ===');
  console.log(`Dimensions: ${sheetW} × ${sheetH} px`);
  console.log(`Cards included: ${CARDS.length}`);
  for (const card of CARDS) {
    console.log(`  ${card.id} (${card.type}) - ${card.reason}`);
  }
  console.log(`Icon resolutions compared:`);
  for (const p of PROFILES) {
    console.log(`  ${p.suffix}: ${p.label}`);
  }
  console.log(`PNG file size: ${(pngStat.size / 1024 / 1024).toFixed(2)} MB`);
  try {
    const pdfStat = fs.statSync(PDF_OUTPUT);
    console.log(`PDF file size: ${(pdfStat.size / 1024 / 1024).toFixed(2)} MB`);
  } catch {
    console.log(`PDF file size: N/A`);
  }
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
