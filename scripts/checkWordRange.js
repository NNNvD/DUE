const fs = require("fs");
const matter = require("gray-matter");
const { unified } = require("unified");
const parse = require("remark-parse");
const strip = require("strip-markdown");
const path = require("path");

const parsePlugin = parse.default || parse;
const stripPlugin = strip.default || strip;

function asPlainText(markdown) {
  const processor = unified().use(parsePlugin).use(stripPlugin);
  const tree = processor.parse(markdown);
  const stripped = processor.runSync(tree);
  const pieces = [];

  (function collect(node) {
    if (typeof node.value === "string") {
      pieces.push(node.value);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(collect);
    }
  })(stripped);

  return pieces.join(" ");
}

function wordCount(md) {
  const text = asPlainText(md);
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function bounds(range) {
  const [lo, hi] = (range || "250-500").split("-").map(Number);
  const grace = Math.ceil(0.02 * hi);
  return [lo, hi + grace];
}

function scan(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".md")).map(f => path.join(dir, f));
}

const files = [
  ...scan("site/essays/drafts"),
  ...scan("site/essays/published")
];

let errors = [];

for (const fp of files) {
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const wc = wordCount(doc.content);
  const [lo, hi] = bounds(doc.data.word_range);
  if (wc < lo || wc > hi) {
    errors.push(`${fp}: ${wc} words (expected ${lo}–${hi})`);
  }
}

if (errors.length) {
  console.error("Word range check failed:\n" + errors.join("\n"));
  process.exit(1);
} else {
  console.log("Word ranges OK");
}
