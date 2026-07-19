const { PROJECT_BOX } = require('./layout');
const { escapeXml } = require('./title');

function renderProjectBox(projectName, projectDescription) {
  const b = PROJECT_BOX;
  const line1Y = b.y + b.padding + 8;
  const line2Y = b.y + b.padding + 44;
  const line3Y = b.y + b.padding + 78;

  const name = projectName ? `Project: ${projectName}` : 'Project';
  const desc1 = projectDescription ? projectDescription : '';
  const desc2 = '';

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" />`,
    `  <text x="${b.x + b.padding}" y="${line1Y}" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1f2937" text-anchor="start" dominant-baseline="middle">${escapeXml(name)}</text>`,
    `  <text x="${b.x + b.padding}" y="${line2Y}" font-family="sans-serif" font-size="17" fill="#374151" text-anchor="start" dominant-baseline="middle">${escapeXml(desc1)}</text>`,
    `  <text x="${b.x + b.padding}" y="${line3Y}" font-family="sans-serif" font-size="17" fill="#374151" text-anchor="start" dominant-baseline="middle">${escapeXml(desc2)}</text>`,
  ].join('\n');
}

module.exports = { renderProjectBox };
