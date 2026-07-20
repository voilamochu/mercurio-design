const { TITLE_BAR, FONTS } = require('./layout');

function fontAttr(spec, size) {
  const parts = [`font-family="${spec.family}"`, `font-size="${size}"`];
  if (spec.weight) parts.push(`font-weight="${spec.weight}"`);
  if (spec.style) parts.push(`font-style="${spec.style}"`);
  return parts.join(' ');
}

function renderTitleBar(name, romanLevel) {
  const b = TITLE_BAR;
  const nameX = b.x + b.paddingX;
  const cy = b.y + b.height / 2;
  const levelX = b.x + b.width - b.levelInset;

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" />`,
    `  <text x="${nameX}" y="${cy}" ${fontAttr(FONTS.title, b.nameFont)} fill="#1a1a1a" text-anchor="start" dominant-baseline="middle">${escapeXml(name)}</text>`,
    `  <text x="${levelX}" y="${cy}" ${fontAttr(FONTS.roman, b.levelFont)} fill="${b.levelColor}" text-anchor="end" dominant-baseline="middle">${escapeXml(romanLevel)}</text>`,
  ].join('\n');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { renderTitleBar, escapeXml, fontAttr };
