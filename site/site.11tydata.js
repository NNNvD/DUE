module.exports = {
  eleventyComputed: {
    canonical_url: (data) => {
      if (data.canonical_url) {
        return data.canonical_url;
      }

      const canonicalBase = data.site && data.site.canonicalBase;
      const pageUrl = data.page && data.page.url;

      if (!canonicalBase || !pageUrl) {
        return undefined;
      }

      const trimmedBase = canonicalBase.endsWith("/") ? canonicalBase.slice(0, -1) : canonicalBase;
      const normalizedPath = pageUrl.startsWith("/") ? pageUrl : `/${pageUrl}`;

      return `${trimmedBase}${normalizedPath}`;
    },
  },
};
