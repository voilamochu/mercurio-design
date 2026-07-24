const { PROJECT_BOX, FONTS, LINE_HEIGHT_RATIO, BOX_PADDING_TOP } = require('./layout');
const { escapeXml, fontAttr } = require('./title');
const { wrapText } = require('./layout');

function renderProjectBox(projectDescription) {
  const b = PROJECT_BOX;
  const innerWidth = b.width - b.paddingX * 2;

  const descText = projectDescription ? projectDescription : '';
  const descLines = descText ? wrapText(descText, b.descFont, innerWidth) : [];

  if (descLines.length === 0) return '';

  const lineHeight = b.descFont * LINE_HEIGHT_RATIO;
  const firstCenter = b.y + BOX_PADDING_TOP + b.descFont / 2;

  const rect = `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />`;

  const textLines = descLines.map((line, i) => {
    const y = firstCenter + i * lineHeight;
    return `  <text x="${b.x + b.paddingX}" y="${y}" ${fontAttr(FONTS.flavor, b.descFont)} fill="#D5DCE5" text-anchor="start" dominant-baseline="middle">${escapeXml(line)}</text>`;
  });

  return [rect, ...textLines].join('\n');
}

module.exports = { renderProjectBox };
