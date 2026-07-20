const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');

const DOMAIN_DIR = path.join(ROOT, 'source', 'artwork', 'technology', 'domains');
const OVERLAY_DIR = path.join(ROOT, 'source', 'artwork', 'technology', 'overlays');

const DOMAIN_EXT = '.png';
const OVERLAY_EXT = '.png';

const ART_CONFIG = {
  blendMode: 'soft-light',
  overlayOpacity: 0.10,
  overlayGlowOpacity: 0.18,
  overlayGlowBlur: 18,
  lightingOpacity: 0.22,
  lightingRadius: 0.42,
  lightingBlur: 30,
  overlayMaskRadius: 0.75,
  overlayMaskFeather: 0.22,
  vignetteOpacity: 0.16,
  colourGradeStrength: 0.18,
  gradientOpacity: 0.26,
};

const OVERLAY_DEFAULTS = {
  scale: 0.55,
  rotation: 0,
  anchor: 'center',
  opacity: null,
  crop: null,
};

const OVERLAY_PRESETS = {
  construction: { scale: 0.6, rotation: 12, anchor: 'bottom-right' },
  optimization: { scale: 0.7, rotation: 0, anchor: 'center' },
  conversion: { scale: 0.8, rotation: 0, anchor: 'bottom' },
  expansion: { scale: 0.5, rotation: 0, anchor: 'top-right' },
  mastery: { scale: 0.45, rotation: -8, anchor: 'top-left' },
};

function anchorPoint(anchor, w, h) {
  switch (anchor) {
    case 'top-left': return { x: w * 0.28, y: h * 0.28 };
    case 'top-right': return { x: w * 0.72, y: h * 0.28 };
    case 'bottom-left': return { x: w * 0.28, y: h * 0.72 };
    case 'bottom-right': return { x: w * 0.72, y: h * 0.72 };
    case 'bottom': return { x: w * 0.5, y: h * 0.72 };
    case 'top': return { x: w * 0.5, y: h * 0.28 };
    case 'center':
    default: return { x: w * 0.5, y: h * 0.5 };
  }
}

function loadImageDataUri(filename, dir) {
  const p = path.join(dir, filename);
  if (!fs.existsSync(p)) return null;
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
}

function loadDomain(domainId) {
  return loadImageDataUri(`${domainId}${DOMAIN_EXT}`, DOMAIN_DIR);
}

function loadOverlay(overlayId) {
  return loadImageDataUri(`${overlayId}${OVERLAY_EXT}`, OVERLAY_DIR);
}

function overlayConfig(overlayId) {
  const preset = OVERLAY_PRESETS[overlayId] || {};
  const cfg = Object.assign({}, OVERLAY_DEFAULTS, preset);
  return {
    scale: cfg.scale,
    rotation: cfg.rotation,
    anchor: cfg.anchor,
    opacity: cfg.opacity != null ? cfg.opacity : ART_CONFIG.overlayOpacity,
  };
}

function overlayGeometry(rect, cfg) {
  const cx = Math.round(rect.x + rect.width / 2);
  const cy = Math.round(rect.y + rect.height / 2);
  return {
    x: rect.x,
    y: rect.y,
    w: rect.width,
    h: rect.height,
    fx: rect.x,
    fy: rect.y,
    cx,
    cy,
    rotation: cfg.rotation,
  };
}

function buildClipDef(id, rect) {
  return `  <clipPath id="artclip-${id}">
    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${rect.rx}" ry="${rect.ry}" />
  </clipPath>`;
}

function buildGradientDef(id, rect) {
  const y0 = rect.y;
  const y1 = rect.y + rect.height;
  return `  <linearGradient id="artgrad-${id}" x1="0" y1="${y0}" x2="0" y2="${y1}" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#000000" stop-opacity="0" />
    <stop offset="100%" stop-color="#000000" stop-opacity="${ART_CONFIG.gradientOpacity}" />
  </linearGradient>`;
}

function buildVignetteDef(id, rect) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const r = Math.max(rect.width, rect.height) * 0.72;
  return `  <radialGradient id="artvig-${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">
    <stop offset="55%" stop-color="#000000" stop-opacity="0" />
    <stop offset="100%" stop-color="#000000" stop-opacity="${ART_CONFIG.vignetteOpacity}" />
  </radialGradient>`;
}

function buildColourGradeFilter(id) {
  const s = Math.max(0, 1 - ART_CONFIG.colourGradeStrength);
  return `  <filter id="artgrade-${id}" color-interpolation-filters="sRGB">
    <feColorMatrix type="saturate" values="${s}" />
    <feComponentTransfer>
      <feFuncR type="linear" slope="1.03" intercept="0.01" />
      <feFuncB type="linear" slope="0.97" intercept="0" />
    </feComponentTransfer>
  </filter>`;
}

function buildBlurFilter(id, radius) {
  return `  <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
    <feGaussianBlur stdDeviation="${radius}" />
  </filter>`;
}

function buildLightingDef(id, rect, geo) {
  const lx = geo.fx + geo.w / 2;
  const ly = geo.fy + geo.h / 2;
  const r = Math.round(Math.max(rect.width, rect.height) * ART_CONFIG.lightingRadius);
  return `  <radialGradient id="artlight-${id}" cx="${lx}" cy="${ly}" r="${r}" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#fff6e8" stop-opacity="${ART_CONFIG.lightingOpacity}" />
    <stop offset="100%" stop-color="#fff6e8" stop-opacity="0" />
  </radialGradient>`;
}

function buildOverlayMask(id, geo) {
  const r = ART_CONFIG.overlayMaskRadius;
  const featherStart = Math.max(0, r - ART_CONFIG.overlayMaskFeather);
  return `  <mask id="artmask-${id}" maskUnits="userSpaceOnUse" x="${geo.fx - geo.w}" y="${geo.fy - geo.h}" width="${geo.w * 3}" height="${geo.h * 3}">
    <rect x="${geo.fx - geo.w}" y="${geo.fy - geo.h}" width="${geo.w * 3}" height="${geo.h * 3}" fill="black" />
    <radialGradient id="artmaskgrad-${id}" cx="${geo.fx + geo.w / 2}" cy="${geo.fy + geo.h / 2}" r="${Math.round(geo.w * r)}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="${Math.round(featherStart * 100)}%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <rect x="${geo.fx - geo.w}" y="${geo.fy - geo.h}" width="${geo.w * 3}" height="${geo.h * 3}" fill="url(#artmaskgrad-${id})" />
  </mask>`;
}

function renderArtwork(assetId, rect, domainId, overlayId) {
  const domainUri = loadDomain(domainId);
  const overlayUri = overlayId ? loadOverlay(overlayId) : null;
  const cfg = overlayUri ? overlayConfig(overlayId) : null;
  const geo = overlayUri ? overlayGeometry(rect, cfg) : null;

  const defs = [];
  defs.push(buildClipDef(assetId, rect));
  defs.push(buildGradientDef(assetId, rect));
  defs.push(buildVignetteDef(assetId, rect));
  defs.push(buildColourGradeFilter(assetId));
  defs.push(buildBlurFilter(`artglow-${assetId}`, ART_CONFIG.overlayGlowBlur));
  defs.push(buildBlurFilter(`artlightblur-${assetId}`, ART_CONFIG.lightingBlur));
  if (overlayUri) {
    defs.push(buildLightingDef(assetId, rect, geo));
    defs.push(buildOverlayMask(assetId, geo));
  }

  const groupOpen = `  <g clip-path="url(#artclip-${assetId})">`;
  const layers = [];

  if (domainUri) {
    layers.push(`    <image href="${domainUri}" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" preserveAspectRatio="xMidYMid slice" filter="url(#artgrade-${assetId})" />`);
    layers.push(`    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="url(#artgrad-${assetId})" />`);
  } else {
    layers.push(`    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="#c9ccd1" />`);
    layers.push(`    <text x="${rect.x + rect.width / 2}" y="${rect.y + rect.height / 2}" font-family="Inter" font-size="22" font-weight="400" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">artwork: ${domainId}</text>`);
  }

  if (overlayUri) {
    const blend = `style="mix-blend-mode:${ART_CONFIG.blendMode}"`;

    layers.push(`    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="url(#artlight-${assetId})" filter="url(#artlightblur-${assetId})" style="mix-blend-mode:screen" />`);

    layers.push(`    <g mask="url(#artmask-${assetId})" ${blend} opacity="${cfg.opacity}">`);
    layers.push(`      <image href="${overlayUri}" x="${geo.fx}" y="${geo.fy}" width="${geo.w}" height="${geo.h}" preserveAspectRatio="xMidYMid meet" transform="rotate(${geo.rotation} ${geo.cx} ${geo.cy})" />`);
    layers.push(`    </g>`);

    layers.push(`    <g mask="url(#artmask-${assetId})" style="mix-blend-mode:screen" opacity="${ART_CONFIG.overlayGlowOpacity}" filter="url(#artglow-${assetId})">`);
    layers.push(`      <image href="${overlayUri}" x="${geo.fx}" y="${geo.fy}" width="${geo.w}" height="${geo.h}" preserveAspectRatio="xMidYMid meet" transform="rotate(${geo.rotation} ${geo.cx} ${geo.cy})" />`);
    layers.push(`    </g>`);
  }

  layers.push(`    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="url(#artvig-${assetId})" />`);

  return {
    defs: defs.join('\n'),
    body: `${groupOpen}\n${layers.join('\n')}\n  </g>`,
    hasDomain: !!domainUri,
    hasOverlay: !!overlayUri,
  };
}

module.exports = {
  renderArtwork,
  loadDomain,
  loadOverlay,
  ART_CONFIG,
  OVERLAY_PRESETS,
  OVERLAY_DEFAULTS,
  DOMAIN_DIR,
  OVERLAY_DIR,
};
