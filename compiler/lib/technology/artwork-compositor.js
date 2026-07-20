const { composeArtworkDataUri, loadDomain, loadOverlay, ART_CONFIG, DOMAIN_DIR, OVERLAY_DIR } = require('./sharp-artwork-compositor');

function buildClipDef(id, rect) {
  return `  <clipPath id="artclip-${id}">
    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${rect.rx}" ry="${rect.ry}" />
  </clipPath>`;
}

async function renderArtwork(assetId, displayRect, domainId, overlayId) {
  const dataUri = await composeArtworkDataUri(domainId, overlayId);

  const defs = buildClipDef(assetId, displayRect);

  const groupOpen = `  <g clip-path="url(#artclip-${assetId})">`;
  const layers = [
    `    <image href="${dataUri}" x="${displayRect.x}" y="${displayRect.y}" width="${displayRect.width}" height="${displayRect.height}" preserveAspectRatio="xMidYMid slice" />`,
  ];
  const body = `${groupOpen}\n${layers.join('\n')}\n  </g>`;

  return { defs, body, hasDomain: !!loadDomain(domainId), hasOverlay: !!loadOverlay(overlayId) };
}

module.exports = {
  renderArtwork,
  loadDomain,
  loadOverlay,
  ART_CONFIG,
  DOMAIN_DIR,
  OVERLAY_DIR,
};
