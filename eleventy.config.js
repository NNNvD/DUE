module.exports = function(eleventyConfig) {
  const isTemplateEntry = (item) => {
    if (!item || typeof item.inputPath !== "string") {
      return false;
    }
    return item.inputPath.includes("/_template.");
  };

  eleventyConfig.addFilter("date", (value, format = "yyyy-LL-dd") => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    if (format === "yyyy-LL-dd") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return date.toISOString();
  });
  eleventyConfig.addCollection("publishedEssays", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("site/essays/**/*.md")
      .filter((item) => item.data.status === "published" && !isTemplateEntry(item))
      .sort((a, b) => {
        const aDate = a.data.published_at ? new Date(a.data.published_at) : new Date(0);
        const bDate = b.data.published_at ? new Date(b.data.published_at) : new Date(0);
        return bDate - aDate;
      });
  });

  eleventyConfig.addCollection("draftEssays", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("site/essays/**/*.md")
      .filter((item) => item.data.status === "draft" && !isTemplateEntry(item))
      .sort((a, b) => {
        const aDeadline = a.data.deadline_at ? new Date(a.data.deadline_at) : new Date(8640000000000000);
        const bDeadline = b.data.deadline_at ? new Date(b.data.deadline_at) : new Date(8640000000000000);
        return aDeadline - bDeadline;
      });
  });

  return {
    dir: {
      input: "site",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
