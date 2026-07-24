const CARD_W = 744;
const CARD_H = 1039;

const ARTWORK_RENDER_WIDTH = 384;
const ARTWORK_RENDER_HEIGHT = 320;

const MARGIN = 24;

const FRAME_COLORS = {
  Project: '#b9852f',
  Passive: '#3a6ea5',
  Active: '#2e8b57',
  Endgame: '#6a3aa5',
};

const FONTS = {
  title: { family: 'Exo 2', weight: 600 },
  roman: { family: 'Exo 2', weight: 700 },
  rules: { family: 'Inter', weight: 400 },
  project: { family: 'Inter', weight: 400 },
  flavor: { family: 'Inter', weight: 400, style: 'italic' },
};

const RADIUS = 16;

const OUTER_FRAME = {
  x: MARGIN,
  y: MARGIN,
  width: CARD_W - MARGIN * 2,
  height: CARD_H - MARGIN * 2,
  rx: RADIUS,
  ry: RADIUS,
  stroke: '#0b1020',
  strokeWidth: 14,
  fill: '#0C1118',
};

const TITLE_BAR = {
  x: MARGIN + 24,
  y: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 152,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
  paddingX: 28,
  levelInset: 36,
  nameFont: 72,
  levelFont: 68,
  levelColor: '#D5DCE5',
};

const ARTWORK_WINDOW = {
  x: MARGIN + 24,
  y: TITLE_BAR.y + TITLE_BAR.height + 12,
  width: CARD_W - MARGIN * 2 - 48,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
};

const ARTWORK_PREFERRED_HEIGHT = 580;
const ARTWORK_MIN_HEIGHT = 120;

const PROJECT_BOX = {
  x: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
  paddingX: 28,
  nameFont: 56,
  descFont: 52,
};

const RULES_BOX = {
  x: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
  paddingX: 28,
  font: 56,
};

const FLAVOR_TEXT = {
  font: 48,
  fillColor: '#A8B4C5',
};

const GAP_AFTER_ARTWORK = 8;
const GAP_BETWEEN_BOXES = 8;
const FLAVOR_BOTTOM_PADDING = 48;

const BOX_PADDING_TOP = 24;
const BOX_PADDING_BOTTOM = 24;
const CHAR_WIDTH_RATIO = 0.5;
const LINE_HEIGHT_RATIO = 1.25;
const GAP_BETWEEN_TEXT_BLOCKS = 8;

const MIN_GAP_ABOVE_FLAVOR = 8;

function wrapText(text, fontSize, availableWidth) {
  if (!text || text.trim().length === 0) return [];
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
  if (lineCount === 0) return 0;
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  return BOX_PADDING_TOP + lineCount * lineHeight + BOX_PADDING_BOTTOM;
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
