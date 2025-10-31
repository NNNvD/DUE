const DEFAULT_PATH_PREFIX = "/DUE/";

function ensureTrailingSlash(value) {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function resolvePathPrefix() {
  const explicit = process.env.BASE_URL;
  if (explicit) {
    return ensureTrailingSlash(explicit);
  }

  const isProduction = process.env.ELEVENTY_ENV === "production";
  return ensureTrailingSlash(isProduction ? DEFAULT_PATH_PREFIX : "/");
}

module.exports = function(eleventyConfig) {
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
  const isTemplateEntry = (item) => {
    return item && typeof item.inputPath === "string" && item.inputPath.includes("_template");
  };

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

  eleventyConfig.addCollection("snapshots", (collectionApi) => {
    return collectionApi.getFilteredByGlob("site/essays/snapshots/**/*.md");
  });

  eleventyConfig.addFilter("absoluteUrl", (path, base) => {
    try {
      return new URL(path, base).toString();
    } catch (error) {
      return path;
    }
  });

  eleventyConfig.addFilter("rssDate", (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toUTCString();
  });

  // Allow custom domain via site/CNAME passthrough (optional)
  try {
    eleventyConfig.addPassthroughCopy("CNAME");
  } catch (e) {
    // no-op if file not present
  }

  const pathPrefix = resolvePathPrefix();

  return {
    dir: {
      input: "site",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    // Ensure 11ty-generated URLs respect the Pages base path
    pathPrefix
  };
};
