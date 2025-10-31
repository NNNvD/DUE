const fs = require("fs");
const matter = require("gray-matter");
const { unified } = require("unified");
const remarkParseModule = require("remark-parse");
const stripMarkdownModule = require("strip-markdown");
const path = require("path");

const parse = remarkParseModule.default || remarkParseModule;
const strip = stripMarkdownModule.default || stripMarkdownModule;

const CITATION_HEADINGS = new Set([
  "citations",
  "footnotes",
  "references",
  "bibliography",
  "sources"
]);

const CITATION_CLASSNAMES = new Set([
  "citation",
  "citations",
  "footnote",
  "footnotes",
  "references",
  "bibliography",
  "sources"
]);

function extractText(node) {
  if (!node || typeof node !== "object") return "";
  if (typeof node.value === "string") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(child => extractText(child)).join(" ");
}

function normalizeHeading(node) {
  return extractText(node).trim().toLowerCase();
}

function classNameMatches(node) {
  const className = node?.data?.hProperties?.className;
  if (!className) return false;
  const classes = Array.isArray(className) ? className : String(className).split(/\s+/);
  return classes.some(cls => CITATION_CLASSNAMES.has(String(cls).toLowerCase()));
}

function htmlLooksLikeCitation(node) {
  if (node.type !== "html" || typeof node.value !== "string") return false;
  return /class\s*=\s*"[^"]*(citation|footnote|bibliography|references|sources)[^"]*"/i.test(node.value);
}

function isFootnoteDefinition(node) {
  if (!node) return false;
  if (node.type === "footnoteDefinition") return true;
  if (node.type === "definition") {
    return typeof node.identifier === "string" && node.identifier.startsWith("^");
  }
  if (node.type === "paragraph") {
    const text = extractText(node).trim();
    return /^\[\^[^\]]+\]:/.test(text);
  }
  return false;
}

function removeCitationSections(tree) {
  if (!tree.children) return;
  const result = [];

  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i];

    if (node.type === "heading" && CITATION_HEADINGS.has(normalizeHeading(node))) {
      const depth = node.depth;
      // Skip nodes until we hit a heading of same or higher depth that is not a citation heading.
      for (i = i + 1; i < tree.children.length; i++) {
        const next = tree.children[i];
        if (next.type === "heading" && next.depth <= depth) {
          if (CITATION_HEADINGS.has(normalizeHeading(next))) {
            continue;
          }
          i -= 1;
          break;
        }
      }
      continue;
    }

    result.push(node);
  }

  tree.children = result;
}

function removeFootnotesAndCitations() {
  return tree => {
    const stack = [tree];
    while (stack.length) {
      const node = stack.pop();
      if (!node || !node.children) continue;

      node.children = node.children.filter(child => {
        const shouldRemove =
          isFootnoteDefinition(child) ||
          classNameMatches(child) ||
          htmlLooksLikeCitation(child);
        if (!shouldRemove) stack.push(child);
        return !shouldRemove;
      });
    }

    removeCitationSections(tree);
  };
}

function wordCount(md) {
  const tree = unified().use(parse).parse(md);
  unified().use(removeFootnotesAndCitations).runSync(tree);
  unified().use(strip).runSync(tree);
  const text = extractText(tree);
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
