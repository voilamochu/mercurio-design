const { RULES_BOX, FONTS } = require('./layout');
const { escapeXml, fontAttr } = require('./title');

const RULES_CHAR_WIDTH = 11;

function wrapText(text, maxWidth, fontSize) {
  const avgChar = RULES_CHAR_WIDTH * (fontSize / 22);
  const maxChars = Math.max(10, Math.floor(maxWidth / avgChar));
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function renderRulesBox(description) {
  const b = RULES_BOX;
  const innerWidth = b.width - b.paddingX * 2;
  const lines = wrapText(description, innerWidth, b.font);

  const rect = `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />`;
  const textLines = lines.map((line, i) => {
    const y = b.y + b.firstYOffset + i * b.lineGap;
    return `  <text x="${b.x + b.paddingX}" y="${y}" ${fontAttr(FONTS.rules, b.font)} fill="#F5F7FA" text-anchor="start" dominant-baseline="middle">${escapeXml(line)}</text>`;
  });

  return [rect, ...textLines].join('\n');
}

module.exports = { renderRulesBox, wrapText };
