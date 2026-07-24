const CARD_W = 744;
const CARD_H = 1039;

const MARGIN = 24;
const RADIUS = 16;

const ARTWORK_RENDER_WIDTH = 648;
const ARTWORK_RENDER_HEIGHT = 576;

const FONTS = {
  title: { family: 'Exo 2', weight: 600 },
  requirement: { family: 'Inter', weight: 400 },
  reward: { family: 'Inter', weight: 400 },
  flavor: { family: 'Inter', weight: 400, style: 'italic' },
};

const OUTER_FRAME = {
  x: MARGIN,
  y: MARGIN,
  width: CARD_W - MARGIN * 2,
  height: CARD_H - MARGIN * 2,
  rx: RADIUS,
  ry: RADIUS,
  stroke: '#F2F2F2',
  strokeWidth: 12,
  fill: '#0C1118',
};

const TITLE_BAR = {
  x: MARGIN + 24,
  y: MARGIN + 24,
  width: CARD_W - MARGIN * 2 - 48,
  height: 128,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
  paddingX: 24,
  nameFont: 64,
  nameColor: '#F5F7FA',
};

// --- Bottom-up anchor chain ---
// Everything below the artwork is anchored to the outer frame bottom edge.
// Flexible space exists only between artwork bottom and requirement top.

const FRAME_BOTTOM = OUTER_FRAME.y + OUTER_FRAME.height;

const FLAVOR = {
  y: FRAME_BOTTOM - 48,
  font: 44,
  fillColor: '#A8B4C5',
};

const _flavorHalf = FLAVOR.font / 2;
const _slotGap = 32;
const _slotSize = 60;

const CLAIM_SLOTS = {
  y: FLAVOR.y - _flavorHalf - _slotGap - _slotSize,
  count: 4,
  size: _slotSize,
  stroke: '#5A6A7D',
  strokeWidth: 2,
  strokeOpacity: 0.5,
};

const _rewardGap = 40;
const _boxHeight = 160;

const REWARD_BOX = {
  x: MARGIN + 24,
  y: CLAIM_SLOTS.y - _rewardGap - _boxHeight,
  width: CARD_W - MARGIN * 2 - 48,
  height: _boxHeight,
  rx: 20,
  ry: 20,
  fill: '#1A2636',
  stroke: '#4A5A70',
  strokeOpacity: 0.5,
  paddingX: 24,
  font: 46,
  labelFont: 36,
  labelY: 48,
  textY: 100,
  label: 'Reward',
  labelColor: '#8B9AAB',
  textColor: '#F5F7FA',
};

const _reqGap = 24;

const REQUIREMENT_BOX = {
  x: MARGIN + 24,
  y: REWARD_BOX.y - _reqGap - _boxHeight,
  width: CARD_W - MARGIN * 2 - 48,
  height: _boxHeight,
  rx: 20,
  ry: 20,
  fill: '#1A2636',
  stroke: '#4A5A70',
  strokeOpacity: 0.5,
  paddingX: 24,
  font: 46,
  labelFont: 36,
  labelY: 48,
  textY: 100,
  label: 'Requirement',
  labelColor: '#8B9AAB',
  textColor: '#F5F7FA',
};

// Artwork fills remaining space down to requirement
const _artworkTop = TITLE_BAR.y + TITLE_BAR.height + 12;

const ARTWORK_WINDOW = {
  x: MARGIN + 24,
  y: _artworkTop,
  width: CARD_W - MARGIN * 2 - 48,
  height: REQUIREMENT_BOX.y - _artworkTop - 12,
  rx: RADIUS,
  ry: RADIUS,
  fill: '#141C27',
};

module.exports = {
  CARD_W,
  CARD_H,
  MARGIN,
  RADIUS,
  ARTWORK_RENDER_WIDTH,
  ARTWORK_RENDER_HEIGHT,
  FONTS,
  OUTER_FRAME,
  TITLE_BAR,
  ARTWORK_WINDOW,
  REQUIREMENT_BOX,
  REWARD_BOX,
  CLAIM_SLOTS,
  FLAVOR,
};
