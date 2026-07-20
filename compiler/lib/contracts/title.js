const { TITLE_BAR, FONTS } = require('./layout');

function fontAttr(spec, size) {
  const parts = [`font-family="${spec.family}"`, `font-size="${size}"`];
  if (spec.weight) parts.push(`font-weight="${spec.weight}"`);
  if (spec.style) parts.push(`font-style="${spec.style}"`);
  return parts.join(' ');
}

function renderTitle(name) {
  const b = TITLE_BAR;
  const nameX = b.x + b.paddingX;
  const cy = b.y + b.height / 2;

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />`,
    `  <text x="${nameX}" y="${cy}" ${fontAttr(FONTS.title, b.nameFont)} fill="${b.nameColor}" text-anchor="start" dominant-baseline="middle">${escapeXml(name)}</text>`,
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

module.exports = { renderTitle, escapeXml, fontAttr };
