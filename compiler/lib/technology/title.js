const { TITLE_BAR, FONTS, BOX_PADDING_TOP, LINE_HEIGHT_RATIO, CHAR_WIDTH_RATIO } = require('./layout');
const { BOX } = require('../shared/card');

function fontAttr(spec, size) {
  const parts = [`font-family="${spec.family}"`, `font-size="${size}"`];
  if (spec.weight) parts.push(`font-weight="${spec.weight}"`);
  if (spec.style) parts.push(`font-style="${spec.style}"`);
  return parts.join(' ');
}

function getMetricsFonts() {
  try {
    const { getFontSafe } = require('../shared/text-layout');
    return {
      titleFont: getFontSafe('Orbitron-SemiBold'),
      levelFont: getFontSafe('Inter-Regular'),
    };
  } catch (_) {
    return { titleFont: null, levelFont: null };
  }
}

function measure(font, text, size) {
  if (!font) return String(text).length * size * CHAR_WIDTH_RATIO;
  try {
    const { measurePx } = require('../shared/text-layout');
    return measurePx(font, text, size);
  } catch (_) {
    return String(text).length * size * CHAR_WIDTH_RATIO;
  }
}

function wrapTitle(name, levelText) {
  const innerWidth = TITLE_BAR.width - TITLE_BAR.paddingX * 2;
  const { titleFont, levelFont } = getMetricsFonts();
  const levelWidth = measure(levelFont, levelText, TITLE_BAR.levelFont);
  const spaceWidth = measure(titleFont, ' ', TITLE_BAR.nameFont);
  // Available for first line when level present: innerWidth - levelWidth - spaceWidth
  const firstLineAvail = innerWidth - levelWidth - spaceWidth;
  const titleAvail = innerWidth;

  // Try to fit name without wrapping if possible with level gap
  const fullWidth = measure(titleFont, name, TITLE_BAR.nameFont);
  if (fullWidth <= firstLineAvail) {
    return { lines: [name], levelOnFirstLine: true, firstLineAvail, innerWidth };
  }

  // Need wrapping: use shared wrap with firstLineAvail for first line, titleAvail for rest
  try {
    const { wrapWords } = require('../shared/text-layout');
    const font = titleFont;
    if (font) {
      // Custom wrapping respecting level on first line
      const words = String(name).trim().split(/\s+/);
      const lines = [];
      let idx = 0;
      // First line with reduced width
      let cur = '';
      let curW = 0;
      const sw = spaceWidth;
      while (idx < words.length) {
        const w = words[idx];
        const wW = measure(font, w, TITLE_BAR.nameFont);
        const need = cur ? curW + sw + wW : wW;
        const limit = lines.length === 0 ? firstLineAvail : titleAvail;
        if (need <= limit) {
          cur = cur ? cur + ' ' + w : w;
          curW = need;
          idx++;
        } else {
          if (!cur) {
            // Single word longer than limit: hyphenate or force
            cur = w;
            idx++;
          }
          lines.push(cur);
          cur = '';
          curW = 0;
          if (lines.length === 1) {
            // after first line, subsequent lines use full width
          }
        }
      }
      if (cur) lines.push(cur);
      // Handle hyphenation for any line that still overflows (single long word)
      // Simple hyphen: if word contains no spaces and overflows, break with hyphen
      const result = [];
      for (const line of lines) {
        if (measure(font, line, TITLE_BAR.nameFont) > titleAvail && !line.includes(' ')) {
          // hyphenate: find break point
          let best = 0;
          for (let i = 1; i < line.length - 1; i++) {
            const left = line.slice(0, i) + '-';
            if (measure(font, left, TITLE_BAR.nameFont) <= titleAvail) best = i;
          }
          if (best > 0) {
            result.push(line.slice(0, best) + '-');
            result.push(line.slice(best));
          } else {
            result.push(line);
          }
        } else {
          result.push(line);
        }
      }
      return { lines: result, levelOnFirstLine: true, firstLineAvail, innerWidth };
    }
  } catch (_) {}

  // Fallback char-ratio wrapping
  const { wrapText } = require('./layout');
  // Use reduced width for first line estimation: if first line would be too long, wrap
  const lines = wrapText(name, TITLE_BAR.nameFont, firstLineAvail);
  if (lines.length <= 1 && fullWidth > firstLineAvail) {
    // fallback would compress to one line even though overflow; force wrap with full width
    return { lines: wrapText(name, TITLE_BAR.nameFont, titleAvail), levelOnFirstLine: true, firstLineAvail, innerWidth };
  }
  return { lines, levelOnFirstLine: true, firstLineAvail, innerWidth };
}

function computeTitleHeight(lines) {
  if (!lines || lines.length === 0) return BOX.paddingY * 2 + TITLE_BAR.nameFont * LINE_HEIGHT_RATIO;
  const lineHeight = TITLE_BAR.nameFont * LINE_HEIGHT_RATIO;
  return BOX.paddingY * 2 + lines.length * lineHeight;
}

function renderTitleBar(name, romanLevel) {
  const b = TITLE_BAR;
  const levelText = String(romanLevel || '');
  const { lines } = wrapTitle(name, levelText);
  const lineHeight = b.nameFont * LINE_HEIGHT_RATIO;
  const height = computeTitleHeight(lines);
  // Update mutable TITLE_BAR height for layout stacking (build-tech-cards reads it)
  b.height = height;

  const innerX = b.x + b.paddingX;
  const levelX = b.x + b.width - b.paddingX;
  const firstCenter = b.y + BOX.paddingY + b.nameFont / 2;

  const rect = `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" fill-opacity="${b.fillOpacity}" stroke="#3A4658" stroke-opacity="0.4" stroke-width="1" />`;

  // Title lines: first line shares top with level, subsequent lines below
  const titleTexts = lines.map((line, i) => {
    const y = firstCenter + i * lineHeight;
    return `  <text x="${innerX}" y="${y}" ${fontAttr(FONTS.title, b.nameFont)} fill="#F5F7FA" text-anchor="start" dominant-baseline="middle">${escapeXml(line)}</text>`;
  });

  const levelY = firstCenter; // level aligned to first line center
  const levelTextEl = levelText
    ? `  <text x="${levelX}" y="${levelY}" ${fontAttr(FONTS.level, b.levelFont)} fill="${b.levelColor}" text-anchor="end" dominant-baseline="middle">${escapeXml(levelText)}</text>`
    : '';

  return [rect, ...titleTexts, levelTextEl].filter(Boolean).join('\n');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { renderTitleBar, escapeXml, fontAttr, wrapTitle, computeTitleHeight };
