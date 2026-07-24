const fs = require('fs');
const path = require('path');
const { generateFontCss } = require('../../lib/svg/font-embed');

const ROOT = path.join(__dirname, '..', '..', '..');

// ─── Tile Geometry (from Prototype B) ─────────────────────────────

const W = 380;
const H = 190;
const M = 12;
const RIGHT_GUTTER = 5;
const CORNER_RADIUS = 10;

const CONTENT_X = M;
const CONTENT_Y = M;
const CONTENT_W = W - M - RIGHT_GUTTER;  // 363 (outer rect spans from left margin to right gutter)
const CONTENT_H = H - M * 2;  // 166

// ─── VP Gutter ───────────────────────────────────────────────────

// VP stars: 24px diameter, 6px edge-to-edge gap (30px center-to-center)
const VP_STAR_RADIUS = 12;
const VP_STAR_DIAMETER = VP_STAR_RADIUS * 2;
const VP_STAR_GAP = 6;
const VP_STAR_CENTER_X = CONTENT_X + CONTENT_W - VP_STAR_RADIUS - 6;  // 357 — 6px left shift
const VP_GUTTER_LEFT = 351;  // VP column boundary (unchanged)
const VP_GUTTER_WIDTH = VP_STAR_DIAMETER;  // 24
const VP_LEFT_MARGIN = 6;  // dedicated empty region immediately left of the VP column

// ─── Cluster Area ────────────────────────────────────────────────

// Cluster uses the region left of the VP column, leaving VP_LEFT_MARGIN empty
const CLUSTER_AREA_W = VP_GUTTER_LEFT - CONTENT_X - VP_LEFT_MARGIN;  // 333
const CLUSTER_CENTER_X = CONTENT_X + Math.round(CLUSTER_AREA_W / 2);  // 179

// ─── Icon Sizing (from Prototype B) ──────────────────────────────

const ICON_SIZE = 64;
const SUB_ICON_SIZE = 56;
const MIN_ICON_SIZE = 48;
const OPERATOR_ICON_SIZE = 32;
const BADGE_ICON_SIZE = 48;
const ICON_HALF = ICON_SIZE / 2;

// ─── Planet Grid (2×2 for Fragmented Biosphere) ──────────────────

const PLANET_GRID_ICON = 28;
const PLANET_GRID_GAP = 2;
const PLANET_GRID_TOTAL = PLANET_GRID_ICON * 2 + PLANET_GRID_GAP;

// ─── Brace/Parenthesis Constants ────────────────────────────────

const BRACE_DEPTH = 8;
const BRACE_PAD = 4;
const BRACE_COLOR = '#8899AA';
const BRACE_STROKE = 2.5;
const PAREN_DEPTH = 5;
const PAREN_PAD = 3;
const PAREN_COLOR = '#8899AA';
const PAREN_STROKE = 2;

// ─── Spacing (from Prototype B) ─────────────────────────────────

const ICON_GAP = 6;
const CLUSTER_GAP = 40;  // Prototype B: 40px between icon centers
const ROW_GAP = 16;

// ─── Superscript Offsets ──────────────────────────────────────────

const SUPERSCRIPT_OFFSET_X = 3;
const SUPERSCRIPT_OFFSET_Y = -3;

// ─── Icon Libraries ─────────────────────────────────────────────

const registry = require('./icon-registry');

const PLANET_NAMES = registry.getPlanetNames();
const RESOURCE_MAP = registry.getResourceMap();
const GENERIC_ICONS = registry.getSvgIconNames();
const OPERATOR_ICONS = registry.getOperatorNames();
const PLANET_SET = registry.getPlanetSet();

// ─── Asset Store ─────────────────────────────────────────────────

let STORE = null;

function loadAssets() {
  if (STORE) return STORE;

  const defs = [];
  const planets = {};
  const resources = {};

  // Planet icons: optimized 64px assets, with source fallback for direct renderer use
  for (const name of PLANET_NAMES) {
    let fp = registry.getOptimizedPlanetFilePath(name);
    if (!fs.existsSync(fp)) {
      fp = registry.getPlanetFilePath(name);
    }
    if (!fs.existsSync(fp)) {
      console.error(`Missing planet icon: ${fp}`);
      continue;
    }
    planets[name] = `data:image/png;base64,${fs.readFileSync(fp).toString('base64')}`;
  }

  // Resource icons: prefer optimized cache, fall back to source artwork
  const resourceIds = new Set(Object.values(RESOURCE_MAP));
  for (const id of resourceIds) {
    let fp = registry.getOptimizedResourceFilePath(id);
    if (!fs.existsSync(fp)) {
      fp = registry.getResourceFilePath(id);
    }
    if (fs.existsSync(fp)) {
      resources[id] = `data:image/png;base64,${fs.readFileSync(fp).toString('base64')}`;
    }
  }

  // Generic SVG icons (loaded as inline <symbol> elements in <defs>)
  for (const name of GENERIC_ICONS) {
    const pngPath = registry.getOptimizedPngFilePath(name);
    if (fs.existsSync(pngPath)) {
      const pngData = fs.readFileSync(pngPath).toString('base64');
      defs.push(`    <symbol id="${registry.getSvgDefId(name)}" viewBox="0 0 1024 1024"><image href="data:image/png;base64,${pngData}" x="0" y="0" width="1024" height="1024" /></symbol>`);
      continue;
    }
    // Prefer optimized version; fall back to source
    let fp = registry.getOptimizedSvgFilePath(name);
    if (!fs.existsSync(fp)) {
      fp = registry.getSvgFilePath(name);
    }
    if (!fs.existsSync(fp)) {
      throw new Error(`Missing icon file for "${name}": neither optimized nor source SVG found`);
    }
    const svgContent = fs.readFileSync(fp, 'utf-8');
    // Extract the <symbol> element if present; otherwise wrap content in <symbol>
    const symbolMatch = svgContent.match(/<symbol[^>]*>[\s\S]*?<\/symbol>/);
    if (symbolMatch) {
      defs.push(`    ${symbolMatch[0]}`);
    } else {
      const viewBox = svgContent.match(/viewBox="([^"]+)"/);
      const vb = viewBox ? viewBox[1] : '0 0 64 64';
      const inner = svgContent.replace(/<svg[^>]*>/g, '').replace(/<\/svg>/g, '').trim();
      defs.push(`    <symbol id="${registry.getSvgDefId(name)}" viewBox="${vb}">${inner}</symbol>`);
    }
  }

  // Operator SVG icons
  for (const name of OPERATOR_ICONS) {
    const fp = registry.getOperatorFilePath(name);
    if (!fs.existsSync(fp)) {
      throw new Error(`Missing operator icon file for "${name}": ${fp}`);
    }
    const svg = fs.readFileSync(fp, 'utf-8');
    const inner = svg.replace(/<svg[^>]*>/g, '').replace(/<\/svg>/g, '').trim();
    defs.push(`    <g id="${registry.getOperatorDefId(name)}">${inner}</g>`);
  }

  STORE = { defs: defs.join('\n'), planets, resources };
  return STORE;
}

function rasterSymbolDefs(assets, groups) {
  const defs = [];
  const emitted = new Set();
  for (const group of groups || []) {
    for (const el of group.elements || []) {
      if (el.kind !== 'icon') continue;
      const isPlanet = el.iconType === 'planet';
      const isResource = el.iconType === 'resource';
      if (!isPlanet && !isResource) continue;

      const uri = isPlanet ? assets.planets[el.icon] : assets.resources[el.icon];
      if (!uri) continue;
      const prefix = isPlanet ? 'planet' : 'resource';
      const id = `gv-${prefix}-${el.icon}`;
      if (emitted.has(id)) continue;
      emitted.add(id);
      defs.push(`    <symbol id="${id}" viewBox="0 0 64 64"><image href="${uri}" x="0" y="0" width="64" height="64" /></symbol>`);
    }
  }
  return defs.join('\n');
}

// ─── SVG Primitives ─────────────────────────────────────────────

function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function starPoints(cx, cy, outerR, innerR) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 72 - 90) * Math.PI / 180;
    const a2 = ((i * 72) + 36 - 90) * Math.PI / 180;
    pts.push(`${(cx + Math.cos(a1) * outerR).toFixed(1)},${(cy + Math.sin(a1) * outerR).toFixed(1)}`);
    pts.push(`${(cx + Math.cos(a2) * innerR).toFixed(1)},${(cy + Math.sin(a2) * innerR).toFixed(1)}`);
  }
  return pts.join(' ');
}

function starDef() {
  const pts = starPoints(0, 0, VP_STAR_RADIUS, VP_STAR_RADIUS * 0.4);
  return `    <g id="gv-star"><polygon points="${pts}" fill="#C4A35A" stroke="#8B7335" stroke-width="0.5" stroke-linejoin="round" /></g>`;
}

function crossMark(x, y, size) {
  const s = size || 12;
  return [
    `    <line x1="${x}" y1="${y}" x2="${x + s}" y2="${y + s}" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round" />`,
    `    <line x1="${x + s}" y1="${y}" x2="${x}" y2="${y + s}" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round" />`,
  ].join('\n');
}

function bracePath(x, y, h, side, depth) {
  const d = depth || BRACE_DEPTH;
  const h4 = h * 0.25;
  const h2 = h * 0.5;
  const h34 = h * 0.75;
  const top = y;
  const bot = y + h;
  if (side === 'left') {
    return `M ${x},${top} Q ${x},${top + h4 * 0.6} ${x - d * 0.7},${top + h4}
             Q ${x - d},${top + h2 * 0.9} ${x},${top + h2}
             Q ${x - d},${bot - h2 * 0.9} ${x - d * 0.7},${bot - h4}
             Q ${x},${bot - h4 * 0.6} ${x},${bot}`;
  }
  return `M ${x},${top} Q ${x},${top + h4 * 0.6} ${x + d * 0.7},${top + h4}
           Q ${x + d},${top + h2 * 0.9} ${x},${top + h2}
           Q ${x + d},${bot - h2 * 0.9} ${x + d * 0.7},${bot - h4}
           Q ${x},${bot - h4 * 0.6} ${x},${bot}`;
}

function parenPath(x, y, h, side, depth) {
  const d = depth || PAREN_DEPTH;
  const top = y;
  const bot = y + h;
  if (side === 'left') {
    return `M ${x + d},${top} C ${x},${top + h * 0.25} ${x},${top + h * 0.75} ${x + d},${bot}`;
  }
  return `M ${x - d},${top} C ${x},${top + h * 0.25} ${x},${top + h * 0.75} ${x - d},${bot}`;
}

function renderBracePair(bounds, options) {
  const depth = options.depth || BRACE_DEPTH;
  const pad = options.pad || BRACE_PAD;
  const color = options.color || BRACE_COLOR;
  const strokeWidth = options.strokeWidth || BRACE_STROKE;
  const braceCount = options.braceCount || null;

  const lx = bounds.x - pad;
  const rx = bounds.x + bounds.w + pad;
  const top = bounds.y;
  const bottom = bounds.y + bounds.h;
  const h = bottom - top;

  const leftPath = bracePath(lx, top, h, 'left', depth);
  const rightPath = bracePath(rx, top, h, 'right', depth);

  let svg = `<path d="${leftPath}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n`;
  svg += `<path d="${rightPath}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />`;

  if (braceCount !== null) {
    const sx = rx + depth + 2;
    const sy = top + 2;
    svg += `\n<text x="${sx}" y="${sy}" font-family="Inter" font-size="13" font-weight="700" fill="${color}" dominant-baseline="hanging">${braceCount}</text>`;
  }
  return svg;
}

function renderParenPair(bounds, options) {
  const depth = options.depth || PAREN_DEPTH;
  const pad = options.pad || PAREN_PAD;
  const color = options.color || PAREN_COLOR;
  const strokeWidth = options.strokeWidth || PAREN_STROKE;

  const lx = bounds.x - pad;
  const rx = bounds.x + bounds.w + pad;
  const top = bounds.y;
  const bottom = bounds.y + bounds.h;
  const h = bottom - top;

  const leftPath = parenPath(lx, top, h, 'left', depth);
  const rightPath = parenPath(rx, top, h, 'right', depth);

  return `<path d="${leftPath}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n<path d="${rightPath}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />`;
}

// ─── Icon Resolution ─────────────────────────────────────────────

const resolveIcon = registry.resolveIcon;

// ─── Element Classification ─────────────────────────────────────

function isAnchored(el) {
  return el.kind === 'badge' ||
         el.kind === 'overlay' ||
         (el.kind === 'label' && el.anchor === 'above');
}

function isFloating(el) {
  return el.kind === 'operator' || el.kind === 'mark';
}

function elementWidth(el) {
  if (isAnchored(el)) return 0;
  if (isFloating(el)) return 0;
  if (el.kind === 'icon') return iconLayoutSize(el);
  if (el.kind === 'planet-grid') return PLANET_GRID_TOTAL;
  if (el.kind === 'label') {
    const fs = el.fontSize || 12;
    return Math.max(fs * 0.58 * (el.text || '').length + 8, fs);
  }
  return 0;
}

function iconLayoutSize(el) {
  return el.layoutSize || el.size || ICON_SIZE;
}

function measureCluster(elements) {
  if (!elements || elements.length === 0) return { w: 0, h: ICON_SIZE };
  let totalW = 0;
  let maxH = 0;
  let first = true;
  for (const el of elements) {
    if (isAnchored(el) || isFloating(el)) continue;
    if (first) { first = false; }
    else { totalW += ICON_GAP; }
    totalW += elementWidth(el);
    const eh = (
      el.kind === 'icon' ? iconLayoutSize(el) :
      el.kind === 'planet-grid' ? PLANET_GRID_TOTAL :
      (el.fontSize || 12)
    );
    if (eh > maxH) maxH = eh;
  }
  if (totalW === 0 && elements.some(e => e.kind === 'icon')) {
    totalW = ICON_SIZE;
  }
  return { w: totalW, h: Math.max(maxH, ICON_SIZE) };
}

// ─── Element Rendering ──────────────────────────────────────────

function glowFilterId(color) {
  if (color === '#4CAF50') return 'gv-glow-green';
  if (color === '#FF9800') return 'gv-glow-orange';
  return null;
}

function renderIcon(el, cx, cy, assets) {
  const baseSize = iconLayoutSize(el);
  const shrink = el.shrink || 0;
  const finalSize = baseSize - shrink;
  const ox = el.offsetX || 0;
  const oy = el.offsetY || 0;
  const x = cx - finalSize / 2 + ox;
  const y = cy - finalSize / 2 + oy;

  const glowAttr = el.glow ? ` filter="url(#${glowFilterId(el.glow)})"` : '';

  let svg = '';
  if (el.iconType === 'planet') {
    const uri = assets.planets[el.icon];
    if (!uri) return null;
    svg = `<use href="#gv-planet-${el.icon}" x="${x}" y="${y}" width="${finalSize}" height="${finalSize}"${glowAttr} />`;
  } else if (el.iconType === 'resource') {
    const uri = assets.resources[el.icon];
    if (!uri) return null;
    svg = `<use href="#gv-resource-${el.icon}" x="${x}" y="${y}" width="${finalSize}" height="${finalSize}"${glowAttr} />`;
  } else if (el.iconType === 'generic') {
    const defId = registry.getSvgDefId(el.icon);
    if (el.dualGlow) {
      const lFilter = 'url(#gv-glow-green)';
      const rFilter = 'url(#gv-glow-orange)';
      const stroke = el.color || '#8899AA';
      svg = [
        `<g clip-path="url(#gv-clip-left)">`,
        `<use href="#${defId}" x="${x}" y="${y}" width="${finalSize}" height="${finalSize}" filter="${lFilter}" stroke="${stroke}" />`,
        `</g>`,
        `<g clip-path="url(#gv-clip-right)">`,
        `<use href="#${defId}" x="${x}" y="${y}" width="${finalSize}" height="${finalSize}" filter="${rFilter}" stroke="${stroke}" />`,
        `</g>`,
      ].join('\n');
    } else {
      svg = `<use href="#${defId}" x="${x}" y="${y}" width="${finalSize}" height="${finalSize}"${glowAttr} stroke="${el.color || '#8899AA'}" />`;
    }
  }
  return { svg, rect: { x, y, w: finalSize, h: finalSize } };
}

function renderPlanetGrid(el, cx, cy, assets) {
  const planets = el.planets || [];
  const s = PLANET_GRID_ICON;
  const gap = PLANET_GRID_GAP;
  const half = PLANET_GRID_TOTAL / 2;
  const x0 = Math.round(cx - half);
  const y0 = Math.round(cy - half);
  const positions = [
    [x0, y0],
    [x0 + s + gap, y0],
    [x0, y0 + s + gap],
    [x0 + s + gap, y0 + s + gap],
  ];
  const parts = [];
  for (let i = 0; i < Math.min(planets.length, 4); i++) {
    const uri = assets.planets[planets[i]];
    if (!uri) continue;
    const [px, py] = positions[i];
    parts.push(`<image href="${uri}" x="${px}" y="${py}" width="${s}" height="${s}" />`);
  }
  const rect = { x: x0, y: y0, w: PLANET_GRID_TOTAL, h: PLANET_GRID_TOTAL };
  return { svg: parts.join('\n'), rect };
}

function renderCount(val, iconCx, cy) {
  const fontSize = 20;
  const dx = Math.round(ICON_SIZE * 0.38);
  const dy = -Math.round(ICON_SIZE * 0.38);
  const tx = Math.round(iconCx + dx);
  const ty = Math.round(cy + dy);
  return `<text x="${tx}" y="${ty}" font-family="Inter" font-size="${fontSize}" font-weight="700" fill="#F0F2F5" text-anchor="middle" dominant-baseline="middle">${val}</text>`;
}

function renderOperator(el, iconCx, iconCy) {
  let useIconName = null;
  let needsFlip = false;
  let isTextOp = false;
  if (el.symbol === 'arrow-right') useIconName = 'arrow_right';
  else if (el.symbol === 'arrow-left') { useIconName = 'arrow_right'; needsFlip = true; }
  else if (el.symbol === 'different') { isTextOp = true; }
  else if (el.symbol === 'equals') useIconName = 'equals';
  if (!useIconName && !isTextOp) return '';

  const s = OPERATOR_ICON_SIZE;
  const gap = 2;
  let ox = iconCx - s / 2, oy = iconCy - s / 2;
  if (el.anchor === 'east') { ox = iconCx + ICON_SIZE / 2 + gap; oy = iconCy - s / 2; }
  else if (el.anchor === 'west') { ox = iconCx - ICON_SIZE / 2 - s - gap; oy = iconCy - s / 2; }
  else if (el.anchor === 'north-east') { ox = iconCx + ICON_SIZE / 2 - s / 2 + gap; oy = iconCy - ICON_SIZE / 2; }
  else if (el.anchor === 'south-east') { ox = iconCx + ICON_SIZE / 2 - s / 2 + gap; oy = iconCy + ICON_SIZE / 2 - s + 1; }
  else if (el.anchor === 'south-west') { ox = iconCx - ICON_SIZE / 2 - s / 2 - gap; oy = iconCy + ICON_SIZE / 2 - s + 1; }
  ox += 3;
  oy += 3;
  if (isTextOp || el.symbol === 'equals') {
    const symbol = el.symbol === 'equals' ? '=' : '\u2260';
    const fontWeight = el.symbol === 'equals' ? 700 : 600;
    const offsetX = el.symbol === 'equals' ? 2 : 0;
    const offsetY = el.symbol === 'equals' ? 1 : 0;
    return `<text x="${ox + s / 2 + offsetX}" y="${oy + s / 2 + offsetY}" font-family="Exo 2" font-weight="${fontWeight}" font-size="27" fill="${el.color || '#FF9800'}" text-anchor="middle" dominant-baseline="central">${symbol}</text>`;
  }
  if (needsFlip) {
    return `<g transform="translate(${ox + s / 2}, ${oy + s / 2}) scale(-1, 1) translate(${-s / 2}, ${-s / 2})"><use href="#gv-op-${useIconName}" width="${s}" height="${s}" stroke="${el.color || '#8899AA'}" /></g>`;
  }
  return `<use href="#gv-op-${useIconName}" x="${ox}" y="${oy}" width="${s}" height="${s}" stroke="${el.color || '#8899AA'}" />`;
}

function renderMark(el, iconCx, iconCy) {
  if (el.style === 'check' && el.anchor === 'north-east') {
    const s = OPERATOR_ICON_SIZE;
    const ox = iconCx + ICON_SIZE / 2 - s / 2 + 3;
    const oy = iconCy - ICON_SIZE / 2 + 3;
    return `<use href="#gv-op-check" x="${ox}" y="${oy}" width="${s}" height="${s}" stroke="${el.color || '#4CAF50'}" />`;
  }
  return '';
}

function renderOverlay(el, iconRect) {
  if (el.style === 'cross' && iconRect) {
    const pad = 2;
    return crossMark(iconRect.x + pad, iconRect.y + pad, iconRect.w - pad * 2);
  }
  return '';
}

function renderLabel(el, iconCx, iconCy) {
  return `<text x="${iconCx}" y="${iconCy - ICON_SIZE / 2 - 6}" font-family="Inter" font-size="${el.fontSize || 14}" font-weight="${el.fontWeight || 600}" fill="${el.color || '#8899AA'}" text-anchor="middle" dominant-baseline="middle">${esc(el.text)}</text>`;
}

// ─── Cluster Rendering ──────────────────────────────────────────

function renderCluster(elements, ox, oy, assets, groupOpts) {
  const parts = [];
  const flowEls = elements.filter(e => !isAnchored(e) && !isFloating(e));
  const anchorEls = elements.filter(e => isAnchored(e));
  const floatEls = elements.filter(e => isFloating(e));
  if (flowEls.length === 0) return { svg: '', bounds: null };

  const clusterH = Math.max(...flowEls.map(e => (
    e.kind === 'icon' ? iconLayoutSize(e) :
    e.kind === 'planet-grid' ? PLANET_GRID_TOTAL :
    (e.fontSize || 12)
  )), ICON_SIZE);
  const cy = oy + clusterH / 2;

  let cursor = ox;
  const flowPositions = [];
  for (let i = 0; i < flowEls.length; i++) {
    const el = flowEls[i];
    const ew = elementWidth(el);
    const cx = cursor + ew / 2;
    flowPositions.push({ el, cx, cy });
    cursor += ew;
    if (i < flowEls.length - 1) cursor += ICON_GAP;
  }

  const iconEl = flowEls.find(e => e.kind === 'icon');
  let primaryCx = ox + ICON_SIZE / 2;
  let primaryCy = cy;
  if (iconEl) {
    const iconPos = flowPositions.find(p => p.el === iconEl);
    if (iconPos) { primaryCx = iconPos.cx; primaryCy = iconPos.cy; }
  } else if (flowPositions.length > 0) {
    primaryCx = flowPositions[0].cx;
    primaryCy = flowPositions[0].cy;
  }

  let lastIconRect = null;
  const allRects = [];

  for (const pos of flowPositions) {
    const { el, cx, cy: centerY } = pos;
    if (el.kind === 'icon') {
      const result = renderIcon(el, cx, centerY, assets);
      if (result) {
        parts.push(result.svg);
        lastIconRect = result.rect;
        allRects.push(result.rect);
      }
    } else if (el.kind === 'planet-grid') {
      const result = renderPlanetGrid(el, cx, centerY, assets);
      parts.push(result.svg);
      lastIconRect = result.rect;
      allRects.push(result.rect);
    } else if (el.kind === 'label') {
      const labelY = el.superscript ? centerY - ICON_SIZE / 2 + (el.fontSize || 11) + SUPERSCRIPT_OFFSET_Y : centerY;
      parts.push(`<text x="${cx + (el.superscript ? SUPERSCRIPT_OFFSET_X : 0)}" y="${labelY}" font-family="Inter" font-size="${el.fontSize || 14}" font-weight="${el.fontWeight || 600}" fill="${el.color || '#8899AA'}" text-anchor="middle" dominant-baseline="middle">${esc(el.text)}</text>`);
    }
  }

  for (const el of anchorEls) {
    if (el.kind === 'badge') parts.push(renderCount(el.value, primaryCx, primaryCy));
    else if (el.kind === 'overlay') parts.push(renderOverlay(el, lastIconRect));
    else if (el.kind === 'label' && el.anchor === 'above') parts.push(renderLabel(el, primaryCx, primaryCy));
  }

  for (const el of floatEls) {
    if (el.kind === 'operator') parts.push(renderOperator(el, primaryCx, primaryCy));
    else if (el.kind === 'mark') parts.push(renderMark(el, primaryCx, primaryCy));
  }

  // Compute cluster bounds
  let bounds = null;
  if (allRects.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of allRects) {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.w);
      maxY = Math.max(maxY, r.y + r.h);
    }
    bounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  // Render braces or parentheses around the cluster
  if (bounds && groupOpts) {
    if (groupOpts.braces) {
      const braceSvg = renderBracePair(bounds, {
        braceCount: groupOpts.braceCount,
      });
      parts.push(braceSvg);
    }
    if (groupOpts.parentheses) {
      const parenSvg = renderParenPair(bounds, {});
      parts.push(parenSvg);
    }
  }

  return { svg: parts.join('\n'), bounds };
}

// ─── Template Classification ────────────────────────────────────

const TEMPLATE_LABELS = {
  T1: 'planets-row-2', T2: 'planets-row-3', T3: 'planets-plus-extra',
  T4: 'count-badge-planet', T5: 'metric-badge', T6: 'negation-badge',
  T7: 'or-group', T8: 'all-label',
};

const METRIC_TYPES = new Set([
  'minPlanetCount', 'minProjectCount', 'minDifferentOutputs',
  'fullSector', 'minSatisfiedInputs', 'minConsumedOutputs',
  'minDifferentTypes', 'minDifferentBioTypes', 'singleGoodCount',
  'minSameInputGood', 'minSameOutputGood',
]);

function classifyTemplate(groups) {
  if (!groups || groups.length === 0) return 'T5';
  const hasOperator = groups.some(g => g.elements.some(e => e.kind === 'operator'));
  const hasBadge = groups.some(g => g.elements.some(e => e.kind === 'badge'));
  const hasMark = groups.some(g => g.elements.some(e => e.kind === 'mark'));
  const hasSubIcon = groups.some(g => g.elements.some(e => e.kind === 'icon' && e.size));
  const hasOverlay = groups.some(g => g.elements.some(e => e.kind === 'overlay'));
  const hasLabelAbove = groups.some(g => g.elements.some(e => e.kind === 'label' && e.anchor === 'above'));
  const allPlainIcons = groups.every(g => g.elements.length === 1 && g.elements[0].kind === 'icon' && !g.elements[0].size);
  if (hasLabelAbove) return 'T8';
  if (hasSubIcon) return 'T7';
  if (hasOverlay) return 'T6';
  if (allPlainIcons) {
    if (groups.length === 2) return 'T1';
    if (groups.length === 3) return 'T2';
  }
  if (hasOperator && groups.length === 3) return 'T3';
  if (hasBadge && (hasOperator || hasMark)) return 'T5';
  const badgeCounts = groups.map(g => g.elements.filter(e => e.kind === 'badge').length);
  if (badgeCounts.some(c => c > 0)) {
    if (groups.length <= 2 && !hasOperator && !hasMark) return 'T4';
    return 'T5';
  }
  if (allPlainIcons && groups.length > 3) return 'T2';
  if (hasOperator) return 'T3';
  return 'T4';
}

function classifyFromGovernor(governor, model) {
  const groups = model.groups || [];
  if (groups.length === 0) return 'T5';
  const hasSubIcon = groups.some(g => g.elements.some(e => e.kind === 'icon' && e.size));
  const hasOverlay = groups.some(g => g.elements.some(e => e.kind === 'overlay'));
  const hasLabelAbove = groups.some(g => g.elements.some(e => e.kind === 'label' && e.anchor === 'above'));
  if (hasLabelAbove) return 'T8';
  if (hasSubIcon) return 'T7';
  if (hasOverlay) return 'T6';
  const allPlainIcons = groups.every(g => g.elements.length === 1 && g.elements[0].kind === 'icon' && !g.elements[0].size);
  if (allPlainIcons) {
    if (groups.length === 2) return 'T1';
    if (groups.length === 3) return 'T2';
  }
  const plainIconGroups = groups.filter(g => g.elements.length === 1 && g.elements[0].kind === 'icon' && !g.elements[0].size);
  const complexGroups = groups.filter(g => !(g.elements.length === 1 && g.elements[0].kind === 'icon' && !g.elements[0].size));
  if (plainIconGroups.length >= 2 && complexGroups.length >= 1 && groups.length >= 3) return 'T3';
  const reqs = governor.requirements || [];
  const hasMetricReq = reqs.some(r => METRIC_TYPES.has(r.type));
  const hasPlanetCount = reqs.some(r => r.type === 'planetType' && r.count > 1);
  if (hasMetricReq && !hasPlanetCount) return 'T5';
  if (groups.length <= 2) return 'T4';
  return 'T5';
}

// ─── Row Packing ────────────────────────────────────────────────

function pack(clusterWidths, maxRowWidth) {
  if (!clusterWidths.length) return [];
  const total = clusterWidths.reduce((s, w) => s + w + CLUSTER_GAP, -CLUSTER_GAP);
  if (total <= maxRowWidth) return [clusterWidths.map((w, i) => ({ w, i }))];
  const rows = [];
  let cur = [], curW = 0;
  for (let i = 0; i < clusterWidths.length; i++) {
    const nextW = curW + (cur.length ? CLUSTER_GAP : 0) + clusterWidths[i];
    if (nextW > maxRowWidth && cur.length) { rows.push(cur); cur = []; curW = 0; }
    cur.push({ w: clusterWidths[i], i });
    curW += (cur.length > 1 ? CLUSTER_GAP : 0) + clusterWidths[i];
  }
  if (cur.length) rows.push(cur);
  return rows;
}

function clusterOuterWidth(group) {
  const m = measureCluster(group.elements);
  if (group.braces) {
    m.w += 2 * (BRACE_DEPTH + BRACE_PAD) + 20;
  }
  if (group.parentheses) {
    m.w += 2 * (PAREN_DEPTH + PAREN_PAD);
  }
  return m.w;
}

// A group that cannot fit in the dedicated cluster region is the only case
// where authored icon sizes may be reduced. Row packing still gets first say:
// groups that fit individually are allowed to reflow naturally as a row.
function fitGroupToWidth(group, maxWidth, groupIndex) {
  if (clusterOuterWidth(group) <= maxWidth) {
    return { group, changes: [] };
  }

  const flowIcons = group.elements
    .map((el, elementIndex) => ({ el, elementIndex }))
    .filter(({ el }) => el.kind === 'icon' && !isAnchored(el) && !isFloating(el));
  if (flowIcons.length === 0) {
    return { group, changes: [] };
  }

  const iconWidth = flowIcons.reduce((sum, { el }) => sum + iconLayoutSize(el), 0);
  const fixedWidth = clusterOuterWidth(group) - iconWidth;
  const availableIconWidth = maxWidth - fixedWidth;
  const minimumIconWidth = flowIcons.length * MIN_ICON_SIZE;

  // There is no useful size reduction below the renderer's minimum. This is
  // an invalid layout rather than a reason to alter spacing or VP geometry.
  if (availableIconWidth < minimumIconWidth) {
    throw new Error(`Governor group ${groupIndex} cannot fit within ${maxWidth}px without icons below ${MIN_ICON_SIZE}px`);
  }

  const scale = Math.min(1, availableIconWidth / iconWidth);
  const changes = [];
  const elements = group.elements.map((el, elementIndex) => {
    if (el.kind !== 'icon' || isAnchored(el) || isFloating(el)) return el;
    const from = iconLayoutSize(el);
    const to = Math.max(MIN_ICON_SIZE, Number((from * scale).toFixed(2)));
    if (to === from) return el;
    changes.push({ groupIndex, elementIndex, from, to });
    return Object.assign({}, el, { layoutSize: to });
  });

  return { group: Object.assign({}, group, { elements }), changes };
}

function prepareGroups(groups, maxWidth) {
  const changes = [];
  const prepared = groups.map((group, groupIndex) => {
    const result = fitGroupToWidth(group, maxWidth, groupIndex);
    changes.push(...result.changes);
    return result.group;
  });
  return { groups: prepared, changes };
}

// ─── Composition ────────────────────────────────────────────────

function compose(model) {
  const assetStore = loadAssets();
  const sourceGroups = model.groups || [];
  const rasterDefs = rasterSymbolDefs(assetStore, sourceGroups);
  const assets = Object.assign({}, assetStore, {
    defs: [assetStore.defs, rasterDefs].filter(Boolean).join('\n'),
  });
  const template = classifyTemplate(sourceGroups);
  const prepared = prepareGroups(sourceGroups, CLUSTER_AREA_W);
  const groups = prepared.groups;

  // Debug info
  const debug = { template, iconSizeChanges: prepared.changes };

  // Measure clusters
  const clusterMeasurements = groups.map(g => ({
    ...measureCluster(g.elements),
    w: clusterOuterWidth(g),
  }));
  const clusterWidths = clusterMeasurements.map(m => m.w);

  // Build rows
  const rows = pack(clusterWidths, CLUSTER_AREA_W);

  // Block dimensions
  const R = rows.length;
  const blockH = R * ICON_SIZE + (R - 1) * ROW_GAP;
  const blockY = CONTENT_Y + Math.round((CONTENT_H - blockH) / 2);

  // ─── VP Stars ──────────────────────────────────────────────
  const vpCount = model.vp || 0;
  const vpStackH = vpCount * VP_STAR_DIAMETER + (vpCount - 1) * VP_STAR_GAP;
  const vpStartY = CONTENT_Y + Math.round((CONTENT_H - vpStackH) / 2) + VP_STAR_RADIUS;

  let vpSvg = '';
  const vpBounds = [];
  for (let i = 0; i < vpCount; i++) {
    const starY = vpStartY + i * (VP_STAR_DIAMETER + VP_STAR_GAP);
    vpSvg += `    <use href="#gv-star" transform="translate(${VP_STAR_CENTER_X}, ${starY})" />\n`;
    vpBounds.push({
      x: VP_STAR_CENTER_X - VP_STAR_RADIUS,
      y: starY - VP_STAR_RADIUS,
      w: VP_STAR_DIAMETER,
      h: VP_STAR_DIAMETER,
    });
  }

  debug.vpGutterWidth = VP_GUTTER_WIDTH;
  debug.vpGutterCenterX = VP_STAR_CENTER_X;
  debug.vpStackHeight = vpStackH;
  debug.vpStartY = vpStartY;
  debug.vpCount = vpCount;
  debug.contentArea = { x: CONTENT_X, y: CONTENT_Y, w: CONTENT_W, h: CONTENT_H };
  debug.clusterAreaWidth = CLUSTER_AREA_W;
  debug.clusterAreaRight = CONTENT_X + CLUSTER_AREA_W;
  debug.vpLeftMargin = VP_LEFT_MARGIN;
  debug.clusterCenterX = CLUSTER_CENTER_X;

  // ─── Icon Clusters ─────────────────────────────────────────
  const row0Y = blockY;
  let clusterSvg = '';
  let clusterBounds = null;
  let clusterOriginX = Infinity;

  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const rowW = row.reduce((s, c) => s + c.w + CLUSTER_GAP, -CLUSTER_GAP);
    const rowX = CLUSTER_CENTER_X - rowW / 2;
    if (rowX < clusterOriginX) clusterOriginX = rowX;

    let cu = rowX;
    for (const c of row) {
      const gi = c.i;
      const clusterY = row0Y + ri * (ICON_SIZE + ROW_GAP);
      const result = renderCluster(groups[gi].elements, cu, clusterY, assets, groups[gi]);
      if (result.svg) clusterSvg += result.svg + '\n';

      if (result.bounds) {
        if (!clusterBounds) {
          clusterBounds = { ...result.bounds };
        } else {
          clusterBounds.x = Math.min(clusterBounds.x, result.bounds.x);
          clusterBounds.y = Math.min(clusterBounds.y, result.bounds.y);
          clusterBounds.w = Math.max(clusterBounds.w, result.bounds.x + result.bounds.w - clusterBounds.x);
          clusterBounds.h = Math.max(clusterBounds.h, result.bounds.y + result.bounds.h - clusterBounds.y);
        }
      }

      cu += c.w + CLUSTER_GAP;
    }
  }

  debug.clusterWidth = clusterBounds ? clusterBounds.w : 0;
  debug.clusterHeight = clusterBounds ? clusterBounds.h : 0;
  debug.clusterOrigin = { x: clusterOriginX === Infinity ? 0 : clusterOriginX, y: blockY };
  debug.blockHeight = blockH;
  debug.blockY = blockY;
  debug.rows = R;

  // ─── Bounds Check ──────────────────────────────────────────
  const violations = [];

  for (const b of vpBounds) {
    if (b.x < 0 || b.y < 0 || b.x + b.w > W || b.y + b.h > H) {
      violations.push(`VP star at (${b.x},${b.y}) size ${b.w}x${b.h} exceeds tile ${W}x${H}`);
    }
    if (b.x < CONTENT_X || b.y < CONTENT_Y || b.x + b.w > CONTENT_X + CONTENT_W || b.y + b.h > CONTENT_Y + CONTENT_H) {
      violations.push(`VP star at (${b.x},${b.y}) exceeds content area`);
    }
  }

  if (clusterBounds) {
    if (clusterBounds.x < 0 || clusterBounds.y < 0 || clusterBounds.x + clusterBounds.w > W || clusterBounds.y + clusterBounds.h > H) {
      violations.push(`Cluster at (${clusterBounds.x},${clusterBounds.y}) size ${clusterBounds.w}x${clusterBounds.h} exceeds tile ${W}x${H}`);
    }
  }

  if (violations.length > 0) {
    throw new Error(`Bounds violation for ${model.title || 'unknown'}:\n  ${violations.join('\n  ')}`);
  }

  // ─── Assemble SVG ──────────────────────────────────────────
  const frame = [
    `<rect x="${CONTENT_X}" y="${CONTENT_Y}" width="${CONTENT_W}" height="${CONTENT_H}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="url(#gv-bg)" stroke="url(#gv-fg)" stroke-width="1.5" />`,
    `<rect x="${CONTENT_X + 3}" y="${CONTENT_Y + 3}" width="${CONTENT_W - 6}" height="${CONTENT_H - 6}" rx="${CORNER_RADIUS - 2}" ry="${CORNER_RADIUS - 2}" fill="none" stroke="#2A3440" stroke-width="0.5" />`,
  ].join('\n');

  const defs = [
    `<style>\n${generateFontCss()}\n</style>`,
    assets.defs,
    starDef(),
    `<filter id="gv-glow-green" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/><feFlood flood-color="#4CAF50" flood-opacity="1" result="color"/><feComposite in="color" in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    `<filter id="gv-glow-orange" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/><feFlood flood-color="#FF9800" flood-opacity="1" result="color"/><feComposite in="color" in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    `<clipPath id="gv-clip-left" clipPathUnits="objectBoundingBox"><rect x="0" y="0" width="0.52" height="1"/></clipPath>`,
    `<clipPath id="gv-clip-right" clipPathUnits="objectBoundingBox"><rect x="0.48" y="0" width="0.52" height="1"/></clipPath>`,
    `<linearGradient id="gv-fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3A4658" /><stop offset="50%" stop-color="#6A7A8D" /><stop offset="100%" stop-color="#3A4658" /></linearGradient>`,
    `<linearGradient id="gv-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#161C26" /><stop offset="100%" stop-color="#0D1117" /></linearGradient>`,
  ];

  const body = [frame, vpSvg, clusterSvg].join('\n');

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <metadata>governor:${esc(model.title || '')}</metadata>
  <defs>
${defs.join('\n')}
  </defs>
${body}
</svg>`,
    debug,
  };
}

// ─── Public API ─────────────────────────────────────────────────

function renderTile(model) {
  return compose(model).svg;
}

function renderTileWithDebug(model) {
  return compose(model);
}

function classify(model) {
  const t = classifyTemplate(model.groups || []);
  return { template: t, label: TEMPLATE_LABELS[t] || 'unknown' };
}

module.exports = { renderTile, renderTileWithDebug, classify, classifyFromGovernor, W, H, CONTENT_X, CONTENT_Y, CONTENT_W, CONTENT_H, VP_GUTTER_WIDTH, VP_GUTTER_LEFT, VP_LEFT_MARGIN, CLUSTER_AREA_W, CLUSTER_CENTER_X, VP_STAR_RADIUS, VP_STAR_DIAMETER, VP_STAR_GAP };
