const fg = require("fast-glob");
const matter = require("gray-matter");
const { isEssayHidden } = require("../../scripts/lib/essayVisibility");

function normalizeStatus(raw, fallback) {
  const normalized = typeof raw === "string" ? raw.toLowerCase() : "";
  if (fallback === "draft" && normalized === "published") return "draft";
  if (["draft", "proposed", "published"].includes(normalized)) return normalized;
  return fallback;
}

function plainText(content = "") {
  return String(content || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[\*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(content, targetLength = 220) {
  const text = plainText(content);
  if (text.length <= targetLength) return text;

  const lowerBound = Math.max(120, targetLength - 50);
  const upperBound = Math.min(text.length, targetLength + 30);
  const candidate = text.slice(0, upperBound);
  const sentenceMatches = [...candidate.matchAll(/[.!?](?=\s|$)/g)];
  const sentenceEnd = sentenceMatches
    .map((match) => match.index + 1)
    .filter((index) => index >= lowerBound && index <= upperBound)
    .pop();

  if (sentenceEnd) return `${candidate.slice(0, sentenceEnd).trim()}…`;

  const clipped = text.slice(0, targetLength).replace(/\s+\S*$/, "").trim();
  return `${clipped}…`;
}

function load(status) {
  const pattern = status === "draft"
    ? "site/essays/drafts/**/*.{md,njk}"
    : "site/essays/published/**/*.{md,njk}";

  return fg.sync(pattern, { dot: true }).map((file) => {
    const { data, content } = matter.read(file);
    if (isEssayHidden(data)) return null;
    if (data.pagination) return null;

    const fileName = (file.split("/").pop() || "").replace(/\.(md|njk)$/i, "");
    const slug = (data.page && data.page.fileSlug) || data.slug || fileName;
    if (!slug || slug.startsWith("_")) return null;

    const normalizedStatus = normalizeStatus(data.status, status);
    return [`${normalizedStatus}-${slug}`, excerpt(content)];
  }).filter(Boolean);
}

module.exports = () => Object.fromEntries([
  ...load("published"),
  ...load("draft"),
]);
