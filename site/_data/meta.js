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

function buildMetaDescription(data = {}) {
  if (data.description) {
    return truncate(data.description, 160);
  }

  const raw = extractDescription(data);
  const summary = raw || "";
  const title = data.title || data.topic || "";

  if (title && summary && !summary.toLowerCase().startsWith(title.toLowerCase())) {
    return truncate(`${title}: ${summary}`, 160);
  }

  if (summary) {
    return truncate(summary, 160);
  }

  return truncate(title, 160);
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

function normalizeAuthors(data = {}) {
  const authors = [];

  if (data.author) {
    authors.push({
      "@type": "Person",
      name: data.author,
    });
  }

  if (Array.isArray(data.coauthors)) {
    data.coauthors.forEach((coauthor) => {
      if (!coauthor) return;

      if (typeof coauthor === "string") {
        authors.push({
          "@type": "Person",
          name: coauthor,
        });
        return;
      }

      const handle = coauthor.user || coauthor.handle || coauthor.github;
      if (handle) {
        authors.push({
          "@type": "Person",
          name: handle,
        });
      }
    });
  }

  return authors.length ? authors : undefined;
}

function buildArticleJsonLd(data = {}) {
  const canonicalUrl = buildCanonicalUrl(data);
  const description = extractDescription(data);
  const authors = normalizeAuthors(data);
  const keywords = Array.isArray(data.display_keywords)
    ? data.display_keywords
    : Array.isArray(data.keywords)
      ? data.keywords.slice(0, 5)
      : undefined;

  const wordCount = typeof data.word_count === "number" ? data.word_count : undefined;
  const datePublished = data.published_at || data.started_at;
  const dateModified =
    data.last_modified_at || data.published_at || (data.page?.date ? data.page.date.toISOString() : undefined);

  const payload = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    inLanguage: "en",
    version: data.version,
    datePublished,
    dateModified,
    author: authors,
    keywords,
    wordCount,
    publisher: {
      "@type": "Organization",
      name: site.title,
      url: site.siteUrl,
    },
  };

  if (data.socialImage) {
    payload.image = data.socialImage;
  }

  return payload;
}

module.exports = {
  absoluteUrl,
  buildCanonicalUrl,
  extractDescription,
  buildMetaDescription,
  ensureTrailingSlash,
  buildArticleJsonLd,
};
