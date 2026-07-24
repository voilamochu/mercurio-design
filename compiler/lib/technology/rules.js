const { RULES_BOX, FONTS, LINE_HEIGHT_RATIO, BOX_PADDING_TOP } = require('./layout');
const { escapeXml, fontAttr } = require('./title');
const { wrapText } = require('./layout');

function renderRulesBox(description) {
  const b = RULES_BOX;
  const innerWidth = b.width - b.paddingX * 2;
  const lines = wrapText(description, b.font, innerWidth);

  if (lines.length === 0) return '';

  const lineHeight = b.font * LINE_HEIGHT_RATIO;
  const firstCenter = b.y + BOX_PADDING_TOP + b.font / 2;

  const rect = `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />`;
  const textLines = lines.map((line, i) => {
    const y = firstCenter + i * lineHeight;
    return `  <text x="${b.x + b.paddingX}" y="${y}" ${fontAttr(FONTS.rules, b.font)} fill="#F5F7FA" text-anchor="start" dominant-baseline="middle">${escapeXml(line)}</text>`;
  });

  return [rect, ...textLines].join('\n');
}

module.exports = { renderRulesBox };
