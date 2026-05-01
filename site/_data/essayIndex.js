const fg = require("fast-glob");
const matter = require("gray-matter");

const meta = require("./meta");
const { wordCount, wordRangeFromCount } = require("../../scripts/checkWordRange");
const { resolveDeadlineAt, resolveTimeStatus } = require("../../scripts/lib/essayLifecycle");
const { enforceTopicAndKeywords, keywordPreview } = require("../../scripts/topicKeywordConstraints");
const { isEssayHidden } = require("../../scripts/lib/essayVisibility");

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

function wordRangeMeta(value) {
  const average = normalizeWordRange(value);

  if (average === null) {
    return {
      bin: "unknown",
      tone: "badge--tone-muted",
      titleClass: "title--muted",
      icon: "circle",
      palette: "muted",
      label: "Length unknown",
    };
  }

  if (average < 500) {
    return {
      bin: "tiny",
      tone: "badge--magenta",
      titleClass: "title--magenta",
      icon: "square",
      palette: "magenta",
      label: "Tiny",
    };
  }

  if (average < 1000) {
    return {
      bin: "minute",
      tone: "badge--orange",
      titleClass: "title--orange",
      icon: "triangle",
      palette: "orange",
      label: "Minute",
    };
  }

  if (average < 1500) {
    return {
      bin: "short",
      tone: "badge--teal",
      titleClass: "title--teal",
      icon: "circle",
      palette: "teal",
      label: "Short",
    };
  }

  return {
    bin: "unknown",
    tone: "badge--tone-muted",
    titleClass: "title--muted",
    icon: "circle",
    palette: "muted",
    label: "Length unknown",
  };
}

function normalizeVersion(raw, initialStatus) {
  const asString = raw === undefined || raw === null ? "" : String(raw);
  const parts = asString
    .split(".")
    .map((part) => parseInt(part, 10))
    .filter((part) => Number.isFinite(part));

  if (!parts.length) {
    return initialStatus === "complete" ? "1.0.0" : "0.1.0";
  }

  while (parts.length < 3) {
    parts.push(0);
  }

  return parts.slice(0, 3).join(".");
}

function normalizeStatus(raw, fallback) {
  const normalized = typeof raw === "string" ? raw.toLowerCase() : "";
  if (fallback === "draft" && normalized === "published") {
    return "draft";
  }
  if (["draft", "proposed", "published"].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function normalizeContributors(contributors = []) {
  if (!Array.isArray(contributors)) return [];
  return contributors
    .map((entry) => entry && (entry.handle || entry.user || entry.name || entry))
    .filter(Boolean);
}

function isEssayEntry(file, data = {}) {
  const slug = (data.page && data.page.fileSlug) || data.slug || "";
  const fileName = (file.split("/").pop() || "").replace(/\.(md|njk)$/i, "");
  const resolvedSlug = slug || fileName;
  const hasStatus = typeof data.status === "string" && data.status.trim().length > 0;

  if (resolvedSlug.startsWith("_")) return false;
  if (file.includes("/_templates/")) return false;
  if (data.pagination) return false;
  if (!hasStatus) return false;

  return true;
}

function loadEssays(status = "published") {
  const basePattern = status === "draft"
    ? "site/essays/drafts/**/*.{md,njk}"
    : "site/essays/published/**/*.{md,njk}";

  const files = fg.sync(basePattern, { dot: true });

  return files
    .map((file) => {
      const { data, content } = matter.read(file);
      if (!isEssayEntry(file, data)) return null;
      if (isEssayHidden(data)) return null;
      const normalizedStatus = normalizeStatus(data.status, status);
      const slug =
        (data.page && data.page.fileSlug) ||
        data.slug ||
        (file.split("/").pop() || "").replace(/\.(md|njk)$/i, "");
      const constrained = enforceTopicAndKeywords(data, { slug, inputPath: file });
      const url = normalizedStatus === "published" ? `/essays/published/${slug}/` : null;
      const keywords = Array.isArray(constrained.keywords) ? constrained.keywords : [];
      const themes = Array.isArray(constrained.themes) ? constrained.themes : [];
      const description = meta.buildMetaDescription({
        ...constrained,
        page: { ...(data.page || {}), inputPath: file },
      });
      const word_count = typeof constrained.word_count === "number" ? constrained.word_count : wordCount(content || "");
      const word_range = normalizedStatus === "published"
        ? wordRangeFromCount(word_count)
        : null;
      const lengthMeta = wordRangeMeta(word_range);
      const resolvedDeadline = resolveDeadlineAt(
        constrained.deadline_at,
        constrained.started_at
      );
      const resolvedDeadlineIso = resolvedDeadline ? resolvedDeadline.toISOString().slice(0, 10) : null;
      const dateValue = normalizedStatus === "published"
        ? new Date(constrained.published_at || 0).getTime()
        : new Date(resolvedDeadlineIso || 0).getTime();
      const initialStatus = constrained.initial_status || null;
      const normalizedVersion = normalizeVersion(constrained.version, initialStatus);
      const timelineStatus = resolveTimeStatus({
        status: normalizedStatus,
        initialStatus,
        publishedAt: constrained.published_at,
        deadlineAt: constrained.deadline_at,
        startedAt: constrained.started_at,
      });
      const contributors = normalizeContributors(constrained.coauthors);

      return {
        id: `${normalizedStatus}-${slug}`,
        slug,
        status: normalizedStatus,
        title: constrained.title || slug,
        topic: constrained.topic || "",
        author: constrained.author || "",
        coauthors: contributors,
        keywords,
        themes,
        display_keywords: keywords,
        browser_keywords: keywordPreview(keywords, 3),
        description,
        url,
        release_notes: Array.isArray(constrained.release_notes) ? constrained.release_notes : [],
        version: normalizedVersion,
        published_at: constrained.published_at || null,
        deadline_at: resolvedDeadlineIso,
        initial_status: initialStatus,
        time_status: timelineStatus,
        started_at: constrained.started_at || null,
        word_range,
        word_count,
        lengthMeta,
        dateValue: Number.isFinite(dateValue) ? dateValue : 0,
        summary: description,
        identity: {
          author: constrained.author || "",
          contributors,
        },
        lifecycle: {
          workflow_state: normalizedStatus,
          outcome_state: timelineStatus,
          started_at: constrained.started_at || null,
          deadline_at: resolvedDeadlineIso,
          published_at: constrained.published_at || null,
          version: normalizedVersion,
        },
        taxonomy: {
          topic: constrained.topic || "",
          keywords,
          themes,
          length_bucket: lengthMeta.bin,
        },
        metrics: {
          word_count,
        },
      };
    })
    .filter(Boolean);
}

module.exports = () => {
  const published = loadEssays("published");
  const drafts = loadEssays("draft");
  return [...published, ...drafts];
};
