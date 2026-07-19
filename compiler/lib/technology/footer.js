const { FOOTER } = require('./layout');
const { escapeXml } = require('./title');

function renderFooter(displayType) {
  const b = FOOTER;
  const cy = b.y + b.height / 2;

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" />`,
    `  <text x="${b.x + b.paddingX}" y="${cy}" font-family="sans-serif" font-size="20" font-weight="bold" fill="#374151" text-anchor="start" dominant-baseline="middle">${escapeXml(displayType)}</text>`,
  ].join('\n');
}

module.exports = { renderFooter };
