const { CARD, FONTS: SHARED_FONTS, BOX, CHAR } = require('../shared/card');
const { wrapWords: sharedWrap, computeBoxHeight: sharedBoxHeight } = require('../shared/text-layout');

const CARD_W = CARD.W;
const CARD_H = CARD.H;

const ARTWORK_RENDER_WIDTH = 500;
const ARTWORK_RENDER_HEIGHT = 700;

const MARGIN = CARD.MARGIN;

const FRAME_COLORS = {
  Project: '#b9852f',
  Passive: '#3a6ea5',
  Active: '#2e8b57',
  Endgame: '#6a3aa5',
};

const FONTS = {
  title: SHARED_FONTS.title,
  roman: { family: 'Inter', weight: 700 },
  rules: SHARED_FONTS.body,
  project: SHARED_FONTS.body,
  flavor: SHARED_FONTS.flavor,
  level: SHARED_FONTS.level,
};

const RADIUS = CARD.RX;

const OUTER_FRAME = {
  x: 0,
  y: 0,
  width: CARD_W,
  height: CARD_H,
  rx: 0,
  ry: 0,
  stroke: '#0b1020',
  strokeWidth: 3,
  fill: 'none',
};

const TITLE_BAR = {
  x: BOX.x,
  y: MARGIN,
  width: BOX.width,
  height: 80,
  rx: BOX.rx,
  ry: BOX.ry,
  fill: '#141C27',
  fillOpacity: BOX.fillOpacity,
  paddingX: BOX.paddingX,
  levelInset: 14,
  nameFont: SHARED_FONTS.title.size,
  levelFont: SHARED_FONTS.level.size,
  levelColor: '#D5DCE5',
};

const ARTWORK_WINDOW = {
  x: BOX.x,
  y: TITLE_BAR.y + TITLE_BAR.height + BOX.gapAfterArt,
  width: BOX.width,
  rx: BOX.rx,
  ry: BOX.ry,
  fill: '#141C27',
};

const ARTWORK_FULL = {
  x: 0,
  y: 0,
  width: CARD_W,
  height: CARD_H,
  rx: 0,
  ry: 0,
};

const ARTWORK_PREFERRED_HEIGHT = 360;
const ARTWORK_MIN_HEIGHT = 80;

const PROJECT_BOX = {
  x: BOX.x,
  width: BOX.width,
  rx: BOX.rx,
  ry: BOX.ry,
  fill: '#141C27',
  fillOpacity: BOX.fillOpacity,
  paddingX: BOX.paddingX,
  nameFont: SHARED_FONTS.title.size,
  descFont: SHARED_FONTS.body.size,
};

const RULES_BOX = {
  x: BOX.x,
  width: BOX.width,
  rx: BOX.rx,
  ry: BOX.ry,
  fill: '#141C27',
  fillOpacity: BOX.fillOpacity,
  paddingX: BOX.paddingX,
  font: SHARED_FONTS.body.size,
};

const FLAVOR_TEXT = {
  font: SHARED_FONTS.flavor.size,
  fillColor: '#A8B4C5',
};

const GAP_AFTER_ARTWORK = BOX.gapAfterArt;
const GAP_BETWEEN_BOXES = BOX.gap;
const FLAVOR_BOTTOM_PADDING = 12;

const BOX_PADDING_TOP = BOX.paddingY;
const BOX_PADDING_BOTTOM = BOX.paddingY;
const CHAR_WIDTH_RATIO = CHAR.widthRatio;
const LINE_HEIGHT_RATIO = CHAR.lineHeight;
const GAP_BETWEEN_TEXT_BLOCKS = BOX.gap;

const MIN_GAP_ABOVE_FLAVOR = BOX.gap;

function getFontForMetrics(familyWeight) {
  try {
    const { getFontSafe } = require('../shared/text-layout');
    // Map to metrics keys: Orbitron-SemiBold for title, Inter-Regular for body
    if (familyWeight === 'title') return getFontSafe('Orbitron-SemiBold');
    if (familyWeight === 'level') return getFontSafe('Inter-Regular');
    return getFontSafe('Inter-Regular');
  } catch (_) {
    return null;
  }
}

function wrapText(text, fontSize, availableWidth) {
  if (!text || text.trim().length === 0) return [];
  // Use real metrics via shared helper
  try {
    const { wrapWords } = require('../shared/text-layout');
    const { getFontSafe } = require('../shared/text-layout');
    // Heuristic: pick metrics based on size (title 48 vs body 32) — Orbitron for title
    const fontKey = fontSize >= 38 ? 'Orbitron-SemiBold' : 'Inter-Regular';
    const font = getFontSafe(fontKey);
    if (font) return wrapWords(text, font, fontSize, availableWidth);
  } catch (_) {}
  // Fallback to char ratio
  const avgCharWidth = CHAR_WIDTH_RATIO * fontSize;
  const maxChars = Math.max(10, Math.floor(availableWidth / avgCharWidth));
  const words = text.trim().split(/\s+/);
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

function computeLineCount(text, fontSize, availableWidth) {
  return wrapText(text, fontSize, availableWidth).length;
}

function computeBoxHeight(lineCount, fontSize) {
  return sharedBoxHeight(lineCount, fontSize);
}

function computeProjectBoxHeight(headingLines, descLines, headingFontSize, descFontSize) {
  if (headingLines === 0 && descLines === 0) return 0;
  const headingCenter = BOX_PADDING_TOP + headingFontSize / 2;
  const headingBottom = headingCenter + headingFontSize / 2;
  let lastItemBottom;
  if (descLines > 0) {
    const descLineHeight = descFontSize * LINE_HEIGHT_RATIO;
    const descFirstCenter = headingBottom + GAP_BETWEEN_TEXT_BLOCKS + descFontSize / 2;
    const descLastCenter = descFirstCenter + (descLines - 1) * descLineHeight;
    lastItemBottom = descLastCenter + descFontSize / 2;
  } else {
    lastItemBottom = headingBottom;
  }
  return lastItemBottom + BOX_PADDING_BOTTOM;
}

function computeProjectLinesY(boxY, headingLines, descLines, headingFontSize, descFontSize) {
  const headingCenter = boxY + BOX_PADDING_TOP + headingFontSize / 2;
  const headingBottom = headingCenter + headingFontSize / 2;
  const result = { headingCenter };
  if (descLines > 0) {
    const descLineHeight = descFontSize * LINE_HEIGHT_RATIO;
    const descFirstCenter = headingBottom + GAP_BETWEEN_TEXT_BLOCKS + descFontSize / 2;
    result.descCenters = [];
    for (let i = 0; i < descLines; i++) {
      result.descCenters.push(descFirstCenter + i * descLineHeight);
    }
  } else {
    result.descCenters = [];
  }
  return result;
}

function computeLinesY(boxY, lineCount, fontSize) {
  const centers = [];
  if (lineCount === 0) return centers;
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const firstCenter = boxY + BOX_PADDING_TOP + fontSize / 2;
  for (let i = 0; i < lineCount; i++) {
    centers.push(firstCenter + i * lineHeight);
  }
  return centers;
}

module.exports = {
  CARD_W,
  CARD_H,
  ARTWORK_RENDER_WIDTH,
  ARTWORK_RENDER_HEIGHT,
  ARTWORK_PREFERRED_HEIGHT,
  ARTWORK_MIN_HEIGHT,
  MARGIN,
  RADIUS,
  FRAME_COLORS,
  FONTS,
  OUTER_FRAME,
  TITLE_BAR,
  ARTWORK_WINDOW,
  ARTWORK_FULL,
  PROJECT_BOX,
  RULES_BOX,
  FLAVOR_TEXT,
  GAP_AFTER_ARTWORK,
  GAP_BETWEEN_BOXES,
  FLAVOR_BOTTOM_PADDING,
  BOX_PADDING_TOP,
  BOX_PADDING_BOTTOM,
  CHAR_WIDTH_RATIO,
  LINE_HEIGHT_RATIO,
  GAP_BETWEEN_TEXT_BLOCKS,
  MIN_GAP_ABOVE_FLAVOR,
  wrapText,
  computeLineCount,
  computeBoxHeight,
  computeProjectBoxHeight,
  computeProjectLinesY,
  computeLinesY,
};
