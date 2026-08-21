/**
 * Shared text layout — single wrap helper using real glyph metrics.
 * All card types must use this; delete duplicate CHAR_WIDTH_RATIO wrappers.
 */
const path = require('path');

let metrics = null;
function loadMetrics() {
  if (metrics) return metrics;
  try {
    const { loadMetrics } = require('../contracts/text-metrics');
    metrics = loadMetrics();
  } catch (e) {
    metrics = null;
  }
  return metrics;
}

function getFontSafe(key) {
  const m = loadMetrics();
  if (!m || !m[key]) return null;
  return m[key];
}

function measurePx(font, text, fontSize) {
  if (!font) {
    // fallback: avg char width 0.5em
    return String(text).length * fontSize * 0.5;
  }
  const { measurePx: mp } = require('../contracts/text-metrics');
  return mp(font, text, fontSize);
}

/**
 * Greedy word wrap using real glyph advance widths.
 * Returns array of line strings, each <= maxWidth (except single long word).
 */
function wrapWords(text, font, fontSize, maxWidth) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
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
      if (current) {
        current += ' ' + word;
        currentWidth += spaceWidth + wordWidth;
      } else {
        current = word;
        currentWidth = wordWidth;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Compute box height for N lines of given font size using shared gap semantics.
 * Uses BOX paddingY + lineHeight 1.25.
 */
function computeBoxHeight(lineCount, fontSize) {
  if (lineCount === 0) return 0;
  const lineHeight = fontSize * 1.25;
  const paddingY = 10;
  return paddingY * 2 + lineCount * lineHeight;
}

/**
 * Hyphenate long single word that exceeds maxWidth by inserting soft hyphen break.
 * Used for "Consciousness" etc.
 */
function hyphenateWord(word, font, fontSize, maxWidth) {
  if (measurePx(font, word, fontSize) <= maxWidth) return [word];
  const parts = [];
  for (let i = 1; i < word.length - 1; i++) {
    const left = word.slice(0, i) + '-';
    if (measurePx(font, left, fontSize) <= maxWidth) {
      const right = word.slice(i);
      if (measurePx(font, right, fontSize) <= maxWidth) {
        return [left, right];
      }
    }
  }
  return [word];
}

module.exports = { wrapWords, computeBoxHeight, measurePx, getFontSafe, hyphenateWord };
