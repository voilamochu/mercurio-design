/**
 * Shared stacking helper — computes y positions for full-width boxes.
 * Boxes run entire width (500 x0 rx0), stacked with consistent gaps.
 */
const { BOX, CARD } = require('./card');

/**
 * Stack boxes below artwork.
 * @param {number} artworkY - top of artwork window
 * @param {number} artworkHeight - height of artwork window
 * @param {Array<{ height: number }>} boxes - ordered boxes to stack (e.g. rules, project)
 * @returns {{ boxes: Array<{ y:number, height:number }>, totalHeight:number }}
 */
function stackBoxes(artworkY, artworkHeight, boxes) {
  const gapAfterArt = BOX.gapAfterArt;
  const gap = BOX.gap;
  let y = artworkY + artworkHeight + gapAfterArt;
  const laid = [];
  for (const b of boxes) {
    if (b.height <= 0) {
      laid.push({ y, height: 0 });
      continue;
    }
    laid.push({ y, height: b.height });
    y += b.height + gap;
  }
  // remove trailing gap
  if (laid.length && laid[laid.length - 1].height > 0) {
    y -= gap;
  }
  return { boxes: laid, totalHeight: y - artworkY };
}

/**
 * Compute artwork height that fits remaining space.
 * @param {number} artworkTop - y of artwork top
 * @param {number} fixedBelowHeight - sum of stacked boxes + gaps
 * @param {number} preferred - preferred artwork height
 * @param {number} min - minimum artwork height
 * @param {number} bottomLimit - y limit (e.g. card bottom - flavor reserve)
 */
function fitArtworkHeight(artworkTop, fixedBelowHeight, preferred, min, bottomLimit) {
  const available = bottomLimit - artworkTop - fixedBelowHeight;
  if (preferred <= available) return preferred;
  return Math.max(min, available);
}

module.exports = { stackBoxes, fitArtworkHeight };
