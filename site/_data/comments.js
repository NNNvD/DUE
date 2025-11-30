const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const fg = require("fast-glob");

const COMMENTS_ROOT = path.join(process.cwd(), "data", "comments");

function normalizeIntent(intent) {
  const value = (intent || "").toString().toLowerCase();
  return value === "major" ? "major" : "minor";
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function resolveStatus(data = {}) {
  const explicit = (data.status || "").toString().toLowerCase();
  if (explicit === "rejected") {
    return "rejected";
  }
  if (explicit === "implemented" || data.implemented === true) {
    return "implemented";
  }
  return "pending";
}

function loadComment(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = yaml.load(raw) || {};
  const slug = data.essay || path.basename(path.dirname(path.dirname(filePath)));

  return {
    slug,
    intent: normalizeIntent(data.intent),
    name: data.name || "Reader",
    comment: data.comment || "",
    contact: data.contact || null,
    submitted_at: parseDate(data.submitted_at || data.submittedAt || data.created_at),
    moderated_at: parseDate(data.moderated_at || data.moderatedAt),
    status: resolveStatus(data),
    moderation_note: data.moderation_note || data.note || null,
  };
}

function loadComments() {
  if (!fs.existsSync(COMMENTS_ROOT)) {
    return { all: [], byEssay: {} };
  }

  const files = fg.sync("**/approved/*.yml", { cwd: COMMENTS_ROOT, absolute: true, dot: false });
  const comments = files.map((file) => loadComment(file));

  comments.sort((a, b) => {
    const aDate = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const bDate = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
    return aDate - bDate;
  });

  const byEssay = comments.reduce((acc, comment) => {
    if (!acc[comment.slug]) {
      acc[comment.slug] = [];
    }
    acc[comment.slug].push(comment);
    return acc;
  }, {});

  return { all: comments, byEssay };
}

module.exports = loadComments();
