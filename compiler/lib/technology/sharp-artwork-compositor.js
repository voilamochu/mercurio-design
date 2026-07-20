const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', '..', '..');

const DOMAIN_DIR = path.join(ROOT, 'source', 'artwork', 'technology', 'domains');
const OVERLAY_DIR = path.join(ROOT, 'source', 'artwork', 'technology', 'overlays');

const DOMAIN_EXT = '.png';
const OVERLAY_EXT = '.png';

const ART_CONFIG = {
  blendMode: 'overlay',
  overlayOpacity: 0.12,
};

function loadDomain(domainId) {
  const p = path.join(DOMAIN_DIR, `${domainId}${DOMAIN_EXT}`);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}

function loadOverlay(overlayId) {
  const p = path.join(OVERLAY_DIR, `${overlayId}${OVERLAY_EXT}`);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}

async function createFallbackBuffer(domainId, w, h) {
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="#c9ccd1"/>
    <text x="${w / 2}" y="${h / 2}" font-family="Inter, sans-serif" font-size="22" font-weight="400" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">artwork: ${domainId}</text>
  </svg>`;
  return sharp(Buffer.from(fallbackSvg))
    .flatten()
    .withMetadata()
    .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
    .toBuffer();
}

async function composeArtwork(domainId, overlayId, rect) {
  const w = rect.width;
  const h = rect.height;

  const domainBuf = loadDomain(domainId);

  if (!domainBuf) {
    return createFallbackBuffer(domainId, w, h);
  }

  const domainResized = await sharp(domainBuf)
    .resize(w, h, { fit: 'cover', kernel: 'lanczos3' })
    .withMetadata()
    .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
    .toBuffer();

  const overlayBuf = loadOverlay(overlayId);
  if (!overlayBuf) {
    return domainResized;
  }

  const overlayResized = await sharp(overlayBuf)
    .resize(w, h, { fit: 'cover', kernel: 'lanczos3' })
    .withMetadata()
    .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
    .toBuffer();

  const result = await sharp(domainResized)
    .composite([{ input: overlayResized, blend: ART_CONFIG.blendMode, opacity: ART_CONFIG.overlayOpacity }])
    .flatten()
    .withMetadata()
    .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
    .toBuffer();

  return result;
}

async function composeArtworkDataUri(domainId, overlayId, rect) {
  const buf = await composeArtwork(domainId, overlayId, rect);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

module.exports = {
  composeArtwork,
  composeArtworkDataUri,
  loadDomain,
  loadOverlay,
  ART_CONFIG,
  DOMAIN_DIR,
  OVERLAY_DIR,
};
