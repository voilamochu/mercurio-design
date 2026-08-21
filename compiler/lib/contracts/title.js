const { TITLE_BAR, FONTS } = require('./layout');
const { BOX, CARD, CHAR } = require('../shared/card');

function fontAttr(spec, size) {
  const parts = [`font-family="${spec.family}"`, `font-size="${size}"`];
  if (spec.weight) parts.push(`font-weight="${spec.weight}"`);
  if (spec.style) parts.push(`font-style="${spec.style}"`);
  return parts.join(' ');
}

function getMetricsFont() {
  try {
    const { getFontSafe } = require('../shared/text-layout');
    return getFontSafe('Orbitron-SemiBold');
  } catch (_) { return null; }
}

function measure(font, text, size) {
  if (!font) return String(text).length * size * CHAR.widthRatio;
  try {
    const { measurePx } = require('../shared/text-layout');
    return measurePx(font, text, size);
  } catch (_) { return String(text).length * size * CHAR.widthRatio; }
}

function wrapContractTitle(name) {
  const innerWidth = TITLE_BAR.width - TITLE_BAR.paddingX * 2;
  const font = getMetricsFont();
  try {
    const { wrapWords } = require('../shared/text-layout');
    if (font) return wrapWords(name, font, TITLE_BAR.nameFont, innerWidth);
  } catch (_) {}
  // fallback
  const avg = CHAR.widthRatio * TITLE_BAR.nameFont;
  const maxChars = Math.max(10, Math.floor(innerWidth / avg));
  const words = String(name).trim().split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function computeTitleHeight(lines) {
  if (!lines || lines.length === 0) return BOX.paddingY * 2 + TITLE_BAR.nameFont * CHAR.lineHeight;
  const lineHeight = TITLE_BAR.nameFont * CHAR.lineHeight;
  return BOX.paddingY * 2 + lines.length * lineHeight;
}

function renderTitle(name) {
  const b = TITLE_BAR;
  const lines = wrapContractTitle(name);
  const lineHeight = b.nameFont * CHAR.lineHeight;
  const height = computeTitleHeight(lines);
  b.height = height;

  const cx = CARD.W / 2;
  const firstCenter = b.y + BOX.paddingY + b.nameFont / 2;
  const rect = `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" fill-opacity="${BOX.fillOpacity}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />`;

  if (lines.length === 1) {
    const y = firstCenter;
    return [
      rect,
      `  <text x="${cx}" y="${y}" ${fontAttr(FONTS.title, b.nameFont)} fill="${b.nameColor}" text-anchor="middle" dominant-baseline="middle">${escapeXml(lines[0])}</text>`,
    ].join('\n');
  }

  // Multi-line centred: each line centred
  const tspans = lines.map((line, i) => {
    const y = firstCenter + i * lineHeight;
    if (i === 0) return `  <text x="${cx}" y="${y}" ${fontAttr(FONTS.title, b.nameFont)} fill="${b.nameColor}" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`;
    // For subsequent lines, we need separate text elements with same x but different y
    return `  <text x="${cx}" y="${y}" ${fontAttr(FONTS.title, b.nameFont)} fill="${b.nameColor}" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`;
  });

  return [rect, ...tspans].join('\n');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { renderTitle, escapeXml, fontAttr, wrapContractTitle, computeTitleHeight };
