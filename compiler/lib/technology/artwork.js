const { ARTWORK_WINDOW, FONTS } = require('./layout');
const { fontAttr } = require('./title');

function renderArtworkWindow() {
  const w = ARTWORK_WINDOW;
  return [
    `  <rect x="${w.x}" y="${w.y}" width="${w.width}" height="${w.height}" rx="${w.rx}" ry="${w.ry}" fill="${w.fill}" />`,
    `  <text x="${w.x + w.width / 2}" y="${w.y + w.height / 2}" ${fontAttr(FONTS.rules, 22)} fill="#6b7280" text-anchor="middle" dominant-baseline="middle">artwork: ${ARTWORK_WINDOW_PLACEHOLDER()}</text>`,
  ].join('\n');
}

function ARTWORK_WINDOW_PLACEHOLDER() {
  return 'unassigned';
}

module.exports = { renderArtworkWindow };
