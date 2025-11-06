const fs = require("fs");
const path = require("path");
const site = require("./site");

function ensureTrailingSlash(value) {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function absoluteUrl(url, siteData = site) {
  const base = siteData.siteUrl || siteData.baseUrl || "/";
  if (!url) {
    return base;
  }

  try {
    const candidate = new URL(url, base);
    return candidate.href;
  } catch (error) {
    return url;
  }
}

function stripFrontMatter(content) {
  if (!content.startsWith("---")) {
    return content;
  }

  const end = content.indexOf("\n---", 3);
  if (end === -1) {
    return content;
  }
  return content.slice(end + 4);
}

function stripMarkdown(value) {
  if (!value) return "";
  return value
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/!\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/>\s?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, length = 280) {
  if (!text) return "";
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1).trim()}…`;
}

function extractDescription(data) {
  if (data && data.description) {
    return data.description;
  }

  const inputPath = data?.page?.inputPath;
  if (!inputPath) {
    return data?.topic || data?.title || "";
  }

  try {
    const raw = fs.readFileSync(path.resolve(inputPath), "utf8");
    const withoutFrontMatter = stripFrontMatter(raw);
    const paragraphs = withoutFrontMatter
      .split(/\r?\n\s*\r?\n/g)
      .map((segment) => stripMarkdown(segment.trim()))
      .filter(Boolean);

    if (paragraphs.length > 0) {
      return truncate(paragraphs[0]);
    }
  } catch (error) {
    return data?.topic || data?.title || "";
  }

  return data?.topic || data?.title || "";
}

function buildCanonicalUrl(data) {
  if (data?.canonical) {
    return data.canonical;
  }

  const pageUrl = data?.page?.url;
  if (!pageUrl) {
    return site.siteUrl;
  }

  return absoluteUrl(pageUrl);
}

module.exports = {
  absoluteUrl,
  buildCanonicalUrl,
  extractDescription,
  ensureTrailingSlash,
};
