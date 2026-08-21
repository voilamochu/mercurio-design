const { REQUIREMENT_BOX, FONTS } = require('./layout');
const { escapeXml, fontAttr } = require('./title');
const { BOX, CHAR } = require('../shared/card');

function renderRequirement(text) {
  const b = REQUIREMENT_BOX;
  if (!b.height || b.height <= 0) return '';

  const rect = `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" fill-opacity="${BOX.fillOpacity}" stroke="${b.stroke}" stroke-opacity="${b.strokeOpacity}" stroke-width="1" />`;

  // Wrap requirement text at 32 with real metrics — no heading label (removed per commission regression fix)
  let lines = [];
  try {
    const { wrapWords, getFontSafe } = require('../shared/text-layout');
    const font = getFontSafe('Inter-Regular');
    const innerWidth = b.width - b.paddingX * 2;
    if (font) lines = wrapWords(text, font, b.font, innerWidth);
    else throw new Error('no font');
  } catch (_) {
    // fallback char ratio
    const avg = CHAR.widthRatio * b.font;
    const maxChars = Math.max(10, Math.floor((b.width - b.paddingX * 2) / avg));
    const words = String(text).trim().split(/\s+/);
    let cur = '';
    for (const w of words) {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
  }
  if (lines.length === 0) return rect;

  const lineHeight = b.font * CHAR.lineHeight;
  const x = b.x + b.paddingX;
  const y = b.y + b.textY;
  const attrs = `x="${x}" y="${y}" ${fontAttr(FONTS.requirement, b.font)} fill="${b.textColor}" text-anchor="start" dominant-baseline="middle"`;
  if (lines.length === 1) {
    return [rect, `  <text ${attrs}>${escapeXml(lines[0])}</text>`].join('\n');
  }
  const tspans = lines.map((line, i) => {
    const dy = i === 0 ? 0 : lineHeight;
    return `    <tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
  }).join('\n');
  const wrapped = `  <text ${attrs}>\n${tspans}\n  </text>`;

  return [rect, wrapped].join('\n');
}

module.exports = { renderRequirement };
