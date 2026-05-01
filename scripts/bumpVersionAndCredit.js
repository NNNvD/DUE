const fs = require("fs");
const matter = require("gray-matter");
const { writeSnapshot } = require("./lib/snapshot");
const { bumpVersion, normalizeUpdateIntent } = require("./lib/version");
const { normalizeCoauthors, normalizeAcknowledgments } = require("./lib/creditUtils");

function parseEnv(env = process.env) {
  const labels = (env.PR_LABELS ? JSON.parse(env.PR_LABELS) : []).map(label => label.name);
  const user = env.PR_USER || "contributor";
  const labelIntent = labels.includes("major")
    ? "new_version"
    : (labels.includes("minor") ? "minor_update" : null);
  const changed = (env.CHANGED_FILES || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(fp => fp.startsWith("site/essays/published/") && fp.endsWith(".md"));

  return { labels, user, labelIntent, changed };
}

function resolveIntent(data = {}, labelIntent = null) {
  const fromField = normalizeUpdateIntent(data.update_intent);
  if (data.update_intent) {
    return fromField;
  }
  return normalizeUpdateIntent(labelIntent);
}

function applyContribution(data = {}, { intent, user }) {
  if (!intent) {
    throw new Error("Intent is required to apply contribution");
  }

  const isNewVersion = intent === "new_version";
  const version = bumpVersion(data.version, intent);
  const note = `Contribution by @${user} (${intent}).`;
  const baseReleaseNotes = Array.isArray(data.release_notes) ? data.release_notes : [];

  const updated = {
    ...data,
    version,
    update_intent: "minor_update",
    release_notes: [note, ...baseReleaseNotes]
  };

  if (isNewVersion) {
    const normalizedCoauthors = normalizeCoauthors(data.coauthors);
    if (!normalizedCoauthors.includes(user)) {
      normalizedCoauthors.push(user);
    }
    updated.coauthors = normalizedCoauthors;

    if (Array.isArray(data.acknowledgments)) {
      const remaining = data.acknowledgments.filter(entry => entry && entry.user !== user);
      if (remaining.length > 0) {
        updated.acknowledgments = normalizeAcknowledgments(remaining);
      } else {
        delete updated.acknowledgments;
      }
    } else {
      delete updated.acknowledgments;
    }
  } else {
    const acknowledgmentNote = intent === "major_update" ? "Major contribution" : "Minor contribution";
    const acknowledgments = normalizeAcknowledgments([
      ...(Array.isArray(data.acknowledgments) ? data.acknowledgments : []),
      { user, note: acknowledgmentNote, since_version: version }
    ]);
    updated.acknowledgments = acknowledgments;
  }

  return { data: updated, note, version };
}

function normalizeCreditUser(value) {
  return String(value || "")
    .trim()
    .replace(/^@/u, "")
    .replace(/[^a-z0-9_-]+/giu, "-")
    .replace(/-{2,}/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function resolveCommenterId(comment = {}) {
  const candidates = [
    comment.commenter_id,
    comment.commenterId,
    comment.user,
    comment.github,
    comment.handle,
    comment.contact,
    comment.name,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCreditUser(candidate);
    if (normalized) return normalized;
  }

  return "commenter";
}

function resolveIntentFromComment(comment = {}) {
  const intent = String(comment.intent || "").toLowerCase();
  return intent === "major" ? "new_version" : "minor_update";
}

function commentIsImplemented(comment = {}) {
  const status = String(comment.status || "").toLowerCase();
  return comment.implemented === true || status === "implemented" || status === "accepted";
}

function applyCommentContribution(data = {}, comment = {}) {
  if (!commentIsImplemented(comment)) {
    throw new Error("Comment must be implemented before applying essay credit");
  }

  return applyContribution(data, {
    intent: resolveIntentFromComment(comment),
    user: resolveCommenterId(comment),
  });
}

function bump(version, isMajor) {
  return bumpVersion(version, isMajor ? "new_version" : "minor_update");
}

function processFile(fp, labelIntent, user, fsModule = fs) {
  const raw = fsModule.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const intent = resolveIntent(doc.data, labelIntent);
  const { data: updated } = applyContribution(doc.data, { intent, user });
  const out = matter.stringify(doc.content, updated);
  fsModule.writeFileSync(fp, out, "utf8");
  console.log(`Updated ${fp} → version ${updated.version}`);

  try {
    const snap = writeSnapshot(fp, updated, doc.content);
    console.log(`Snapshot written: ${snap}`);
  } catch (error) {
    console.warn("Snapshot failed:", error.message);
  }
}

function processFileWithComment(fp, comment, fsModule = fs, options = {}) {
  const raw = fsModule.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const { data: updated } = applyCommentContribution(doc.data, comment);
  const out = matter.stringify(doc.content, updated);
  fsModule.writeFileSync(fp, out, "utf8");

  if (options.writeSnapshot !== false) {
    try {
      const snap = writeSnapshot(fp, updated, doc.content);
      console.log(`Snapshot written: ${snap}`);
    } catch (error) {
      console.warn("Snapshot failed:", error.message);
    }
  }

  return updated;
}

function run(env = process.env, fsModule = fs) {
  const { labelIntent, changed, user } = parseEnv(env);
  if (changed.length === 0) {
    console.log("No changed published essays; exiting.");
    return 0;
  }

  for (const fp of changed) {
    processFile(fp, labelIntent, user, fsModule);
  }

  return 0;
}

if (require.main === module) {
  process.exit(run());
}

exports.bump = bump;
exports.applyContribution = applyContribution;
exports.applyCommentContribution = applyCommentContribution;
exports.commentIsImplemented = commentIsImplemented;
exports.parseEnv = parseEnv;
exports.resolveCommenterId = resolveCommenterId;
exports.resolveIntentFromComment = resolveIntentFromComment;
exports.resolveIntent = resolveIntent;
exports.processFile = processFile;
exports.processFileWithComment = processFileWithComment;
exports.run = run;
