const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');

const RESOURCE_ICONS = [
  'grain', 'water', 'algae', 'ore', 'robot',
  'electronics', 'crate', 'power', 'science',
  'population', 'influence',
];

const ICON_SIZE = 352;
const ICON_COLORS = {
  grain: '#C8A84E',
  water: '#4A8BC2',
  algae: '#5B9E4A',
  ore: '#8B7B6B',
  robot: '#6B8BA4',
  electronics: '#4A9E8B',
  crate: '#A47B4A',
  power: '#C84A3E',
  science: '#7B5BA4',
  population: '#C87B3E',
  influence: '#C89E4A',
};

const EXISTING_SOURCE = path.join(ROOT, 'source', 'icons', 'resources');
const TARGET_DIR = path.join(ROOT, 'source', 'artwork', 'resources');

const EXISTING_MAP = {
  algae: 'Algae.png',
  crate: 'Crate.png',
  electronics: 'Electronics.png',
  grain: 'Grain.png',
  ore: 'Ore.png',
  population: 'Human.png',
  robot: 'Robot.png',
  water: 'Water.png',
};

async function main() {
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  for (const id of RESOURCE_ICONS) {
    const targetPath = path.join(TARGET_DIR, `${id}.png`);

    if (fs.existsSync(targetPath)) {
      console.log(`  EXISTS: ${id}.png — skipped`);
      continue;
    }

    if (EXISTING_MAP[id]) {
      const src = path.join(EXISTING_SOURCE, EXISTING_MAP[id]);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, targetPath);
        console.log(`  COPIED: ${EXISTING_MAP[id]} → ${id}.png`);
        continue;
      }
    }

    const color = ICON_COLORS[id] || '#888888';
    const svg = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ICON_SIZE}" height="${ICON_SIZE}" rx="24" fill="${color}" opacity="0.15"/>
      <circle cx="${ICON_SIZE / 2}" cy="${ICON_SIZE / 2}" r="96" fill="${color}" opacity="0.6"/>
      <text x="${ICON_SIZE / 2}" y="${ICON_SIZE / 2 + 16}" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-rendering="geometricPrecision">${id[0].toUpperCase()}</text>
    </svg>`;

    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(targetPath);

    console.log(`  GENERATED: ${id}.png (placeholder)`);
  }

  const files = fs.readdirSync(TARGET_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`\n  Total: ${files.length} resource icons in ${TARGET_DIR}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
