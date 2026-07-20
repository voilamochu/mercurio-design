const { CARD_W, CARD_H } = require('./layout');

function wrapSvg(body, assetId, defs) {
  const defsBlock = defs ? `  <defs>\n${defs}\n  </defs>` : '';
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
