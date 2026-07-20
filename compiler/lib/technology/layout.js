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
  footer: { family: 'Inter', weight: 500 },
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
  height: 76,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
  paddingX: 28,
  levelInset: 36,
  nameFont: 36,
  levelFont: 34,
  levelColor: '#D5DCE5',
};

const ARTWORK_WINDOW = {
  x: MARGIN + 24,
  y: TITLE_BAR.y + TITLE_BAR.height + 12,
  width: CARD_W - MARGIN * 2 - 48,
  height: 580,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
};

const PROJECT_BOX = {
  x: MARGIN + 24,
  y: ARTWORK_WINDOW.y + ARTWORK_WINDOW.height + 10,
  width: CARD_W - MARGIN * 2 - 48,
  height: 100,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
  paddingX: 28,
  nameFont: 28,
  nameYOffset: 44,
  descFont: 26,
  descYOffset: 80,
};

const RULES_BOX = {
  x: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 150,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
  paddingX: 28,
  font: 28,
  lineGap: 34,
  firstYOffset: 44,
};

const FLAVOR_TEXT = {
  font: 24,
  fillColor: '#A8B4C5',
};

module.exports = {
  CARD_W,
  CARD_H,
  ARTWORK_RENDER_WIDTH,
  ARTWORK_RENDER_HEIGHT,
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
};
