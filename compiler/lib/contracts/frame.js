const { OUTER_FRAME } = require('./layout');

function renderOuterFrame() {
  const f = OUTER_FRAME;
  return `  <rect x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" rx="${f.rx}" ry="${f.ry}" fill="${f.fill}" stroke="${f.stroke}" stroke-width="${f.strokeWidth}" />`;
}

module.exports = { renderOuterFrame };
