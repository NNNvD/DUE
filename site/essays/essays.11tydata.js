const fs = require("fs");
const matter = require("gray-matter");

const meta = require("../_data/meta");
const { wordCount } = require("../../scripts/checkWordRange");

module.exports = {
  eleventyComputed: {
    canonical: (data) => meta.buildCanonicalUrl(data),
    description: (data) => meta.extractDescription(data),
    ogTitle: (data) => data.title || data.topic || data.site?.title,
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
      if (!Array.isArray(data.keywords)) return [];
      return data.keywords.slice(0, 5);
    },
    socialImage: (data) => {
      if (!data.social_image) return null;
      return meta.absoluteUrl(data.social_image, data.site);
    },
  },
};
