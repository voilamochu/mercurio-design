const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');

const PATHS = {
  artworkDir: path.join(ROOT, 'source', 'artwork', 'cards', 'others'),
  outputDir: path.join(ROOT, 'generated', 'cards-others'),
};

const SVGO_SCRIPT = path.join(__dirname, 'optimize-svg.mjs');

const { CARD, FONTS, BOX } = require('./lib/shared/card');
const CARD_W = CARD.W;
const CARD_H = CARD.H;

// Embedded artwork resolution.
const FAMILIES = [
  {
    prefix: 'card_028',
    title: 'Asteroids',
    artwork: 'asteroid.png',
    copies: 9,
  },
  {
    prefix: 'card_029',
    title: 'Lost Fleet',
    artwork: 'lostfleet.png',
    copies: 12,
  },
];

const TITLE = {
  x: BOX.x,
  y: CARD.MARGIN,
  width: BOX.width,
  height: 70,
  fontSize: FONTS.title.size,
  lineHeight: FONTS.title.size * 1.25,
  paddingX: BOX.paddingX,
  color: '#F5F7FA',
  scrimFill: '#141C27',
  scrimOpacity: BOX.fillOpacity,
  scrimRx: BOX.rx,
};

const BOTTOM = {
  x: BOX.x,
  y: CARD.H - 70 - CARD.MARGIN,
  width: BOX.width,
  height: 70,
  fontSize: FONTS.body.size,
  lineHeight: FONTS.body.size * 1.25,
  color: '#F5F7FA',
  scrimFill: '#141C27',
  scrimOpacity: BOX.fillOpacity,
  scrimRx: BOX.rx,
};

const { generateFontCss } = require('./lib/svg/font-embed');

async function embedArtworkDataUri(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Artwork not found: ${filePath}`);
  }
  const optimized = await sharp(filePath)
    .png({ compressionLevel: 9, palette: true, colors: 128, effort: 10, adaptiveFiltering: false })
    .toBuffer();
  return optimized.toString('base64');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderCardSvg(family, artworkBase64) {
  const fontCss = generateFontCss();
  const cx = CARD_W / 2;
  const titleCy = TITLE.y + TITLE.height / 2;
  const bottomCy = BOTTOM.y + BOTTOM.height / 2;
  // Bottom descriptive text — restored after 500×700 pipeline removed it (captain 2026-08-21).
  // Full-width rx0 box, Inter 32, same scrim as title. Content mirrors server hint:
  // asteroid → "Tuck. +1★" (star gold), lost fleet → "Tuck. Gain a lost fleet reward."
  const isAsteroid = family.prefix === 'card_028';
  const bottomInner = isAsteroid
    ? `Tuck. +1<tspan fill="#d8a838">\u2605</tspan>`
    : `Tuck. Gain a lost fleet reward.`;
  const bottomText = `<text x="${cx}" y="${bottomCy}" font-family="${FONTS.body.family}" font-weight="${FONTS.body.weight}" font-size="${BOTTOM.fontSize}" fill="${BOTTOM.color}" text-anchor="middle" dominant-baseline="middle">${bottomInner}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
  <defs>
    <style>
${fontCss}
    </style>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="${CARD_W}" height="${CARD_H}" rx="${CARD.RX}" ry="${CARD.RX}" />
    </clipPath>
  </defs>
  <g clip-path="url(#cardClip)">
    <image href="data:image/png;base64,${artworkBase64}" x="0" y="0" width="${CARD_W}" height="${CARD_H}" preserveAspectRatio="xMidYMid slice" />
    <rect x="${TITLE.x}" y="${TITLE.y}" width="${TITLE.width}" height="${TITLE.height}" rx="${TITLE.scrimRx}" ry="${TITLE.scrimRx}" fill="${TITLE.scrimFill}" fill-opacity="${TITLE.scrimOpacity}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />
    <text x="${cx}" y="${titleCy}" font-family="${FONTS.title.family}" font-weight="${FONTS.title.weight}" font-size="${TITLE.fontSize}" fill="${TITLE.color}" text-anchor="middle" dominant-baseline="middle">${escapeXml(family.title)}</text>
    <rect x="${BOTTOM.x}" y="${BOTTOM.y}" width="${BOTTOM.width}" height="${BOTTOM.height}" rx="${BOTTOM.scrimRx}" ry="${BOTTOM.scrimRx}" fill="${BOTTOM.scrimFill}" fill-opacity="${BOTTOM.scrimOpacity}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />
    ${bottomText}
  </g>
</svg>
`;
}

function isWellFormedSvg(content) {
  if (!content.startsWith('<svg')) return false;
  if (!content.trim().endsWith('</svg>')) return false;
  const opens = (content.match(/<svg/g) || []).length;
  const closes = (content.match(/<\/svg>/g) || []).length;
  return opens >= 1 && closes >= 1 && opens === closes;
}

function validateSelfContained(content, assetId) {
  const patterns = [
    { name: 'non-data href', re: /href="(?!data:)/ },
    { name: 'url(http', re: /url\(https?:\/\// },
    { name: '@import', re: /@import\s/ },
    { name: '<link', re: /<link\s/ },
  ];
  for (const { name, re } of patterns) {
    if (re.test(content)) {
      throw new Error(`Self-contained validation failed for ${assetId}: pattern "${name}"`);
    }
  }
  return true;
}

async function build() {
  const startTime = Date.now();

  console.log('\n  OTHERS CARDS ASSET PIPELINE (asteroid / lost fleet)');
  console.log('  ──────────────────────────────────────');

  fs.mkdirSync(PATHS.outputDir, { recursive: true });

  const written = [];
  const seenFilenames = new Set();

  for (const family of FAMILIES) {
    const artworkPath = path.join(PATHS.artworkDir, family.artwork);
    const artworkBase64 = await embedArtworkDataUri(artworkPath);

    const svg = renderCardSvg(family, artworkBase64);

    if (!isWellFormedSvg(svg)) {
      throw new Error(`Malformed SVG for ${family.prefix}`);
    }

    for (let copy = 1; copy <= family.copies; copy++) {
      const filename = `${family.prefix}_${copy}.svg`;
      if (seenFilenames.has(filename)) {
        throw new Error(`Duplicate output filename: ${filename}`);
      }
      seenFilenames.add(filename);

      validateSelfContained(svg, filename);

      const filePath = path.join(PATHS.outputDir, filename);
      fs.writeFileSync(filePath, svg, 'utf-8');
      written.push({ filename, size: fs.statSync(filePath).size });
    }
  }

  console.log(`  Generated ${written.length} SVGs in ${PATHS.outputDir}`);

  console.log('  Running SVGO optimization...');
  try {
    execSync(`node "${SVGO_SCRIPT}" --others-only`, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error('  SVGO optimization failed:', err.message);
    process.exit(1);
  }

  const totalBytes = written.reduce((sum, f) => sum + f.size, 0);
  console.log(`  Total output: ${(totalBytes / 1048576).toFixed(2)} MB`);
  console.log('  All SVGs are self-contained: artwork embedded, title text inline.');
  console.log('  ──────────────────────────────────────');
  console.log(`  Done in ${Date.now() - startTime}ms\n`);
}

build().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
