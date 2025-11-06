module.exports = {
  eleventyComputed: {
    title: (data) => {
      const title = data.essay && data.essay.data && data.essay.data.title;
      return title ? `${title} — Version history` : "Essay history";
    },
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
