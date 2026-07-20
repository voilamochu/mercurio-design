const { PROJECT_BOX, FONTS } = require('./layout');
const { escapeXml, fontAttr } = require('./title');

function renderProjectBox(projectName, projectDescription) {
  const b = PROJECT_BOX;
  const nameY = b.y + b.nameYOffset;
  const descY = b.y + b.descYOffset;

  const name = projectName ? `Project: ${projectName}` : 'Project';
  const desc = projectDescription ? projectDescription : '';

  return [
    `  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" ry="${b.ry}" fill="${b.fill}" />`,
    `  <text x="${b.x + b.paddingX}" y="${nameY}" ${fontAttr(FONTS.project, b.nameFont).replace('font-weight="400"', 'font-weight="700"')} fill="#1f2937" text-anchor="start" dominant-baseline="middle">${escapeXml(name)}</text>`,
    `  <text x="${b.x + b.paddingX}" y="${descY}" ${fontAttr(FONTS.project, b.descFont)} fill="#374151" text-anchor="start" dominant-baseline="middle">${escapeXml(desc)}</text>`,
  ].join('\n');
}

module.exports = { renderProjectBox };
