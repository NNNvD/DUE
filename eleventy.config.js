function formatDateValue(value, format = "yyyy-LL-dd") {
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
}

function computeEssayMeta(data = {}) {
  const meta = {
    badges: [],
    author: null,
    coauthors: [],
    acknowledgments: [],
  };

  if (!data || typeof data !== "object") {
    return meta;
  }

  const version = data.version ? String(data.version) : null;
  if (version) {
    meta.badges.push({
      key: "version",
      label: `v${version}`,
      tone: "info",
      tooltip: `Version ${version}`,
    });
  }

  const status = data.initial_status;
  if (status === "complete") {
    meta.badges.push({
      key: "status",
      label: "Published complete",
      tone: "success",
    });
  } else if (status === "unfinished") {
    meta.badges.push({
      key: "status",
      label: "Published unfinished",
      tone: "warn",
    });
  } else if (data.status) {
    const isPublished = data.status === "published";
    meta.badges.push({
      key: "status",
      label: isPublished ? "Published" : "Draft",
      tone: isPublished ? "success" : "warn",
    });
  } else {
    meta.badges.push({
      key: "status",
      label: "Status unknown",
      tone: "muted",
    });
  }

  if (data.word_range) {
    meta.badges.push({
      key: "word-range",
      label: `${data.word_range} words`,
      tone: "muted",
    });
  }

  if (data.published_at) {
    const formatted = formatDateValue(data.published_at);
    meta.badges.push({
      key: "published",
      label: `Published ${formatted}`,
      tone: "muted",
      tooltip: `First published on ${formatted}`,
    });
  }

  if (data.author) {
    meta.author = {
      handle: data.author,
      tone: "info",
      tooltip: "Author",
    };
  }

  const coauthors = Array.isArray(data.coauthors) ? data.coauthors : [];
  meta.coauthors = coauthors
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        return {
          handle: entry,
          tone: "info",
          tooltip: "Coauthor",
        };
      }

      if (typeof entry === "object") {
        const handle = entry.handle || entry.user || entry.name;
        if (!handle) return null;
        const tooltipParts = [];
        if (entry.note) tooltipParts.push(entry.note);
        if (entry.since_version) tooltipParts.push(`Since v${entry.since_version}`);
        return {
          handle,
          tone: "info",
          tooltip: tooltipParts.join(" • ") || "Coauthor",
          note: entry.note || null,
          since_version: entry.since_version || null,
        };
      }

      return null;
    })
    .filter(Boolean);

  const acknowledgments = Array.isArray(data.acknowledgments) ? data.acknowledgments : [];
  meta.acknowledgments = acknowledgments
    .map((ack) => {
      if (!ack) return null;
      const handle = ack.user || ack.handle || ack.name;
      if (!handle) return null;
      const tooltipParts = [];
      if (ack.note) tooltipParts.push(ack.note);
      if (ack.since_version) tooltipParts.push(`Since v${ack.since_version}`);
      return {
        handle,
        tone: "muted",
        tooltip: tooltipParts.join(" • ") || null,
        note: ack.note || null,
        since_version: ack.since_version || null,
      };
    })
    .filter(Boolean);

  return meta;
}

module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter("date", (value, format = "yyyy-LL-dd") => {
    return formatDateValue(value, format);
  });

  eleventyConfig.addFilter("essayMeta", computeEssayMeta);
  eleventyConfig.addCollection("publishedEssays", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("site/essays/**/*.md")
      .filter((item) => item.data.status === "published")
      .sort((a, b) => {
        const aDate = a.data.published_at ? new Date(a.data.published_at) : new Date(0);
        const bDate = b.data.published_at ? new Date(b.data.published_at) : new Date(0);
        return bDate - aDate;
      });
  });

  eleventyConfig.addCollection("draftEssays", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("site/essays/**/*.md")
      .filter((item) => item.data.status === "draft")
      .sort((a, b) => {
        const aDeadline = a.data.deadline_at ? new Date(a.data.deadline_at) : new Date(8640000000000000);
        const bDeadline = b.data.deadline_at ? new Date(b.data.deadline_at) : new Date(8640000000000000);
        return aDeadline - bDeadline;
      });
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
