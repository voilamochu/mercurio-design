const { PROJECT_BOX, FONTS, LINE_HEIGHT_RATIO } = require('./layout');
const { escapeXml, fontAttr } = require('./title');
const { wrapText, computeProjectLinesY } = require('./layout');

function renderProjectBox(projectName, projectDescription) {
  const b = PROJECT_BOX;
  const innerWidth = b.width - b.paddingX * 2;

  const headingText = projectName ? `Project: ${projectName}` : 'Project';
  const descText = projectDescription ? projectDescription : '';

  const headingLines = wrapText(headingText, b.nameFont, innerWidth);
  const descLines = descText ? wrapText(descText, b.descFont, innerWidth) : [];

  if (headingLines.length === 0 && descLines.length === 0) return '';

  const linesY = computeProjectLinesY(b.y, headingLines.length, descLines.length, b.nameFont, b.descFont);
  const headingLineHeight = b.nameFont * LINE_HEIGHT_RATIO;

  const headingBold = fontAttr(FONTS.project, b.nameFont).replace('font-weight="400"', 'font-weight="700"');

  const rect = `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />`;

  const parts = [rect];

  for (let i = 0; i < headingLines.length; i++) {
    parts.push(`  <text x="${b.x + b.paddingX}" y="${linesY.headingCenter + i * headingLineHeight}" ${headingBold} fill="#F5F7FA" text-anchor="start" dominant-baseline="middle">${escapeXml(headingLines[i])}</text>`);
  }

  for (let i = 0; i < descLines.length; i++) {
    parts.push(`  <text x="${b.x + b.paddingX}" y="${linesY.descCenters[i]}" ${fontAttr(FONTS.project, b.descFont)} fill="#D5DCE5" text-anchor="start" dominant-baseline="middle">${escapeXml(descLines[i])}</text>`);
  }

  return parts.join('\n');
}

module.exports = { renderProjectBox };
