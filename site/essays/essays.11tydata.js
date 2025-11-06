const meta = require("../_data/meta");

module.exports = {
  eleventyComputed: {
    canonical: (data) => meta.buildCanonicalUrl(data),
    description: (data) => meta.extractDescription(data),
    ogTitle: (data) => data.title || data.topic || data.site?.title,
    ogType: () => "article",
    socialImage: (data) => {
      if (!data.social_image) return null;
      return meta.absoluteUrl(data.social_image, data.site);
    },
  },
};
