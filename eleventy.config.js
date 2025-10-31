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
  const parseVersion = (value) => {
    const parts = String(value || "0.0").split(".");
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1] || "0", 10);
    return {
      major: Number.isFinite(major) ? major : 0,
      minor: Number.isFinite(minor) ? minor : 0
    };
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
  const isTemplateEntry = (item) => {
    return item && typeof item.inputPath === "string" && item.inputPath.includes("_template");
  };

  eleventyConfig.addCollection("publishedEssays", (collectionApi) => {
    const entries = collectionApi
      .getFilteredByTag("essay")
      .filter((item) => item.data.status === "published")
      .sort((a, b) => {
        const aDate = a.data.published_at ? new Date(a.data.published_at) : new Date(0);
        const bDate = b.data.published_at ? new Date(b.data.published_at) : new Date(0);
        return bDate - aDate;
      });
    return entries;
  });

  eleventyConfig.addCollection("draftEssays", (collectionApi) => {
    return collectionApi
      .getFilteredByTag("essay")
      .filter((item) => item.data.status === "draft")
      .sort((a, b) => {
        const aDeadline = a.data.deadline_at ? new Date(a.data.deadline_at) : new Date(8640000000000000);
        const bDeadline = b.data.deadline_at ? new Date(b.data.deadline_at) : new Date(8640000000000000);
        return aDeadline - bDeadline;
      });
  });

  eleventyConfig.addCollection("snapshots", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("site/essays/snapshots/**/*.md")
      .sort((a, b) => {
        const slugA = a.data.origin_slug || "";
        const slugB = b.data.origin_slug || "";
        const slugCompare = slugA.localeCompare(slugB);
        if (slugCompare !== 0) return slugCompare;

        const aVersion = parseVersion(a.data.version);
        const bVersion = parseVersion(b.data.version);

        if (bVersion.major !== aVersion.major) {
          return bVersion.major - aVersion.major;
        }

        return bVersion.minor - aVersion.minor;
      });
  });

  eleventyConfig.addFilter("snapshotsFor", (snapshots, slug) => {
    if (!Array.isArray(snapshots)) return [];
    return snapshots.filter((snap) => snap.data.origin_slug === slug);
  });

  eleventyConfig.addFilter("snapshotsForSlug", (snapshots = [], slug) => {
    if (!slug || slug.startsWith("_")) return [];
    return snapshots
      .filter((item) => item.data && item.data.origin_slug === slug)
      .sort((a, b) => {
        const getDate = (entry) => {
          if (entry.data && entry.data.published_at) {
            const parsed = new Date(entry.data.published_at);
            if (!Number.isNaN(parsed.getTime())) {
              return parsed.getTime();
            }
          }
          const fallback = entry.date instanceof Date ? entry.date : new Date(0);
          return fallback.getTime();
        };

        return getDate(b) - getDate(a);
      });
  });

  // Allow custom domain via site/CNAME passthrough (optional)
  try {
    eleventyConfig.addPassthroughCopy("CNAME");
  } catch (e) {
    // no-op if file not present
  }

  return {
    dir: {
      input: "site",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    // Ensure 11ty-generated URLs respect the Pages base path
    pathPrefix: "/DUE/"
  };
};
