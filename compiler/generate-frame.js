const fs = require('fs');
const path = require('path');

const SLOTS_PATH = path.join(__dirname, '..', 'templates', 'cards', 'planet', 'slots.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'templates', 'cards', 'planet', 'frame.svg');
const SLOT_RADIUS = 20;

const slots = JSON.parse(fs.readFileSync(SLOTS_PATH, 'utf-8'));

const { card, header, artwork, inputs, outputs, footer } = slots;
const { width, height, cornerRadius, safeMargin } = card;

function debugLabel(id) {
  return id
    .replace(/^input-/i, 'IN-')
    .replace(/^output-/i, 'OUT-')
    .toUpperCase();
}

const lines = [];
function l(s) { lines.push(s); }

l(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`);

l(`  <g id="background"/>`);

l(`  <g id="frame">`);
l(`    <rect x="0" y="0" width="${width}" height="${height}" rx="${cornerRadius}" ry="${cornerRadius}" fill="none" stroke="#333333" stroke-width="2"/>`);
l(`    <line x1="0" y1="${header.height}" x2="${width}" y2="${header.height}" stroke="#333333" stroke-width="1"/>`);
l(`  </g>`);

l(`  <g id="artwork">`);
l(`    <rect x="${artwork.x}" y="${artwork.y}" width="${artwork.width}" height="${artwork.height}" fill="none" stroke="#999999" stroke-dasharray="4,4"/>`);
l(`  </g>`);

l(`  <g id="header">`);
const ptR = header.planetType.size / 2;
l(`    <circle cx="${header.planetType.x}" cy="${header.planetType.y}" r="${ptR}" fill="none" stroke="#333333" stroke-width="2"/>`);
l(`    <text x="${header.planetType.x}" y="${header.planetType.y + ptR + 14}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#333333">Planet Type</text>`);
const vpR = header.vp.iconSize / 2;
l(`    <circle cx="${header.vp.x}" cy="${header.vp.y}" r="${vpR}" fill="none" stroke="#333333" stroke-width="2"/>`);
l(`    <text x="${header.vp.x}" y="${header.vp.y + vpR + 14}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#333333">VP</text>`);
l(`  </g>`);

l(`  <g id="inputs">`);
inputs.forEach((slot) => {
  l(`    <circle cx="${slot.x}" cy="${slot.y}" r="${SLOT_RADIUS}" fill="none" stroke="#333333" stroke-width="2"/>`);
  l(`    <text x="${slot.x}" y="${slot.y}" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="7" fill="#333333">${debugLabel(slot.id)}</text>`);
});
l(`  </g>`);

l(`  <g id="outputs">`);
outputs.forEach((slot) => {
  l(`    <circle cx="${slot.x}" cy="${slot.y}" r="${SLOT_RADIUS}" fill="none" stroke="#333333" stroke-width="2"/>`);
  l(`    <text x="${slot.x}" y="${slot.y}" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="7" fill="#333333">${debugLabel(slot.id)}</text>`);
});
l(`  </g>`);

l(`  <g id="footer">`);
l(`    <rect x="${footer.x}" y="${footer.y}" width="${footer.width}" height="${footer.height}" fill="#333333"/>`);
l(`  </g>`);

l(`  <g id="debug">`);
l(`    <rect x="${safeMargin}" y="${safeMargin}" width="${width - 2 * safeMargin}" height="${height - 2 * safeMargin}" fill="none" stroke="#FF0000" stroke-dasharray="2,2" stroke-width="1"/>`);
l(`    <text x="${safeMargin}" y="${safeMargin - 4}" font-family="sans-serif" font-size="9" fill="#FF0000">Safe Margin</text>`);
l(`    <text x="${artwork.x}" y="${artwork.y - 6}" font-family="sans-serif" font-size="9" fill="#FF0000">Artwork</text>`);
l(`    <text x="${footer.x + 8}" y="${footer.y - 4}" font-family="sans-serif" font-size="9" fill="#FF0000">Footer</text>`);
l(`  </g>`);

l(`</svg>`);

fs.writeFileSync(OUTPUT_PATH, lines.join('\n') + '\n');
console.log('Generated frame.svg');
