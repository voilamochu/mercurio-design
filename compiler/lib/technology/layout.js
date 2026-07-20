const CARD_W = 744;
const CARD_H = 1039;

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
  fill: '#f7f7f5',
};

const TITLE_BAR = {
  x: MARGIN + 24,
  y: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 76,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#e8eaf0',
  paddingX: 28,
  levelInset: 36,
  nameFont: 36,
  levelFont: 34,
  levelColor: '#1f2937',
};

const ARTWORK_WINDOW = {
  x: MARGIN + 24,
  y: TITLE_BAR.y + TITLE_BAR.height + 16,
  width: CARD_W - MARGIN * 2 - 48,
  height: 420,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#c9ccd1',
};

const PROJECT_BOX = {
  x: MARGIN + 24,
  y: ARTWORK_WINDOW.y + ARTWORK_WINDOW.height + 16,
  width: CARD_W - MARGIN * 2 - 48,
  height: 104,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#dfe3ea',
  paddingX: 28,
  nameFont: 24,
  nameYOffset: 40,
  descFont: 19,
  descYOffset: 76,
};

const RULES_BOX = {
  x: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 168,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#eef0f4',
  paddingX: 28,
  font: 22,
  lineGap: 30,
  firstYOffset: 42,
};

const FLAVOR_BOX = {
  x: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 76,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#f3f1ec',
  paddingX: 28,
  font: 18,
  fontStyle: 'italic',
  fillColor: '#6b6478',
  firstYOffset: 40,
  lineGap: 26,
};

const FOOTER = {
  x: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 44,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#e0e3ea',
  paddingX: 28,
  font: 22,
};

module.exports = {
  CARD_W,
  CARD_H,
  MARGIN,
  RADIUS,
  FRAME_COLORS,
  FONTS,
  OUTER_FRAME,
  TITLE_BAR,
  ARTWORK_WINDOW,
  PROJECT_BOX,
  RULES_BOX,
  FLAVOR_BOX,
  FOOTER,
};
