// Text wrap + auto-fit for fixed-geometry boxes on contract cards.
//
// Preserves the existing box geometry exactly (rects, label positions, textY
// anchor, padding). Only the value <text> element changes: when the text fits
// on one line at the box's base font size the emitted markup is byte-identical
// to the previous single-line output; otherwise the text is wrapped into
// <tspan> lines inside the box width and the font size is reduced until the
// block fits inside the box height. Nothing is ever moved out of the box and
// no layout is re-tuned.

const { getFont, measurePx } = require('./text-metrics');

const LINE_HEIGHT_RATIO = 1.25; // matches lib/technology/layout.js convention
const MIN_FONT_SIZE = 20;
const LABEL_GAP = 8;
const BOTTOM_INSET = 8;

// Greedy word wrap using real glyph advance widths.
// Returns an array of line strings, each guaranteed <= maxWidth (except a
// single word longer than the box, which is kept on its own line rather than
// hard-split; no current card text contains such a word).
function wrapWords(text, font, fontSize, maxWidth) {
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let current = '';
  let currentWidth = 0;
  const spaceWidth = measurePx(font, ' ', fontSize);

  for (const word of words) {
    const wordWidth = measurePx(font, word, fontSize);
    if (current && currentWidth + spaceWidth + wordWidth > maxWidth) {
      lines.push(current);
      current = word;
      currentWidth = wordWidth;
    } else {
      current = current ? `${current} ${word}` : word;
      currentWidth += currentWidth ? spaceWidth + wordWidth : wordWidth;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Vertical fit check inside the box. The text block is anchored at the box's
// existing textY (first line center) and grows downward with
// fontSize * LINE_HEIGHT_RATIO per line.
function fitsVertically(box, lineCount, fontSize) {
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const labelBottom = box.labelY + box.labelFont * 0.5;
  const firstTop = box.textY - fontSize / 2;
  const lastBottom = box.textY + (lineCount - 1) * lineHeight + fontSize / 2;
  if (firstTop < labelBottom + LABEL_GAP) return false;
  if (lastBottom > box.height - BOTTOM_INSET) return false;
  return true;
}

// Find the largest font size (<= box.font) where the wrapped lines fit inside
// the box. Returns { fontSize, lines, wrapped }.
function fitText(box, text, fontKey) {
  const font = getFont(fontKey);
  const baseSize = box.font;
  const maxWidth = box.width - 2 * box.paddingX;

  for (let f = baseSize; f >= MIN_FONT_SIZE; f--) {
    const lines = wrapWords(text, font, f, maxWidth);
    if (fitsVertically(box, lines.length, f)) {
      return { fontSize: f, lines, wrapped: lines.length > 1 || f < baseSize };
    }
  }

  const lines = wrapWords(text, font, MIN_FONT_SIZE, maxWidth);
  return { fontSize: MIN_FONT_SIZE, lines, wrapped: true, atMin: true };
}

// Render the value <text> element for a box. Single-line text at the base
// font size emits exactly the legacy markup; wrapped text emits <tspan> lines.
// `fontKey` selects the metrics family (e.g. 'Inter-Regular'); `fontSpec` is
// the FONTS entry used for the SVG font attributes.
function renderBoxText(box, text, fontKey, fontSpec) {
  const { escapeXml, fontAttr } = require('./title');
  const { fontSize, lines, wrapped } = fitText(box, text, fontKey);

  const x = box.x + box.paddingX;
  const y = box.y + box.textY;
  const attrs = `x="${x}" y="${y}" ${fontAttr(fontSpec, fontSize)} fill="${box.textColor}" text-anchor="start" dominant-baseline="middle"`;

  if (!wrapped) {
    // Legacy single-line output, byte-identical.
    return `  <text ${attrs}>${escapeXml(text)}</text>`;
  }

  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const tspans = lines.map((line, i) => {
    const dy = i === 0 ? 0 : lineHeight;
    return `    <tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
  }).join('\n');

  return [
    `  <text ${attrs}>`,
    tspans,
    `  </text>`,
  ].join('\n');
}

module.exports = { wrapWords, fitText, renderBoxText, LINE_HEIGHT_RATIO };
