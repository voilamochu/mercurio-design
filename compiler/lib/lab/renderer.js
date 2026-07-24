const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CANONICAL_ICONS = new Set([
  'population', 'algae', 'electronics', 'robot', 'science',
]);

const ICON_GAP = 8;

function loadDesignTokens(rootDir) {
  const colors = JSON.parse(fs.readFileSync(path.join(rootDir, 'source', 'style', 'colors.json'), 'utf-8'));
  return { colors };
}

async function loadIconDataUris(rootDir, iconIds, iconSize) {
  const resourcesDir = path.join(rootDir, 'source', 'artwork', 'resources');
  const result = {};
  for (const id of iconIds) {
    if (!CANONICAL_ICONS.has(id)) continue;
    const filePath = path.join(resourcesDir, `${id}.png`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  WARNING: canonical icon not found — ${id}.png`);
      continue;
    }
    const buf = await sharp(filePath)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    result[id] = `data:image/png;base64,${buf.toString('base64')}`;
  }
  return result;
}

function svgDefs(iconSize) {
  const s = iconSize;
  const half = s / 2;
  const lines = [];

  lines.push(`  <defs>`);

  lines.push(`    <g id="icon-tech-slot">`);
  const cx = half;
  const bulbR = s * 0.26;
  lines.push(`      <circle cx="${cx}" cy="${s * 0.3}" r="${bulbR}" fill="none" stroke="#9B8656" stroke-width="1.3" />`);
  const bx1 = cx - bulbR * 0.55;
  const bx2 = cx + bulbR * 0.55;
  const by1 = s * 0.3 + bulbR * 0.4;
  const by2 = s * 0.72;
  lines.push(`      <path d="M${bx1},${by1} L${bx1 + 1},${by2} L${bx2 - 1},${by2} L${bx2},${by1}" fill="none" stroke="#9B8656" stroke-width="1.1" stroke-linejoin="round" />`);
  const lx1 = cx - 2.5;
  const lx2 = cx + 2.5;
  const ly1 = s * 0.77;
  const ly2 = s * 0.84;
  lines.push(`      <line x1="${lx1}" y1="${ly1}" x2="${lx2}" y2="${ly1}" stroke="#9B8656" stroke-width="0.9" stroke-linecap="round" />`);
  lines.push(`      <line x1="${lx1 - 1.5}" y1="${ly2}" x2="${lx2 + 1.5}" y2="${ly2}" stroke="#9B8656" stroke-width="0.7" stroke-linecap="round" />`);
  lines.push(`    </g>`);

  lines.push(`    <g id="icon-vp">`);
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const outerR = half - 5;
    const innerR = outerR * 0.4;
    const outerAngle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    pts.push(`${half + Math.cos(outerAngle) * outerR},${half + Math.sin(outerAngle) * outerR}`);
    pts.push(`${half + Math.cos(innerAngle) * innerR},${half + Math.sin(innerAngle) * innerR}`);
  }
  lines.push(`      <polygon points="${pts.join(' ')}" fill="none" stroke="#C4A35A" stroke-width="1.2" stroke-linejoin="round" />`);
  lines.push(`    </g>`);

  lines.push(`  </defs>`);
  return lines.join('\n');
}

function renderIcon(x, y, iconId, iconDataUris, iconSize) {
  const cx = x - iconSize / 2;
  const cy = y - iconSize / 2;
  if (CANONICAL_ICONS.has(iconId)) {
    const uri = iconDataUris[iconId];
    if (!uri) return '';
    return `    <image href="${uri}" x="${cx}" y="${cy}" width="${iconSize}" height="${iconSize}" />`;
  }
  if (iconId === 'tech-slot') {
    return `    <use href="#icon-tech-slot" x="${cx}" y="${cy}" width="${iconSize}" height="${iconSize}" />`;
  }
  if (iconId === 'vp') {
    return `    <use href="#icon-vp" x="${cx}" y="${cy}" width="${iconSize}" height="${iconSize}" />`;
  }
  return '';
}

function renderEmptyInput(x, y) {
  return `    <line x1="${x - 7}" y1="${y}" x2="${x + 7}" y2="${y}" stroke="#4A4536" stroke-width="1.5" stroke-linecap="round" />`;
}

function renderRowBg(y, rowH, index, total, W) {
  const t = index / Math.max(1, total - 1);
  const r = Math.round(22 + t * 6);
  const g = Math.round(18 + t * 6);
  const b = Math.round(14 + t * 6);
  const alpha = index % 2 === 0 ? 0.18 : 0.10;
  return `    <rect x="0" y="${y}" width="${W}" height="${rowH}" fill="rgb(${r},${g},${b})" fill-opacity="${alpha}" />`;
}

function renderTrackLine(y1, y2, x) {
  return `    <line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#4A4536" stroke-width="1.5" />`;
}

function renderTrackDot(x, y, index, total) {
  const t = index / Math.max(1, total - 1);
  const r = Math.round(59 + t * 100);
  const g = Math.round(130 + t * 70);
  const b = Math.round(246 - t * 100);
  const radius = 5;
  const lines = [];
  lines.push(`    <circle cx="${x}" cy="${y}" r="${radius + 3}" fill="none" stroke="rgb(${r},${g},${b})" stroke-width="1" stroke-opacity="0.25" />`);
  lines.push(`    <circle cx="${x}" cy="${y}" r="${radius}" fill="rgb(${r},${g},${b})" fill-opacity="0.5" />`);
  lines.push(`    <circle cx="${x}" cy="${y}" r="${radius * 0.5}" fill="rgb(${r + 40},${g + 20},${b + 20})" fill-opacity="0.7" />`);
  return lines.join('\n');
}

function renderChevron(x, y) {
  const size = 8;
  const left = x - size;
  const right = x;
  const top = y - size * 0.6;
  const bottom = y + size * 0.6;
  return `    <path d="M${left},${top} L${right},${y} L${left},${bottom}" fill="none" stroke="#5C5640" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
}

function renderRowSeparator(y, w) {
  return `    <line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#2A2518" stroke-width="0.5" />`;
}

function renderBorder(w, h) {
  const lines = [];
  lines.push(`  <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#2A2518" stroke-width="1.5" />`);
  lines.push(`  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="none" stroke="#1C1913" stroke-width="0.5" />`);
  return lines.join('\n');
}

async function renderLab(stageData, rootDir) {
  const tokens = loadDesignTokens(rootDir);
  const { canvas, levels, rowHeight, iconSize } = stageData;
  const { width: W, height: H } = canvas;

  const allIconIds = new Set();
  for (const level of levels) {
    for (const id of level.inputs) allIconIds.add(id);
    for (const id of level.outputs) allIconIds.add(id);
  }
  for (const id of allIconIds) {
    if (CANONICAL_ICONS.has(id)) allIconIds.add(id);
  }
  const iconDataUris = await loadIconDataUris(rootDir, [...allIconIds], iconSize);

  const topMargin = 28;
  const trackX = 42;
  const inputStartX = 78;
  const inputStep = iconSize + ICON_GAP;
  const chevronX = 252;
  const outputStartX = 292;
  const outputStep = iconSize + 10;

  const lines = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`);
  lines.push(svgDefs(iconSize));
  lines.push(`  <rect width="${W}" height="${H}" fill="#14110E" />`);

  for (let i = 0; i < levels.length; i++) {
    const rowY = topMargin + i * rowHeight;
    const centerY = rowY + rowHeight / 2;
    lines.push(renderRowBg(rowY, rowHeight, i, levels.length, W));

    if (i > 0) {
      const prevCenterY = topMargin + (i - 1) * rowHeight + rowHeight / 2;
      lines.push(renderTrackLine(prevCenterY, centerY, trackX));
    }

    lines.push(renderTrackDot(trackX, centerY, i, levels.length));
    lines.push(renderChevron(chevronX, centerY));

    const level = levels[i];

    const inputCount = level.inputs.length;
    if (inputCount === 0) {
      lines.push(renderEmptyInput(inputStartX, centerY));
    } else {
      for (let j = 0; j < inputCount; j++) {
        const ix = inputStartX + j * inputStep;
        lines.push(renderIcon(ix, centerY, level.inputs[j], iconDataUris, iconSize));
      }
    }

    const outputCount = level.outputs.length;
    for (let j = 0; j < outputCount; j++) {
      const ox = outputStartX + j * outputStep;
      lines.push(renderIcon(ox, centerY, level.outputs[j], iconDataUris, iconSize));
    }

    if (i < levels.length - 1) {
      const sepY = rowY + rowHeight;
      lines.push(renderRowSeparator(sepY, W));
    }
  }

  lines.push(renderBorder(W, H));
  lines.push(`</svg>`);
  return lines.join('\n');
}

module.exports = { renderLab };
