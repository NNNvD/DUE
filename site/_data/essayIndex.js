const fg = require("fast-glob");
const matter = require("gray-matter");

const meta = require("./meta");
const { wordCount } = require("../../scripts/checkWordRange");
const { enforceTopicAndKeywords } = require("../../scripts/topicKeywordConstraints");

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
      bin: "concise",
      tone: "badge--magenta",
      titleClass: "title--magenta",
      icon: "square",
      palette: "magenta",
      label: "Concise",
    };
  }

  if (average < 1000) {
    return {
      bin: "midlength",
      tone: "badge--orange",
      titleClass: "title--orange",
      icon: "triangle",
      palette: "orange",
      label: "Mid-length",
    };
  }

  if (average < 1500) {
    return {
      bin: "longform",
      tone: "badge--teal",
      titleClass: "title--teal",
      icon: "circle",
      palette: "teal",
      label: "Long-form",
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

function loadEssays(status = "published") {
  const pattern = status === "draft"
    ? "site/essays/drafts/**/*.md"
    : "site/essays/published/**/*.md";

  return fg.sync(pattern).map((file) => {
    const { data, content } = matter.read(file);
    const slug = (data.page && data.page.fileSlug) || data.slug || (file.split("/").pop() || "").replace(/\.md$/, "");
    const constrained = enforceTopicAndKeywords(data, { slug, inputPath: file });
    const segment = status === "draft" ? "drafts" : "published";
    const url = `/essays/${segment}/${slug}/`;
    const keywords = Array.isArray(constrained.keywords) ? constrained.keywords : [];
    const word_range = constrained.word_range || null;
    const lengthMeta = wordRangeMeta(word_range);
    const description = meta.buildMetaDescription({
      ...constrained,
      page: { ...(data.page || {}), inputPath: file },
    });
    const word_count = typeof constrained.word_count === "number" ? constrained.word_count : wordCount(content || "");
    const dateValue = status === "published"
      ? new Date(constrained.published_at || 0).getTime()
      : new Date(constrained.deadline_at || 0).getTime();

    return {
      id: `${status}-${slug}`,
      slug,
      status,
      title: constrained.title || slug,
      topic: constrained.topic || "",
      author: constrained.author || "",
      coauthors: Array.isArray(constrained.coauthors) ? constrained.coauthors.map((entry) => entry && (entry.handle || entry.user || entry.name || entry)) : [],
      keywords,
      display_keywords: keywords.slice(0, 5),
      description,
      url,
      release_notes: Array.isArray(constrained.release_notes) ? constrained.release_notes : [],
      version: constrained.version || "1.0.0",
      published_at: constrained.published_at || null,
      deadline_at: constrained.deadline_at || null,
      initial_status: constrained.initial_status || null,
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
