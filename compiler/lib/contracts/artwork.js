const fs = require('fs');
const path = require('path');
const { ARTWORK_WINDOW } = require('./layout');

const ROOT = path.join(__dirname, '..', '..', '..');
const ARTWORK_DIR = path.join(ROOT, 'generated', 'optimized-contract-assets');

function loadArtworkPng(filename) {
  const p = path.join(ARTWORK_DIR, filename);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}

function buildClipDef(assetId, rect) {
  return `  <clipPath id="artclip-${assetId}">
    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${rect.rx}" ry="${rect.ry}" />
  </clipPath>`;
}

function renderArtwork(assetId, filename) {
  const buf = loadArtworkPng(filename);
  const rect = ARTWORK_WINDOW;

  if (!buf) {
    return {
      defs: '',
      body: `  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${rect.rx}" ry="${rect.ry}" fill="#2A2E35" />`,
    };
  }

  const dataUri = `data:image/png;base64,${buf.toString('base64')}`;
  const defs = buildClipDef(assetId, rect);

  const body = [
    `  <g clip-path="url(#artclip-${assetId})">`,
    `    <image href="${dataUri}" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" preserveAspectRatio="xMidYMid slice" />`,
    `  </g>`,
  ].join('\n');

  return { defs, body };
}

module.exports = { renderArtwork, loadArtworkPng, ARTWORK_DIR };
