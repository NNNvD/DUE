const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

let matter;
try {
  // Prefer the rich gray-matter parser when dependencies are installed.
  // eslint-disable-next-line n/global-require, n/no-unsupported-features/node-builtins
  matter = require("gray-matter");
} catch (error) {
  matter = null;
}

const yamlEngine = {
  parse: src => yaml.load(src, { schema: yaml.JSON_SCHEMA }),
  stringify: obj => yaml.dump(obj, { schema: yaml.JSON_SCHEMA, lineWidth: 100 })
};

let advancedWordCount = null;
try {
  // Attempt to use the markdown AST pipeline when the unified toolchain is available.
  // eslint-disable-next-line n/global-require
  const { unified } = require("unified");
  // eslint-disable-next-line n/global-require
  const remarkParseModule = require("remark-parse");
  // eslint-disable-next-line n/global-require
  const stripMarkdownModule = require("strip-markdown");

  const parse = remarkParseModule.default || remarkParseModule;
  const strip = stripMarkdownModule.default || stripMarkdownModule;

  advancedWordCount = md => {
    const tree = unified().use(parse).parse(md);
    unified().use(removeFootnotesAndCitations).runSync(tree);
    unified().use(strip).runSync(tree);
    const text = extractText(tree);
    return text.trim().split(/\s+/).filter(Boolean).length;
  };
} catch (error) {
  advancedWordCount = null;
}

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

function fallbackParseFrontMatter(raw) {
  const normalized = raw.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  if (lines[0]?.trim() !== "---") {
    return { data: {}, content: raw };
  }

  let i = 1;
  const frontMatterLines = [];
  for (; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      break;
    }
    frontMatterLines.push(lines[i]);
  }

  if (i === lines.length) {
    return { data: {}, content: raw };
  }

  const content = lines.slice(i + 1).join("\n");
  return { data: parseSimpleYaml(frontMatterLines), content };
}

function parseSimpleYaml(lines) {
  const data = {};
  let currentArray = null;
  let currentObject = null;
  let currentIndent = 0;

  const commitObject = () => {
    if (currentArray && currentObject) {
      currentArray.push(currentObject);
      currentObject = null;
      currentIndent = 0;
    }
  };

  lines.forEach(line => {
    const rawLine = line || "";
    const indentMatch = rawLine.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0].length : 0;
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    if (currentObject && indent > currentIndent) {
      const subMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (subMatch) {
        const key = subMatch[1].trim();
        const value = subMatch[2];
        currentObject[key] = parseScalar(value.trim());
        return;
      }
    }

    if (!rawLine.startsWith(" ") && trimmed.includes(":")) {
      commitObject();
      const [keyPart, ...rest] = trimmed.split(":");
      const key = keyPart.trim();
      const valuePart = rest.join(":").trim();

      if (!valuePart) {
        currentArray = [];
        data[key] = currentArray;
        currentObject = null;
        currentIndent = 0;
      } else {
        data[key] = parseScalar(valuePart);
        currentArray = null;
        currentObject = null;
        currentIndent = 0;
      }
      return;
    }

    if (currentArray && trimmed.startsWith("-")) {
      const value = trimmed.slice(1).trim();
      if (!value) {
        commitObject();
        currentObject = {};
        currentIndent = indent + 2;
        return;
      }

      if (value.includes(":") && !value.startsWith("\"") && !value.startsWith("'")) {
        const [subKeyPart, ...rest] = value.split(":");
        const subKey = subKeyPart.trim();
        const subValue = rest.join(":").trim();
        commitObject();
        currentObject = { [subKey]: parseScalar(subValue) };
        currentIndent = indent + 2;
        return;
      }

      commitObject();
      currentArray.push(parseScalar(value));
      currentObject = null;
      currentIndent = 0;
      return;
    }

    if (currentArray && currentObject && indent >= currentIndent) {
      const pair = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (pair) {
        const key = pair[1].trim();
        const value = pair[2];
        currentObject[key] = parseScalar(value.trim());
        currentIndent = indent;
        return;
      }
    }
  });

  commitObject();
  return data;
}

function parseScalar(rawValue) {
  const value = rawValue == null ? "" : String(rawValue).trim();
  if (value === "[]") return [];
  if (value === "{}") return {};
  if (!value) return "";
  if (value === "null" || value === "~") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }

  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    const unquoted = value.slice(1, -1);
    return unquoted.replace(/\\"/g, '"').replace(/\\n/g, "\n");
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      const normalized = value.replace(/'(.*?)'/g, (_, inner) => `"${inner.replace(/"/g, '\\"')}"`);
      return JSON.parse(normalized);
    } catch (error) {
      return value;
    }
  }

  if (value.includes(":")) {
    const [key, ...rest] = value.split(":");
    const obj = {};
    obj[key.trim()] = parseScalar(rest.join(":").trim());
    return obj;
  }

  return value;
}

function basicMarkdownSanitize(md) {
  let text = md;
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]*`/g, " ");
  text = text.replace(/^\[\^[^\]]+\]:[\s\S]*?(?=^\S|\Z)/gm, " ");
  text = text.replace(/\[\^[^\]]+\]/g, " ");
  text = text.replace(/(^|\n)#{1,6}\s*(citations|footnotes|references|bibliography|sources)\s*$[\s\S]*?(?=^#{1,6}\s|\Z)/gim, " ");
  text = text.replace(/!\[[^\]]*\]\([^\)]+\)/g, " ");
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/[*_`>#+=~-]/g, " ");
  return text;
}

function fallbackWordCount(md) {
  const clean = basicMarkdownSanitize(md);
  return clean.trim().split(/\s+/).filter(Boolean).length;
}

function wordCount(md) {
  if (typeof advancedWordCount === "function") {
    try {
      return advancedWordCount(md);
    } catch (error) {
      // Fall back to the lightweight counter if the advanced pipeline fails.
    }
  }

  return fallbackWordCount(md);
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

function stringifyFrontMatter(doc, wordCountValue) {
  if (!matter) {
    throw new Error("gray-matter is required to write word_count; please install dependencies.");
  }

  const data = { ...doc.data, word_count: wordCountValue };
  const content = doc.content || "";
  return matter.stringify(content, data, { engines: { yaml: yamlEngine } });
}

function checkFiles(files, options = {}) {
  const { fsModule = fs, write = false } = options;
  const errors = [];
  const updates = [];

  for (const fp of files) {
    const raw = fsModule.readFileSync(fp, "utf8");
    const doc = parseFrontMatter(raw);
    const result = validateWordRange(doc.content, doc.data.word_range);

    if (!result.ok) {
      errors.push(formatError(fp, result));
    }

    const hasWordCount = typeof doc.data.word_count === "number";
    const wordCountMatches = hasWordCount && doc.data.word_count === result.wordCount;

    if (!wordCountMatches) {
      if (write) {
        const rewritten = stringifyFrontMatter(doc, result.wordCount);
        fsModule.writeFileSync(fp, rewritten, "utf8");
        updates.push(fp);
      } else {
        errors.push(`${fp}: missing or stale word_count (expected ${result.wordCount})`);
      }
    }
  }

  return { errors, updates };
}

function parseFrontMatter(raw) {
  if (matter) {
    try {
      return matter(raw, { engines: { yaml: yamlEngine } });
    } catch (error) {
      // Swallow and attempt the fallback parser below.
    }
  }

  return fallbackParseFrontMatter(raw);
}

function run(fsModule = fs, { write = false } = {}) {
  const files = listMarkdownFiles(fsModule);
  const { errors, updates } = checkFiles(files, { fsModule, write });

  if (updates.length) {
    console.log(`Updated word_count for ${updates.length} file(s).`);
  }

  if (errors.length) {
    console.error("Word range check failed:\n" + errors.join("\n"));
    return 1;
  }

  console.log("Word ranges OK");
  return 0;
}

if (require.main === module) {
  const write = process.argv.includes("--write");
  process.exit(run(fs, { write }));
}

module.exports = {
  wordCount,
  bounds,
  validateWordRange,
  formatError,
  scan,
  listMarkdownFiles,
  checkFiles,
  run,
  parseFrontMatter
};
