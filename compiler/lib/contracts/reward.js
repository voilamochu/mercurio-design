const { REWARD_BOX, FONTS } = require('./layout');
const { escapeXml, fontAttr } = require('./title');
const { renderBoxText } = require('./text-layout');

function renderReward(text) {
  const b = REWARD_BOX;

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" stroke="${b.stroke}" stroke-opacity="${b.strokeOpacity}" stroke-width="1" />`,
    `  <text x="${b.x + b.paddingX}" y="${b.y + b.labelY}" ${fontAttr(FONTS.reward, b.labelFont)} fill="${b.labelColor}" text-anchor="start" dominant-baseline="middle">${escapeXml(b.label)}</text>`,
    renderBoxText(b, text, 'Inter-Regular', FONTS.reward),
  ].join('\n');
}

module.exports = { renderReward };
