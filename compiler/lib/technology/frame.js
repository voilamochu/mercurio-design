const { OUTER_FRAME, FRAME_COLORS } = require('./layout');

function renderOuterFrame(frameStyle) {
  const f = OUTER_FRAME;
  const color = FRAME_COLORS[frameStyle] || f.stroke;
  return [
    `  <rect x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" rx="${f.rx}" ry="${f.ry}" fill="${f.fill}" stroke="${color}" stroke-width="${f.strokeWidth}" />`,
  ].join('\n');
}

module.exports = { renderOuterFrame };
