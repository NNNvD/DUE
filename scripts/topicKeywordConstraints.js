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

function normalizeTopic(topic) {
  if (!topic || typeof topic !== "string") return "";
  return topic.trim();
}

function dedupeTerms(values = []) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function normalizeKeywords(keywords, fallbackTopic = "") {
  const normalized = dedupeTerms(Array.isArray(keywords) ? keywords : []);
  if (normalized.length) {
    return normalized;
  }

  const topic = normalizeTopic(fallbackTopic);
  return topic ? [topic] : [];
}

function normalizeThemes(themes = []) {
  const source = Array.isArray(themes) ? themes : [];
  return dedupeTerms(source.map((value) => String(value || "").toLowerCase()))
    .filter((value) => ALLOWED_THEMES.includes(value));
}

function keywordPreview(keywords = [], limit = 3) {
  if (!Array.isArray(keywords) || limit <= 0) return [];
  return keywords.filter(Boolean).slice(0, limit);
}

function enforceTopicAndKeywords(data = {}) {
  const topic = normalizeTopic(data.topic || "");
  const keywords = normalizeKeywords(data.keywords || [], topic);
  const themes = normalizeThemes(data.themes || []);

  return {
    ...data,
    topic,
    keywords,
    themes,
  };
}

module.exports = {
  enforceTopicAndKeywords,
  ALLOWED_THEMES,
  keywordPreview,
  normalizeKeywords,
  normalizeThemes,
  normalizeTopic,
};
