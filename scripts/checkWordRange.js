
const fs = require("fs");
const matter = require("gray-matter");
const { unified } = require("unified");
const parse = require("remark-parse");
const strip = require("strip-markdown");
const path = require("path");

function wordCount(md) {
  const text = String(unified().use(parse).use(strip).processSync(md));
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function bounds(range) {
  const [lo, hi] = (range || "250-500").split("-").map(Number);
  const grace = Math.ceil(0.02 * hi);
  return [lo, hi + grace];
}

function validateWordRange(md, range) {
  const wc = wordCount(md);
  const [lo, hi] = bounds(range);
  const ok = wc >= lo && wc <= hi;
  return { ok, wordCount: wc, range: [lo, hi] };
}

function formatError(fp, result) {
  return `${fp}: ${result.wordCount} words (expected ${result.range[0]}–${result.range[1]})`;
}

function scan(dir, fsModule = fs) {
  if (!fsModule.existsSync(dir)) return [];
  return fsModule
    .readdirSync(dir)
    .filter(f => f.endsWith(".md"))
    .map(f => path.join(dir, f));
}

function listMarkdownFiles(fsModule = fs) {
  return [
    ...scan("site/essays/drafts", fsModule),
    ...scan("site/essays/published", fsModule)
  ];
}

function checkFiles(files, fsModule = fs) {
  const errors = [];
  for (const fp of files) {
    const raw = fsModule.readFileSync(fp, "utf8");
    const doc = matter(raw);
    const result = validateWordRange(doc.content, doc.data.word_range);
    if (!result.ok) {
      errors.push(formatError(fp, result));
    }
  }
  return errors;
}

function run(fsModule = fs) {
  const files = listMarkdownFiles(fsModule);
  const errors = checkFiles(files, fsModule);
  if (errors.length) {
    console.error("Word range check failed:\n" + errors.join("\n"));
    return 1;
  }
  console.log("Word ranges OK");
  return 0;
}

if (require.main === module) {
  process.exit(run());
}

module.exports = {
  wordCount,
  bounds,
  validateWordRange,
  formatError,
  scan,
  listMarkdownFiles,
  checkFiles,
  run
};
