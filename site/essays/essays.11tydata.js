const fs = require("fs");
const matter = require("gray-matter");

const meta = require("../_data/meta");
const { wordCount, wordRangeFromCount } = require("../../scripts/checkWordRange");
const { enforceTopicAndKeywords, keywordPreview } = require("../../scripts/topicKeywordConstraints");
const { isEssayHidden } = require("../../scripts/lib/essayVisibility");

const constraintCache = new Map();
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function resolveDeadlineAt(data = {}) {
  const explicit = parseDateValue(data.deadline_at) || parseDateValue(data.published_at);
  if (explicit) return explicit;

  const started = parseDateValue(data.started_at);
  if (!started) return null;

  return new Date(started.getTime() + 30 * MS_PER_DAY);
}

function applyTopicKeywordConstraints(data = {}) {
  const cacheKey = data?.page?.inputPath || data?.page?.fileSlug || data.slug || "unknown";
  if (constraintCache.has(cacheKey)) {
    return constraintCache.get(cacheKey);
  }

  const constrained = enforceTopicAndKeywords(data, {
    slug: data?.page?.fileSlug || data.slug,
    inputPath: data?.page?.inputPath,
  });

  constraintCache.set(cacheKey, constrained);
  return constrained;
}

function resolvePermalink(data = {}) {
  const inputPath = data?.page?.inputPath || "";
  const isEssay = inputPath.includes("/essays/published/") || inputPath.includes("/essays/drafts/");
  if (!isEssay) return data.permalink;
  if (!inputPath.endsWith(".md")) return data.permalink;
  if (data.pagination) return data.permalink;
  if (data.permalink === false) return false;

  const normalizedStatus = typeof data.status === "string" ? data.status.toLowerCase() : "";
  if (inputPath.includes("/essays/drafts/") && ["draft", "proposed"].includes(normalizedStatus)) {
    return false;
  }

  if (typeof data.permalink === "string" && data.permalink.trim()) {
    return data.permalink;
  }

  const slug = data?.page?.fileSlug || data.slug;
  if (!slug) return data.permalink;
  const segment = inputPath.includes("/essays/published/") ? "published" : "drafts";
  return `/essays/${segment}/${slug}/`;
}

module.exports = {
  eleventyComputed: {
    permalink: (data) => resolvePermalink(data),
    topic: (data) => applyTopicKeywordConstraints(data).topic,
    keywords: (data) => applyTopicKeywordConstraints(data).keywords,
    canonical: (data) => meta.buildCanonicalUrl({
      ...data,
      canonical: data.canonical,
      canonical_url: data.canonical_url,
      site: data.site,
    }),
    description: (data) => meta.buildMetaDescription(applyTopicKeywordConstraints(data)),
    ogTitle: (data) => {
      const constrained = applyTopicKeywordConstraints(data);
      return data.title || data.page?.title || constrained.title || constrained.topic || constrained.site?.title;
    },
    ogType: () => "article",
    word_count: (data) => {
      if (typeof data.word_count === "number") return data.word_count;

      const inputPath = data?.page?.inputPath;
      if (!inputPath || !inputPath.endsWith(".md")) return null;

      try {
        const raw = fs.readFileSync(inputPath, "utf8");
        const parsed = matter(raw);
        return wordCount(parsed.content || "");
      } catch (error) {
        return null;
      }
    },
    word_range: (data) => {
      const inputPath = data?.page?.inputPath || "";
      const isPublishedEssay = inputPath.includes("/essays/published/");
      if (!isPublishedEssay) return null;
      const computedWordCount = typeof data.word_count === "number" ? data.word_count : null;
      return wordRangeFromCount(computedWordCount);
    },
    display_keywords: (data) => {
      const constrained = applyTopicKeywordConstraints(data);
      if (!Array.isArray(constrained.keywords)) return [];
      return constrained.keywords;
    },
    browser_keywords: (data) => {
      const constrained = applyTopicKeywordConstraints(data);
      if (!Array.isArray(constrained.keywords)) return [];
      return keywordPreview(constrained.keywords, 3);
    },
    deadline_at: (data) => {
      if (data.deadline_at) return data.deadline_at;
      const resolved = resolveDeadlineAt(data);
      return resolved ? resolved.toISOString().slice(0, 10) : data.deadline_at;
    },
    excludeFromSitemap: (data) => isEssayHidden(data),
    socialImage: (data) => {
      if (!data.social_image) return null;
      return meta.absoluteUrl(data.social_image, data.site);
    },
    jsonLd: (data) => {
      const isPublishedEssay = data?.page?.inputPath?.includes("/essays/published/");
      if (!isPublishedEssay || isEssayHidden(data)) return null;

      const constrained = applyTopicKeywordConstraints(data);
      const resolvedTitle = data.title || data.page?.title || constrained.title || constrained.topic;
      const resolvedDescription = data.description || meta.buildMetaDescription({
        ...constrained,
        title: resolvedTitle,
        page: data.page,
      });

      return meta.buildArticleJsonLd({
        ...constrained,
        title: resolvedTitle,
        description: resolvedDescription,
        author: data.author || constrained.author,
        coauthors: data.coauthors || constrained.coauthors,
        version: data.version || constrained.version,
        word_count: typeof data.word_count === "number" ? data.word_count : constrained.word_count,
        published_at: data.published_at || constrained.published_at,
        started_at: data.started_at || constrained.started_at,
        last_modified_at: data.last_modified_at || constrained.last_modified_at,
        page: data.page,
        site: data.site,
        canonical: data.canonical,
        canonical_url: data.canonical_url,
        socialImage: data.socialImage || constrained.socialImage,
        display_keywords: Array.isArray(constrained.keywords)
          ? constrained.keywords
          : constrained.display_keywords,
      });
    },
  },
};
