const meta = require("./site/_data/meta");
const fg = require("fast-glob");
const matter = require("gray-matter");
const fs = require("fs");
const path = require("path");
const { runAutopublish, readAutopublishManifest } = require("./scripts/autopublish");

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

function normalizeWordRange(value) {
  if (!value) return null;
  const matches = String(value).match(/\d+/g);
  if (!matches || !matches.length) return null;

  const numbers = matches
    .map((entry) => parseInt(entry, 10))
    .filter((entry) => Number.isFinite(entry));

  if (!numbers.length) return null;

  const sum = numbers.reduce((total, current) => total + current, 0);
  return sum / numbers.length;
}

function wordRangeTone(value) {
  const average = normalizeWordRange(value);

  if (average === null) return "badge--tone-muted";
  if (average < 500) return "badge--magenta";
  if (average < 1000) return "badge--orange";
  if (average < 1500) return "badge--teal";

  return "badge--tone-muted";
}

function wordRangeMeta(value) {
  const average = normalizeWordRange(value);

  if (average === null) {
    return {
      tone: "badge--tone-muted",
      titleClass: "title--muted",
      icon: "circle",
      palette: "muted",
      label: "Length unknown",
    };
  }

  if (average < 500) {
    return {
      tone: "badge--magenta",
      titleClass: "title--magenta",
      icon: "square",
      palette: "magenta",
      label: "Tiny",
    };
  }

  if (average < 1000) {
    return {
      tone: "badge--orange",
      titleClass: "title--orange",
      icon: "triangle",
      palette: "orange",
      label: "Minute",
    };
  }

  if (average < 1500) {
    return {
      tone: "badge--teal",
      titleClass: "title--teal",
      icon: "circle",
      palette: "teal",
      label: "Short",
    };
  }

  return {
    tone: "badge--tone-muted",
    titleClass: "title--muted",
    icon: "circle",
    palette: "muted",
    label: "Length unknown",
  };
}

function filterEssayTemplates(collection = []) {
  if (!Array.isArray(collection)) {
    return [];
  }

  return collection.filter((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const inputPath = item.inputPath || "";
    const fileSlug = item.fileSlug || "";

    if (fileSlug.startsWith("_")) {
      return false;
    }

    if (inputPath.includes("/_templates/")) {
      return false;
    }

    return true;
  });
}

function normalizeStatus(raw, fallback) {
  const normalized = typeof raw === "string" ? raw.toLowerCase() : "";
  if (["draft", "proposed", "published"].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function loadEssaysByStatus(status = "published") {
  const manifest = readAutopublishManifest();
  const autopublished = Array.isArray(manifest.published) ? manifest.published : [];
  const autopublishedSlugs = new Set(
    autopublished
      .map((entry) => entry && (entry.slug || path.basename(entry.source || "", path.extname(entry.source || ""))))
      .filter(Boolean)
  );

  const autopublishedPaths = autopublished
    .map((entry) => entry && entry.dest)
    .filter((fp) => fp && fs.existsSync(fp));

  const pattern = status === "draft"
    ? "site/essays/drafts/**/*.md"
    : "site/essays/published/**/*.md";

  const files = fg.sync(pattern, { dot: true });
  const resolved = status === "published" ? [...files, ...autopublishedPaths] : files;

  return resolved
    .map((file) => {
      const { data, content } = matter.read(file);
      const normalizedStatus = autopublishedPaths.includes(file)
        ? "published"
        : normalizeStatus(data.status, status);
      const slug =
        (data.page && data.page.fileSlug) ||
        data.slug ||
        (file.split("/").pop() || "").replace(/\.md$/, "");
      const segment = normalizedStatus === "published" ? "published" : "drafts";
      const url = `/essays/${segment}/${slug}/`;

      return {
        inputPath: file,
        fileSlug: slug,
        url,
        data: {
          ...data,
          status: normalizedStatus,
          page: {
            ...(data.page || {}),
            url,
            fileSlug: slug,
          },
        },
        templateContent: content,
      };
    })
    .filter((entry) => {
      if (status === "draft" && autopublishedSlugs.has(entry.fileSlug)) {
        return false;
      }
      return true;
    });
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

  const authorAliases = {
    noahvandongen: "Noah van Dongen",
  };

  const formatAuthorName = (value) => {
    if (!value) return "";
    const normalized = String(value).replace(/^@/, "");
    if (authorAliases[normalized]) return authorAliases[normalized];

    const parts = normalized
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

    return parts.length ? parts.join(" ") : normalized;
  };

  eleventyConfig.addFilter("date", (value, format = "yyyy-LL-dd") => {
    return formatDateValue(value, format);
  });

  eleventyConfig.on("eleventy.before", () => {
    if (process.env.SKIP_AUTOPUBLISH) {
      console.log("Skipping autopublish because SKIP_AUTOPUBLISH is set.");
      return;
    }

    runAutopublish({ quiet: true });
  });

  eleventyConfig.addFilter("authorName", formatAuthorName);
  eleventyConfig.addFilter("essayMeta", computeEssayMeta);
  eleventyConfig.addFilter("absoluteUrl", (value, siteData) => {
    return meta.absoluteUrl(value, siteData);
  });
  eleventyConfig.addFilter("wordRangeTone", wordRangeTone);
  eleventyConfig.addFilter("wordRangeMeta", wordRangeMeta);
  eleventyConfig.addFilter("shortWords", (value, count = 5) => {
    if (!value || typeof value !== "string") return "";
    return value
      .trim()
      .split(/\s+/)
      .slice(0, count)
      .join(" ");
  });
  eleventyConfig.addFilter("rssDate", value => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toUTCString();
  });
  const isPublishedEssay = (item = {}) => {
    const status = item.data && item.data.status;
    const normalized = typeof status === "string" ? status.toLowerCase() : status;
    const inputPath = item.inputPath || "";
    return normalized === "published" && inputPath.includes("/essays/published/");
  };

  const isDraftEssay = (item = {}) => {
    const status = item.data && item.data.status;
    const normalized = typeof status === "string" ? status.toLowerCase() : status;
    const inputPath = item.inputPath || "";
    return ["draft", "proposed"].includes(normalized) && inputPath.includes("/essays/drafts/");
  };

  eleventyConfig.addCollection("publishedEssays", (collectionApi) => {
    const items = loadEssaysByStatus("published")
      .filter(isPublishedEssay)
      .sort((a, b) => {
        const aDate = a.data.published_at ? new Date(a.data.published_at) : new Date(0);
        const bDate = b.data.published_at ? new Date(b.data.published_at) : new Date(0);
        return bDate - aDate;
      });

    return filterEssayTemplates(items);
  });

  eleventyConfig.addCollection("draftEssays", (collectionApi) => {
    return filterEssayTemplates(
      loadEssaysByStatus("draft")
        .filter(isDraftEssay)
        .sort((a, b) => {
          const aDeadline = a.data.deadline_at ? new Date(a.data.deadline_at) : new Date(8640000000000000);
          const bDeadline = b.data.deadline_at ? new Date(b.data.deadline_at) : new Date(8640000000000000);
          return aDeadline - bDeadline;
        })
    );
  });

  eleventyConfig.addFilter("split", (value, delimiter = "/") => {
    if (typeof value !== "string") {
      return [];
    }
    return value.split(delimiter);
  });

  eleventyConfig.addFilter("daysUntil", (value) => {
    if (!value) return null;

    const deadline = new Date(value);
    if (Number.isNaN(deadline.getTime())) {
      return null;
    }

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const diff = deadline.getTime() - Date.now();
    const days = Math.ceil(diff / MS_PER_DAY);

    return days < 0 ? 0 : days;
  });

  eleventyConfig.addFilter("whereStatus", (items, statuses) => {
    const list = Array.isArray(items) ? items : [];
    const accepted = (Array.isArray(statuses) ? statuses : [statuses])
      .map((entry) => (typeof entry === "string" ? entry.toLowerCase() : ""))
      .filter(Boolean);

    if (!accepted.length) return list;
    return list.filter((item) => accepted.includes((item?.data?.status || "").toLowerCase()));
  });

  eleventyConfig.addFilter("sortByDate", (items, path = "") => {
    if (!Array.isArray(items)) return [];

    const getValue = (obj, dottedPath) => {
      return dottedPath.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    };

    return [...items].sort((a, b) => {
      const rawA = path ? getValue(a, path) : a;
      const rawB = path ? getValue(b, path) : b;
      const aDate = new Date(rawA);
      const bDate = new Date(rawB);
      const aValue = Number.isNaN(aDate.getTime()) ? Infinity : aDate.getTime();
      const bValue = Number.isNaN(bDate.getTime()) ? Infinity : bDate.getTime();
      return aValue - bValue;
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

  // Copy static assets directly so style and script changes show up in the build output
  eleventyConfig.addPassthroughCopy({ "site/assets": "assets" });
  eleventyConfig.addWatchTarget("site/assets");

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
    templateFormats: ["njk", "md"],
    // Ensure 11ty-generated URLs respect the Pages base path
    pathPrefix: "/DUE/"
  };
};
