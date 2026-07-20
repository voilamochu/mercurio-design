const { FLAVOR_BOX, FONTS } = require('./layout');
const { escapeXml, fontAttr } = require('./title');

const PLACEHOLDER_FLAVOR = 'The future belongs to those willing to build it.';

function renderFlavorBox(flavorText) {
  const b = FLAVOR_BOX;
  const text = flavorText && flavorText.trim() ? flavorText : PLACEHOLDER_FLAVOR;
  const y = b.y + b.firstYOffset;

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" />`,
    `  <text x="${b.x + b.paddingX}" y="${y}" ${fontAttr(FONTS.flavor, b.font)} fill="${b.fillColor}" text-anchor="start" dominant-baseline="middle">${escapeXml(text)}</text>`,
  ].join('\n');
}

module.exports = { renderFlavorBox, PLACEHOLDER_FLAVOR };
