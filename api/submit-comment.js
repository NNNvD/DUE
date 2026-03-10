const crypto = require("node:crypto");
const yaml = require("js-yaml");

const COMMENT_DIR = process.env.COMMENTS_DIR || "data/comments";
const MAX_COMMENT_LENGTH = Number(process.env.COMMENTS_MAX_LENGTH || 4000);
const SITE_BASE = process.env.COMMENTS_SITE_BASE || "";

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(payload),
  };
}

function getHeader(headers, name) {
  if (!headers) return "";
  const entries = Object.entries(headers);
  const match = entries.find(([key]) => key.toLowerCase() === name.toLowerCase());
  return match ? match[1] : "";
}

function decodeBody(body, headers = {}, isBase64Encoded = false) {
  if (!body) return {};

  const contentType = getHeader(headers, "content-type").toLowerCase();
  const raw = isBase64Encoded ? Buffer.from(body, "base64").toString("utf8") : body;

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return {};
    }
  }

  return Object.fromEntries(new URLSearchParams(raw));
}

function sanitizeSlug(value) {
  if (!value) return "unknown";
  return value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/giu, "-")
    .replace(/-{2,}/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .trim() || "unknown";
}

function shortId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID().split("-")[0];
  }
  return crypto.randomBytes(6).toString("hex");
}

function buildFilePath(slug, id) {
  const timestamp = new Date().toISOString().replace(/[:.]/gu, "-");
  return `${COMMENT_DIR}/${slug}/approved/${timestamp}-${id}.yml`;
}

function ensureTrailingSlash(value) {
  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
}

function resolveEssayUrl(essayUrl, essayPath) {
  if (essayUrl) return essayUrl;
  if (!SITE_BASE || !essayPath) return null;

  const normalizedBase = ensureTrailingSlash(SITE_BASE.trim());
  const normalizedPath = essayPath.startsWith("/") ? essayPath.slice(1) : essayPath;
  return `${normalizedBase}${normalizedPath}`;
}

function validatePayload(payload = {}) {
  const errors = [];
  const intent = (payload.intent || "").toString().toLowerCase();
  const name = (payload.name || "").toString().trim();
  const contact = (payload.contact || "").toString().trim();
  const comment = (payload.comment || "").toString().trim();
  const slug = sanitizeSlug(payload.slug || payload.essay || payload.essay_slug || "");
  const essayTitle = (payload.essayTitle || payload.title || "").toString().trim();
  const essayPath = (payload.essayPath || payload.path || "").toString().trim();
  const essayUrl = (payload.essayUrl || payload.url || "").toString().trim();
  const honeypot = (payload.website || "").toString().trim();

  if (honeypot) {
    errors.push("Submission blocked.");
  }

  if (!slug || slug === "unknown") {
    errors.push("Missing essay identifier.");
  }

  if (!intent || !["minor", "major"].includes(intent)) {
    errors.push("Choose Minor or Major so we can route your note.");
  }

  if (!name) {
    errors.push("Add your name or handle so we can attribute credit.");
  } else if (name.length > 120) {
    errors.push("Name is too long.");
  }

  if (!comment) {
    errors.push("Share a short note so we know what to change.");
  } else if (comment.length < 10) {
    errors.push("A few more details will help us review your suggestion.");
  } else if (comment.length > MAX_COMMENT_LENGTH) {
    errors.push("Comment is too long.");
  }

  if (contact && contact.length > 320) {
    errors.push("Contact details are too long.");
  }

  if (errors.length) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      slug,
      intent,
      name,
      contact: contact || null,
      comment,
      essayTitle: essayTitle || null,
      essayPath: essayPath || null,
      essayUrl: essayUrl || null,
    },
  };
}

async function githubRequest(path, options = {}) {
  const token = process.env.COMMENTS_TOKEN || process.env.GITHUB_TOKEN || "";
  if (!token) {
    throw new Error("Missing GitHub token for comment intake.");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "due-comments-intake",
      ...options.headers,
    },
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = {};
    }
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : `GitHub request failed (${response.status})`;
    const error = new Error(message);
    error.statusCode = response.status || 502;
    error.details = data;
    throw error;
  }

  return data;
}

function encodePath(path) {
  return path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

async function createCommentPullRequest(commentData, requestMeta = {}) {
  const repoConfig = process.env.COMMENTS_REPO || process.env.GITHUB_REPOSITORY || "";
  const [owner, repo] = repoConfig.split("/");
  if (!owner || !repo) {
    throw new Error("Missing COMMENTS_REPO or GITHUB_REPOSITORY for comment intake.");
  }

  const baseBranch = process.env.COMMENTS_BASE_BRANCH;
  const submittedAt = new Date().toISOString();
  const id = shortId();
  const filePath = buildFilePath(commentData.slug, id);

  const { default_branch: defaultBranch } = await githubRequest(`/repos/${owner}/${repo}`);
  const branchBase = baseBranch || defaultBranch || "main";

  const content = yaml.dump(
    {
      essay: commentData.slug,
      intent: commentData.intent,
      name: commentData.name,
      contact: commentData.contact,
      comment: commentData.comment,
      essay_title: commentData.essayTitle,
      essay_path: commentData.essayPath,
      essay_url: resolveEssayUrl(commentData.essayUrl, commentData.essayPath),
      submitted_at: submittedAt,
      status: "pending",
      moderated_at: null,
      user_agent: getHeader(requestMeta.headers, "user-agent") || null,
      referrer: getHeader(requestMeta.headers, "referer") || null,
    },
    { lineWidth: 100 }
  );

  await githubRequest(`/repos/${owner}/${repo}/contents/${encodePath(filePath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Add ${commentData.intent} comment for ${commentData.slug}`,
      content: Buffer.from(content).toString("base64"),
      branch: branchBase,
    }),
  });

  return { prUrl: null, branchName: branchBase, filePath };
}

async function handleEvent(event) {
  const method = event.httpMethod || event.method || "GET";
  if (method !== "POST") {
    return jsonResponse(405, { success: false, message: "Method not allowed" });
  }

  const headers = event.headers || {};
  const payload = decodeBody(event.body, headers, event.isBase64Encoded);
  const validation = validatePayload(payload);

  if (!validation.valid) {
    return jsonResponse(400, { success: false, errors: validation.errors });
  }

  try {
    const result = await createCommentPullRequest(validation.data, { headers });
    return jsonResponse(200, {
      success: true,
      message: "Feedback received and published. Moderators may update its status soon.",
      prUrl: result.prUrl,
      branch: result.branchName,
      filePath: result.filePath,
    });
  } catch (error) {
    const statusCode = error.statusCode || 502;
    const message = error.message || "Unable to submit feedback right now.";
    return jsonResponse(statusCode, { success: false, message });
  }
}

exports.handler = async (event) => handleEvent(event);

module.exports = async (req, res) => {
  const headers = req.headers || {};
  const method = req.method || "GET";
  let rawBody = "";

  if (typeof req.body === "string") {
    rawBody = req.body;
  } else if (req.body && Object.keys(req.body).length) {
    rawBody = JSON.stringify(req.body);
    if (!getHeader(headers, "content-type")) {
      headers["content-type"] = "application/json";
    }
  }

  const event = {
    httpMethod: method,
    headers,
    body: rawBody,
    isBase64Encoded: false,
  };

  const response = await handleEvent(event);
  res.statusCode = response.statusCode;
  Object.entries(response.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.end(response.body);
};
