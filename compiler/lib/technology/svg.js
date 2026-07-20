const { CARD_W, CARD_H } = require('./layout');
const { generateFontCss } = require('../../lib/svg/font-embed');

function wrapSvg(body, assetId, defs) {
  const fontCss = generateFontCss();

  let defsContent = '';
  if (fontCss) {
    defsContent += `    <style>\n${fontCss}\n    </style>`;
  }
  if (defs) {
    if (defsContent) defsContent += '\n';
    defsContent += defs;
  }

  const defsBlock = defsContent ? `  <defs>\n${defsContent}\n  </defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
  <metadata>technology:${escapeAttr(assetId)}</metadata>
${defsBlock}
${body}
</svg>`;
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

module.exports = { wrapSvg };
