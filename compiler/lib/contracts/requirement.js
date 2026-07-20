const { REQUIREMENT_BOX, FONTS } = require('./layout');
const { escapeXml, fontAttr } = require('./title');

function renderRequirement(text) {
  const b = REQUIREMENT_BOX;

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" stroke="${b.stroke}" stroke-opacity="${b.strokeOpacity}" stroke-width="1" />`,
    `  <text x="${b.x + b.paddingX}" y="${b.y + b.labelY}" ${fontAttr(FONTS.requirement, b.labelFont)} fill="${b.labelColor}" text-anchor="start" dominant-baseline="middle">${escapeXml(b.label)}</text>`,
    `  <text x="${b.x + b.paddingX}" y="${b.y + b.textY}" ${fontAttr(FONTS.requirement, b.font)} fill="${b.textColor}" text-anchor="start" dominant-baseline="middle">${escapeXml(text)}</text>`,
  ].join('\n');
}

module.exports = { renderRequirement };
