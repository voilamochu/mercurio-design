const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const FONT_DIR = path.join(ROOT, 'source', 'fonts');

const FONT_FACES = [
  { family: 'Exo 2', weight: '600 700', style: 'normal', filename: 'Exo2-SemiBold.woff2' },
  { family: 'Inter', weight: '400 500', style: 'normal', filename: 'Inter-Regular.woff2' },
  { family: 'Inter', weight: '400', style: 'italic', filename: 'Inter-Italic.woff2' },
];

let cachedFontCss = null;

function base64Font(filename) {
  const filePath = path.join(FONT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath).toString('base64');
}

function generateFontCss() {
  if (cachedFontCss !== null) {
    return cachedFontCss;
  }

  const loaded = new Map();

  const rules = FONT_FACES.map(ff => {
    const filePath = path.join(FONT_DIR, ff.filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stat = fs.statSync(filePath);
    const contentKey = `${stat.size}:${stat.mtimeMs}`;

    let b64;
    if (loaded.has(contentKey)) {
      b64 = loaded.get(contentKey);
    } else {
      const buffer = fs.readFileSync(filePath);
      b64 = buffer.toString('base64');
      loaded.set(contentKey, b64);
    }

    const styleDecl = ff.style === 'italic' ? 'font-style: italic;' : '';
    return `    @font-face { font-family: '${ff.family}'; font-weight: ${ff.weight}; ${styleDecl} src: url(data:font/woff2;base64,${b64}) format('woff2'); }`;
  }).filter(Boolean);

  cachedFontCss = rules.join('\n');
  return cachedFontCss;
}

function getEmbeddedFontCount() {
  return FONT_FACES.length;
}

function getEmbeddedFontNames() {
  return FONT_FACES.map(ff => ff.filename);
}

module.exports = { generateFontCss, getEmbeddedFontCount, getEmbeddedFontNames };
