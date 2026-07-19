const CARD_W = 744;
const CARD_H = 1039;

const MARGIN = 24;

const OUTER_FRAME = {
  x: MARGIN,
  y: MARGIN,
  width: CARD_W - MARGIN * 2,
  height: CARD_H - MARGIN * 2,
  rx: 32,
  ry: 32,
  stroke: '#0b1020',
  strokeWidth: 6,
  fill: '#f7f7f5',
};

const ARTWORK_WINDOW = {
  x: MARGIN + 24,
  y: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 420,
  rx: 18,
  ry: 18,
  fill: '#c9ccd1',
};

const TITLE_BAR = {
  x: MARGIN + 24,
  y: ARTWORK_WINDOW.y + ARTWORK_WINDOW.height + 20,
  width: CARD_W - MARGIN * 2 - 48,
  height: 76,
  rx: 12,
  ry: 12,
  fill: '#e8eaf0',
  paddingX: 24,
  levelBadgeSize: 56,
};

const PROJECT_BOX = {
  x: MARGIN + 24,
  y: TITLE_BAR.y + TITLE_BAR.height + 16,
  width: CARD_W - MARGIN * 2 - 48,
  height: 110,
  rx: 12,
  ry: 12,
  fill: '#dfe3ea',
  padding: 18,
};

const RULES_BOX = {
  x: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 300,
  rx: 12,
  ry: 12,
  fill: '#eef0f4',
  padding: 22,
};

const FOOTER = {
  x: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 48,
  rx: 12,
  ry: 12,
  fill: '#e0e3ea',
  paddingX: 24,
};

module.exports = {
  CARD_W,
  CARD_H,
  MARGIN,
  OUTER_FRAME,
  ARTWORK_WINDOW,
  TITLE_BAR,
  PROJECT_BOX,
  RULES_BOX,
  FOOTER,
};
