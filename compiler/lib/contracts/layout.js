const { CARD, FONTS: SHARED_FONTS, BOX, CHAR } = require('../shared/card');

const CARD_W = CARD.W;
const CARD_H = CARD.H;

const MARGIN = CARD.MARGIN;
const RADIUS = CARD.RX;

const ARTWORK_RENDER_WIDTH = 436; // 648 * 500/744 ≈435
const ARTWORK_RENDER_HEIGHT = 388; // 576 * 500/744 ≈387

const FONTS = {
  title: SHARED_FONTS.title,
  requirement: SHARED_FONTS.body,
  reward: SHARED_FONTS.body,
  flavor: SHARED_FONTS.flavor,
  body: SHARED_FONTS.body,
};

const OUTER_FRAME = {
  x: MARGIN,
  y: MARGIN,
  width: CARD_W - MARGIN * 2,
  height: CARD_H - MARGIN * 2,
  rx: RADIUS,
  ry: RADIUS,
  stroke: '#F2F2F2',
  strokeWidth: 3,
  fill: '#0C1118',
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
  nameFont: SHARED_FONTS.title.size,
  nameColor: '#F5F7FA',
};

// Bottom-up anchor chain is replaced by top-down stack with BOX.gap
// Keep FRAME_BOTTOM for flavor calc but recompute at new size
const FRAME_BOTTOM = OUTER_FRAME.y + OUTER_FRAME.height;

const FLAVOR = {
  y: CARD_H - 18,
  font: SHARED_FONTS.flavor.size,
  fillColor: '#A8B4C5',
};

const CLAIM_SLOTS = {
  y: 0, // computed dynamically after reward
  count: 4,
  size: 40,
  stroke: '#D0D0D0',
  strokeWidth: 2,
  strokeOpacity: 0.45,
};

const REWARD_BOX = {
  x: BOX.x,
  y: 0, // dynamic
  width: BOX.width,
  height: 0, // dynamic
  rx: BOX.rx,
  ry: BOX.ry,
  fill: '#1A2636',
  fillOpacity: BOX.fillOpacity,
  stroke: '#4A5A70',
  strokeOpacity: 0.5,
  paddingX: BOX.paddingX,
  font: SHARED_FONTS.body.size,
  labelFont: SHARED_FONTS.flavor.size,
  labelY: 22,
  textY: 32,
  label: 'Reward',
  labelColor: '#8B9AAB',
  textColor: '#c8e6c9',
};

const REQUIREMENT_BOX = {
  x: BOX.x,
  y: 0, // dynamic
  width: BOX.width,
  height: 0, // dynamic
  rx: BOX.rx,
  ry: BOX.ry,
  fill: '#1A2636',
  fillOpacity: BOX.fillOpacity,
  stroke: '#4A5A70',
  strokeOpacity: 0.5,
  paddingX: BOX.paddingX,
  font: SHARED_FONTS.body.size,
  labelFont: SHARED_FONTS.flavor.size,
  labelY: 22,
  textY: 32,
  label: 'Requirement',
  labelColor: '#8B9AAB',
  textColor: '#ffb3a7',
};

const ARTWORK_WINDOW = {
  x: BOX.x,
  y: TITLE_BAR.y + TITLE_BAR.height + BOX.gapAfterArt,
  width: BOX.width,
  height: 260,
  rx: BOX.rx,
  ry: BOX.ry,
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
