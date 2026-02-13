const MAX_TOPIC_WORDS = 5;
const MAX_KEYWORDS = 5;
const ALLOWED_THEMES = [
  "deadlines",
  "iteration",
  "publishing",
  "collaboration",
  "quality",
  "process",
  "scope",
  "authorship",
  "feedback",
  "revision",
];

const warningCache = new Set();

function countWords(value = "") {
  if (!value) return 0;
  return String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function normalizeTopic(topic) {
  if (!topic || typeof topic !== "string") return "";
  return topic.trim();
}

function normalizeKeywords(keywords) {
  if (!Array.isArray(keywords)) return [];
  return keywords
    .map((keyword) => (typeof keyword === "string" ? keyword.trim() : ""))
    .filter(Boolean);
}

function normalizeThemes(themes = [], fallbackKeywords = []) {
  const source = Array.isArray(themes) && themes.length ? themes : fallbackKeywords;
  if (!Array.isArray(source)) return [];

  const deduped = new Set();
  for (const value of source) {
    if (typeof value !== "string") continue;
    const normalized = value.trim().toLowerCase();
    if (!normalized || !ALLOWED_THEMES.includes(normalized)) continue;
    deduped.add(normalized);
    if (deduped.size >= MAX_KEYWORDS) break;
  }

  return Array.from(deduped);
}

function warnOnce(key, message, logger = console) {
  if (!message || warningCache.has(key)) return;
  warningCache.add(key);
  if (logger && typeof logger.warn === "function") {
    logger.warn(message);
  }
}

function enforceTopicAndKeywords(data = {}, context = {}, logger = console) {
  const topic = normalizeTopic(data.topic || "");
  const topicWordCount = countWords(topic);
  const keywords = normalizeKeywords(data.keywords || []);
  const themes = normalizeThemes(data.themes || [], keywords);

  const slug = context.slug || data.slug || data.page?.fileSlug || "unknown";
  const inputPath = context.inputPath || data.page?.inputPath;
  const location = inputPath ? `${slug} (${inputPath})` : slug;

  if (topicWordCount > MAX_TOPIC_WORDS) {
    warnOnce(
      `topic-${slug}`,
      `Topic for "${location}" uses ${topicWordCount} words (max ${MAX_TOPIC_WORDS}). Please shorten it.`,
      logger,
    );
  }

  if (keywords.length > MAX_KEYWORDS) {
    warnOnce(
      `keywords-${slug}`,
      `Keywords for "${location}" exceed ${MAX_KEYWORDS}; keeping the first ${MAX_KEYWORDS}.`,
      logger,
    );
  }

  return {
    ...data,
    topic,
    topic_word_count: topicWordCount,
    keywords: keywords.slice(0, MAX_KEYWORDS),
    themes,
  };
}

module.exports = {
  enforceTopicAndKeywords,
  MAX_TOPIC_WORDS,
  MAX_KEYWORDS,
  ALLOWED_THEMES,
  normalizeThemes,
};
