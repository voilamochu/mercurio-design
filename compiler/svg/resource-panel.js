function renderResourcePanel({ stageCount, x, y, width, height, chevronSvg }) {
  const CORNER_RADIUS = 16;

  const PANEL_FILL = '#302A24';
  const PANEL_OPACITY = 0.22;
  const PANEL_BORDER = '#B9A894';
  const PANEL_BORDER_OPACITY = 0.07;
  const PANEL_BORDER_WIDTH = 1;

  const HIGHLIGHT_COLOR = '#D2C3AF';
  const HIGHLIGHT_OPACITY = 0.08;
  const HIGHLIGHT_WIDTH = 1;

  const DIVIDER_COLOR = '#8F8575';
  const DIVIDER_OPACITY = 0.9;
  const DIVIDER_WIDTH = 3;

  const CHEVRON_COLOR = '#C7C2BA';
  const CHEVRON_OPACITY = 0.26;

  const NOTCH_WIDTH = 16;
  const NOTCH_DEPTH = 8;

  const lines = [];

  lines.push(`    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="${PANEL_FILL}" opacity="${PANEL_OPACITY}" />`);

  lines.push(`    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="none" stroke="${PANEL_BORDER}" stroke-opacity="${PANEL_BORDER_OPACITY}" stroke-width="${PANEL_BORDER_WIDTH}" />`);

  const hlY = y + 1;
  const hlInset = CORNER_RADIUS;
  lines.push(`    <line x1="${x + hlInset}" y1="${hlY}" x2="${x + width - hlInset}" y2="${hlY}" stroke="${HIGHLIGHT_COLOR}" stroke-opacity="${HIGHLIGHT_OPACITY}" stroke-width="${HIGHLIGHT_WIDTH}" stroke-linecap="round" />`);

  const divInset = CORNER_RADIUS;
  const divX1 = x + divInset;
  const divX2 = x + width - divInset;
  const notchCenterX = Math.round(x + width / 2);

  const chevronX = Math.round(x + width / 2);

  if (stageCount === 3) {
    const gap = height / stageCount;
    for (let i = 1; i < stageCount; i++) {
      const dy = Math.round(y + gap * i);
      appendDividerWithNotch(lines, divX1, dy, divX2, notchCenterX, NOTCH_WIDTH, NOTCH_DEPTH, DIVIDER_COLOR, DIVIDER_OPACITY, DIVIDER_WIDTH);
    }
    const centers = getEqualStageCenters(y, height, stageCount);
    for (const sc of centers) {
      appendFlowIndicator(lines, chevronSvg, chevronX, sc, CHEVRON_OPACITY, CHEVRON_COLOR);
    }
  } else if (stageCount === 2) {
    const rowH = height / 3;
    const dividerY = Math.round(y + rowH);
    appendDividerWithNotch(lines, divX1, dividerY, divX2, notchCenterX, NOTCH_WIDTH, NOTCH_DEPTH, DIVIDER_COLOR, DIVIDER_OPACITY, DIVIDER_WIDTH);

    const sc1 = Math.round(y + rowH / 2);
    const sc2 = Math.round(y + rowH + (height - rowH) / 2);
    appendFlowIndicator(lines, chevronSvg, chevronX, sc1, CHEVRON_OPACITY, CHEVRON_COLOR);
    appendFlowIndicator(lines, chevronSvg, chevronX, sc2, CHEVRON_OPACITY, CHEVRON_COLOR);
  } else if (stageCount === 1) {
    const sc = Math.round(y + height / 2);
    appendFlowIndicator(lines, chevronSvg, chevronX, sc, CHEVRON_OPACITY, CHEVRON_COLOR);
  }

  return lines.join('\n');
}

function appendDividerWithNotch(lines, x1, y, x2, notchCenterX, notchWidth, notchDepth, color, opacity, strokeWidth) {
  const nw = notchWidth / 2;
  const nc = notchCenterX;
  const nd = y + notchDepth;

  const d = 'M ' + x1 + ' ' + y + ' L ' + (nc - nw) + ' ' + y + ' Q ' + nc + ' ' + nd + ' ' + (nc + nw) + ' ' + y + ' L ' + x2 + ' ' + y;
  lines.push('    <path d="' + d + '" stroke="' + color + '" stroke-opacity="' + opacity + '" stroke-width="' + strokeWidth + '" fill="none" stroke-linecap="round" />');
}

function appendFlowIndicator(lines, chevronSvg, x, y, opacity, color) {
  lines.push('    <g transform="translate(' + x + ', ' + y + ') scale(1.5, 2.0) translate(-12, -12)" color="' + color + '" opacity="' + opacity + '">');
  lines.push('      ' + chevronSvg);
  lines.push('    </g>');
}

function getEqualStageCenters(y, height, count) {
  const centers = [];
  const gap = height / count;
  for (let i = 0; i < count; i++) {
    centers.push(Math.round(y + (i + 0.5) * gap));
  }
  return centers;
}

module.exports = { renderResourcePanel };
