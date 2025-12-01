const fg = require("fast-glob");
const matter = require("gray-matter");

const meta = require("./meta");
const { wordCount } = require("../../scripts/checkWordRange");

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
    const segment = status === "draft" ? "drafts" : "published";
    const url = `/essays/${segment}/${slug}/`;
    const keywords = Array.isArray(data.keywords) ? data.keywords : [];
    const word_range = data.word_range || null;
    const lengthMeta = wordRangeMeta(word_range);
    const description = meta.buildMetaDescription({
      ...data,
      page: { ...(data.page || {}), inputPath: file },
    });
    const word_count = typeof data.word_count === "number" ? data.word_count : wordCount(content || "");
    const dateValue = status === "published"
      ? new Date(data.published_at || 0).getTime()
      : new Date(data.deadline_at || 0).getTime();

    return {
      id: `${status}-${slug}`,
      slug,
      status,
      title: data.title || slug,
      topic: data.topic || "",
      author: data.author || "",
      coauthors: Array.isArray(data.coauthors) ? data.coauthors.map((entry) => entry && (entry.handle || entry.user || entry.name || entry)) : [],
      keywords,
      display_keywords: keywords.slice(0, 5),
      description,
      url,
      release_notes: Array.isArray(data.release_notes) ? data.release_notes : [],
      version: data.version || "1.0.0",
      published_at: data.published_at || null,
      deadline_at: data.deadline_at || null,
      initial_status: data.initial_status || null,
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
