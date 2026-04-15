module.exports = {
  eleventyComputed: {
    title: (data) => {
      const title = data.essay && data.essay.data && data.essay.data.title;
      return title ? `${title} — Version history` : "Essay history";
    },
    description: (data) => {
      const title = data.essay && data.essay.data && data.essay.data.title;
      return title
        ? `Browse every published snapshot and release note for ${title}.`
        : "Browse the published snapshots and release notes for this essay.";
    },
    jsonLd: () => null,
    permalink: (data) => {
      const essay = data.essay;
      if (!essay) return false;
      const slug = essay.fileSlug || (essay.data && essay.data.page && essay.data.page.fileSlug);
      if (!slug || slug.startsWith("_")) {
        return false;
      }
      return `essays/published/${slug}/history/index.html`;
    },
  },
};
