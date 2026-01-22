const fs = require("fs");
const path = require("path");
const { registerErrorHandlers } = require("./lib/registerErrorHandlers");
const loadEssayIndex = require("../site/_data/essayIndex");

const siteRoot = path.join(__dirname, "..", "_site");
const feedsRoot = path.join(siteRoot, "feeds");
const rssPath = path.join(siteRoot, "feed.xml");
const jsonPath = path.join(siteRoot, "feed.json");
const atomXmlPath = path.join(feedsRoot, "feed.xml");
const atomJsonPath = path.join(feedsRoot, "feed.json");

registerErrorHandlers("validateFeeds");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function ensureFileExists(filePath) {
  assert(fs.existsSync(filePath), `Expected ${filePath} to exist. Did you run \"npm run build\"?`);
}

function formatJsonParseError(jsonContent, error) {
  const match = error && typeof error.message === "string" && error.message.match(/position\s+(\d+)/i);
  const position = match ? parseInt(match[1], 10) : null;

  if (!Number.isFinite(position)) {
    return error.message;
  }

  const start = Math.max(0, position - 40);
  const end = Math.min(jsonContent.length, position + 40);
  const excerpt = jsonContent.slice(start, end).replace(/\s+/g, " ");

  return `${error.message} (around: ${excerpt})`;
}

function isWellFormedXml(xml) {
  const stack = [];
  const tagPattern = /<\/?([A-Za-z_:][A-Za-z0-9._:-]*)([^>]*)>/g;
  let match;

  while ((match = tagPattern.exec(xml)) !== null) {
    const [fullMatch, tagName, attributes] = match;

    if (fullMatch.startsWith("<?") || fullMatch.startsWith("<!")) {
      continue;
    }

    const isClosing = fullMatch.startsWith("</");
    const isSelfClosing = /\/>\s*$/.test(fullMatch) || /\/$/.test(attributes.trim());

    if (isClosing) {
      const last = stack.pop();
      if (last !== tagName) {
        return false;
      }
    } else if (!isSelfClosing) {
      stack.push(tagName);
    }
  }

  return stack.length === 0;
}

function validateXmlFeed(filePath, rootTag, entryTag) {
  const xmlContent = fs.readFileSync(filePath, "utf8");
  assert(isWellFormedXml(xmlContent), "Feed XML is not well-formed.");
  assert(new RegExp(`<${rootTag}[\\s>]`).test(xmlContent), `Feed XML must include a <${rootTag}> root element.`);
  assert(new RegExp(`<${entryTag}[\\s>]`).test(xmlContent), `Feed XML must contain at least one ${entryTag} element.`);
}

function validateJsonFeed(filePath) {
  const jsonContent = fs.readFileSync(filePath, "utf8");
  let feed;

  try {
    feed = JSON.parse(jsonContent);
  } catch (error) {
    const message = formatJsonParseError(jsonContent, error);
    throw new Error(`Unable to parse ${filePath}: ${message}`);
  }
  assert(Array.isArray(feed.items), "Feed JSON must include an items array.");
  feed.items.forEach((item, index) => {
    assert(item.title, `Feed item #${index + 1} is missing a title.`);
    assert(item.url, `Feed item #${index + 1} is missing a canonical URL.`);
    assert(Object.prototype.hasOwnProperty.call(item, "version"), `Feed item #${index + 1} is missing a version field.`);
    assert(Object.prototype.hasOwnProperty.call(item, "content_text"), `Feed item #${index + 1} is missing release note content.`);
  });
}

function validateSourceMetadata() {
  const essays = loadEssayIndex();
  const published = essays.filter((entry) => entry && entry.status === "published");
  const missingTitle = published.filter((entry) => !entry.title);

  assert(
    missingTitle.length === 0,
    `Published essays are missing titles: ${missingTitle.map((entry) => entry.slug || "unknown-slug").join(", ")}`
  );
}

validateSourceMetadata();
ensureFileExists(rssPath);
ensureFileExists(jsonPath);
validateXmlFeed(rssPath, "rss", "item");
validateJsonFeed(jsonPath);

if (fs.existsSync(atomXmlPath)) {
  validateXmlFeed(atomXmlPath, "feed", "entry");
}
if (fs.existsSync(atomJsonPath)) {
  validateJsonFeed(atomJsonPath);
}

console.log("Feeds validated successfully.");
