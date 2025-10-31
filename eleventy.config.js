module.exports = function(eleventyConfig) {
  const isEssayTemplate = (item) => {
    if (!item || !item.inputPath) return false;
    const normalizedPath = item.inputPath.replace(/\\/g, "/");
    return normalizedPath.includes("/site/essays/_templates/");
  };

  const filterEssayTemplates = (items) => items.filter((item) => !isEssayTemplate(item));

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
    return filterEssayTemplates(
      collectionApi
        .getFilteredByGlob("site/essays/**/*.md")
      .filter((item) => item.data.status === "published")
      .sort((a, b) => {
        const aDate = a.data.published_at ? new Date(a.data.published_at) : new Date(0);
        const bDate = b.data.published_at ? new Date(b.data.published_at) : new Date(0);
        return bDate - aDate;
      })
    );
  });

  eleventyConfig.addCollection("draftEssays", (collectionApi) => {
    return filterEssayTemplates(
      collectionApi
        .getFilteredByGlob("site/essays/**/*.md")
      .filter((item) => item.data.status === "draft")
      .sort((a, b) => {
        const aDeadline = a.data.deadline_at ? new Date(a.data.deadline_at) : new Date(8640000000000000);
        const bDeadline = b.data.deadline_at ? new Date(b.data.deadline_at) : new Date(8640000000000000);
        return aDeadline - bDeadline;
      })
    );
  });

  eleventyConfig.addCollection("snapshots", (collectionApi) => {
    return collectionApi.getFilteredByGlob("site/essays/snapshots/**/*.md");
  });

  // Allow custom domain via site/CNAME passthrough (optional)
  try {
    eleventyConfig.addPassthroughCopy("CNAME");
  } catch (e) {
    // no-op if file not present
  }

  // Compute base path for GitHub Pages (auto-detect)
  const repo = process.env.GITHUB_REPOSITORY || ""; // e.g., owner/repo
  const repoName = (repo.split("/")[1] || "").trim();
  const isUserSite = /\.github\.io$/i.test(repoName);
  const computedBase = repoName ? (isUserSite ? "/" : `/${repoName}/`) : "/";
  const baseUrl = process.env.BASE_URL || computedBase;

  return {
    dir: {
      input: "site",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    // Ensure 11ty-generated URLs respect the Pages base path
    pathPrefix: baseUrl
  };
};
