const { CLAIM_SLOTS, ARTWORK_WINDOW } = require('./layout');

function renderClaimSlots() {
  const s = CLAIM_SLOTS;
  const innerWidth = ARTWORK_WINDOW.width;
  const gap = (innerWidth - s.count * s.size) / (s.count + 1);
  const rects = [];

  for (let i = 0; i < s.count; i++) {
    const x = Math.round(ARTWORK_WINDOW.x + gap * (i + 1) + s.size * i);
    const r = s.size / 2;
    rects.push(
      `  <rect x="${x}" y="${s.y}" width="${s.size}" height="${s.size}" rx="${r}" ry="${r}" fill="none" stroke="${s.stroke}" stroke-opacity="${s.strokeOpacity}" stroke-width="${s.strokeWidth}" />`
    );
  }

  return rects.join('\n');
}

module.exports = { renderClaimSlots };
