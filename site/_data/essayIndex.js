const fg = require("fast-glob");
const matter = require("gray-matter");

const fs = require("fs");
const path = require("path");
const meta = require("./meta");
const { wordCount } = require("../../scripts/checkWordRange");
const { enforceTopicAndKeywords } = require("../../scripts/topicKeywordConstraints");
const { readAutopublishManifest } = require("../../scripts/autopublish");

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

function timeStatus(initialStatus, status) {
  if (status === "proposed") return "proposed";
  if (status === "draft") return "draft";
  return initialStatus === "complete" ? "finished-on-time" : "unfinished-on-time";
}

function loadEssays(status = "published") {
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

  const basePattern = status === "draft"
    ? "site/essays/drafts/**/*.{md,njk}"
    : "site/essays/published/**/*.{md,njk}";

  const baseFiles = fg.sync(basePattern, { dot: true });
  const files = status === "published"
    ? [...baseFiles, ...autopublishedPaths]
    : baseFiles.filter((fp) => !autopublishedSlugs.has(path.basename(fp, path.extname(fp))));

  return files.map((file) => {
    const { data, content } = matter.read(file);
    const normalizedStatus = autopublishedPaths.includes(file)
      ? "published"
      : normalizeStatus(data.status, status);
    const slug = (data.page && data.page.fileSlug) || data.slug || (file.split("/").pop() || "").replace(/\.md$/, "");
    const constrained = enforceTopicAndKeywords(data, { slug, inputPath: file });
    const segment = normalizedStatus === "published" ? "published" : "drafts";
    const url = `/essays/${segment}/${slug}/`;
    const keywords = Array.isArray(constrained.keywords) ? constrained.keywords : [];
    const word_range = constrained.word_range || null;
    const lengthMeta = wordRangeMeta(word_range);
    const description = meta.buildMetaDescription({
      ...constrained,
      page: { ...(data.page || {}), inputPath: file },
    });
    const word_count = typeof constrained.word_count === "number" ? constrained.word_count : wordCount(content || "");
    const dateValue = normalizedStatus === "published"
      ? new Date(constrained.published_at || 0).getTime()
      : new Date(constrained.deadline_at || 0).getTime();
    const initialStatus = constrained.initial_status || null;
    const normalizedVersion = normalizeVersion(constrained.version, initialStatus);
    const timelineStatus = timeStatus(initialStatus, normalizedStatus);

    return {
      id: `${normalizedStatus}-${slug}`,
      slug,
      status: normalizedStatus,
      title: constrained.title || slug,
      topic: constrained.topic || "",
      author: constrained.author || "",
      coauthors: Array.isArray(constrained.coauthors) ? constrained.coauthors.map((entry) => entry && (entry.handle || entry.user || entry.name || entry)) : [],
      keywords,
      display_keywords: keywords.slice(0, 5),
      description,
      url,
      release_notes: Array.isArray(constrained.release_notes) ? constrained.release_notes : [],
      version: normalizedVersion,
      published_at: constrained.published_at || null,
      deadline_at: constrained.deadline_at || null,
      initial_status: initialStatus,
      time_status: timelineStatus,
      word_range,
      word_count,
      lengthMeta,
      dateValue: Number.isFinite(dateValue) ? dateValue : 0,
      summary: description,
    };
  });
}

module.exports = () => {
  const published = loadEssays("published");
  const drafts = loadEssays("draft");
  return [...published, ...drafts];
};
