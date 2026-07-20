const { FOOTER, FONTS } = require('./layout');
const { escapeXml, fontAttr } = require('./title');

function renderFooter(displayType) {
  const b = FOOTER;
  const cy = b.y + b.height / 2;

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />`,
    `  <text x="${b.x + b.paddingX}" y="${cy}" ${fontAttr(FONTS.footer, b.font)} fill="#F5F7FA" text-anchor="start" dominant-baseline="middle">${escapeXml(displayType)}</text>`,
  ].join('\n');
}

module.exports = { renderFooter };
