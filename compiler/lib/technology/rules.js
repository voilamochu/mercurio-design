const { RULES_BOX } = require('./layout');
const { escapeXml } = require('./title');

function renderRulesBox(description) {
  const b = RULES_BOX;
  const lineY = b.y + b.padding + 8;

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" />`,
    `  <text x="${b.x + b.padding}" y="${lineY}" font-family="sans-serif" font-size="20" fill="#1f2937" text-anchor="start" dominant-baseline="middle">${escapeXml(description)}</text>`,
  ].join('\n');
}

module.exports = { renderRulesBox };
