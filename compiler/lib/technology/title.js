const { TITLE_BAR } = require('./layout');

function renderTitleBar(name, romanLevel) {
  const b = TITLE_BAR;
  const cx = b.x + b.paddingX;
  const cy = b.y + b.height / 2;

  const badgeX = b.x + b.width - b.paddingX - b.levelBadgeSize;
  const badgeY = b.y + (b.height - b.levelBadgeSize) / 2;

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" />`,
    `  <text x="${cx}" y="${cy}" font-family="sans-serif" font-size="34" font-weight="bold" fill="#1a1a1a" text-anchor="start" dominant-baseline="middle">${escapeXml(name)}</text>`,
    `  <rect x="${badgeX}" y="${badgeY}" width="${b.levelBadgeSize}" height="${b.levelBadgeSize}" rx="10" ry="10" fill="#1f2937" />`,
    `  <text x="${badgeX + b.levelBadgeSize / 2}" y="${badgeY + b.levelBadgeSize / 2}" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${escapeXml(romanLevel)}</text>`,
  ].join('\n');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { renderTitleBar, escapeXml };
