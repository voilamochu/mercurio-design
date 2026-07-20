const { CARD_W, FLAVOR, FONTS } = require('./layout');
const { escapeXml, fontAttr } = require('./title');

function renderFlavorText(flavorText) {
  const text = flavorText && flavorText.trim() ? flavorText : '';
  if (!text) return '';

  const cx = CARD_W / 2;

  return `  <text x="${cx}" y="${FLAVOR.y}" ${fontAttr(FONTS.flavor, FLAVOR.font)} fill="${FLAVOR.fillColor}" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>`;
}

module.exports = { renderFlavorText };
