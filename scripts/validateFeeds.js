const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "_site", "feeds");
const xmlPath = path.join(root, "feed.xml");
const jsonPath = path.join(root, "feed.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function ensureFileExists(filePath) {
  assert(fs.existsSync(filePath), `Expected ${filePath} to exist. Did you run \"npm run build\"?`);
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

function validateXmlFeed(filePath) {
  const xmlContent = fs.readFileSync(filePath, "utf8");
  assert(isWellFormedXml(xmlContent), "Feed XML is not well-formed.");
  assert(/<feed[\s>]/.test(xmlContent), "Feed XML must include a <feed> root element.");
  assert(/<entry[\s>]/.test(xmlContent), "Feed XML must contain at least one entry element.");
}

function validateJsonFeed(filePath) {
  const jsonContent = fs.readFileSync(filePath, "utf8");
  const feed = JSON.parse(jsonContent);
  assert(Array.isArray(feed.items), "Feed JSON must include an items array.");
  feed.items.forEach((item, index) => {
    assert(item.title, `Feed item #${index + 1} is missing a title.`);
    assert(item.url, `Feed item #${index + 1} is missing a canonical URL.`);
    assert(Object.prototype.hasOwnProperty.call(item, "version"), `Feed item #${index + 1} is missing a version field.`);
    assert(Object.prototype.hasOwnProperty.call(item, "content_text"), `Feed item #${index + 1} is missing release note content.`);
  });
}

ensureFileExists(xmlPath);
ensureFileExists(jsonPath);
validateXmlFeed(xmlPath);
validateJsonFeed(jsonPath);

console.log("Feeds validated successfully.");
