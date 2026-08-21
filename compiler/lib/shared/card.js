/**
 * Shared card constants — single source of truth for 500×700 pipeline.
 * All card-type layouts must import from here; no local CARD_W/H or font sizes.
 * Captain spec 2026-08-21: 500×700 viewBox, 48 Orbitron title, 32 Inter body, final size (no scaling).
 */
const CARD = { W: 500, H: 700, RX: 12.8, MARGIN: 12 };

const FONTS = {
  title: { family: 'Orbitron', weight: 600, size: 48 },
  body:  { family: 'Inter', weight: 400, size: 32 },
  flavor:{ family: 'Inter', weight: 400, style: 'italic', size: 26 },
  level: { family: 'Inter', weight: 700, size: 38 },
};

const BOX = {
  width: CARD.W,
  x: 0,
  rx: 0,
  ry: 0,
  fillOpacity: 0.78,
  paddingX: 24,
  paddingY: 10,
  gap: 8,
  gapAfterArt: 8,
};

const CHAR = { widthRatio: 0.5, lineHeight: 1.25 };

module.exports = { CARD, FONTS, BOX, CHAR };
