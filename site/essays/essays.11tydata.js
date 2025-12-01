const fs = require("fs");
const matter = require("gray-matter");

const meta = require("../_data/meta");
const { wordCount } = require("../../scripts/checkWordRange");
const { enforceTopicAndKeywords } = require("../../scripts/topicKeywordConstraints");

const constraintCache = new Map();

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

module.exports = {
  eleventyComputed: {
    topic: (data) => applyTopicKeywordConstraints(data).topic,
    keywords: (data) => applyTopicKeywordConstraints(data).keywords,
    canonical: (data) => meta.buildCanonicalUrl(data),
    description: (data) => meta.buildMetaDescription(applyTopicKeywordConstraints(data)),
    ogTitle: (data) => {
      const constrained = applyTopicKeywordConstraints(data);
      return constrained.title || constrained.topic || constrained.site?.title;
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
    display_keywords: (data) => {
      const constrained = applyTopicKeywordConstraints(data);
      if (!Array.isArray(constrained.keywords)) return [];
      return constrained.keywords.slice(0, 5);
    },
    socialImage: (data) => {
      if (!data.social_image) return null;
      return meta.absoluteUrl(data.social_image, data.site);
    },
    jsonLd: (data) => {
      const isPublishedEssay = data?.page?.inputPath?.includes("/essays/published/");
      if (!isPublishedEssay) return null;

      const constrained = applyTopicKeywordConstraints(data);
      return meta.buildArticleJsonLd({
        ...constrained,
        description: meta.buildMetaDescription(constrained),
        socialImage: constrained.socialImage,
        display_keywords: Array.isArray(constrained.keywords)
          ? constrained.keywords.slice(0, 5)
          : constrained.display_keywords,
      });
    },
  },
};
