const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const { parseDocument } = require('htmlparser2');
const {
  findAll,
  findOne,
  getAttributeValue,
} = require('domutils');

const siteRoot = path.join(__dirname, '..', '_site');

function requireBuildOutput() {
  if (!fs.existsSync(siteRoot)) {
    throw new Error('Build output not found. Run "npm run build" first.');
  }
}

function attr(node, name) {
  const value = getAttributeValue(node, name);
  return value === undefined || value === null ? '' : String(value);
}

function hasAssociatedLabel(node, root) {
  if (attr(node, 'aria-label') || attr(node, 'aria-labelledby')) {
    return true;
  }

  if (node.parent && node.parent.name === 'label') {
    return true;
  }

  const id = attr(node, 'id');
  if (!id) return false;

  const directLabel = findOne(
    (el) => el.name === 'label' && attr(el, 'for') === id,
    root.children,
    true,
  );

  return Boolean(directLabel);
}

function checkImages(document, issues, page) {
  const images = findAll((el) => el.name === 'img', document.children, true);
  for (const image of images) {
    const alt = attr(image, 'alt');
    if (alt === '') {
      issues.push({ page, message: 'Image missing descriptive alt text.' });
    }
    if (!('alt' in image.attribs)) {
      issues.push({ page, message: 'Image missing alt attribute.' });
    }
  }
}

function checkForms(document, issues, page) {
  const formFields = findAll(
    (el) =>
      ['input', 'select', 'textarea'].includes(el.name) &&
      !['hidden', 'submit', 'button'].includes(attr(el, 'type')),
    document.children,
    true,
  );

  for (const field of formFields) {
    if (!hasAssociatedLabel(field, document)) {
      const id = attr(field, 'id') || attr(field, 'name') || field.name;
      issues.push({ page, message: `Form control "${id}" is missing an accessible label.` });
    }
  }
}

function checkNavigation(document, issues, page) {
  const navs = findAll((el) => el.name === 'nav', document.children, true);
  for (const nav of navs) {
    if (!attr(nav, 'aria-label') && !attr(nav, 'aria-labelledby')) {
      issues.push({ page, message: 'Navigation landmark missing an accessible name.' });
    }
  }
}

function checkMainRegion(document, issues, page) {
  const main = findOne((el) => el.name === 'main', document.children, true);
  if (!main) {
    issues.push({ page, message: 'Missing <main> landmark.' });
  }
  if (main && attr(main, 'id') !== 'main-content') {
    issues.push({ page, message: 'Main landmark should have id="main-content" for skip link target.' });
  }
}

function checkSkipLink(document, issues, page) {
  const skip = findOne(
    (el) => el.name === 'a' && attr(el, 'href') === '#main-content',
    document.children,
    true,
  );
  if (!skip) {
    issues.push({ page, message: 'Missing skip link to main content.' });
  }
}

function checkHeadings(document, issues, page) {
  const headings = findAll((el) => el.name === 'h1', document.children, true);
  if (headings.length === 0) {
    issues.push({ page, message: 'Page is missing an <h1> heading.' });
  }
}

function parseColor(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function luminance([r, g, b]) {
  const values = [r, g, b].map((v) => {
    const channel = v / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrast(colorA, colorB) {
  const lumA = luminance(parseColor(colorA));
  const lumB = luminance(parseColor(colorB));
  const [lighter, darker] = lumA >= lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
}

function checkPalette(issues) {
  const palette = {
    bg: '#f9fafb',
    bgPanel: '#f2f4f7',
    card: '#f8fafc',
    surface: '#ffffff',
    ink: '#1f2937',
    muted: '#4b5563',
    muted2: '#646d7c',
    accent: '#c2410c',
    accent2: '#d946ef',
    accent3: '#14b8a6',
  };

  const textColors = ['ink', 'muted', 'muted2', 'accent'];
  const backgrounds = ['bg', 'bgPanel', 'card', 'surface'];

  for (const text of textColors) {
    for (const bg of backgrounds) {
      const ratio = contrast(palette[text], palette[bg]);
      if (ratio < 4.5) {
        issues.push({
          page: 'palette',
          message: `Contrast ratio too low for ${text} on ${bg}: ${ratio.toFixed(2)}:1`,
        });
      }
    }
  }

  const buttonContrast = contrast('#ffffff', palette.accent);
  if (buttonContrast < 4.5) {
    issues.push({ page: 'palette', message: `Primary button contrast too low: ${buttonContrast.toFixed(2)}:1` });
  }
}

function evaluatePage(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const document = parseDocument(html);
  const page = path.relative(siteRoot, filePath);
  const issues = [];

  checkImages(document, issues, page);
  checkForms(document, issues, page);
  checkNavigation(document, issues, page);
  checkMainRegion(document, issues, page);
  checkSkipLink(document, issues, page);
  checkHeadings(document, issues, page);

  return issues;
}

async function main() {
  requireBuildOutput();
  const files = await fg('**/*.html', { cwd: siteRoot, absolute: true });

  const allIssues = [];
  for (const file of files) {
    const pageIssues = evaluatePage(file);
    if (pageIssues.length) {
      allIssues.push(...pageIssues);
      console.error(`❌ ${path.relative(siteRoot, file)} (${pageIssues.length} issues)`);
      for (const issue of pageIssues) {
        console.error(`   - ${issue.message}`);
      }
    } else {
      console.log(`✅ ${path.relative(siteRoot, file)}`);
    }
  }

  const paletteIssues = [];
  checkPalette(paletteIssues);

  if (paletteIssues.length) {
    allIssues.push(...paletteIssues);
    console.error('❌ Palette checks');
    for (const issue of paletteIssues) {
      console.error(`   - ${issue.message}`);
    }
  }

  if (allIssues.length) {
    console.error(`\nAccessibility checks found ${allIssues.length} issue(s).`);
    process.exit(1);
  }

  console.log('\nAccessibility checks passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
