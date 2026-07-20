const { CARD_W, FLAVOR_TEXT, FONTS } = require('./layout');
const { escapeXml, fontAttr } = require('./title');

const PLACEHOLDER_FLAVOR = 'The future belongs to those willing to build it.';

function renderFlavorText(flavorText, y) {
  const text = flavorText && flavorText.trim() ? flavorText : PLACEHOLDER_FLAVOR;
  const cx = CARD_W / 2;

  return `  <text x="${cx}" y="${y}" ${fontAttr(FONTS.flavor, FLAVOR_TEXT.font)} fill="${FLAVOR_TEXT.fillColor}" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>`;
}

module.exports = { renderFlavorText, PLACEHOLDER_FLAVOR };
